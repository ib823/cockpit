#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const code = '123456';
  const email = 'admin@admin.com';
  const tokenHash = await hash(code, 10);
  const tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      exception: true,
    },
    create: {
      email,
      role: 'ADMIN',
      exception: true,
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.emailApproval.upsert({
    where: { email },
    update: {
      tokenHash,
      tokenExpiresAt,
      approvedByUserId: adminUser.id,
      usedAt: null,
    },
    create: {
      email,
      tokenHash,
      tokenExpiresAt,
      approvedByUserId: adminUser.id,
    },
  });

  console.log('✅ Admin code set to: 123456');
  console.log('📧 Email: admin@admin.com');
  console.log('🔗 Login: http://localhost:3001/login');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
