import { encode } from 'next-auth/jwt';

async function testSessionCreation() {
  console.log('🔍 Testing session creation...\n');

  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.log('❌ NEXTAUTH_SECRET not found!');
    return;
  }

  console.log('✅ NEXTAUTH_SECRET found');
  console.log('   Length:', secret.length);
  console.log('   First 10 chars:', secret.substring(0, 10) + '...');

  try {
    const token = await encode({
      token: {
        userId: 'test-user-123',
        email: 'admin@admin.com',
        role: 'ADMIN',
        sub: 'test-user-123',
        name: 'admin',
      },
      secret,
      maxAge: 30 * 24 * 60 * 60,
    });

    console.log('\n✅ Token created successfully!');
    console.log('   Token length:', token.length);
    console.log('   Token preview:', token.substring(0, 50) + '...');

  } catch (error) {
    console.error('\n❌ Token creation failed!');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testSessionCreation();
