/**
 * Create Admin User Script
 *
 * Run: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminPasswordHash) {
    console.error("❌ ADMIN_PASSWORD_HASH not found in environment variables");
    console.error(
      "Run: node -e \"console.log(require('bcryptjs').hashSync('YourPassword123!', 12))\""
    );
    process.exit(1);
  }

  try {
    // Check if admin user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      console.log(`   Role: ${existingUser.role}`);

      // Update to ADMIN if not already
      if (existingUser.role !== "ADMIN") {
        await prisma.users.update({
          where: { id: existingUser.id },
          data: { role: "ADMIN" },
        });
        console.log(`✅ Updated user role to ADMIN`);
      }
      return;
    }

    // Create new admin user
    const adminUser = await prisma.users.create({
      data: {
        id: createId(),
        email: adminEmail,
        emailVerified: new Date(),
        name: "Admin",
        role: "ADMIN",
        status: "ACTIVE",
        requiresPasswordChange: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Created admin user: ${adminEmail}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log("\n🔐 You can now log in at /login using passkey or magic link");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
