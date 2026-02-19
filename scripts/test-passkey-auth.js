const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuth() {
  console.log('\n=== TESTING PASSKEY AUTHENTICATION ===\n');

  const email = 'admin@example.com';

  try {
    console.log(`1. Fetching user: ${email}`);
    const user = await prisma.users.findUnique({
      where: { email },
      include: { Authenticator: true },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Passkeys: ${user.Authenticator.length}`);
    console.log('');

    console.log('2. Checking access expiry');
    const now = new Date();
    console.log(`   Now: ${now.toISOString()}`);
    console.log(`   Access expires at: ${user.accessExpiresAt?.toISOString() || 'Never'}`);
    console.log(`   Exception flag: ${user.exception}`);

    if (!user.exception && user.accessExpiresAt && user.accessExpiresAt <= now) {
      console.log('❌ ACCESS EXPIRED!');
      console.log('   This is likely causing the 500 error');
      console.log('   The user account has expired and needs to be renewed');
      return;
    } else {
      console.log('✅ Access not expired');
    }
    console.log('');

    console.log('3. Checking authenticators');
    if (user.Authenticator.length === 0) {
      console.log('❌ No passkeys registered');
      return;
    }

    user.Authenticator.forEach((auth, i) => {
      console.log(`   Passkey ${i + 1}:`);
      console.log(`      ID: ${auth.id}`);
      console.log(`      Device Type: ${auth.deviceType}`);
      console.log(`      Nickname: ${auth.nickname || 'Unnamed'}`);
      console.log(`      Last Used: ${auth.lastUsedAt.toISOString()}`);
      console.log(`      Counter: ${auth.counter}`);
      console.log(`      Backed Up: ${auth.backedUp}`);
    });
    console.log('');

    console.log('4. Environment check');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
    console.log(`   WEBAUTHN_RP_ID: ${process.env.WEBAUTHN_RP_ID}`);
    console.log(`   WEBAUTHN_ORIGIN: ${process.env.WEBAUTHN_ORIGIN}`);
    console.log('');

    console.log('✅ All checks passed - auth should work');
    console.log('');
    console.log('If you\'re still getting 500 errors, check:');
    console.log('  1. Browser console for the exact error');
    console.log('  2. Network tab to see the request/response');
    console.log('  3. Server logs for "Finish login failed" errors');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
