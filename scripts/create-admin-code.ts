/**
 * Create Admin Access Code
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminCode() {
  const adminEmail = "admin@example.com";
  const accessCode = "123456"; // Simple code for testing

  try {
    // Get admin user
    const adminUser = await prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (!adminUser) {
      console.error("❌ Admin user not found");
      return;
    }

    // Hash the code
    const tokenHash = await hash(accessCode, 12);

    // Create or update email approval
    const approval = await prisma.emailApproval.upsert({
      where: { email: adminEmail },
      update: {
        tokenHash,
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        usedAt: null, // Reset usage
      },
      create: {
        email: adminEmail,
        tokenHash,
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        approvedByUserId: adminUser.id, // Use admin's own ID
      },
    });

    console.log("\n✅ Admin access code created!");
    console.log("\n=== LOGIN INSTRUCTIONS ===");
    console.log("1. Go to: http://localhost:3000/login");
    console.log("2. Enter email: admin@example.com");
    console.log("3. Enter code: 123456");
    console.log("4. Complete passkey registration");
    console.log("\nCode expires:", approval.tokenExpiresAt);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminCode();
