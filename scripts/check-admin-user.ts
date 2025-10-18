import { prisma } from '../src/lib/db';

async function main() {
  const user = await prisma.users.findUnique({
    where: { email: 'admin@admin.com' },
    include: { Authenticator: true },
  });

  if (!user) {
    console.log('❌ User admin@admin.com does not exist in database');
    return;
  }

  console.log('✓ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Name:', user.name);
  console.log('  Role:', user.role);
  console.log('  Passkeys:', user.Authenticator.length);

  if (user.Authenticator.length === 0) {
    console.log('\n⚠️  User has no passkeys registered!');

    // Check for email approval
    const approval = await prisma.emailApproval.findUnique({
      where: { email: 'admin@admin.com' }
    });

    if (approval) {
      console.log('\n✓ EmailApproval found:');
      console.log('  Code:', approval.code);
      console.log('  Created:', approval.createdAt);
      console.log('\n💡 Solution: Use the registration URL with this code:');
      console.log(`   http://localhost:3000/register?code=${approval.code}`);
    } else {
      console.log('\n❌ No EmailApproval found');
      console.log('💡 Solution: Create an approval record for this user');
    }
  } else {
    console.log('\n✓ User has passkeys registered and should be able to login');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
