/**
 * Create Admin Session Directly
 * This bypasses passkey registration and creates a valid session
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function createAdminSession() {
  const adminEmail = 'ikmls@hotmail.com';

  try {
    // Get admin user
    const user = await prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (!user) {
      console.error('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:', user.email);

    // Create a session token
    const sessionToken = randomUUID();
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create session in database
    const session = await prisma.sessions.create({
      data: {
        id: sessionId,
        sessionToken,
        userId: user.id,
        expires: expiresAt,
      },
    });

    console.log('\n✅ Session created successfully!');
    console.log('\n=== MANUAL LOGIN INSTRUCTIONS ===');
    console.log('1. Open your browser DevTools (F12)');
    console.log('2. Go to Application > Cookies');
    console.log('3. Add a new cookie with these values:');
    console.log('   Name: next-auth.session-token');
    console.log('   Value:', sessionToken);
    console.log('   Domain: localhost');
    console.log('   Path: /');
    console.log('   HttpOnly: ✓ (checked)');
    console.log('   Secure: (unchecked for localhost)');
    console.log('   SameSite: Lax');
    console.log('4. Refresh the page');
    console.log('5. You should be logged in!');
    console.log('\nSession expires:', expiresAt.toISOString());

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminSession();
