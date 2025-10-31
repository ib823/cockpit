import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking production database users...\n');

  // Show production URL
  const prodUrl = process.env.NEXT_PUBLIC_APP_URL ||
                  process.env.VERCEL_URL ||
                  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
                  'https://cockpit-r7xjukyir-ikmals-projects-4ec38ef0.vercel.app';
  console.log('🌐 Production URL:', prodUrl);
  console.log('🗄️  Database:', process.env.DATABASE_URL ? '✅ Connected' : '❌ Not connected');
  console.log('\n');

  // Get all users
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      Authenticator: {
        select: {
          id: true,
          deviceType: true,
          createdAt: true,
          lastUsedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Total users: ${users.length}\n`);
  console.log('=' .repeat(100));

  for (const user of users) {
    const hasPasskey = user.Authenticator.length > 0;

    console.log(`\n👤 User: ${user.email}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);
    console.log(`   Passkey Registered: ${hasPasskey ? '✅ YES' : '❌ NO'}`);

    if (hasPasskey) {
      console.log(`   Passkeys: ${user.Authenticator.length}`);
      user.Authenticator.forEach((auth, idx) => {
        console.log(`     ${idx + 1}. ${auth.deviceType} - Last used: ${auth.lastUsedAt.toISOString()}`);
      });
    } else {
      // Check for magic token (6-digit code)
      const magicToken = await prisma.magic_tokens.findFirst({
        where: {
          email: user.email,
          type: 'otp',
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (magicToken) {
        console.log(`   🔐 6-Digit Code: ${magicToken.token}`);
        console.log(`   Code Expires: ${magicToken.expiresAt.toISOString()}`);
      } else {
        console.log(`   🔐 6-Digit Code: None found or expired`);
      }
    }
    console.log('-'.repeat(100));
  }

  console.log('\n✅ Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
