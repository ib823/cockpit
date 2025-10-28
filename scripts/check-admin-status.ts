/**
 * Check Admin User Status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminStatus() {
  const adminEmail = 'ikmls@hotmail.com';

  try {
    // Check user
    const user = await prisma.users.findUnique({
      where: { email: adminEmail },
      include: {
        Authenticator: true,
      }
    });

    console.log('\n=== USER STATUS ===');
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User exists`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log(`   Access Expires: ${user.accessExpiresAt}`);
    console.log(`   Exception: ${user.exception ? 'Yes' : 'No'}`);
    console.log(`   Passkeys: ${user.Authenticator.length}`);

    // Check email approval
    const approval = await prisma.emailApproval.findUnique({
      where: { email: adminEmail },
    });

    console.log('\n=== EMAIL APPROVAL ===');
    if (!approval) {
      console.log('❌ No email approval found');
      console.log('   Admin users need email approval to log in');
    } else {
      console.log(`✅ Email approval exists`);
      console.log(`   Approved By: ${approval.approvedBy}`);
      console.log(`   Token Expires: ${approval.tokenExpiresAt}`);
      console.log(`   Used At: ${approval.usedAt || 'Not used'}`);

      const isExpired = approval.tokenExpiresAt < new Date();
      const isUsed = !!approval.usedAt;

      if (isExpired) {
        console.log('   ⚠️  Token EXPIRED');
      }
      if (isUsed) {
        console.log('   ⚠️  Token ALREADY USED');
      }

      if (!isExpired && !isUsed) {
        console.log('   ✅ Token is VALID and ready to use');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminStatus();
