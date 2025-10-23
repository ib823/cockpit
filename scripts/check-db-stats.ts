import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const users = await prisma.users.count();
    const projects = await prisma.projects.findMany({
      select: { id: true, name: true, status: true, createdAt: true }
    });
    const approvedProjects = await prisma.projects.count({ where: { status: 'APPROVED' } });
    const proposals = await prisma.projects.count({
      where: { status: { in: ['DRAFT', 'IN_REVIEW'] } }
    });

    console.log('\n📊 Database Statistics:');
    console.log('─'.repeat(50));
    console.log(`👥 Total Users: ${users}`);
    console.log(`📁 Total Projects: ${projects.length}`);
    console.log(`✅ Active Projects: ${approvedProjects}`);
    console.log(`📝 Proposals: ${proposals}`);

    if (projects.length > 0) {
      console.log('\n📋 Projects in Database:');
      console.log('─'.repeat(50));
      projects.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.name} [${p.status}] - Created: ${p.createdAt.toLocaleDateString()}`);
      });
    } else {
      console.log('\n⚠️  No projects found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
