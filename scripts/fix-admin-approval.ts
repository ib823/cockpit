import { prisma } from '../src/lib/db';
import { randomBytes } from 'crypto';

async function main() {
  // Check current approval
  const approval = await prisma.emailApproval.findUnique({
    where: { email: 'admin@admin.com' }
  });

  if (!approval) {
    console.log('❌ No EmailApproval found for admin@admin.com');

    // Create a new one
    const code = randomBytes(16).toString('hex');
    await prisma.emailApproval.create({
      data: {
        email: 'admin@admin.com',
        code: code,
      }
    });

    console.log('✓ Created new EmailApproval');
    console.log('  Code:', code);
    console.log('\n💡 Register at:');
    console.log(`   http://localhost:3000/register?code=${code}`);
  } else {
    console.log('✓ EmailApproval exists');
    console.log('  Code:', approval.code);
    console.log('  Code is null/undefined:', approval.code === null || approval.code === undefined);

    // If code is null/undefined, update it
    if (!approval.code) {
      const newCode = randomBytes(16).toString('hex');
      await prisma.emailApproval.update({
        where: { email: 'admin@admin.com' },
        data: { code: newCode }
      });

      console.log('\n✓ Updated code to:', newCode);
      console.log('\n💡 Register at:');
      console.log(`   http://localhost:3000/register?code=${newCode}`);
    } else {
      console.log('\n💡 Register at:');
      console.log(`   http://localhost:3000/register?code=${approval.code}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
