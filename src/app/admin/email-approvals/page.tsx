"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EmailApproval {
  email: string;
  tokenHash: string;
  tokenExpiresAt: string;
  approvedByUserId: string;
  usedAt: string | null;
  createdAt: string;
  codeSent: boolean;
}

export default function EmailApprovalsPage() {
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
      // TODO: Replace with actual API call
      const mockApprovals: EmailApproval[] = [
        {
          email: "test@example.com",
          tokenHash: "$2a$12$...",
          tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          approvedByUserId: "admin123",
          usedAt: null,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          codeSent: true,
        },
      ];

      setApprovals(mockApprovals);
    } catch (err: unknown) {
      console.error("[EmailApprovals] Failed to load:", err);
      setError("Failed to load email approvals");
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
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/email-approvals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     email: newEmail.trim().toLowerCase(),
      //     adminId: 'current-admin-id'
      //   })
      // });

      // For now, simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setGeneratedCode(code);
      setSuccess(`Email approval created successfully! Code: ${code}`);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading email approvals...</p>
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Email Approvals</h1>
            <p className="text-slate-600">Manage email approvals for new user registrations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              + Create Approval
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back to Admin
            </button>
          </div>
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

        {/* Approvals List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {approvals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Email Approvals</h3>
              <p className="text-slate-600 mb-6">
                Create an email approval to allow a user to register
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Create First Approval
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Code Sent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {approvals.map((approval) => (
                    <tr key={approval.email} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{approval.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            approval.usedAt
                              ? "bg-gray-100 text-gray-700"
                              : new Date(approval.tokenExpiresAt) < new Date()
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {approval.usedAt
                            ? "Used"
                            : new Date(approval.tokenExpiresAt) < new Date()
                              ? "Expired"
                              : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(approval.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(approval.tokenExpiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            approval.codeSent
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {approval.codeSent ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Create Email Approval</h2>
            <p className="text-slate-600 mb-6">
              Enter the email address of the user you want to allow to register. They will receive a
              6-digit code.
            </p>

            {generatedCode ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  ✓ Approval Created Successfully
                </h3>
                <p className="text-sm text-green-800 mb-4">
                  Share this 6-digit code with the user. They will need it to complete registration.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border-2 border-green-300 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold tracking-widest text-slate-900 font-mono">
                      {generatedCode}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Copy Code
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  Code expires in 7 days. User must visit /register-secure to use it.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !creating && handleCreateApproval()}
                  placeholder="user@example.com"
                  autoFocus
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  The user will receive a 6-digit code to complete registration
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewEmail("");
                  setGeneratedCode("");
                  setError("");
                }}
                disabled={creating}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {generatedCode ? "Done" : "Cancel"}
              </button>
              {!generatedCode && (
                <button
                  onClick={handleCreateApproval}
                  disabled={creating || !newEmail}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Generate Code"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
