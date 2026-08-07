"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { AppShell, PageHeader, Card } from "@/components/ds/AppShell";
import { AuthStatus } from "@/components/ds/AuthShell";
import { DataTable, type Column } from "@/components/ds/DataTable";
import { Button } from "@/components/ds/Button";
import { Textarea } from "@/components/ds/Textarea";
import { Select } from "@/components/ds/Select";
import { Banner } from "@/components/ds/Banner";
import { StatusPill } from "@/components/ds/Display";
import { EmptyState } from "@/components/ds/Feedback";
import { Modal } from "@/components/ds/Modal";
import { adminNav } from "../nav";

interface RecoveryRequest {
  id: string;
  userId: string;
  user: {
    email: string;
    name: string | null;
  };
  reason: string;
  notes: string | null;
  status: string;
  submittedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export default function RecoveryRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RecoveryRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Load requests
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/recovery");
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load recovery requests");
      }

      setRequests(data.requests || []);
    } catch (err: unknown) {
      logger.error("[RecoveryRequests] Failed to load:", { error: err });
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load recovery requests");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/recovery/${selectedRequest.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: approvalNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to approve request");
      }

      setSuccess(
        `Recovery request approved. User will receive an email with recovery instructions.`
      );
      setShowApproveModal(false);
      setApprovalNotes("");
      loadRequests();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }

    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason) {
      setError("Rejection reason is required");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/recovery/${selectedRequest.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rejectionReason,
          notes: rejectionNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to reject request");
      }

      setSuccess("Recovery request rejected. User will be notified.");
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectionNotes("");
      loadRequests();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatReason = (reason: string) => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <AppShell brand="Admin" primaryNav={adminNav("/admin/recovery-requests")}>
        <PageHeader title="Account recovery" />
        <AuthStatus message="Loading recovery requests…" />
      </AppShell>
    );
  }

  const columns: Column<RecoveryRequest>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.user.name || r.user.email}</div>
          <div
            style={{ font: "var(--ds-type-label)", color: "var(--ds-content-tertiary)" }}
          >
            {r.user.email}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusPill
          tone={
            r.status === "approved"
              ? "success"
              : r.status === "rejected"
                ? "danger"
                : "warning"
          }
        >
          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
        </StatusPill>
      ),
    },
    { key: "reason", header: "Reason", render: (r) => formatReason(r.reason) },
    { key: "submittedAt", header: "Submitted", render: (r) => formatDate(r.submittedAt) },
    {
      key: "detail",
      header: "Notes",
      render: (r) => (
        <span style={{ color: "var(--ds-content-secondary)" }}>
          {r.rejectionReason ? `Rejected: ${r.rejectionReason}` : r.notes || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "pending" ? (
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "var(--ds-space-2)" }}
          >
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setSelectedRequest(r);
                setShowApproveModal(true);
              }}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setSelectedRequest(r);
                setShowRejectModal(true);
              }}
            >
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  const FILTERS = ["pending", "approved", "rejected", "all"] as const;

  return (
    <AppShell brand="Admin" primaryNav={adminNav("/admin/recovery-requests")}>
      <PageHeader
        title="Account recovery"
        description="Approving a request lets someone re-enrol a passkey on an account they are locked out of. Verify identity before approving."
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
          caption="Account recovery requests"
          columns={columns}
          rows={filteredRequests}
          rowKey={(r) => r.id}
          toolbar={
            <div style={{ display: "flex", gap: "var(--ds-space-1)" }} role="group" aria-label="Filter by status">
              {FILTERS.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filter === status ? "secondary" : "ghost"}
                  aria-pressed={filter === status}
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== "all" &&
                    ` (${requests.filter((r) => r.status === status).length})`}
                </Button>
              ))}
            </div>
          }
          emptyState={
            <EmptyState
              kind="no-results"
              title={`No ${filter === "all" ? "" : filter + " "}requests`}
              body={
                filter === "all"
                  ? "Recovery requests appear here when a locked-out user submits one."
                  : `There are ${requests.length} requests in total. Switch the filter above to see them.`
              }
            />
          }
        />
      </Card>

      <Modal
        open={showApproveModal && Boolean(selectedRequest)}
        onClose={() => {
          setShowApproveModal(false);
          setApprovalNotes("");
        }}
        title="Approve recovery request"
        description={
          selectedRequest
            ? `${selectedRequest.user.email} will be able to enrol a new passkey.`
            : undefined
        }
        footer={
          <>
            <Button
              variant="tertiary"
              loading={processing}
              onClick={() => {
                setShowApproveModal(false);
                setApprovalNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={processing}
              loadingLabel="Approving…"
              onClick={handleApprove}
            >
              Approve request
            </Button>
          </>
        }
      >
        <Textarea
          label="Notes"
          optionalHint
          value={approvalNotes}
          onChange={(e) => setApprovalNotes(e.target.value)}
          placeholder="How identity was verified, and by whom."
          helper="Recorded on the request. Useful when this is audited later."
        />
      </Modal>

      <Modal
        open={showRejectModal && Boolean(selectedRequest)}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason("");
          setRejectionNotes("");
        }}
        title="Reject recovery request"
        description={
          selectedRequest
            ? `${selectedRequest.user.email} stays locked out and is told the request was declined.`
            : undefined
        }
        footer={
          <>
            <Button
              variant="tertiary"
              loading={processing}
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
                setRejectionNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={processing}
              loadingLabel="Rejecting…"
              disabled={!rejectionReason}
              onClick={handleReject}
            >
              Reject request
            </Button>
          </>
        }
      >
        <Select
          label="Rejection reason"
          required
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          helper="Shown to the user, so it should make sense without further context."
        >
          <option value="">Select a reason…</option>
          <option value="Unable to verify identity">Unable to verify identity</option>
          <option value="Insufficient documentation">Insufficient documentation</option>
          <option value="Suspicious activity detected">Suspicious activity detected</option>
          <option value="Account not found">Account not found</option>
          <option value="Other">Other (specify in notes)</option>
        </Select>

        <div style={{ marginTop: "var(--ds-space-4)" }}>
          <Textarea
            label="Internal notes"
            optionalHint
            value={rejectionNotes}
            onChange={(e) => setRejectionNotes(e.target.value)}
            placeholder="Not shown to the user."
          />
        </div>
      </Modal>
    </AppShell>
  );
}
