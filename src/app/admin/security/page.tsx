import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/common/LogoutButton";
import { SecurityDashboardClient } from "@/components/admin/SecurityDashboardClient";
import {
  getAuthMetricsSummary,
  getRecentFailedAttempts,
  checkForSuspiciousActivity,
} from "@/lib/monitoring/auth-metrics";
import { getBlockedIPs } from "@/lib/security/ip-blocker";
import { AppShell, PageHeader } from "@/components/ds/AppShell";
import { adminNav } from "../nav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SecurityDashboard() {
  const session = await getServerSession(authConfig);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch initial data server-side
  const [metrics, recentFailures, suspiciousActivity, blockedIPs] = await Promise.all([
    getAuthMetricsSummary(),
    getRecentFailedAttempts(60, 100),
    checkForSuspiciousActivity(),
    getBlockedIPs(),
  ]);

  return (
    <AppShell
      brand="Admin"
      primaryNav={adminNav("/admin/security")}
      topBarEnd={
        <>
          <span
            style={{
              font: "var(--ds-type-label)",
              color: "var(--ds-content-secondary)",
            }}
          >
            {session.user.email}
          </span>
          <LogoutButton />
        </>
      }
    >
      <PageHeader
        title="Security monitoring"
        description="Authentication metrics and threat detection."
      />
      <SecurityDashboardClient
        initialMetrics={metrics}
        initialFailures={recentFailures}
        initialAlerts={suspiciousActivity}
        initialBlockedIPs={blockedIPs}
      />
    </AppShell>
  );
}
