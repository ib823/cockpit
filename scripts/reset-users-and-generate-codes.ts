import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function resetUsersAndGenerateCodes() {
  console.log("🔄 Resetting users and generating 6-digit codes...\n");

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

    // Delete any existing magic tokens for this user
    await prisma.magic_tokens.deleteMany({
      where: { email },
    });
    console.log(`   ✅ Cleared existing OTP tokens`);

    // Generate a new 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code for storage (using SHA-256)
    const tokenHash = crypto.createHash("sha256").update(code).digest("hex");

    // Create new magic token with 15 minutes expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.magic_tokens.create({
      data: {
        id: crypto.randomUUID(),
        email,
        token: tokenHash,
        expiresAt,
        type: "otp",
      },
    });

    console.log(`   ✅ Generated new 6-digit code`);

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
    console.log(`   ⏰ Valid for: 15 minutes`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Reset complete!");
  console.log("=".repeat(60));
  console.log("\nℹ️  Notes:");
  console.log("  • All passkeys have been removed");
  console.log("  • Users can now login with their 6-digit codes");
  console.log("  • Codes expire in 15 minutes");
  console.log("  • Users can re-register their passkeys after login");
}

resetUsersAndGenerateCodes()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
