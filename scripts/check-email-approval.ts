#!/usr/bin/env tsx
import { prisma } from '../src/lib/db';

async function main() {
  const email = 'admin@admin.com';

  const approval = await prisma.emailApproval.findUnique({
    where: { email }
  });

  console.log('EmailApproval for admin@admin.com:', approval);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
