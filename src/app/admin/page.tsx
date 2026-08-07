import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/common/LogoutButton";
import { prisma, withRetry } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { logger } from "@/lib/logger";
import { AppShell, PageHeader, Card } from "@/components/ds/AppShell";
import { Banner } from "@/components/ds/Banner";
import { adminNav } from "./nav";
import styles from "./admin.module.css";

// Cache admin stats with smart error handling and retry logic
const getCachedAdminStats = unstable_cache(
  async () => {
    try {
      const [totalUsers, activeProjects, proposals] = await withRetry(() =>
        Promise.all([
          prisma.users.count(),
          prisma.projects.count({ where: { status: "APPROVED" } }),
          prisma.projects.count({ where: { status: { in: ["DRAFT", "IN_REVIEW"] } } }),
        ])
      );

      return { totalUsers, activeProjects, proposals, dbError: false };
    } catch (error) {
      logger.error("[Admin Dashboard] Failed to fetch statistics:", { error });
      return { totalUsers: 0, activeProjects: 0, proposals: 0, dbError: true };
    }
  },
  ["admin-stats"],
  { revalidate: 10, tags: ["admin-stats"] } // Cache for 10 seconds (balanced for responsiveness)
);

const QUICK_LINKS = [
  { href: "/admin/users", title: "Manage users", body: "Add, edit or remove users" },
  { href: "/admin/approvals", title: "Approvals", body: "Pending access requests" },
  {
    href: "/admin/security",
    title: "Security monitoring",
    body: "Auth metrics and threat detection",
  },
  { href: "/gantt-tool", title: "Gantt tool", body: "Manage project timelines" },
];

export default async function AdminDashboard() {
  const session = await getServerSession(authConfig);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch statistics with caching
  const { totalUsers, activeProjects, proposals, dbError } = await getCachedAdminStats();

  const stats = [
    { label: "Total users", value: totalUsers },
    { label: "Active projects", value: activeProjects },
    { label: "Proposals in progress", value: proposals },
  ];

  return (
    <AppShell
      brand="Admin"
      primaryNav={adminNav("/admin")}
      topBarEnd={
        <>
          <span className={styles.email}>{session.user.email}</span>
          <LogoutButton />
        </>
      }
    >
      <PageHeader title="Overview" description="Users, projects and system settings." />

      {dbError && (
        <div className={styles.bannerSlot}>
          {/* The figures below are zeroes from a failed query, not real counts.
              Saying so is the difference between "quiet week" and "the database
              is unreachable". */}
          <Banner tone="warning" title="Statistics are unavailable">
            The database could not be reached, so every figure below reads zero.
            These are placeholders, not counts. Check the database connection and
            reload.
          </Banner>
        </div>
      )}

      <div className={styles.statGrid}>
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue} aria-live="polite">
              {dbError ? "—" : stat.value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <section aria-labelledby="quick-actions" className={styles.section}>
        <h2 id="quick-actions" className={styles.sectionTitle}>
          Quick actions
        </h2>
        <div className={styles.linkGrid}>
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={styles.linkCard}>
              <span className={styles.linkTitle}>{link.title}</span>
              <span className={styles.linkBody}>{link.body}</span>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
