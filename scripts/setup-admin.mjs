import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log("🔧 Setting up admin user for passkey login...\n");

    const existingAdmin = await prisma.users.findUnique({
      where: { email: "admin@admin.com" },
      include: { Authenticator: true },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already EXISTS");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      console.log("Passkeys registered:", existingAdmin.Authenticator.length);

      if (existingAdmin.role !== "ADMIN") {
        await prisma.users.update({
          where: { id: existingAdmin.id },
          data: { role: "ADMIN", emailVerified: new Date() },
        });
        console.log("✅ Updated role to ADMIN");
      }
    } else {
      const admin = await prisma.users.create({
        data: {
          id: "admin-" + Date.now(),
          email: "admin@admin.com",
          name: "Administrator",
          role: "ADMIN",
          emailVerified: new Date(),
          updatedAt: new Date(),
          accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("✅ Admin user CREATED");
      console.log("Email:", admin.email);
    }

    console.log("\n📋 How to Login as Admin:");
    console.log("═".repeat(60));
    console.log("1. Go to: http://localhost:3002/login");
    console.log("2. Enter email: admin@admin.com");
    console.log('3. Click "Register with Passkey" (first time only)');
    console.log("4. Use fingerprint, Face ID, or hardware key");
    console.log("5. After registration, login with same passkey");
    console.log("═".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
