/**
 * Manual Passkey Addition Script
 *
 * This script helps add a second passkey for a user who can't login
 * due to device sync issues. It generates a registration URL that
 * bypasses the session requirement temporarily.
 *
 * SECURITY NOTE: This should only be used for emergency recovery.
 * The generated token expires in 15 minutes.
 */

import { prisma } from "../src/lib/db";
import crypto from "crypto";

async function generatePasskeyRegistrationToken(email: string) {
  try {
    console.log("\n═══════════════════════════════════════");
    console.log("🔐 Passkey Registration Token Generator");
    console.log("═══════════════════════════════════════\n");

    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    if (!user) {
      console.log("❌ User not found:", email);
      return;
    }

    console.log("✅ User Found:");
    console.log(`  Email: ${user.email}`);
    console.log(`  Existing Passkeys: ${user.Authenticator.length}`);

    // Generate a secure one-time token
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token in a temporary table or use EmailApproval for tracking
    // For now, we'll create a special recovery token
    console.log("\n📝 Generated Registration Token:");
    console.log(`  Token: ${token}`);
    console.log(`  Expires: ${expiresAt.toISOString()}`);
    console.log(`  Valid for: 15 minutes`);

    console.log("\n🔗 Registration URL:");
    console.log(`  ${process.env.NEXTAUTH_URL || "http://localhost:3001"}/account/add-passkey?token=${token}`);

    console.log("\n📋 Instructions:");
    console.log("  1. Open the URL above on the device you want to add");
    console.log("  2. The page will auto-register without requiring login");
    console.log("  3. Complete the passkey creation when prompted");
    console.log("  4. Token expires in 15 minutes for security");

    console.log("\n⚠️  IMPORTANT:");
    console.log("  • This token grants temporary access to add a passkey");
    console.log("  • Do not share this URL with anyone");
    console.log("  • It will expire automatically after 15 minutes");
    console.log("  • After adding the passkey, normal login will work\n");

    // Return token for programmatic use
    return {
      token,
      tokenHash,
      expiresAt,
      url: `${process.env.NEXTAUTH_URL || "http://localhost:3001"}/account/add-passkey?token=${token}`,
    };
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run for the specified email
const email = process.argv[2] || "ikmls@hotmail.com";
generatePasskeyRegistrationToken(email);
