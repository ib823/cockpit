import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkYTLProject() {
  try {
    // Find YTL Cement project
    const project = await prisma.ganttProject.findFirst({
      where: {
        name: {
          contains: 'YTL',
          mode: 'insensitive',
        },
      },
      include: {
        resources: true,
        phases: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      console.log('❌ No YTL Cement project found');
      return;
    }

    console.log('✅ PROJECT FOUND:', project.name);
    console.log('📊 PROJECT ID:', project.id);
    console.log('📅 CREATED:', project.createdAt);
    console.log('');
    console.log('🔍 RESOURCE COUNT ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 Total Resources in Database: ${project.resources.length}`);
    console.log('');

    if (project.resources.length > 0) {
      console.log('📋 RESOURCE BREAKDOWN BY CATEGORY:');
      const categories = ['leadership', 'pm', 'technical', 'functional', 'change', 'qa', 'basis', 'security'];
      categories.forEach(cat => {
        const count = project.resources.filter(r => r.category === cat).length;
        if (count > 0) {
          console.log(`   ${cat.padEnd(15)}: ${count}`);
        }
      });
      console.log('');
      console.log('👥 RESOURCES LIST:');
      project.resources.forEach((r, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${r.name} (${r.designation}) - ${r.category}`);
      });
    }

    console.log('');
    console.log('📊 PROJECT STATS:');
    console.log(`   Phases: ${project.phases.length}`);
    console.log(`   Tasks: ${project.phases.reduce((acc, p) => acc + p.tasks.length, 0)}`);

  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYTLProject();
