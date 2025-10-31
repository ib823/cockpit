import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

async function verifyNewCodes() {
  console.log("🔍 Verifying new codes...\n");

  const testCases = [
    { email: "ikmls@hotmail.com", code: "543794" },
    { email: "ibaharudin@abeam.com", code: "335819" },
  ];

  for (const { email, code } of testCases) {
    console.log(`${"=".repeat(60)}`);
    console.log(`📧 ${email}`);
    console.log(`🔑 Code: ${code}`);
    console.log("=".repeat(60));

    const approval = await prisma.emailApproval.findUnique({
      where: { email },
    });

    if (!approval) {
      console.log("❌ No approval found\n");
      continue;
    }

    const isValid = await compare(code, approval.tokenHash);
    const isExpired = approval.tokenExpiresAt < new Date();
    const isUsed = !!approval.usedAt;

    console.log(`✅ Code validation: ${isValid ? "✅ VALID" : "❌ INVALID"}`);
    console.log(`   Used: ${isUsed ? "❌ YES" : "✅ NO"}`);
    console.log(`   Expired: ${isExpired ? "❌ YES" : "✅ NO"}`);
    console.log(`   Expires: ${approval.tokenExpiresAt.toISOString()}\n`);

    if (isValid && !isUsed && !isExpired) {
      console.log(`🎉 ${email} is ready to login!\n`);
    } else {
      console.log(`⚠️  ${email} may have issues logging in.\n`);
    }
  }
}

verifyNewCodes()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
