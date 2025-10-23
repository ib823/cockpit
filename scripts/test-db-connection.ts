import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

  try {
    console.log('\n⏳ Attempting to connect...');
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as db_version`;
    console.log('✅ Connection successful!');
    console.log('Result:', result);

    const userCount = await prisma.users.count();
    console.log(`\n📊 Database contains ${userCount} users`);

  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'P1001') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if your Neon database still exists at https://console.neon.tech');
      console.log('2. Verify the database is not suspended or deleted');
      console.log('3. Check if you need to generate new credentials');
      console.log('4. Ensure network connectivity from Codespace to Neon');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
