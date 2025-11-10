#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const email = "ikmls@hotmail.com";
  const tokenHash = await hash(code, 10);
  const tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

  const adminUser = await prisma.users.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      exception: true,
    },
    create: {
      id: randomUUID(),
      email,
      role: "ADMIN",
      exception: true,
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
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

  console.log(`✅ Admin code set to: ${code}`);
  console.log("📧 Email: ikmls@hotmail.com");
  console.log("🔗 Login: http://localhost:3000/login");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
