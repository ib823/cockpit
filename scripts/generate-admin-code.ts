#!/usr/bin/env tsx
/**
 * Generate Admin Access Code (No Email Required)
 *
 * Creates an admin user and generates a 6-digit access code for first-time setup.
 * No email configuration needed - just displays the code in the terminal.
 *
 * Usage:
 *   pnpm admin:generate-code <email> [name]
 *
 * Example:
 *   pnpm admin:generate-code admin@example.com "John Doe"
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID, randomBytes, randomInt } from 'crypto';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Generate cryptographically secure 6-digit code
function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

function generateMagicToken(): string {
  return randomBytes(32).toString('hex'); // 64 character secure token
}

async function main() {
  const email = process.argv[2];
  const name = process.argv[3] || null;

  if (!email) {
    console.error('❌ Error: Email is required\n');
    console.log('Usage: pnpm admin:generate-code <email> [name]\n');
    console.log('Example: pnpm admin:generate-code admin@example.com "John Doe"\n');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Error: Invalid email format\n');
    process.exit(1);
  }

  console.log('🔐 Generating Admin Access Code\n');
  console.log('='.repeat(80));

  // Generate code and token
  const code = generateCode();
  const tokenHash = await hash(code, 12);
  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Generate magic token
  const magicToken = generateMagicToken();
  const magicTokenExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  try {
    // Create or update admin user
    const user = await prisma.users.upsert({
      where: { email },
      update: {
        name: name || undefined,
        role: 'ADMIN',
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        email,
        name,
        role: 'ADMIN',
        exception: false,
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        updatedAt: new Date(),
      },
    });

    // Create email approval
    await prisma.emailApproval.upsert({
      where: { email },
      update: {
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: user.id, // Self-approved
        usedAt: null,
      },
      create: {
        email,
        tokenHash,
        tokenExpiresAt,
        approvedByUserId: user.id, // Self-approved
      },
    });

    // Create magic token
    await prisma.magic_tokens.create({
      data: {
        id: randomUUID(),
        email,
        token: magicToken,
        expiresAt: magicTokenExpiry,
      },
    });

    // Get base URL from environment or use default
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const magicUrl = `${baseUrl}/login?token=${magicToken}`;

    console.log('\n✅ Admin Access Code Generated Successfully!\n');
    console.log('='.repeat(80));
    console.log('\n📧 Admin Email:', email);
    if (name) console.log('👤 Name:', name);
    console.log('🔑 Role: ADMIN');
    console.log('\n' + '─'.repeat(80));
    console.log('\n🔐 ACCESS CODE (Primary Method - Expires in 7 days):');
    console.log('\n   ┌─────────────────┐');
    console.log(`   │   ${code}    │`);
    console.log('   └─────────────────┘');
    console.log('\n📋 Instructions:');
    console.log('   1. Go to:', baseUrl + '/login');
    console.log('   2. Enter email:', email);
    console.log('   3. Enter code:', code);
    console.log('   4. Set up passkey (fingerprint/Face ID)');
    console.log('   5. Done! Login with passkey from now on');
    console.log('\n' + '─'.repeat(80));
    console.log('\n🔗 MAGIC LINK (Alternative - Expires in 2 minutes):');
    console.log('\n   ' + magicUrl);
    console.log('\n📋 Instructions:');
    console.log('   1. Click the link above (or paste in browser)');
    console.log('   2. Set up passkey immediately');
    console.log('   3. Done!');
    console.log('\n' + '─'.repeat(80));
    console.log('\n⏰ Expiration:');
    console.log('   - Code expires:', tokenExpiresAt.toLocaleString());
    console.log('   - Magic link expires:', magicTokenExpiry.toLocaleString());
    console.log('   - Access valid until:', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleString());
    console.log('\n💡 Tips:');
    console.log('   - Use the 6-digit code for best security (7 days to use it)');
    console.log('   - Magic link is faster but expires in 2 minutes');
    console.log('   - After setup, login with passkey (no code needed)');
    console.log('   - You can generate new codes anytime with this script');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error generating admin code:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
