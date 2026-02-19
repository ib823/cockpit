import { rpID, origin } from "../src/lib/webauthn";
import { prisma } from "../src/lib/db";

async function checkWebAuthnConfig() {
  try {
    console.log("\n🔐 WebAuthn Configuration Check");
    console.log("═══════════════════════════════════════════════════\n");

    // Check environment
    console.log("📋 Environment Variables:");
    console.log("  • NODE_ENV:", process.env.NODE_ENV);
    console.log("  • WEBAUTHN_RP_ID:", process.env.WEBAUTHN_RP_ID || "NOT SET (using localhost)");
    console.log(
      "  • WEBAUTHN_ORIGIN:",
      process.env.WEBAUTHN_ORIGIN || "NOT SET (using http://localhost:3001)"
    );
    console.log("  • NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "NOT SET");

    console.log("\n🔧 Resolved WebAuthn Config:");
    console.log("  • RP ID:", rpID);
    console.log("  • Origin:", origin);

    // Check if we're in production mode
    const isProduction = process.env.NODE_ENV === "production";
    console.log("\n📊 Environment Status:");
    console.log("  • Is Production:", isProduction);

    if (isProduction) {
      if (!process.env.WEBAUTHN_RP_ID || !process.env.WEBAUTHN_ORIGIN) {
        console.log("\n❌ CRITICAL ERROR:");
        console.log("  WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN are REQUIRED in production!");
        console.log("\n💡 Fix in your production environment (Vercel/hosting dashboard):");
        console.log('  1. Set WEBAUTHN_RP_ID to your domain (e.g., "app.yourdomain.com")');
        console.log(
          '  2. Set WEBAUTHN_ORIGIN to your full URL (e.g., "https://app.yourdomain.com")'
        );
        console.log("  3. Redeploy your application");
        return;
      }
    }

    // Check admin user's passkey
    const email = "admin@example.com";
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    if (user && user.Authenticator.length > 0) {
      console.log("\n🔑 Admin Passkey Info:");
      console.log("  • Registered:", user.Authenticator[0].createdAt);
      console.log("  • Last Used:", user.Authenticator[0].lastUsedAt);
      console.log("  • Use Count:", user.Authenticator[0].counter);

      if (user.Authenticator[0].counter === 0) {
        console.log("\n⚠️  WARNING: Passkey has NEVER been used successfully!");
        console.log("  This strongly suggests a WebAuthn configuration problem.");
      }
    }

    console.log("\n═══════════════════════════════════════════════════");
    console.log("\n🔍 DIAGNOSIS:");

    if (isProduction && (!process.env.WEBAUTHN_RP_ID || !process.env.WEBAUTHN_ORIGIN)) {
      console.log("  🔴 Missing WebAuthn configuration in production");
      console.log("\n📝 ACTION REQUIRED:");
      console.log("  1. Go to your Vercel/hosting dashboard");
      console.log("  2. Add these environment variables:");
      console.log("     WEBAUTHN_RP_ID=your-domain.com");
      console.log("     WEBAUTHN_ORIGIN=https://your-domain.com");
      console.log("  3. Redeploy");
      console.log("\n  ⚠️  IMPORTANT: After fixing config, you may need to");
      console.log("     re-register your passkey for it to work.");
    } else if (user && user.Authenticator[0]?.counter === 0) {
      console.log("  🟡 Passkey registered but never used successfully");
      console.log("\n📝 POSSIBLE FIXES:");
      console.log("  1. Check browser console for WebAuthn errors during login");
      console.log("  2. Verify WEBAUTHN_RP_ID matches your actual domain");
      console.log("  3. Verify WEBAUTHN_ORIGIN matches your actual URL");
      console.log("  4. Try re-registering the passkey if config was wrong");
    } else {
      console.log("  🟢 Configuration looks correct");
      console.log("\n  If login still fails, check:");
      console.log("  • Browser console for errors");
      console.log("  • Network tab for failed API calls");
      console.log("  • Server logs during login attempt");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWebAuthnConfig();
