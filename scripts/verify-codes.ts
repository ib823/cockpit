/**
 * Verify the current codes work
 */

import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('✅ VERIFYING PRODUCTION CODES\n');

  const tests = [
    { email: 'ikmls@hotmail.com', code: '405045' },
    { email: 'ibaharudin@abeam.com', code: '885712' },
  ];

  for (const test of tests) {
    console.log(`\n📧 ${test.email}`);
    console.log(`   Code to test: ${test.code}`);

    const approval = await prisma.emailApproval.findUnique({
      where: { email: test.email },
    });

    if (!approval) {
      console.log('   ❌ No approval found!');
      continue;
    }

    const isValid = await compare(test.code, approval.tokenHash);
    console.log(`   ${isValid ? '✅' : '❌'} Code validates: ${isValid}`);

    if (!isValid) {
      console.log('   ⚠️  Hash in DB: ' + approval.tokenHash.substring(0, 30) + '...');
    }

    // Check other conditions
    const isExpired = approval.tokenExpiresAt < new Date();
    const isUsed = !!approval.usedAt;

    console.log(`   Expired: ${isExpired ? '❌ YES' : '✅ NO'}`);
    console.log(`   Used: ${isUsed ? '❌ YES' : '✅ NO'}`);

    if (isValid && !isExpired && !isUsed) {
      console.log('   ✅✅✅ READY TO USE!');
    }
  }
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
