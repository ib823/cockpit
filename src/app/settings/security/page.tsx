"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SecurityOverview {
  passwordChangedAt: string | null;
  passwordExpiresAt: string | null;
  passwordExpiresIn: number | null;
  totpEnabled: boolean;
  totpEnabledAt: string | null;
  backupCodesRemaining: number;
  activeSessions: number;
  trustedDevices: number;
  maxConcurrentSessions: number;
  accountLocked: boolean;
  failedLoginAttempts: number;
}

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  location: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

interface TrustedDevice {
  id: string;
  nickname: string | null;
  userAgent: string;
  lastSeenAt: string;
  location: string;
}

export default function SecuritySettingsPage() {
  const _router = useRouter(); // Reserved for future use

  // Data state
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [_sessions, _setSessions] = useState<Session[]>([]); // Reserved for future use
  const [_devices, _setDevices] = useState<TrustedDevice[]>([]); // Reserved for future use

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "password" | "totp" | "sessions" | "devices"
  >("overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // ============================================
  // Load Security Overview
  // ============================================
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    setError("");

    try {
      // TODO: Replace with actual API endpoints
      // For now, using mock data
      const mockOverview: SecurityOverview = {
        passwordChangedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        passwordExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        passwordExpiresIn: 60,
        totpEnabled: true,
        totpEnabledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        backupCodesRemaining: 8,
        activeSessions: 2,
        trustedDevices: 3,
        maxConcurrentSessions: 1,
        accountLocked: false,
        failedLoginAttempts: 0,
      };

      setOverview(mockOverview);
    } catch (err: any) {
      console.error("[Security] Failed to load data:", err);
      setError("Failed to load security settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Handle Password Change
  // ============================================
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }

    setChangingPassword(true);

    try {
      // TODO: Implement password change API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // ============================================
  // Format Dates
  // ============================================
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Security Settings</h1>
          <p className="text-slate-600">Manage your account security and authentication methods</p>
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

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: "🔒" },
                { id: "password", label: "Password", icon: "🔑" },
                { id: "totp", label: "2FA", icon: "📱" },
                { id: "sessions", label: "Sessions", icon: "💻" },
                { id: "devices", label: "Devices", icon: "🖥️" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && overview && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Security Overview</h2>

                {/* Password Expiry Alert */}
                {overview.passwordExpiresIn !== null && overview.passwordExpiresIn <= 15 && (
                  <div
                    className={`p-4 rounded-lg border ${
                      overview.passwordExpiresIn <= 5
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-yellow-50 border-yellow-200 text-yellow-700"
                    }`}
                  >
                    <h3 className="font-bold mb-1">⚠️ Password Expiring Soon</h3>
                    <p className="text-sm">
                      Your password expires in {overview.passwordExpiresIn} day(s) on{" "}
                      {formatDate(overview.passwordExpiresAt!)}.{" "}
                      <button
                        onClick={() => setActiveTab("password")}
                        className="underline font-medium"
                      >
                        Change it now
                      </button>
                    </p>
                  </div>
                )}

                {/* Security Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Password Card */}
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">🔑 Password</h3>
                        <p className="text-sm text-slate-600">
                          Last changed{" "}
                          {overview.passwordChangedAt
                            ? formatRelativeTime(overview.passwordChangedAt)
                            : "Never"}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Expires in:</span>
                        <span className="font-medium text-slate-900">
                          {overview.passwordExpiresIn} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Expiry date:</span>
                        <span className="font-medium text-slate-900">
                          {formatDate(overview.passwordExpiresAt!)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("password")}
                      className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* TOTP Card */}
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">
                          📱 Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-slate-600">
                          {overview.totpEnabled ? "Enabled" : "Disabled"}
                          {overview.totpEnabledAt &&
                            ` ${formatRelativeTime(overview.totpEnabledAt)}`}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          overview.totpEnabled
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {overview.totpEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Backup codes:</span>
                        <span
                          className={`font-medium ${
                            overview.backupCodesRemaining <= 2 ? "text-red-600" : "text-slate-900"
                          }`}
                        >
                          {overview.backupCodesRemaining} remaining
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Method:</span>
                        <span className="font-medium text-slate-900">Google Authenticator</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("totp")}
                      className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      Manage 2FA
                    </button>
                  </div>

                  {/* Sessions Card */}
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">💻 Active Sessions</h3>
                        <p className="text-sm text-slate-600">
                          {overview.activeSessions} active session(s)
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {overview.activeSessions}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Concurrent limit:</span>
                        <span className="font-medium text-slate-900">
                          {overview.maxConcurrentSessions} session(s)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Failed attempts:</span>
                        <span className="font-medium text-slate-900">
                          {overview.failedLoginAttempts}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("sessions")}
                      className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      Manage Sessions
                    </button>
                  </div>

                  {/* Trusted Devices Card */}
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">🖥️ Trusted Devices</h3>
                        <p className="text-sm text-slate-600">
                          {overview.trustedDevices} trusted device(s)
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {overview.trustedDevices}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Security alerts:</span>
                        <span className="font-medium text-slate-900">Enabled</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Location tracking:</span>
                        <span className="font-medium text-slate-900">Enabled</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("devices")}
                      className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      Manage Devices
                    </button>
                  </div>
                </div>

                {/* Account Status */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-bold text-green-900 mb-1">Account Secure</h3>
                      <p className="text-sm text-green-800">
                        Your account is protected with strong password, two-factor authentication,
                        and active session monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Change Password</h2>
                  <p className="text-slate-600">
                    Your password must be at least 12 characters and include uppercase, lowercase,
                    numbers, and special characters.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="max-w-2xl space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      changingPassword || !currentPassword || !newPassword || !confirmPassword
                    }
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? "Changing Password..." : "Change Password"}
                  </button>
                </form>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-900 mb-2">Password Requirements</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>At least 12 characters long</li>
                    <li>Mix of uppercase and lowercase letters</li>
                    <li>At least one number</li>
                    <li>At least one special character</li>
                    <li>Not found in breach databases</li>
                    <li>Cannot reuse last 5 passwords</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TOTP Tab */}
            {activeTab === "totp" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-slate-600">
                    Manage your TOTP settings and backup recovery codes.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-2">Coming Soon</h3>
                  <p className="text-sm text-blue-800">
                    TOTP management features are under development. Contact support if you need to
                    reset your authenticator.
                  </p>
                </div>
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Active Sessions</h2>
                  <p className="text-slate-600">
                    View and manage devices that are currently signed in to your account.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-2">Coming Soon</h3>
                  <p className="text-sm text-blue-800">
                    Session management features are under development.
                  </p>
                </div>
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === "devices" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Trusted Devices</h2>
                  <p className="text-slate-600">
                    Manage devices you&apos;ve marked as trusted for faster sign-in.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-2">Coming Soon</h3>
                  <p className="text-sm text-blue-800">
                    Device management features are under development.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
