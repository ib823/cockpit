import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeOrgChart() {
  try {
    const project = await prisma.ganttProject.findFirst({
      where: {
        name: {
          contains: 'YTL',
          mode: 'insensitive',
        },
      },
      include: {
        resources: true,
      },
    });

    if (!project) {
      console.log('❌ No YTL Cement project found');
      return;
    }

    console.log('🔍 BRUTAL HONEST ASSESSMENT - YTL CEMENT PC GREENFIELD');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Database count
    console.log('📊 DATABASE (Source of Truth):');
    console.log(`   Total Resources: ${project.resources.length}`);
    console.log('');

    // What Resource Panel SHOULD show (from line 589 in page.tsx)
    // {currentProject.resources?.length || 0} people • Organizational hierarchy
    console.log('📱 RESOURCE PANEL DISPLAY:');
    console.log(`   Expected Display: "${project.resources.length} people • Organizational hierarchy"`);
    console.log(`   Resource Count Header: ${project.resources.length}`);
    console.log('');

    // Category breakdown (what the panel shows in detail)
    console.log('📋 RESOURCE PANEL - CATEGORY BREAKDOWN:');
    const categoryMap: Record<string, string[]> = {
      leadership: [],
      pm: [],
      technical: [],
      functional: [],
      change: [],
      qa: [],
      basis: [],
      security: [],
      other: [],
    };

    project.resources.forEach(r => {
      const cat = r.category || 'other';
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(r.name);
    });

    let totalCategorized = 0;
    Object.entries(categoryMap).forEach(([cat, resources]) => {
      if (resources.length > 0) {
        console.log(`   ${cat.padEnd(15)}: ${resources.length}`);
        totalCategorized += resources.length;
      }
    });
    console.log(`   ${'TOTAL'.padEnd(15)}: ${totalCategorized}`);
    console.log('');

    // Org Chart Builder analysis
    console.log('🏢 ORG CHART BUILDER:');
    console.log(`   Resources Available: ${project.resources.length}`);
    console.log('   Notes:');
    console.log('   - Org chart reads directly from currentProject.resources array');
    console.log('   - Converts each resource to OrgNode format');
    console.log('   - Should display ALL resources as draggable cards');
    console.log('');

    // Check for hierarchy relationships
    const withManager = project.resources.filter(r => r.managerResourceId).length;
    const withoutManager = project.resources.filter(r => !r.managerResourceId).length;

    console.log('👥 HIERARCHY STRUCTURE:');
    console.log(`   Resources with Manager: ${withManager}`);
    console.log(`   Root-level Resources: ${withoutManager}`);
    console.log('');

    // BRUTAL HONESTY CHECK
    console.log('⚠️  BRUTAL HONESTY CHECK:');
    console.log('═══════════════════════════════════════════════════════════════');

    // Check if there are any duplicates
    const names = project.resources.map(r => r.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      console.log(`❌ DUPLICATES FOUND: ${[...new Set(duplicates)].join(', ')}`);
    } else {
      console.log('✅ No duplicate resource names');
    }

    // Check category issues
    const invalidCategories = project.resources.filter(r =>
      r.category === 'other' || !['leadership', 'pm', 'technical', 'functional', 'change', 'qa', 'basis', 'security'].includes(r.category)
    );
    if (invalidCategories.length > 0) {
      console.log(`⚠️  ${invalidCategories.length} resources have category 'other' or invalid category`);
      invalidCategories.forEach(r => {
        console.log(`   - ${r.name} (${r.category})`);
      });
    }

    console.log('');
    console.log('🎯 EXPECTED SYNC BEHAVIOR:');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`✅ Database has: ${project.resources.length} resources`);
    console.log(`✅ Resource Panel should show: "${project.resources.length} people • Organizational hierarchy"`);
    console.log(`✅ Org Chart Builder should display: ${project.resources.length} draggable cards`);
    console.log(`✅ All three should be IN PERFECT SYNC`);
    console.log('');

    console.log('💡 CONCLUSION:');
    if (duplicates.length > 0 || invalidCategories.length > 0) {
      console.log('⚠️  DATA QUALITY ISSUES DETECTED - May affect display');
    } else {
      console.log('✅ Data is clean. All counts should match perfectly.');
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeOrgChart();
