#!/usr/bin/env tsx
/**
 * Clear passkeys for admin@admin.com
 * This allows re-registration with correct WebAuthn configuration
 */

import { prisma } from '../src/lib/db';

async function main() {
  const email = 'admin@admin.com';

  console.log(`🔍 Looking for user: ${email}`);

  const user = await prisma.users.findUnique({
    where: { email },
    include: { Authenticator: true }
  });

  if (!user) {
    console.error(`❌ User ${email} not found`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);
  console.log(`📱 Current authenticators: ${user.Authenticator.length}`);

  if (user.Authenticator.length === 0) {
    console.log(`ℹ️  No authenticators to delete`);
    process.exit(0);
  }

  // Delete all authenticators for this user
  const result = await prisma.authenticator.deleteMany({
    where: { userId: user.id }
  });

  console.log(`✅ Deleted ${result.count} authenticator(s)`);
  console.log(`\n🎉 Success! You can now re-register passkeys for ${email}`);
  console.log(`📝 Next steps:`);
  console.log(`   1. Restart your dev server if it's running`);
  console.log(`   2. Go to the registration page`);
  console.log(`   3. Register your passkey again`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
