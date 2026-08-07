import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import UserManagementClient from "@/components/admin/UserManagementClient";
import { AppShell, PageHeader } from "@/components/ds/AppShell";
import { Banner } from "@/components/ds/Banner";
import { adminNav } from "../nav";

export default async function UsersPage() {
  const session = await getServerSession(authConfig);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all users from database (excluding other admins for security)
  const users = await prisma.users.findMany({
    where: {
      role: { not: "ADMIN" },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      accessExpiresAt: true,
      exception: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AppShell brand="Admin" primaryNav={adminNav("/admin/users")}>
      <PageHeader
        title="Users"
        description={`${users.length} ${users.length === 1 ? "user" : "users"}. Administrators are not listed.`}
      />

      <UserManagementClient initialUsers={users} />

      {/* Guidance stays on the page rather than in a tooltip: it explains a
          rule (permanent access never expires) that changes what the controls
          above actually do. */}
      <div style={{ marginTop: "var(--ds-space-5)" }}>
        <Banner tone="info" title="How access works">
          Users with permanent access never expire. Everyone else loses access on
          their expiry date and must be renewed. Editing a user does not notify
          them; deleting one is immediate and cannot be undone.
        </Banner>
      </div>
    </AppShell>
  );
}
