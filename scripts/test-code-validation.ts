import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

async function testCodeValidation() {
  console.log("🔍 Testing code validation...\n");

  const testCases = [
    { email: "admin@example.com", code: "472221" },
    { email: "user@example.com", code: "216055" },
  ];

  for (const { email, code } of testCases) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📧 ${email}`);
    console.log(`🔑 Code: ${code}`);
    console.log("=".repeat(60));

    const approval = await prisma.emailApproval.findUnique({
      where: { email },
    });

    if (!approval) {
      console.log("❌ No approval found");
      continue;
    }

    console.log(`\n✅ Approval found`);
    console.log(`   Token Hash: ${approval.tokenHash.substring(0, 20)}...`);
    console.log(`   Used At: ${approval.usedAt || "Not used"}`);
    console.log(`   Expires At: ${approval.tokenExpiresAt}`);
    console.log(`   Is Expired: ${approval.tokenExpiresAt < new Date() ? "YES" : "NO"}`);

    console.log(`\n🔐 Testing bcrypt comparison...`);
    try {
      const isValid = await compare(code, approval.tokenHash);
      console.log(`   Result: ${isValid ? "✅ VALID" : "❌ INVALID"}`);

      if (!isValid) {
        console.log(`\n   ⚠️  Code does NOT match the hash!`);
        console.log(`   This means the code or hash is incorrect.`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    // Additional validation checks
    console.log(`\n📋 Validation Checks:`);
    console.log(`   ✅ Approval exists: ${!!approval}`);
    console.log(`   ${approval.usedAt ? "❌" : "✅"} Not used: ${!approval.usedAt}`);
    console.log(
      `   ${approval.tokenExpiresAt < new Date() ? "❌" : "✅"} Not expired: ${approval.tokenExpiresAt >= new Date()}`
    );
  }

  console.log("\n" + "=".repeat(60));
}

testCodeValidation()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
