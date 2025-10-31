// This script checks what WebAuthn values would be used in production

console.log("🔍 Checking WebAuthn Configuration...\n");

console.log("Environment Variables:");
console.log("=".repeat(60));
console.log(`WEBAUTHN_RP_ID: ${process.env.WEBAUTHN_RP_ID || "❌ NOT SET"}`);
console.log(`WEBAUTHN_ORIGIN: ${process.env.WEBAUTHN_ORIGIN || "❌ NOT SET"}`);
console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || "❌ NOT SET"}`);
console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "❌ NOT SET"}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`VERCEL_URL: ${process.env.VERCEL_URL || "❌ NOT SET"}`);
console.log("=".repeat(60));

const dev = process.env.NODE_ENV !== "production";

const rpID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const origin = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3001";

console.log("\n📋 Computed Values (as used by webauthn.ts):");
console.log("=".repeat(60));
console.log(`rpID: ${rpID}`);
console.log(`origin: ${origin}`);
console.log(`isDev: ${dev}`);
console.log("=".repeat(60));

console.log("\n💡 Production Requirements:");
if (!dev) {
  if (!process.env.WEBAUTHN_RP_ID || !process.env.WEBAUTHN_ORIGIN) {
    console.log("❌ ERROR: WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN are required in production!");
  } else {
    console.log("✅ All required environment variables are set");
  }
}

console.log("\n🎯 Expected Production Values:");
console.log("WEBAUTHN_RP_ID should be: cockpit-ebon.vercel.app");
console.log("WEBAUTHN_ORIGIN should be: https://cockpit-ebon.vercel.app");
