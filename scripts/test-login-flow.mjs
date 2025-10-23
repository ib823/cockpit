import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLoginFlow() {
  console.log('🔍 Testing login flow for admin@admin.com...\n');

  try {
    // Check user
    const user = await prisma.users.findUnique({
      where: { email: 'admin@admin.com' },
      include: { Authenticator: true }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('✅ User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Access Expires:', user.accessExpiresAt);
    console.log('  Exception:', user.exception);
    console.log('  Authenticators:', user.Authenticator.length);

    // Check if access expired
    const now = new Date();
    if (!user.exception && user.accessExpiresAt && user.accessExpiresAt <= now) {
      console.log('\n⚠️  ACCESS EXPIRED!');
      console.log('  Current time:', now);
      console.log('  Expires at:', user.accessExpiresAt);
      console.log('\n🔧 Fixing: Extending access expiry...');
      
      await prisma.users.update({
        where: { id: user.id },
        data: { 
          accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          exception: true 
        }
      });
      
      console.log('✅ Access extended for 1 year + exception set');
    } else {
      console.log('\n✅ Access is valid');
    }

    // Check environment
    console.log('\n🔐 Environment Check:');
    console.log('  NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set ✓' : 'Missing ✗');
    console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Missing ✗');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginFlow();
