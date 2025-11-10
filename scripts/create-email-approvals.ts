/**
 * Create Email Approvals for Test Users
 *
 * This allows test users to register their passkeys
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Creating email approvals for test users...\n");

  const users = [
    { email: "admin@test.com", role: "ADMIN" },
    { email: "user@test.com", role: "USER" },
  ];

  // Get or create system admin user for approvedByUserId
  let systemAdmin = await prisma.users.findFirst({
    where: { role: "ADMIN" },
  });

  if (!systemAdmin) {
    systemAdmin = await prisma.users.create({
      data: {
        id: createId(),
        email: "system@keystone.local",
        role: "ADMIN",
        name: "System",
        updatedAt: new Date(),
      },
    });
  }

  for (const user of users) {
    // Generate magic link token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash the token for storage (security best practice)
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      // Check if approval already exists
      const existing = await prisma.emailApproval.findUnique({
        where: { email: user.email },
      });

      if (existing) {
        // Update existing approval
        await prisma.emailApproval.update({
          where: { email: user.email },
          data: {
            tokenHash,
            tokenExpiresAt: expiresAt,
            usedAt: null, // Reset used status
            approvedByUserId: systemAdmin.id,
          },
        });
        console.log(`✅ Updated approval for ${user.email}`);
      } else {
        // Create new approval
        await prisma.emailApproval.create({
          data: {
            email: user.email,
            tokenHash,
            tokenExpiresAt: expiresAt,
            approvedByUserId: systemAdmin.id,
            codeSent: true,
          },
        });
        console.log(`✅ Created approval for ${user.email}`);
      }

      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔗 Token: ${token}`);
      console.log(`   ⏰ Expires: ${expiresAt.toISOString()}\n`);
    } catch (error) {
      console.error(`❌ Error creating approval for ${user.email}:`, error);
    }
  }

  console.log("✅ Email approvals created successfully!\n");
  console.log("📋 NEXT STEPS:");
  console.log("1. Go to http://localhost:3000/login");
  console.log("2. Enter email (admin@test.com or user@test.com)");
  console.log("3. Enter the 6-digit code shown above");
  console.log("4. Register your passkey (fingerprint/face)");
  console.log("5. Login with passkey from then on!\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
