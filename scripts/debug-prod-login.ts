/**
 * Debug Production Login Issue
 * Check all relevant database records
 */

import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 DEBUGGING PRODUCTION LOGIN ISSUE\n");
  console.log("=".repeat(80));

  const testEmail = "admin@example.com";
  const testCode = "357457";

  // 1. Check if user exists
  console.log("\n1️⃣ Checking Users table...");
  const user = await prisma.users.findUnique({
    where: { email: testEmail },
    include: { Authenticator: true },
  });

  if (!user) {
    console.log(`❌ User NOT found: ${testEmail}`);
  } else {
    console.log(`✅ User found: ${testEmail}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Passkeys: ${user.Authenticator.length}`);
    console.log(`   Access Expires: ${user.accessExpiresAt || "Never"}`);
    console.log(`   Exception: ${user.exception}`);
  }

  // 2. Check EmailApproval
  console.log("\n2️⃣ Checking EmailApproval table...");
  const approval = await prisma.emailApproval.findUnique({
    where: { email: testEmail },
  });

  if (!approval) {
    console.log(`❌ EmailApproval NOT found for: ${testEmail}`);
  } else {
    console.log(`✅ EmailApproval found for: ${testEmail}`);
    console.log(`   Approved By User ID: ${approval.approvedByUserId}`);
    console.log(`   Token Hash: ${approval.tokenHash.substring(0, 20)}...`);
    console.log(`   Expires At: ${approval.tokenExpiresAt}`);
    console.log(`   Used At: ${approval.usedAt || "Not used"}`);
    console.log(`   Code Sent: ${approval.codeSent}`);
    console.log(`   Created At: ${approval.createdAt}`);

    // Test the code
    console.log("\n3️⃣ Testing code validation...");
    try {
      const isValid = await compare(testCode, approval.tokenHash);
      console.log(`   Test Code: ${testCode}`);
      console.log(`   Valid: ${isValid ? "✅ YES" : "❌ NO"}`);
    } catch (error) {
      console.error(`   ❌ Error comparing: ${error}`);
    }
  }

  // 3. Check if approval is expired
  if (approval) {
    const now = new Date();
    const isExpired = approval.tokenExpiresAt < now;
    console.log(`   Expired: ${isExpired ? "❌ YES" : "✅ NO"}`);
    if (isExpired) {
      console.log(
        `   Time difference: ${Math.round((now.getTime() - approval.tokenExpiresAt.getTime()) / 1000 / 60)} minutes ago`
      );
    }
  }

  // 4. Check magic_tokens (OTP codes)
  console.log("\n4️⃣ Checking magic_tokens table...");
  const magicTokens = await prisma.magic_tokens.findMany({
    where: { email: testEmail },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (magicTokens.length === 0) {
    console.log(`   No magic tokens found for ${testEmail}`);
  } else {
    console.log(`   Found ${magicTokens.length} magic token(s):`);
    magicTokens.forEach((token, idx) => {
      console.log(
        `   ${idx + 1}. Type: ${token.type}, Expires: ${token.expiresAt}, Used: ${token.usedAt || "No"}`
      );
    });
  }

  // 5. Check all EmailApprovals
  console.log("\n5️⃣ Checking ALL EmailApprovals...");
  const allApprovals = await prisma.emailApproval.findMany();
  console.log(`   Total approvals in database: ${allApprovals.length}`);
  allApprovals.forEach((app) => {
    console.log(
      `   - ${app.email}: Expires ${app.tokenExpiresAt}, Used: ${app.usedAt ? "YES" : "NO"}`
    );
  });

  console.log("\n" + "=".repeat(80));
  console.log("✅ Debug complete!");
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
