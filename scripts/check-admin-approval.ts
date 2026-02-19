import { prisma } from "../src/lib/db";

async function main() {
  const adminEmail = "admin@example.com";

  // Check if user exists
  const user = await prisma.users.findUnique({ where: { email: adminEmail } });
  console.log("User:", user ? "EXISTS" : "NOT FOUND");

  // Check if approval exists
  const approval = await prisma.emailApproval.findUnique({ where: { email: adminEmail } });
  console.log("Email Approval:", approval ? "EXISTS" : "NOT FOUND");

  if (approval) {
    console.log("  - Used At:", approval.usedAt);
    console.log("  - Expires At:", approval.tokenExpiresAt);
    console.log("  - Is Valid:", !approval.usedAt && approval.tokenExpiresAt > new Date());
  }

  await prisma.$disconnect();
}

main().catch(console.error);
