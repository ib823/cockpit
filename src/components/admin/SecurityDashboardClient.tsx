"use client";

import { useState, useEffect } from "react";
import { BlockedIP } from "@/lib/security/ip-blocker";

interface AuthMetricsSummary {
  last24Hours: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  last7Days: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  last30Days: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  recentFailures: number;
  topFailureReasons: Array<{ reason: string; count: number }>;
}

interface FailedAttempt {
  email: string | null;
  ipAddress: string | null;
  failureReason: string | null;
  timestamp: Date;
  method: string | null;
}

interface SuspiciousActivity {
  hasAlert: boolean;
  alerts: Array<{
    type: "high_failure_rate" | "repeated_failures" | "distributed_attack";
    severity: "low" | "medium" | "high";
    message: string;
    data: unknown;
  }>;
}

interface SecurityDashboardClientProps {
  initialMetrics: AuthMetricsSummary;
  initialFailures: FailedAttempt[];
  initialAlerts: SuspiciousActivity;
  initialBlockedIPs: BlockedIP[];
}

export function SecurityDashboardClient({
  initialMetrics,
  initialFailures,
  initialAlerts,
  initialBlockedIPs,
}: SecurityDashboardClientProps) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [failures, setFailures] = useState(initialFailures);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [blockedIPs, setBlockedIPs] = useState(initialBlockedIPs);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        // Fetch updated metrics
        const [metricsRes, failuresRes, alertsRes, blockedIPsRes] = await Promise.all([
          fetch("/api/admin/auth-metrics?action=summary"),
          fetch("/api/admin/auth-metrics?action=failures&minutes=60"),
          fetch("/api/admin/auth-metrics?action=alerts"),
          fetch("/api/admin/security/blocked-ips"),
        ]);

        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data.data);
        }

        if (failuresRes.ok) {
          const data = await failuresRes.json();
          setFailures(data.data.failures);
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json();
          setAlerts(data.data);
        }

        if (blockedIPsRes.ok) {
          const data = await blockedIPsRes.json();
          setBlockedIPs(data.blockedIPs);
        }

        setLastUpdate(new Date());
      } catch (error) {
        console.error("Failed to refresh security data:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleUnblockIP = async (ip: string) => {
    if (!confirm(`Are you sure you want to unblock IP ${ip}?`)) return;

    try {
      const res = await fetch("/api/admin/security/unblock-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });

      if (res.ok) {
        setBlockedIPs((prev) => prev.filter((b) => b.ip !== ip));
        alert(`Successfully unblocked IP ${ip}`);
      } else {
        alert("Failed to unblock IP");
      }
    } catch (_error) {
      alert("Error unblocking IP");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
      case "critical":
        return "text-red-600 bg-red-50";
      case "medium":
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return "text-green-600";
    if (rate >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Auto-refresh toggle and last update */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Last updated: {lastUpdate.toLocaleTimeString()}</div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
        </label>
      </div>

      {/* Security Alerts */}
      {alerts.hasAlert && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Security Alerts ({alerts.alerts.length})
          </h3>
          <div className="space-y-3">
            {alerts.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  alert.severity === "high" ? "border-red-300" : "border-yellow-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-sm text-gray-600">{alert.type.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-gray-900">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">24 Hour Success Rate</p>
          <p
            className={`text-3xl font-bold ${getSuccessRateColor(metrics.last24Hours.successRate)}`}
          >
            {metrics.last24Hours.successRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {metrics.last24Hours.successful} / {metrics.last24Hours.total} attempts
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">7 Day Success Rate</p>
          <p className={`text-3xl font-bold ${getSuccessRateColor(metrics.last7Days.successRate)}`}>
            {metrics.last7Days.successRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {metrics.last7Days.successful} / {metrics.last7Days.total} attempts
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">30 Day Success Rate</p>
          <p
            className={`text-3xl font-bold ${getSuccessRateColor(metrics.last30Days.successRate)}`}
          >
            {metrics.last30Days.successRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {metrics.last30Days.successful} / {metrics.last30Days.total} attempts
          </p>
        </div>
      </div>

      {/* Two column layout for failures and blocked IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Failures */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Failed Attempts ({failures.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {failures.slice(0, 20).map((failure, idx) => (
              <div key={idx} className="border-l-4 border-red-400 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{failure.email || "Unknown"}</p>
                    <p className="text-sm text-gray-600">{failure.ipAddress || "Unknown IP"}</p>
                    <p className="text-xs text-gray-500">{failure.failureReason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(failure.timestamp).toLocaleTimeString()}
                    </p>
                    {failure.method && (
                      <span className="inline-block px-2 py-1 mt-1 text-xs bg-gray-100 rounded">
                        {failure.method}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {failures.length === 0 && (
              <p className="text-gray-500 text-center py-8">No recent failures</p>
            )}
          </div>
        </div>

        {/* Blocked IPs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Blocked IPs ({blockedIPs.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {blockedIPs.map((block) => (
              <div key={block.ip} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-mono font-semibold text-gray-900">{block.ip}</p>
                    <p className="text-sm text-gray-600 mt-1">{block.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Blocked: {new Date(block.blockedAt).toLocaleString()}
                    </p>
                    {block.expiresAt && !block.permanent && (
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(block.expiresAt).toLocaleString()}
                      </p>
                    )}
                    {block.permanent && (
                      <span className="inline-block px-2 py-1 mt-2 text-xs bg-red-100 text-red-800 rounded">
                        Permanent
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnblockIP(block.ip)}
                    className="ml-4 px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
            {blockedIPs.length === 0 && (
              <p className="text-gray-500 text-center py-8">No blocked IPs</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Failure Reasons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Failure Reasons</h3>
        <div className="space-y-3">
          {metrics.topFailureReasons.map((reason, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                  <p className="text-gray-900">{reason.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{reason.count}</p>
                  <p className="text-xs text-gray-500">occurrences</p>
                </div>
              </div>
            </div>
          ))}
          {metrics.topFailureReasons.length === 0 && (
            <p className="text-gray-500 text-center py-4">No failure data</p>
          )}
        </div>
      </div>
    </div>
  );
}
