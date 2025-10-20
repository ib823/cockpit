/**
 * DEPRECATED: This script needs to be rewritten to match current EmailApproval schema
 *
 * The EmailApproval model no longer has a 'code' field. It uses:
 * - tokenHash (hashed token)
 * - tokenExpiresAt
 * - approvedByUserId
 *
 * TODO: Rewrite to use proper token hashing or remove if no longer needed
 */

import { prisma } from '../src/lib/db';
import { randomBytes, createHash } from 'crypto';

async function main() {
  console.log('⚠️  This script is deprecated and needs to be rewritten.');
  console.log('The EmailApproval schema has changed.');
  console.log('\n💡 To create an admin user, use the admin panel or API instead.');

  // Temporarily disabled - needs schema update
  /*
  // Check current approval
  const approval = await prisma.emailApproval.findUnique({
    where: { email: 'admin@admin.com' }
  });

  if (!approval) {
    console.log('❌ No EmailApproval found for admin@admin.com');

    // Create a new one with proper schema
    const token = randomBytes(16).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await prisma.emailApproval.create({
      data: {
        email: 'admin@admin.com',
        tokenHash: tokenHash,
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        approvedByUserId: 'system', // Need actual user ID
      }
    });

    console.log('✓ Created new EmailApproval');
    console.log('  Token:', token);
  } else {
    console.log('✓ EmailApproval exists');
    console.log('  Token Hash:', approval.tokenHash);
  }
  */
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
