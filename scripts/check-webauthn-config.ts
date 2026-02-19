import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking WebAuthn Configuration...\n");

  // Show current WebAuthn config
  const rpID = process.env.WEBAUTHN_RP_ID;
  const origin = process.env.WEBAUTHN_ORIGIN;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL;

  console.log("📋 Current Environment Variables:");
  console.log("================================");
  console.log("WEBAUTHN_RP_ID:", rpID || "❌ NOT SET");
  console.log("WEBAUTHN_ORIGIN:", origin || "❌ NOT SET");
  console.log("NEXTAUTH_URL:", nextAuthUrl || "❌ NOT SET");
  console.log("NEXT_PUBLIC_APP_URL:", appUrl || "❌ NOT SET");
  console.log("VERCEL_URL:", vercelUrl || "❌ NOT SET");
  console.log("");

  // Show what the code will use
  const actualOrigin = origin ?? nextAuthUrl ?? "http://localhost:3001";
  const actualRPID = rpID ?? "localhost";

  console.log("🎯 Actual Values Being Used:");
  console.log("================================");
  console.log("Expected Origin:", actualOrigin);
  console.log("Expected RP ID:", actualRPID);
  console.log("");

  // Check registered passkeys
  const authenticators = await prisma.authenticator.findMany({
    include: {
      users: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  console.log("🔑 Registered Passkeys:");
  console.log("================================");
  console.log(`Total: ${authenticators.length}\n`);

  authenticators.forEach((auth, idx) => {
    console.log(`${idx + 1}. User: ${auth.users.email}`);
    console.log(`   Device: ${auth.deviceType}`);
    console.log(`   Created: ${auth.createdAt.toISOString()}`);
    console.log(`   Last Used: ${auth.lastUsedAt.toISOString()}`);
    console.log(`   Counter: ${auth.counter}`);
    console.log("");
  });

  console.log("⚠️  TROUBLESHOOTING:");
  console.log("================================");
  console.log("For passkeys to work, you need to set these in Vercel:");
  console.log("");
  console.log("1. WEBAUTHN_ORIGIN should be:");
  console.log("   https://example-cockpit.vercel.app");
  console.log("");
  console.log("2. WEBAUTHN_RP_ID should be:");
  console.log("   example-cockpit.vercel.app");
  console.log("");
  console.log("⚠️  If you change these values, users will need to RE-REGISTER their passkeys!");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
