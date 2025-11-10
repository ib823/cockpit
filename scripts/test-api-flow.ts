/**
 * Test the exact API flow for login
 */

import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Testing API Flow\n");
  console.log("=".repeat(80));

  const testEmail = "ikmls@hotmail.com";
  const testCode = "357457";

  // Step 1: Test email-status API logic
  console.log("\n📋 Step 1: Email Status Check");
  const user = await prisma.users.findUnique({
    where: { email: testEmail },
    include: { Authenticator: true },
  });

  const invite = await prisma.emailApproval.findUnique({
    where: { email: testEmail },
  });

  const registered = !!user;
  const hasPasskey = !!(user && user.Authenticator && user.Authenticator.length > 0);
  const invited = !!(
    invite &&
    !invite.usedAt &&
    invite.tokenExpiresAt &&
    new Date(invite.tokenExpiresAt) > new Date()
  );

  const needsAction = registered && hasPasskey ? "login" : invited ? "enter_invite" : "not_found";

  console.log(`   Registered: ${registered}`);
  console.log(`   Has Passkey: ${hasPasskey}`);
  console.log(`   Invited: ${invited}`);
  console.log(`   Needs Action: ${needsAction}`);

  if (needsAction === "not_found") {
    console.log('   ❌ Would show: "This email is not registered or approved for access."');
    return;
  }

  if (needsAction === "login") {
    console.log("   ℹ️  Would show: passkey login button");
    return;
  }

  // Step 2: Test begin-register API logic
  console.log("\n📋 Step 2: Begin Register (Code Validation)");

  if (!testCode || testCode.length !== 6) {
    console.log("   ❌ Code format invalid");
    return;
  }

  const approval = await prisma.emailApproval.findUnique({
    where: { email: testEmail },
  });

  if (!approval) {
    console.log("   ❌ No approval found");
    return;
  }

  console.log(`   Approval found: ${approval.email}`);
  console.log(`   Used At: ${approval.usedAt}`);
  console.log(`   Expires At: ${approval.tokenExpiresAt}`);
  console.log(`   Now: ${new Date()}`);

  if (approval.usedAt) {
    console.log('   ❌ Would return: "This access code has already been used."');
    return;
  }

  if (approval.tokenExpiresAt < new Date()) {
    console.log('   ❌ Would return: "This access code has expired."');
    return;
  }

  console.log(`\n   Testing bcrypt comparison:`);
  console.log(`   Code: "${testCode}"`);
  console.log(`   Hash: ${approval.tokenHash.substring(0, 30)}...`);

  const codeIsValid = await compare(testCode, approval.tokenHash);
  console.log(`   Valid: ${codeIsValid ? "✅ YES" : "❌ NO"}`);

  if (!codeIsValid) {
    console.log('   ❌ Would return: "The provided code is incorrect."');
    return;
  }

  console.log("\n✅ All checks passed! Would proceed to WebAuthn registration.");

  console.log("\n" + "=".repeat(80));
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
