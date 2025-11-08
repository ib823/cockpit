#!/usr/bin/env tsx

/**
 * Comprehensive Database Connection Test
 *
 * Tests database connectivity and simulates the admin stats query
 * to diagnose production connection issues.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('');

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣  Testing basic connectivity...');
    const startTime1 = Date.now();
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as db_version`;
    const duration1 = Date.now() - startTime1;
    console.log(`✅ Connection successful (${duration1}ms)`);
    console.log('   Database info:', result);
    console.log('');

    // Test 2: Simple count
    console.log('2️⃣  Testing user count query...');
    const startTime2 = Date.now();
    const userCount = await prisma.users.count();
    const duration2 = Date.now() - startTime2;
    console.log(`✅ Found ${userCount} users (${duration2}ms)`);
    console.log('');

    // Test 3: Admin stats query (simulate production)
    console.log('3️⃣  Testing admin stats query (as in production)...');
    const startTime3 = Date.now();

    const queryPromise = Promise.all([
      prisma.users.count(),
      prisma.projects.count({ where: { status: 'APPROVED' } }),
      prisma.projects.count({ where: { status: { in: ['DRAFT', 'IN_REVIEW'] } } }),
    ]);

    // 15 second timeout (same as production)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 15s')), 15000)
    );

    const [totalUsers, activeProjects, proposals] = await Promise.race([
      queryPromise,
      timeoutPromise
    ]);

    const duration3 = Date.now() - startTime3;
    console.log(`✅ Admin stats query successful (${duration3}ms)`);
    console.log(`   - Total Users: ${totalUsers}`);
    console.log(`   - Active Projects: ${activeProjects}`);
    console.log(`   - Proposals: ${proposals}`);
    console.log('');

    // Test 4: Connection health
    console.log('4️⃣  Testing connection health check...');
    const startTime4 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration4 = Date.now() - startTime4;
    console.log(`✅ Health check passed (${duration4}ms)`);
    console.log('');

    console.log('🎉 All tests passed! Database connection is working correctly.');

  } catch (error: any) {
    console.error('\n❌ Connection test failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    if (error.code === 'P1001') {
      console.log('\n💡 Possible solutions for P1001 (Can\'t reach database):');
      console.log('1. Check if your Neon database is still active at https://console.neon.tech');
      console.log('2. Verify the database is not suspended or deleted');
      console.log('3. Check if you need to generate new credentials');
      console.log('4. Ensure network connectivity from your environment to Neon');
      console.log('5. Verify DATABASE_URL environment variable is set correctly');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout issue:');
      console.log('1. Database might be slow or overloaded');
      console.log('2. Network connection might be slow');
      console.log('3. Try running the test again');
    } else {
      console.log('\n💡 General troubleshooting:');
      console.log('1. Check your .env file has DATABASE_URL set');
      console.log('2. Run: npx prisma generate');
      console.log('3. Verify database credentials are correct');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
