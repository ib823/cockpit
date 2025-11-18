import { prisma } from "../src/lib/db";

async function diagnosePasskeyIssue() {
  try {
    const email = "ikmls@hotmail.com";

    console.log("\n═══════════════════════════════════════");
    console.log("🔍 Passkey Diagnosis for:", email);
    console.log("═══════════════════════════════════════\n");

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    // Fetch EmailApproval separately (no direct relation)
    const emailApproval = await prisma.emailApproval.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User NOT FOUND in database\n");
      return;
    }

    console.log("✅ User FOUND");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("👤 User Details:");
    console.log(`  ID:              ${user.id}`);
    console.log(`  Email:           ${user.email}`);
    console.log(`  Access Expires:  ${user.accessExpiresAt || "Never"}`);
    console.log(`  Exception:       ${user.exception}`);

    console.log("\n🔑 Passkey Status:");
    console.log(`  Total Passkeys:  ${user.Authenticator.length}`);

    if (user.Authenticator.length === 0) {
      console.log("\n  ⚠️  NO PASSKEYS FOUND!");
      console.log("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("  This is why you're seeing 'passkey not found'");
      console.log("  despite successful login on production.\n");
    } else {
      console.log("\n  Passkey Details:");
      user.Authenticator.forEach((auth, idx) => {
        console.log(`\n  [${idx + 1}]`);
        console.log(`    ID:           ${auth.id.substring(0, 30)}...`);
        console.log(`    Device Type:  ${auth.deviceType}`);
        console.log(`    Backed Up:    ${auth.backedUp}`);
        console.log(`    Counter:      ${auth.counter}`);
        console.log(`    Created:      ${auth.createdAt.toISOString()}`);
        console.log(`    Last Used:    ${auth.lastUsedAt.toISOString()}`);
        console.log(`    Transports:   ${JSON.stringify(auth.transports)}`);
      });
    }

    console.log("\n📧 Email Approval:");
    if (emailApproval) {
      console.log("  Status:          ✅ EXISTS");
      console.log(`  Token Hash:      ${emailApproval.tokenHash.substring(0, 20)}...`);
      console.log(`  Token Expires:   ${emailApproval.tokenExpiresAt.toISOString()}`);
      console.log(`  Created:         ${emailApproval.createdAt.toISOString()}`);
      console.log(`  Used At:         ${emailApproval.usedAt || "Not used yet"}`);
    } else {
      console.log("  Status:          ❌ NONE");
    }

    console.log("\n═══════════════════════════════════════");
    console.log("📊 DIAGNOSIS");
    console.log("═══════════════════════════════════════\n");

    if (user.Authenticator.length === 0) {
      console.log("🔴 ROOT CAUSE:");
      console.log("   Your account exists in production but has NO passkeys");
      console.log("   registered. This causes the conflict you're seeing:\n");
      console.log("   • Login API succeeds (user exists) ✅");
      console.log("   • Device passkey prompt fails (no passkey stored) ❌\n");

      console.log("💡 SOLUTION:");
      console.log("   You need to register a passkey for this account:\n");
      console.log("   1. Go to production site");
      console.log("   2. Use 'Register' or 'Add Passkey' flow");
      console.log("   3. Complete passkey creation on your device");
      console.log("   4. Then login will work properly\n");

      console.log("⚙️  TECHNICAL DETAILS:");
      console.log("   • WebAuthn requires a credential ID stored in DB");
      console.log("   • Your device needs to create & store the private key");
      console.log("   • Both must match for authentication to succeed\n");
    } else {
      console.log("🟢 Passkeys are registered!");
      console.log("   The issue might be:");
      console.log("   • Different device/browser than where passkey was created");
      console.log("   • Passkey not synced to this device");
      console.log("   • Browser/OS passkey manager not accessible\n");
    }

    console.log("═══════════════════════════════════════\n");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosePasskeyIssue();
