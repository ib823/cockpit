"use client";

import React, { useState } from "react";
import { logger } from "@/lib/logger";
import { format, addDays } from "date-fns";
import { Card } from "@/components/ds/AppShell";
import { DataTable, type Column } from "@/components/ds/DataTable";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Select } from "@/components/ds/Select";
import { Textarea } from "@/components/ds/Textarea";
import { Toggle } from "@/components/ds/Choice";
import { Modal } from "@/components/ds/Modal";
import { Banner } from "@/components/ds/Banner";
import { StatusPill, Avatar } from "@/components/ds/Display";
import { EmptyState } from "@/components/ds/Feedback";
import styles from "./UserManagementClient.module.css";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "MANAGER" | "ADMIN";
  createdAt: Date;
  accessExpiresAt: Date;
  exception: boolean;
}

interface CodeResponse {
  code: string;
  email: string;
  userName: string | null;
  magicUrl: string;
  registrationUrl: string;
  codeExpiry: string;
  magicLinkExpiry: string;
}

interface FormState {
  email: string;
  name: string;
  role: "USER" | "MANAGER" | "ADMIN";
  accessExpiresAt: string;
  exception: boolean;
}

interface FormErrors {
  email?: string;
  role?: string;
  accessExpiresAt?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyForm(): FormState {
  return {
    email: "",
    name: "",
    role: "USER",
    exception: false,
    accessExpiresAt: format(addDays(new Date(), 90), "yyyy-MM-dd"),
  };
}

export default function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<CodeResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedNotice, setCopiedNotice] = useState("");

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key in formErrors) {
      setFormErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  // Reload users from API
  const reloadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      logger.error("Failed to reload users", { error });
    }
  };

  // Open modal for creating new user
  const handleAddUser = () => {
    setEditingUser(null);
    setForm(emptyForm());
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      name: user.name ?? "",
      role: user.role,
      exception: user.exception,
      accessExpiresAt: format(new Date(user.accessExpiresAt), "yyyy-MM-dd"),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setForm(emptyForm());
    setFormErrors({});
  };

  // Same rules the previous form enforced: email required and well-formed,
  // role required, and an expiry date required unless permanent access is set.
  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!form.email) {
      errors.email = "Please enter email";
    } else if (!EMAIL_RE.test(form.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!form.role) {
      errors.role = "Please select a role";
    }
    if (!form.exception && !form.accessExpiresAt) {
      errors.accessExpiresAt = "Please select expiration date";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission (create or update)
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      // `name` is omitted when blank — the update schema rejects an empty
      // string, and the create route stores a missing name as null anyway.
      const values: Record<string, unknown> = {
        email: form.email,
        role: form.role,
        exception: form.exception,
        accessExpiresAt: form.accessExpiresAt,
      };
      if (form.name.trim() !== "") values.name = form.name;

      if (editingUser) {
        // Update existing user
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update user");
        }

        setSuccessMessage("User updated successfully");
      } else {
        // Create new user
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create user");
        }

        setSuccessMessage("User created successfully");
      }

      setErrorMessage("");
      closeFormModal();
      await reloadUsers();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion (runs after the confirm dialog)
  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      setSuccessMessage("User deleted successfully");
      setErrorMessage("");
      await reloadUsers();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle generating access code for user
  const handleGenerateCode = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/generate-code`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate code");
      }

      const data = await response.json();
      setGeneratedCode(data);
      setCopiedNotice("");
      setIsCodeModalOpen(true);
      setSuccessMessage("Access code generated successfully");
      setErrorMessage("");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to generate access code"
      );
    } finally {
      setLoading(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(`${label} copied to clipboard`);
  };

  const closeCodeModal = () => {
    setIsCodeModalOpen(false);
    setGeneratedCode(null);
    setCopiedNotice("");
  };

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <div className={styles.userCell}>
          <Avatar name={user.name || user.email} />
          <div>
            <div className={styles.userName}>{user.name || "No name"}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <span
          className={`${styles.role} ${
            user.role === "ADMIN"
              ? styles.roleAdmin
              : user.role === "MANAGER"
                ? styles.roleManager
                : styles.roleUser
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => {
        const isExpired =
          user.accessExpiresAt && new Date(user.accessExpiresAt) <= new Date() && !user.exception;
        return user.exception ? (
          <StatusPill tone="success">Permanent Access</StatusPill>
        ) : isExpired ? (
          <StatusPill tone="danger">Expired</StatusPill>
        ) : (
          <StatusPill tone="success">Active</StatusPill>
        );
      },
    },
    {
      key: "created",
      header: "Created",
      render: (user) => (
        <span suppressHydrationWarning>
          {format(new Date(user.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "expires",
      header: "Access Expires",
      render: (user) => (
        <span suppressHydrationWarning>
          {user.exception ? (
            <span className={styles.never}>Never</span>
          ) : user.accessExpiresAt ? (
            format(new Date(user.accessExpiresAt), "MMM d, yyyy")
          ) : (
            <span className={styles.notSet}>Not set</span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => handleGenerateCode(user.id)}>
            Code
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>
            Edit
          </Button>
          {/* Arms the two-step confirm; the actual delete happens in the modal. */}
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(user)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {(errorMessage || successMessage) && (
        <div className={styles.messages}>
          {errorMessage && (
            <Banner
              tone="danger"
              title="Something went wrong"
              onDismiss={() => setErrorMessage("")}
            >
              {errorMessage}
            </Banner>
          )}
          {successMessage && (
            <Banner
              tone="success"
              title={successMessage}
              onDismiss={() => setSuccessMessage("")}
            />
          )}
        </div>
      )}

      <Card padded={false}>
        <DataTable
          caption="System users and permissions"
          columns={columns}
          rows={users}
          rowKey={(user) => user.id}
          loading={loading}
          toolbar={
            <div className={styles.toolbarRow}>
              <span className={styles.toolbarHint}>
                Manage system users and permissions
              </span>
              <span className={styles.toolbarSpacer} />
              <Button variant="primary" onClick={handleAddUser}>
                Add user
              </Button>
            </div>
          }
          emptyState={
            <EmptyState
              kind="first-run"
              title="No users"
              body="Get started by creating a new user."
              primaryAction={
                <Button variant="primary" onClick={handleAddUser}>
                  Add user
                </Button>
              }
            />
          }
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeFormModal}
        title={editingUser ? "Edit User" : "Add New User"}
        footer={
          <>
            <Button variant="tertiary" loading={loading} onClick={closeFormModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={loading}
              loadingLabel={editingUser ? "Saving…" : "Creating…"}
              onClick={handleSubmit}
            >
              {editingUser ? "Save changes" : "Create user"}
            </Button>
          </>
        }
      >
        <div className={styles.formStack}>
          <Input
            label="Email"
            required
            placeholder="user@example.com"
            value={form.email}
            disabled={!!editingUser}
            error={formErrors.email}
            onChange={(event) => setField("email", event.target.value)}
          />

          <Input
            label="Name"
            optionalHint
            placeholder="John Doe"
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
          />

          <Select
            label="Role"
            required
            value={form.role}
            error={formErrors.role}
            onChange={(event) =>
              setField("role", event.target.value as FormState["role"])
            }
          >
            <option value="USER">User</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>

          <Toggle
            label="Permanent Access"
            description="Access never expires. Overrides the expiry date below."
            checked={form.exception}
            onChange={(event) => setField("exception", event.target.checked)}
          />

          {/* The expiry field only applies while permanent access is off —
              same visibility rule the previous form enforced. */}
          {!form.exception && (
            <Input
              label="Access Expires At"
              required
              type="date"
              value={form.accessExpiresAt}
              error={formErrors.accessExpiresAt}
              onChange={(event) => setField("accessExpiresAt", event.target.value)}
            />
          )}
        </div>
      </Modal>

      {/* Delete confirmation — step two of the destructive action. */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete user"
        footer={
          <>
            <Button
              variant="tertiary"
              loading={loading}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={loading}
              loadingLabel="Deleting…"
              onClick={async () => {
                if (!deleteTarget) return;
                await handleDeleteUser(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete user
            </Button>
          </>
        }
        size="sm"
      >
        {deleteTarget && (
          <p className={styles.deleteBody}>
            Are you sure you want to delete{" "}
            <span className={styles.deleteEmail}>{deleteTarget.email}</span>? This is
            immediate and cannot be undone.
          </p>
        )}
      </Modal>

      {/* Access Code Modal */}
      <Modal
        open={isCodeModalOpen}
        onClose={closeCodeModal}
        title="User Access Code"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeCodeModal}>
            Close
          </Button>
        }
      >
        {generatedCode && (
          <div className={styles.codeStack}>
            {copiedNotice && (
              <Banner
                tone="success"
                title={copiedNotice}
                onDismiss={() => setCopiedNotice("")}
              />
            )}

            <Banner
              tone="info"
              title={`Share the following access code with ${generatedCode.email}`}
            />

            {/* 6-Digit Code */}
            <div className={styles.codeSection}>
              <div className={styles.codeRow}>
                <Input
                  label="6-Digit Access Code"
                  helper={`Valid for ${generatedCode.codeExpiry}`}
                  value={generatedCode.code}
                  readOnly
                  className={styles.codeInput}
                />
                <Button
                  onClick={() => copyToClipboard(generatedCode.code, "Access code")}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Magic Link */}
            <div className={styles.codeSection}>
              <div className={styles.codeRow}>
                <Textarea
                  label="Magic Link (Direct Login)"
                  helper={`Valid for ${generatedCode.magicLinkExpiry}`}
                  value={generatedCode.magicUrl}
                  readOnly
                  rows={2}
                  className={styles.monoArea}
                />
                <Button
                  onClick={() => copyToClipboard(generatedCode.magicUrl, "Magic link")}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Registration URL */}
            <div className={styles.codeSection}>
              <div className={styles.codeRow}>
                <Textarea
                  label="Registration Page"
                  value={generatedCode.registrationUrl}
                  readOnly
                  rows={2}
                  className={styles.monoArea}
                />
                <Button
                  onClick={() =>
                    copyToClipboard(generatedCode.registrationUrl, "Registration URL")
                  }
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className={styles.instructions}>
              <h4 className={styles.instructionsTitle}>Instructions for User</h4>
              <ol className={styles.instructionsList}>
                <li>
                  Send the user either the <strong>6-digit code</strong> OR the{" "}
                  <strong>magic link</strong>
                </li>
                <li>
                  If using the code: User visits the registration page and enters their
                  email and the 6-digit code
                </li>
                <li>
                  If using magic link: User clicks the link for instant access (expires
                  in {generatedCode.magicLinkExpiry})
                </li>
                <li>
                  User will be prompted to set up passkey authentication for future
                  logins
                </li>
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
