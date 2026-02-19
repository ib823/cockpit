import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function resetUsersProperly() {
  console.log("🔄 Resetting users with proper email approvals...\n");

  const userEmails = ["admin@example.com", "user@example.com"];
  const results: Array<{ email: string; code: string; userId: string }> = [];

  for (const email of userEmails) {
    // Find the user
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      continue;
    }

    console.log(`\n👤 Processing user: ${email}`);
    console.log(`   User ID: ${user.id}`);

    // Delete all authenticators (passkeys) for this user
    const deletedAuthenticators = await prisma.authenticator.deleteMany({
      where: { userId: user.id },
    });
    console.log(`   ✅ Deleted ${deletedAuthenticators.count} passkey(s)`);

    // Generate a new 6-digit code
    const code = crypto.randomInt(100000, 1000000).toString();

    // Hash the code using bcrypt (same as EmailApproval uses)
    const tokenHash = await hash(code, 10);

    // Set expiry to 7 days from now
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Upsert EmailApproval record (create or update)
    await prisma.emailApproval.upsert({
      where: { email },
      create: {
        email,
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: user.id,
        usedAt: null,
        codeSent: true,
      },
      update: {
        tokenHash,
        tokenExpiresAt,
        usedAt: null, // Reset to unused
        codeSent: true,
      },
    });

    console.log(`   ✅ Updated/created email approval with new code`);

    results.push({
      email,
      code,
      userId: user.id,
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 USER RESET SUMMARY");
  console.log("=".repeat(60));

  for (const result of results) {
    console.log(`\n📧 ${result.email}`);
    console.log(`   🔑 6-Digit Code: ${result.code}`);
    console.log(`   🆔 User ID: ${result.userId}`);
    console.log(`   ⏰ Valid for: 7 days`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Reset complete!");
  console.log("=".repeat(60));
  console.log("\nℹ️  Notes:");
  console.log("  • All passkeys have been removed");
  console.log("  • Email approvals have been reset to unused");
  console.log("  • Users can now login with their 6-digit codes");
  console.log("  • Codes are valid for 7 days");
  console.log("  • Users can re-register their passkeys after login");
  console.log("\n🌐 Production URL: https://cockpit-ebon.vercel.app");
}

resetUsersProperly()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
