import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminSession() {
  console.log("🔍 Checking admin user session and passkey...\n");

  const email = "ikmls@hotmail.com";

  const user = await prisma.users.findUnique({
    where: { email },
    include: {
      Authenticator: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    console.log("❌ User not found");
    return;
  }

  console.log("👤 User Details:");
  console.log(`   Email: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Name: ${user.name || "Not set"}`);
  console.log(`   First Login: ${user.firstLoginAt || "Never"}`);
  console.log(`   Last Login: ${user.lastLoginAt || "Never"}`);

  console.log("\n🔑 Passkeys:");
  if (user.Authenticator.length === 0) {
    console.log("   ❌ No passkeys registered");
  } else {
    user.Authenticator.forEach((auth, idx) => {
      console.log(`   ${idx + 1}. ID: ${auth.id.substring(0, 20)}...`);
      console.log(`      Device: ${auth.deviceType}`);
      console.log(`      Created: ${auth.createdAt}`);
      console.log(`      Last Used: ${auth.lastUsedAt}`);
    });
  }

  console.log("\n📝 Recent Sessions:");
  if (user.sessions.length === 0) {
    console.log("   ❌ No sessions found");
  } else {
    user.sessions.forEach((session, idx) => {
      const isExpired = session.expires < new Date();
      const isRevoked = !!session.revokedAt;
      console.log(`   ${idx + 1}. Session ID: ${session.id}`);
      console.log(`      Created: ${session.createdAt}`);
      console.log(`      Expires: ${session.expires}`);
      console.log(
        `      Status: ${isRevoked ? "❌ Revoked" : isExpired ? "❌ Expired" : "✅ Active"}`
      );
      if (isRevoked) {
        console.log(`      Revoked Reason: ${session.revokedReason}`);
      }
    });
  }

  // Check email approval status
  const approval = await prisma.emailApproval.findUnique({
    where: { email },
  });

  console.log("\n📧 Email Approval:");
  if (approval) {
    console.log(`   Used: ${approval.usedAt ? "✅ YES" : "❌ NO"}`);
    console.log(`   Used At: ${approval.usedAt || "Not used"}`);
  } else {
    console.log("   ❌ No approval found");
  }
}

checkAdminSession()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
