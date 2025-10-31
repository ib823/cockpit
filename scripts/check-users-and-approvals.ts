import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsersAndApprovals() {
  console.log("🔍 Checking users and email approvals...\n");

  const userEmails = ["ikmls@hotmail.com", "ibaharudin@abeam.com"];

  for (const email of userEmails) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📧 ${email}`);
    console.log("=".repeat(60));

    // Check user
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    if (user) {
      console.log(`✅ User exists`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Access expires: ${user.accessExpiresAt}`);
      console.log(`   Exception: ${user.exception}`);
      console.log(`   Passkeys: ${user.Authenticator.length}`);
    } else {
      console.log(`❌ User does NOT exist`);
    }

    // Check email approval
    const approval = await prisma.emailApproval.findUnique({
      where: { email },
    });

    if (approval) {
      console.log(`✅ Email approval exists`);
      console.log(`   Created: ${approval.createdAt}`);
      console.log(`   Expires: ${approval.tokenExpiresAt}`);
      console.log(`   Used: ${approval.usedAt || "Not used"}`);
      console.log(`   Approved by: ${approval.approvedByUserId}`);

      const isExpired = new Date() > approval.tokenExpiresAt;
      const isUsed = !!approval.usedAt;
      console.log(`   Status: ${isExpired ? "❌ EXPIRED" : isUsed ? "✅ Used" : "✅ Valid"}`);
    } else {
      console.log(`❌ Email approval does NOT exist`);
    }

    // Check magic tokens
    const tokens = await prisma.magic_tokens.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (tokens.length > 0) {
      console.log(`\n📝 Magic tokens (${tokens.length}):`);
      tokens.forEach((token, idx) => {
        const isExpired = new Date() > token.expiresAt;
        const isUsed = !!token.usedAt;
        console.log(
          `   ${idx + 1}. Created: ${token.createdAt.toISOString()}, ` +
          `Expires: ${token.expiresAt.toISOString()}, ` +
          `Status: ${isExpired ? "❌ EXPIRED" : isUsed ? "✅ Used" : "✅ Valid"}`
        );
      });
    } else {
      console.log(`\n📝 No magic tokens found`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

checkUsersAndApprovals()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
