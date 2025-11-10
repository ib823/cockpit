/**
 * Create Test Admin User
 *
 * Creates an admin user with test credentials for development/testing
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Creating test admin user...\n");

  // Test admin credentials
  const testAdmin = {
    email: "admin@test.com",
    password: "Admin123!", // Simple test password
    name: "Test Administrator",
  };

  // Hash password
  const hashedPassword = await bcrypt.hash(testAdmin.password, 12);

  // Set access expiration to 1 year from now
  const accessExpiresAt = new Date();
  accessExpiresAt.setFullYear(accessExpiresAt.getFullYear() + 1);

  try {
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: testAdmin.email },
    });

    if (existingUser) {
      console.log("⚠️  Admin user already exists, updating...");

      // Update existing user
      const user = await prisma.users.update({
        where: { email: testAdmin.email },
        data: {
          passwordHash: hashedPassword,
          role: "ADMIN",
          name: testAdmin.name,
          emailVerified: new Date(),
          updatedAt: new Date(),
          passwordChangedAt: new Date(),
          accessExpiresAt,
        },
      });

      console.log("✅ Admin user updated successfully!");
    } else {
      // Create new admin user
      const user = await prisma.users.create({
        data: {
          id: createId(),
          email: testAdmin.email,
          passwordHash: hashedPassword,
          role: "ADMIN",
          name: testAdmin.name,
          emailVerified: new Date(),
          updatedAt: new Date(),
          passwordChangedAt: new Date(),
          accessExpiresAt,
        },
      });

      console.log("✅ Admin user created successfully!");
    }

    console.log("\n📋 TEST ADMIN CREDENTIALS:");
    console.log("════════════════════════════");
    console.log(`Email:    ${testAdmin.email}`);
    console.log(`Password: ${testAdmin.password}`);
    console.log("════════════════════════════\n");

    // Create a regular test user too
    const testUser = {
      email: "user@test.com",
      password: "User123!",
      name: "Test User",
    };

    const userHashedPassword = await bcrypt.hash(testUser.password, 12);

    const existingRegularUser = await prisma.users.findUnique({
      where: { email: testUser.email },
    });

    if (existingRegularUser) {
      await prisma.users.update({
        where: { email: testUser.email },
        data: {
          passwordHash: userHashedPassword,
          role: "USER",
          name: testUser.name,
          emailVerified: new Date(),
          updatedAt: new Date(),
          passwordChangedAt: new Date(),
          accessExpiresAt,
        },
      });
      console.log("✅ Regular test user updated!");
    } else {
      await prisma.users.create({
        data: {
          id: createId(),
          email: testUser.email,
          passwordHash: userHashedPassword,
          role: "USER",
          name: testUser.name,
          emailVerified: new Date(),
          updatedAt: new Date(),
          passwordChangedAt: new Date(),
          accessExpiresAt,
        },
      });
      console.log("✅ Regular test user created!");
    }

    console.log("\n📋 TEST USER CREDENTIALS:");
    console.log("════════════════════════════");
    console.log(`Email:    ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    console.log("════════════════════════════\n");
  } catch (error) {
    console.error("❌ Error creating test users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
