"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
      // TODO: Replace with actual API call
      // For now, using mock data
      const mockRequests: RecoveryRequest[] = [
        {
          id: "1",
          userId: "user1",
          user: {
            email: "john.doe@example.com",
            name: "John Doe",
          },
          reason: "lost_totp",
          notes: "Lost my phone with authenticator app",
          status: "pending",
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null,
        },
        {
          id: "2",
          userId: "user2",
          user: {
            email: "jane.smith@example.com",
            name: "Jane Smith",
          },
          reason: "lost_all",
          notes: "Lost all backup codes and TOTP device",
          status: "pending",
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null,
        },
      ];

      setRequests(mockRequests);
    } catch (err: unknown) {
      console.error("[RecoveryRequests] Failed to load:", err);
      setError("Failed to load recovery requests");
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
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/recovery/${selectedRequest.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: "current-admin-id", // TODO: Get from session
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
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/recovery/${selectedRequest.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: "current-admin-id", // TODO: Get from session
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading recovery requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Recovery Requests</h1>
            <p className="text-slate-600">
              Review and approve account recovery requests from users
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Admin
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && ` (${requests.filter((r) => r.status === status).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Requests Found</h3>
              <p className="text-slate-600">
                {filter === "pending"
                  ? "No pending recovery requests at the moment"
                  : `No ${filter} recovery requests`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {request.user.name || request.user.email}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : request.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mb-3">{request.user.email}</p>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Reason:</span>{" "}
                          <span className="font-medium text-slate-900">
                            {formatReason(request.reason)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Submitted:</span>{" "}
                          <span className="font-medium text-slate-900">
                            {formatDate(request.submittedAt)}
                          </span>
                        </div>
                        {request.notes && (
                          <div className="md:col-span-2">
                            <span className="text-slate-500">User Notes:</span>{" "}
                            <span className="text-slate-900">{request.notes}</span>
                          </div>
                        )}
                        {request.rejectionReason && (
                          <div className="md:col-span-2">
                            <span className="text-slate-500">Rejection Reason:</span>{" "}
                            <span className="text-red-700">{request.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {request.status === "pending" && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApproveModal(true);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Approve Recovery Request</h2>
            <p className="text-slate-600 mb-6">
              You are about to approve the recovery request for{" "}
              <strong>{selectedRequest.user.email}</strong>. This will:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 mb-6 space-y-1">
              <li>Revoke all active sessions</li>
              <li>Reset two-factor authentication</li>
              <li>Delete all passkeys</li>
              <li>Send recovery email with 48-hour link</li>
            </ul>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovalNotes("");
                }}
                disabled={processing}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processing ? "Approving..." : "Approve Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Reject Recovery Request</h2>
            <p className="text-slate-600 mb-6">
              You are about to reject the recovery request for{" "}
              <strong>{selectedRequest.user.email}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <option value="">Select a reason...</option>
                <option value="Unable to verify identity">Unable to verify identity</option>
                <option value="Insufficient documentation">Insufficient documentation</option>
                <option value="Suspicious activity detected">Suspicious activity detected</option>
                <option value="Account not found">Account not found</option>
                <option value="Other">Other (specify in notes)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setRejectionNotes("");
                }}
                disabled={processing}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processing ? "Rejecting..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
