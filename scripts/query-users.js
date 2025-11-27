const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      Authenticator: {
        select: {
          id: true,
          deviceType: true,
          nickname: true,
          lastUsedAt: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('\n=== REGISTERED USERS ===\n');

  if (users.length === 0) {
    console.log('No users found in database');
  } else {
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'Not set'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
      console.log(`   Passkeys: ${user.Authenticator.length}`);
      if (user.Authenticator.length > 0) {
        user.Authenticator.forEach((auth, i) => {
          console.log(`     ${i + 1}. ${auth.deviceType} - ${auth.nickname || 'Unnamed'} (Last used: ${auth.lastUsedAt})`);
        });
      }
      console.log('');
    });
  }

  console.log(`Total users: ${users.length}\n`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
