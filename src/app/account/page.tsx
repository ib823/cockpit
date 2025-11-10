"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useSessionGuard } from "@/hooks/useSessionGuard";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">Manage your profile, passkeys, and active sessions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{profile?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              {isEditingName ? (
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setEditedName(profile?.name || "");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-gray-900">{profile?.name || "Not set"}</p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-gray-900 capitalize">{profile?.role.toLowerCase()}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-gray-900">
                {profile?.createdAt &&
                  new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </p>
            </div>

            {profile?.lastLoginAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Login</label>
                <p className="mt-1 text-gray-900">
                  {formatDistanceToNow(new Date(profile.lastLoginAt), { addSuffix: true })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Passkeys Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Passkeys</h2>
            <button
              onClick={() => router.push("/account/add-passkey")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              + Add Passkey
            </button>
          </div>

          {passkeys.length === 0 ? (
            <p className="text-gray-600 text-sm">No passkeys registered</p>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {passkey.nickname || "Unnamed Passkey"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {passkey.deviceType} • Last used{" "}
                      {formatDistanceToNow(new Date(passkey.lastUsedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(passkey.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-600 rounded-md hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Sessions Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Sessions</h2>

          {sessions.length === 0 ? (
            <p className="text-gray-600 text-sm">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {session.deviceInfo?.browser || "Unknown Browser"} on{" "}
                        {session.deviceInfo?.os || "Unknown OS"}
                      </p>
                      {session.current && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {session.ipAddress} • Last active{" "}
                      {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                    </p>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-600 rounded-md hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
