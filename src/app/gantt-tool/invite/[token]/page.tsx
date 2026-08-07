"use client";

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthShell, AuthStatus, AuthActions } from "@/components/ds/AuthShell";
import { Button } from "@/components/ds/Button";
import { Banner } from "@/components/ds/Banner";
import { StatusPill } from "@/components/ds/Display";
import { EmptyState } from "@/components/ds/Feedback";
import styles from "./invite.module.css";



interface InviteDetails {
  project: {
    id: string;
    name: string;
    description: string | null;
    owner: {
      name: string | null;
      email: string;
    };
  };
  role: string;
  invitedBy: {
    name: string | null;
    email: string;
  };
  invitedEmail: string;
  createdAt: string;
  expiresAt: string | null;
}

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/gantt-tool/invite/${token}`)}`;
      router.push(loginUrl);
    }
  }, [sessionStatus, router, token]);

  const fetchInviteDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/gantt-tool/invites/${token}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError("This invite link is invalid or does not exist.");
        } else if (response.status === 410) {
          setError(data.error || "This invite link has expired or has already been used.");
        } else {
          setError(data.error || "Failed to load invite details.");
        }
        setInviteDetails(null);
      } else {
        setInviteDetails(data);
      }
    } catch (err) {
      logger.error("Failed to fetch invite details:", { error: err });
      setError("Failed to load invite details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch invite details when authenticated
  useEffect(() => {
    if (sessionStatus === "authenticated" && token) {
      fetchInviteDetails();
    }
  }, [sessionStatus, token, fetchInviteDetails]);

  const acceptInvite = async () => {
    if (!token) return;

    try {
      setAccepting(true);
      setError(null);

      const response = await fetch(`/api/gantt-tool/invites/${token}`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError(
            `This invite was sent to ${data.invitedEmail}. You are currently logged in as ${data.currentEmail}. Please log in with the invited email address.`
          );
        } else if (response.status === 409) {
          setError("You are already a collaborator on this project.");
          // Redirect to project after 2 seconds
          setTimeout(() => {
            if (inviteDetails?.project.id) {
              router.push(`/gantt-tool?project=${inviteDetails.project.id}`);
            }
          }, 2000);
        } else if (response.status === 410) {
          setError(data.error || "This invite has expired or has already been used.");
        } else {
          setError(data.error || "Failed to accept invite.");
        }
      } else {
        setAccepted(true);
        // Redirect to project after 2 seconds
        setTimeout(() => {
          router.push(`/gantt-tool?project=${data.project.id}`);
        }, 2000);
      }
    } catch (err) {
      logger.error("Failed to accept invite:", { error: err });
      setError("Failed to accept invite. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  // Show loading state while checking authentication
  if (sessionStatus === "loading" || loading) {
    return (
      <AuthShell title="Project invitation">
        <AuthStatus
          message={sessionStatus === "loading" ? "Checking your session…" : "Loading invite…"}
        />
      </AuthShell>
    );
  }

  if (error && !inviteDetails) {
    return (
      <AuthShell title="Project invitation">
        <EmptyState
          kind="error"
          title="This invite could not be opened"
          body={error}
          reference={`invite / ${String(params?.token ?? "").slice(0, 8)}`}
          primaryAction={
            <Button variant="primary" onClick={() => router.push("/dashboard")}>
              Go to dashboard
            </Button>
          }
        />
      </AuthShell>
    );
  }

  if (accepted && inviteDetails) {
    return (
      <AuthShell title="Project invitation">
        <AuthStatus
          variant="success"
          message={`You now have ${inviteDetails.role} access to ${inviteDetails.project.name}. Opening it…`}
        />
      </AuthShell>
    );
  }

  if (inviteDetails) {
    const ROLE_DESCRIPTIONS: Record<string, string> = {
      OWNER: "Full access, including sharing and deleting the project.",
      EDITOR: "Can view and edit everything in the project.",
      VIEWER: "Can view the project. Cannot change anything.",
    };

    const wrongAccount =
      Boolean(session?.user?.email) && session!.user!.email !== inviteDetails.invitedEmail;

    return (
      <AuthShell
        title="Project invitation"
        subtitle={`You have been invited to collaborate on ${inviteDetails.project.name}.`}
      >
        {wrongAccount && (
          // Accepting from the wrong account is the single most likely way
          // this flow fails, so it is said before the button, not after it.
          <Banner tone="warning" title="You are signed in as a different person">
            This invite was sent to <strong>{inviteDetails.invitedEmail}</strong>, but you
            are signed in as <strong>{session!.user!.email}</strong>. Sign in with the
            invited address if accepting fails.
          </Banner>
        )}

        {error && (
          <Banner tone="danger" title="Could not accept the invitation">
            {error}
          </Banner>
        )}

        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt>Project</dt>
            <dd>{inviteDetails.project.name}</dd>
          </div>
          {inviteDetails.project.description && (
            <div className={styles.detailRow}>
              <dt>Description</dt>
              <dd>{inviteDetails.project.description}</dd>
            </div>
          )}
          <div className={styles.detailRow}>
            <dt>Owner</dt>
            <dd>
              {inviteDetails.project.owner.name || inviteDetails.project.owner.email}
            </dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Invited by</dt>
            <dd>{inviteDetails.invitedBy.name || inviteDetails.invitedBy.email}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Your role</dt>
            <dd>
              <StatusPill tone={inviteDetails.role === "VIEWER" ? "neutral" : "info"}>
                {inviteDetails.role}
              </StatusPill>
              <span className={styles.roleNote}>
                {ROLE_DESCRIPTIONS[inviteDetails.role]}
              </span>
            </dd>
          </div>
        </dl>

        <AuthActions row>
          <Button
            variant="primary"
            size="lg"
            loading={accepting}
            loadingLabel="Joining…"
            onClick={acceptInvite}
          >
            Accept invitation
          </Button>
          <Button
            variant="secondary"
            size="lg"
            loading={accepting}
            onClick={() => router.push("/dashboard")}
          >
            Decline
          </Button>
        </AuthActions>
      </AuthShell>
    );
  }

  return null;
}
