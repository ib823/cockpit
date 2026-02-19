import { prisma } from "../src/lib/db";

async function main() {
  const tokens = await prisma.magic_tokens.findMany({
    where: {
      email: "admin@example.com",
    },
    orderBy: {
      expiresAt: "desc",
    },
    take: 5,
  });

  console.log(`Found ${tokens.length} magic tokens for admin@example.com:`);
  tokens.forEach((token) => {
    console.log("\nToken:", token.token.substring(0, 20) + "...");
    console.log("  Created:", token.createdAt || "N/A");
    console.log("  Expires:", token.expiresAt);
    console.log("  Used At:", token.usedAt);
    console.log("  Is Valid:", !token.usedAt && token.expiresAt > new Date());
    console.log("  Magic Link:", `http://localhost:3000/login?token=${token.token}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
