#!/usr/bin/env tsx
/**
 * Bootstrap admin user for passkey authentication
 * Usage: npx tsx scripts/bootstrap-admin.ts admin@example.com
 */

import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAILS?.split(",")[0];

  if (!email) {
    console.error("Usage: npx tsx scripts/bootstrap-admin.ts <admin-email>");
    console.error("Or set ADMIN_EMAILS in .env.local");
    process.exit(1);
  }

  console.log(`Creating admin user: ${email}`);

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const tokenHash = await hash(code, 10);
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Create temp admin user to approve themselves
  const adminUser = await prisma.users.upsert({
    where: { email },
    update: {
      role: Role.ADMIN,
      exception: true, // No expiration
    },
    create: {
      id: randomUUID(),
      email,
      role: Role.ADMIN,
      exception: true,
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  });

  // Create email approval
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

  console.log("\n✅ Admin user created successfully!");
  console.log("\n📋 Setup Instructions:");
  console.log("1. Go to http://localhost:3000/login");
  console.log("2. Enter the 6-digit code below:");
  console.log(`\n   ${code}\n`);
  console.log("3. Follow the prompts to set up your passkey");
  console.log("4. Future logins will use your passkey only\n");
  console.log("💡 Code expires in 24 hours\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
