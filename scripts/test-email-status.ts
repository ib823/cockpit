import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testEmailStatus() {
  console.log("🔍 Testing email status for both users...\n");

  const userEmails = ["admin@example.com", "user@example.com"];

  for (const emailRaw of userEmails) {
    const email = emailRaw.toLowerCase();
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📧 ${email}`);
    console.log("=".repeat(60));

    // Mimic the email-status endpoint logic
    const user = await prisma.users.findUnique({
      where: { email },
      include: { Authenticator: true },
    });

    const invite = await prisma.emailApproval.findUnique({
      where: { email },
    });

    const registered = !!user;
    const hasPasskey = !!(user && user.Authenticator && user.Authenticator.length > 0);
    const invited = !!(
      invite &&
      !invite.usedAt &&
      invite.tokenExpiresAt &&
      new Date(invite.tokenExpiresAt) > new Date()
    );

    const useMagicLinks = process.env.ENABLE_MAGIC_LINKS === "true";
    const inviteMethod: "code" | "link" | null = invited ? (useMagicLinks ? "link" : "code") : null;

    const needsAction = registered && hasPasskey ? "login" : invited ? "enter_invite" : "not_found";

    console.log("\n📊 Status Response:");
    console.log(`   registered: ${registered}`);
    console.log(`   hasPasskey: ${hasPasskey}`);
    console.log(`   invited: ${invited}`);
    console.log(`   inviteMethod: ${inviteMethod}`);
    console.log(`   needsAction: ${needsAction}`);

    console.log("\n🔍 Detailed Info:");
    if (user) {
      console.log(`   ✅ User exists (ID: ${user.id})`);
      console.log(`   Passkeys: ${user.Authenticator.length}`);
    } else {
      console.log(`   ❌ User does NOT exist`);
    }

    if (invite) {
      console.log(`   ✅ Invite exists`);
      console.log(`   Used: ${invite.usedAt ? "YES" : "NO"}`);
      console.log(`   Expired: ${new Date(invite.tokenExpiresAt) < new Date() ? "YES" : "NO"}`);
      console.log(`   Expires at: ${invite.tokenExpiresAt}`);
    } else {
      console.log(`   ❌ Invite does NOT exist`);
    }

    console.log(`\n   ENABLE_MAGIC_LINKS: ${process.env.ENABLE_MAGIC_LINKS}`);

    // Expected behavior
    console.log("\n💡 Expected Behavior:");
    if (needsAction === "enter_invite") {
      console.log(
        `   ✅ User should see: "${inviteMethod === "code" ? "6-Digit Code" : "Magic Link"}" input`
      );
    } else if (needsAction === "login") {
      console.log(`   ✅ User should see: "Use Passkey" button`);
    } else {
      console.log(`   ❌ User should see: "Invalid. Contact Admin"`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

testEmailStatus()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
