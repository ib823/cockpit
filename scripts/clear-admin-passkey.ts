import { prisma } from "../src/lib/db";

async function clearAdminPasskey() {
  try {
    const email = "ikmls@hotmail.com";

    console.log("\n🔄 Clearing passkeys for:", email);
    console.log("═══════════════════════════════════════════════════\n");

    // First, check current state
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log("✅ User found:");
    console.log("  • ID:", user.id);
    console.log("  • Email:", user.email);
    console.log("  • Role:", user.role);

    if (user.Authenticator.length === 0) {
      console.log("\n⚠️  No passkeys to clear - account is already clean!");
      console.log("\n💡 You can go directly to registration:");
      console.log("  1. Go to your production app");
      console.log("  2. Navigate to registration page");
      console.log("  3. Register your passkey for", email);
      return;
    }

    console.log("\n🔑 Current passkeys:", user.Authenticator.length);
    user.Authenticator.forEach((auth, i) => {
      console.log(`\n  Passkey #${i + 1}:`);
      console.log("    • ID:", auth.id.substring(0, 30) + "...");
      console.log("    • Device:", auth.nickname || auth.deviceType);
      console.log("    • Created:", auth.createdAt);
      console.log("    • Last Used:", auth.lastUsedAt);
      console.log("    • Counter:", auth.counter);
    });

    console.log("\n⚠️  WARNING: About to delete all passkeys for this account!");
    console.log("After deletion, you will need to re-register your passkey.\n");

    // Delete all authenticators for this user
    const deleteResult = await prisma.authenticator.deleteMany({
      where: { userId: user.id },
    });

    console.log("✅ Deleted", deleteResult.count, "passkey(s)");

    // Verify deletion
    const verifyUser = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    console.log("\n✅ Verification: Account now has", verifyUser!.Authenticator.length, "passkeys");

    console.log("\n═══════════════════════════════════════════════════");
    console.log("\n🎯 NEXT STEPS:\n");
    console.log("1. Make sure your production environment has correct WebAuthn config:");
    console.log("   • WEBAUTHN_RP_ID = your-domain.com (no https://)");
    console.log("   • WEBAUTHN_ORIGIN = https://your-domain.com (with https://)");
    console.log("");
    console.log("2. Redeploy your app if you changed environment variables");
    console.log("");
    console.log("3. Go to your production registration page");
    console.log("");
    console.log("4. Register a new passkey for:", email);
    console.log("");
    console.log("5. Try logging in with the new passkey");
    console.log("");
    console.log("💡 TIP: Check browser console during registration for any errors\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Safety check - require confirmation
const args = process.argv.slice(2);
const confirmed = args.includes("--confirm");

if (!confirmed) {
  console.log("\n⚠️  SAFETY CHECK REQUIRED\n");
  console.log("This script will DELETE all passkeys for ikmls@hotmail.com");
  console.log("");
  console.log("To proceed, run:");
  console.log("  npx tsx scripts/clear-admin-passkey.ts --confirm");
  console.log("");
  process.exit(0);
}

clearAdminPasskey();
