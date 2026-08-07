"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { AppShell, PageHeader, Card } from "@/components/ds/AppShell";
import { AuthShell, AuthStatus } from "@/components/ds/AuthShell";
import { DataTable } from "@/components/ds/DataTable";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Banner } from "@/components/ds/Banner";
import { StatusPill } from "@/components/ds/Display";
import { EmptyState } from "@/components/ds/Feedback";
import styles from "./account.module.css";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface Passkey {
  id: string;
  nickname: string | null;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string;
}

interface Session {
  id: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
  } | null;
  ipAddress: string | null;
  lastActivity: string;
  current: boolean;
}

export default function AccountPage() {
  const { status } = useSessionGuard(); // SECURITY: Validates session on page visibility
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch profile, passkeys, and sessions
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, passkeysRes, sessionsRes] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/passkeys"),
        fetch("/api/account/sessions"),
      ]);

      if (!profileRes.ok || !passkeysRes.ok || !sessionsRes.ok) {
        throw new Error("Failed to load account data");
      }

      const profileData = await profileRes.json();
      const passkeysData = await passkeysRes.json();
      const sessionsData = await sessionsRes.json();

      setProfile(profileData);
      setEditedName(profileData.name || "");
      setPasskeys(passkeysData);
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    try {
      setError(null);
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName }),
      });

      if (!res.ok) {
        throw new Error("Failed to update name");
      }

      const updated = await res.json();
      setProfile(updated);
      setIsEditingName(false);
      setSuccessMessage("Name updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm("Are you sure you want to remove this passkey?")) {
      return;
    }

    try {
      setError(null);
      const res = await fetch(`/api/account/passkeys/${passkeyId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete passkey");
      }

      setPasskeys(passkeys.filter((p) => p.id !== passkeyId));
      setSuccessMessage("Passkey removed successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete passkey");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) {
      return;
    }

    try {
      setError(null);
      const res = await fetch(`/api/account/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke session");
      }

      setSessions(sessions.filter((s) => s.id !== sessionId));
      setSuccessMessage("Session revoked successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session");
    }
  };

  if (status === "loading" || loading) {
    return (
      <AuthShell title="Account">
        <AuthStatus message="Loading account settings…" />
      </AuthShell>
    );
  }

  return (
    <AppShell brand="Account">
      <PageHeader
        title="Account"
        description="Your profile, the passkeys that can sign in as you, and where you are currently signed in."
      />

      {error && (
        <div className={styles.slot}>
          <Banner tone="danger" title="Something went wrong" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        </div>
      )}
      {successMessage && (
        <div className={styles.slot}>
          <Banner tone="success" title={successMessage} onDismiss={() => setSuccessMessage(null)} />
        </div>
      )}

      <Card label="Profile" className={styles.slot}>
        <h2 className={styles.cardTitle}>Profile</h2>
        <dl className={styles.defList}>
          <div className={styles.defRow}>
            <dt>Email</dt>
            <dd>{profile?.email}</dd>
          </div>
          <div className={styles.defRow}>
            <dt>Role</dt>
            <dd>{profile?.role}</dd>
          </div>
          <div className={styles.defRow}>
            <dt>Member since</dt>
            <dd>{profile ? new Date(profile.createdAt).toLocaleDateString() : "—"}</dd>
          </div>
          <div className={styles.defRow}>
            <dt>Last sign-in</dt>
            <dd>
              {profile?.lastLoginAt
                ? new Date(profile.lastLoginAt).toLocaleString()
                : "—"}
            </dd>
          </div>
        </dl>

        <div className={styles.nameRow}>
          {isEditingName ? (
            <>
              <Input
                label="Display name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className={styles.nameField}
              />
              <Button variant="primary" onClick={handleSaveName}>
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditingName(false);
                  setEditedName(profile?.name || "");
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Input
                label="Display name"
                readOnly
                value={profile?.name || "Not set"}
                className={styles.nameField}
              />
              <Button variant="secondary" onClick={() => setIsEditingName(true)}>
                Edit
              </Button>
            </>
          )}
        </div>
      </Card>

      <Card label="Passkeys" padded={false} className={styles.slot}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Passkeys</h2>
          <Button variant="primary" size="sm" onClick={() => router.push("/account/add-passkey")}>
            Add passkey
          </Button>
        </div>
        <DataTable
          caption="Passkeys registered to this account"
          columns={[
            {
              key: "nickname",
              header: "Device",
              render: (p: Passkey) => p.nickname || p.deviceType || "Unnamed passkey",
            },
            {
              key: "createdAt",
              header: "Added",
              render: (p: Passkey) => new Date(p.createdAt).toLocaleDateString(),
            },
            {
              key: "lastUsedAt",
              header: "Last used",
              render: (p: Passkey) =>
                p.lastUsedAt ? new Date(p.lastUsedAt).toLocaleString() : "Never",
            },
            {
              key: "actions",
              header: "Actions",
              render: (p: Passkey) => (
                <div className={styles.rowActions}>
                  <Button
                    size="sm"
                    variant="danger"
                    // Removing your only passkey locks you out, so it is
                    // blocked here rather than explained after the fact.
                    disabled={passkeys.length === 1}
                    onClick={() => handleDeletePasskey(p.id)}
                  >
                    Remove
                  </Button>
                </div>
              ),
            },
          ]}
          rows={passkeys}
          rowKey={(p) => p.id}
          emptyState={
            <EmptyState
              kind="first-run"
              title="No passkeys yet"
              body="A passkey signs you in with your device's fingerprint, face or PIN."
              primaryAction={
                <Button variant="primary" onClick={() => router.push("/account/add-passkey")}>
                  Add your first passkey
                </Button>
              }
            />
          }
          footer={
            passkeys.length === 1
              ? "Your last passkey cannot be removed — doing so would lock you out."
              : undefined
          }
        />
      </Card>

      <Card label="Active sessions" padded={false} className={styles.slot}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Active sessions</h2>
        </div>
        <DataTable
          caption="Devices currently signed in to this account"
          columns={[
            {
              key: "device",
              header: "Device",
              render: (s: Session) => (
                <span>
                  {s.deviceInfo
                    ? `${s.deviceInfo.browser} on ${s.deviceInfo.os}`
                    : "Unknown device"}
                  {s.current && (
                    <>
                      {" "}
                      <StatusPill tone="info">This device</StatusPill>
                    </>
                  )}
                </span>
              ),
            },
            { key: "ip", header: "IP address", render: (s: Session) => s.ipAddress || "—" },
            {
              key: "lastActivity",
              header: "Last active",
              render: (s: Session) =>
                s.lastActivity ? new Date(s.lastActivity).toLocaleString() : "—",
            },
            {
              key: "actions",
              header: "Actions",
              render: (s: Session) => (
                <div className={styles.rowActions}>
                  {!s.current && (
                    <Button size="sm" variant="danger" onClick={() => handleRevokeSession(s.id)}>
                      Sign out
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={sessions}
          rowKey={(s) => s.id}
          emptyState={
            <EmptyState
              kind="no-results"
              title="No other sessions"
              body="You are only signed in on this device."
            />
          }
        />
      </Card>
    </AppShell>
  );
}
