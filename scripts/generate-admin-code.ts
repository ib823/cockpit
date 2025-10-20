import { prisma } from '../src/lib/db';
import { hash } from 'bcryptjs';
import { randomInt } from 'crypto';

async function main() {
  const email = 'admin@admin.com';

  // Generate a 6-digit code
  const code = randomInt(100000, 999999).toString();

  // Hash the code
  const tokenHash = await hash(code, 10);

  // Set expiration to 7 days from now
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

  // Check if user exists
  const user = await prisma.users.findUnique({
    where: { email },
    include: { Authenticator: true },
  });

  if (!user) {
    console.log('❌ User admin@admin.com does not exist');
    return;
  }

  console.log('✓ User found:');
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  Current passkeys:', user.Authenticator.length);

  // Check if approval exists
  const existingApproval = await prisma.emailApproval.findUnique({
    where: { email }
  });

  if (existingApproval) {
    // Update existing approval
    await prisma.emailApproval.update({
      where: { email },
      data: {
        tokenHash,
        tokenExpiresAt,
        usedAt: null, // Reset usedAt
      }
    });
    console.log('\n✓ Updated EmailApproval with new code');
  } else {
    // Create new approval (need approvedByUserId)
    const adminUser = await prisma.users.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ No admin user found to set as approver');
      return;
    }

    await prisma.emailApproval.create({
      data: {
        email,
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: adminUser.id,
      }
    });
    console.log('\n✓ Created new EmailApproval');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔑 REGISTRATION CODE FOR admin@admin.com:');
  console.log('');
  console.log('   ' + code);
  console.log('');
  console.log('='.repeat(60));
  console.log('\n📝 Steps to register:');
  console.log('   1. Go to http://localhost:3000/register');
  console.log('   2. Enter email: admin@admin.com');
  console.log('   3. Enter code: ' + code);
  console.log('   4. Create your passkey when prompted');
  console.log('\n⏰ Code expires:', tokenExpiresAt.toISOString());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
