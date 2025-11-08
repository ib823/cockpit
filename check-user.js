const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const email = 'ikmls@hotmail.com';

    console.log('\n🔍 Checking user:', email);
    console.log('═══════════════════════════════════════════════════\n');

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        passkeys: true,
        webauthnChallenges: {
          orderBy: { expiresAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      console.log('❌ User not found!');
      console.log('\nPossible reasons:');
      console.log('  • Email might be different');
      console.log('  • User might have been deleted');
      console.log('  • Database connection issue');
      return;
    }

    console.log('✅ User found!');
    console.log('\nUser Details:');
    console.log('  • ID:', user.id);
    console.log('  • Email:', user.email);
    console.log('  • Name:', user.name || 'N/A');
    console.log('  • Role:', user.role);
    console.log('  • Created:', user.createdAt);
    console.log('  • Email Verified:', user.emailVerified ? '✓' : '✗');

    console.log('\n🔑 Passkeys:');
    if (user.passkeys.length === 0) {
      console.log('  ❌ No passkeys registered!');
      console.log('\n  This is why login is failing - you need to register a passkey first.');
    } else {
      console.log(`  ✅ ${user.passkeys.length} passkey(s) found:\n`);
      user.passkeys.forEach((pk, i) => {
        console.log(`  Passkey ${i + 1}:`);
        console.log('    • ID:', pk.id);
        console.log('    • Credential ID:', pk.credentialId);
        console.log('    • Device:', pk.deviceName || 'Unknown device');
        console.log('    • Created:', pk.createdAt);
        console.log('    • Last Used:', pk.lastUsedAt || 'Never');
        console.log('    • Counter:', pk.counter);
        console.log('    • Transports:', pk.transports);
        console.log('');
      });
    }

    console.log('🔐 Recent WebAuthn Challenges:');
    if (user.webauthnChallenges.length === 0) {
      console.log('  No recent challenges');
    } else {
      user.webauthnChallenges.forEach((ch, i) => {
        const expired = new Date(ch.expiresAt) < new Date();
        console.log(`  ${i + 1}. Challenge: ${ch.challenge.substring(0, 20)}...`);
        console.log(`     • Type: ${ch.type}`);
        console.log(`     • Created: ${ch.createdAt}`);
        console.log(`     • Expires: ${ch.expiresAt} ${expired ? '(EXPIRED)' : ''}`);
        console.log('');
      });
    }

    // Check if user has admin approval
    const adminApproval = await prisma.adminApproval.findUnique({
      where: { email }
    });

    console.log('👑 Admin Access:');
    if (adminApproval) {
      console.log('  ✅ Admin approval found');
      console.log('    • Approved by:', adminApproval.approvedBy);
      console.log('    • Approved at:', adminApproval.approvedAt);
      if (adminApproval.expiresAt) {
        const expired = new Date(adminApproval.expiresAt) < new Date();
        console.log('    • Expires:', adminApproval.expiresAt, expired ? '(EXPIRED)' : '');
      }
    } else {
      console.log('  ℹ️  No admin approval (regular user)');
    }

    console.log('\n═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
