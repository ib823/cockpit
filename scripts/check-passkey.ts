import { prisma } from "../src/lib/db";

async function checkPasskey() {
  try {
    const email = "admin@example.com";

    console.log("\n🔍 Checking passkey for:", email);
    console.log("═══════════════════════════════════════════════════\n");

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        passkeys: true,
        webauthnChallenges: {
          orderBy: { expiresAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      console.log("❌ User NOT FOUND!");
      console.log("\n💡 Possible reasons:");
      console.log("  • Email might be spelled differently in database");
      console.log("  • User account may have been deleted");
      console.log("  • Database connection issue");
      console.log("\nTry searching for similar emails...\n");
      return;
    }

    console.log("✅ User FOUND!");
    console.log("\n👤 User Details:");
    console.log("  • ID:", user.id);
    console.log("  • Email:", user.email);
    console.log("  • Name:", user.name || "N/A");
    console.log("  • Role:", user.role);
    console.log("  • Created:", user.createdAt.toISOString());
    console.log("  • Email Verified:", user.emailVerified ? "✅ Yes" : "❌ No");

    console.log("\n🔑 Passkey Status:");
    if (user.passkeys.length === 0) {
      console.log("  ❌ NO PASSKEYS REGISTERED");
      console.log("\n  ⚠️  This is the problem!");
      console.log("  Your user account exists but has no passkeys.");
      console.log("\n  📝 To fix this:");
      console.log("     1. Go to /register-secure");
      console.log("     2. Complete the passkey registration");
      console.log("     3. Then you can login with your passkey\n");
    } else {
      console.log(`  ✅ ${user.passkeys.length} passkey(s) registered:\n`);
      user.passkeys.forEach((pk, i) => {
        console.log(`  Passkey #${i + 1}:`);
        console.log("    • ID:", pk.id.substring(0, 20) + "...");
        console.log("    • Credential ID:", pk.credentialId.substring(0, 40) + "...");
        console.log("    • Device:", pk.deviceName || "Unknown device");
        console.log("    • Created:", pk.createdAt.toISOString());
        console.log("    • Last Used:", pk.lastUsedAt ? pk.lastUsedAt.toISOString() : "Never");
        console.log("    • Counter:", pk.counter);
        console.log("    • Transports:", pk.transports || "N/A");
        console.log("");
      });
    }

    console.log("🔐 Recent Authentication Challenges:");
    if (user.webauthnChallenges.length === 0) {
      console.log("  No recent login attempts");
    } else {
      user.webauthnChallenges.slice(0, 3).forEach((ch, i) => {
        const expired = new Date(ch.expiresAt) < new Date();
        console.log(`  ${i + 1}. ${ch.type} challenge`);
        console.log(`     • Created: ${ch.createdAt.toISOString()}`);
        console.log(
          `     • Expires: ${ch.expiresAt.toISOString()} ${expired ? "⚠️ EXPIRED" : "✓ Valid"}`
        );
        console.log("");
      });
    }

    // Check admin approval
    const adminApproval = await prisma.adminApproval.findUnique({
      where: { email },
    });

    console.log("👑 Admin Access Status:");
    if (adminApproval) {
      console.log("  ✅ Admin approval EXISTS");
      console.log("    • Approved by:", adminApproval.approvedBy);
      console.log("    • Approved at:", adminApproval.approvedAt.toISOString());
      if (adminApproval.expiresAt) {
        const expired = new Date(adminApproval.expiresAt) < new Date();
        console.log(
          "    • Expires:",
          adminApproval.expiresAt.toISOString(),
          expired ? "⚠️ EXPIRED" : "✓ Valid"
        );
        if (expired) {
          console.log("\n  ⚠️  Admin access has EXPIRED! Request renewal from another admin.");
        }
      } else {
        console.log("    • Expires: Never (permanent access)");
      }
    } else {
      console.log("  ℹ️  No admin approval (regular user access only)");
    }

    console.log("\n═══════════════════════════════════════════════════\n");

    // Summary
    console.log("📊 DIAGNOSIS SUMMARY:");
    if (user.passkeys.length === 0) {
      console.log("  🔴 ISSUE IDENTIFIED: No passkeys registered");
      console.log("  🔧 FIX: Register a passkey at /register-secure\n");
    } else if (
      adminApproval &&
      adminApproval.expiresAt &&
      new Date(adminApproval.expiresAt) < new Date()
    ) {
      console.log("  🟡 ISSUE: Admin access expired");
      console.log("  🔧 FIX: Request admin access renewal\n");
    } else {
      console.log("  🟢 Account looks healthy!");
      console.log("  If login still fails, check:");
      console.log("     • Browser console for errors");
      console.log("     • Passkey authenticator is working");
      console.log("     • Correct email is being used\n");
    }
  } catch (error: any) {
    console.error("\n❌ Error checking passkey:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasskey();
