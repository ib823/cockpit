/**
 * Set 6-digit codes for production users in EmailApproval table
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Setting 6-digit codes for production users...\n");

  const users = [
    { email: "ikmls@hotmail.com", role: "ADMIN" },
    { email: "ibaharudin@abeam.com", role: "USER" },
  ];

  // Get system admin for approvedByUserId
  let systemAdmin = await prisma.users.findFirst({
    where: { role: "ADMIN" },
  });

  if (!systemAdmin) {
    console.error("❌ No admin user found in database");
    process.exit(1);
  }

  const results: Array<{ email: string; code: string }> = [];

  for (const user of users) {
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code with bcrypt (same as begin-register expects)
    const tokenHash = await hash(code, 10);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      // Check if approval already exists
      const existing = await prisma.emailApproval.findUnique({
        where: { email: user.email },
      });

      if (existing) {
        // Update existing approval with new code
        await prisma.emailApproval.update({
          where: { email: user.email },
          data: {
            tokenHash,
            tokenExpiresAt: expiresAt,
            usedAt: null, // Reset used status
            approvedByUserId: systemAdmin.id,
            codeSent: true,
          },
        });
        console.log(`✅ Updated code for ${user.email}`);
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
        console.log(`✅ Created code for ${user.email}`);
      }

      results.push({ email: user.email, code });
    } catch (error) {
      console.error(`❌ Error setting code for ${user.email}:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 PRODUCTION CODES");
  console.log("=".repeat(60));

  for (const result of results) {
    console.log(`\n📧 ${result.email}`);
    console.log(`   🔑 6-Digit Code: ${result.code}`);
    console.log(`   ⏰ Valid for: 7 days`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Codes set successfully!");
  console.log("=".repeat(60));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
