"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { AppShell, PageHeader, Card } from "@/components/ds/AppShell";
import { AuthStatus } from "@/components/ds/AuthShell";
import { DataTable, type Column } from "@/components/ds/DataTable";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Banner } from "@/components/ds/Banner";
import { StatusPill } from "@/components/ds/Display";
import { EmptyState } from "@/components/ds/Feedback";
import { Modal } from "@/components/ds/Modal";
import { adminNav } from "../nav";
import { UserMenu } from "@/components/navigation/UserMenu";
import styles from "../admin.module.css";

interface EmailApproval {
  email: string;
  tokenExpiresAt: string;
  approvedByUserId: string;
  usedAt: string | null;
  createdAt: string;
  codeSent: boolean;
}

export default function EmailApprovalsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [approvals, setApprovals] = useState<EmailApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New approval form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/email-approvals");
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load email approvals");
      }

      setApprovals(data.approvals || []);
    } catch (err: unknown) {
      logger.error("[EmailApprovals] Failed to load:", { error: err });
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load email approvals");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApproval = async () => {
    if (!newEmail) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newEmail)) {
      setError("Invalid email format");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/email-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to create email approval");
      }

      setGeneratedCode(data.code);
      const successMessage = data.codeSent
        ? `Email approval created! Code sent to ${data.email}`
        : `Email approval created! Share this code with the user: ${data.code}`;
      setSuccess(successMessage);
      setNewEmail("");
      loadApprovals();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create email approval");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setSuccess("Code copied to clipboard!");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <AppShell
      brand="Admin"
      primaryNav={adminNav("/admin/email-approvals")}
      topBarEnd={<UserMenu session={session} />}
    >
        <PageHeader title="Email approvals" />
        <AuthStatus message="Loading email approvals…" />
      </AppShell>
    );
  }

  const columns: Column<EmailApproval>[] = [
    { key: "email", header: "Email", render: (a) => a.email },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const expired = new Date(a.tokenExpiresAt) < new Date();
        return a.usedAt ? (
          <StatusPill tone="neutral">Used</StatusPill>
        ) : expired ? (
          <StatusPill tone="danger">Expired</StatusPill>
        ) : (
          <StatusPill tone="success">Active</StatusPill>
        );
      },
    },
    { key: "createdAt", header: "Created", render: (a) => formatDate(a.createdAt) },
    { key: "tokenExpiresAt", header: "Expires", render: (a) => formatDate(a.tokenExpiresAt) },
    {
      key: "codeSent",
      header: "Code sent",
      render: (a) =>
        a.codeSent ? (
          <StatusPill tone="info">Sent</StatusPill>
        ) : (
          <StatusPill tone="neutral">Not sent</StatusPill>
        ),
    },
  ];

  const closeModal = () => {
    setShowCreateModal(false);
    setNewEmail("");
    setGeneratedCode("");
    setError("");
  };

  return (
    <AppShell
      brand="Admin"
      primaryNav={adminNav("/admin/email-approvals")}
      topBarEnd={<UserMenu session={session} />}
    >
      <PageHeader
        title="Email approvals"
        description="Approve an email address so its owner can register."
        actions={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create approval
          </Button>
        }
      />

      {error && (
        <div style={{ marginBottom: "var(--ds-space-5)" }}>
          <Banner tone="danger" title="Something went wrong" onDismiss={() => setError("")}>
            {error}
          </Banner>
        </div>
      )}

      {success && (
        <div style={{ marginBottom: "var(--ds-space-5)" }}>
          <Banner tone="success" title={success} onDismiss={() => setSuccess("")} />
        </div>
      )}

      <Card padded={false}>
        <DataTable
          caption="Email approval requests"
          columns={columns}
          rows={approvals}
          rowKey={(a) => a.email}
          emptyState={
            <EmptyState
              kind="first-run"
              title="No approvals yet"
              body="Approving an email address lets its owner register with a 6-digit code. Nothing is wrong — there is simply nobody approved yet."
              primaryAction={
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  Create the first approval
                </Button>
              }
            />
          }
        />
      </Card>

      <Modal
        open={showCreateModal}
        onClose={closeModal}
        title={generatedCode ? "Approval created" : "Create email approval"}
        description={
          generatedCode
            ? undefined
            : "The user receives a 6-digit code they need to complete registration."
        }
        footer={
          <>
            <Button variant="tertiary" onClick={closeModal} loading={creating}>
              {generatedCode ? "Done" : "Cancel"}
            </Button>
            {!generatedCode && (
              <Button
                variant="primary"
                onClick={handleCreateApproval}
                disabled={!newEmail}
                loading={creating}
                loadingLabel="Creating…"
              >
                Generate code
              </Button>
            )}
          </>
        }
      >
        {generatedCode ? (
          <>
            <Banner tone="success" title="Share this code once">
              It expires in 7 days, and the user must visit <code>/register</code> to use it.
            </Banner>
            <div className={styles.codeReveal}>
              <span className={styles.codeValue}>{generatedCode}</span>
              <Button variant="secondary" onClick={handleCopyCode}>
                Copy code
              </Button>
            </div>
          </>
        ) : (
          <Input
            label="Email address"
            type="email"
            required
            size="lg"
            autoFocus
            placeholder="user@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !creating && handleCreateApproval()}
            helper="They will receive a 6-digit code to complete registration."
          />
        )}
      </Modal>
    </AppShell>
  );
}
