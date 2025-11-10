import { prisma } from "../src/lib/db";

async function checkAdminPasskey() {
  try {
    const email = "ikmls@hotmail.com";
    console.log("\n🔍 Checking passkey for:", email);
    console.log("═══════════════════════════════════════════════════\n");

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    if (!user) {
      console.log("❌ User NOT FOUND in database!");
      return;
    }

    console.log("✅ User FOUND!");
    console.log("  • ID:", user.id);
    console.log("  • Email:", user.email);
    console.log("  • Role:", user.role);
    console.log("  • Access Expires:", user.accessExpiresAt);
    console.log("  • Exception:", user.exception);

    console.log("\n🔑 Authenticator/Passkey Status:");
    if (user.Authenticator.length === 0) {
      console.log("  ❌ NO PASSKEYS REGISTERED");
      console.log("  This is why login fails!");
    } else {
      console.log(`  ✅ ${user.Authenticator.length} passkey(s) registered\n`);
      user.Authenticator.forEach((auth, i) => {
        console.log(`  Passkey #${i + 1}:`);
        console.log("    • ID:", auth.id.substring(0, 30) + "...");
        console.log("    • Device:", auth.nickname || auth.deviceType);
        console.log("    • Created:", auth.createdAt);
        console.log("    • Last Used:", auth.lastUsedAt);
        console.log("    • Counter:", auth.counter);
        console.log("");
      });
    }

    // Check if access expired
    const now = new Date();
    if (!user.exception && user.accessExpiresAt && user.accessExpiresAt <= now) {
      console.log("⚠️  WARNING: Access has EXPIRED!");
      console.log("   Expiry date:", user.accessExpiresAt);
      console.log("   Current time:", now);
      console.log("\n💡 This is the root cause - your access expired!");
    } else {
      console.log("✅ Access is valid");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPasskey();
