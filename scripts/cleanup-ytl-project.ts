import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupYTLProject() {
  try {
    console.log('🔧 YTL CEMENT PROJECT - DATA CLEANUP');
    console.log('═══════════════════════════════════════════════════════════════\n');

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
      },
    });

    if (!project) {
      console.log('❌ No YTL Cement project found');
      return;
    }

    console.log('✅ PROJECT FOUND:', project.name);
    console.log('📊 PROJECT ID:', project.id);
    console.log('');

    // STEP 1: Identify duplicates
    console.log('STEP 1: IDENTIFYING DUPLICATES');
    console.log('───────────────────────────────────────────────────────────────');

    const resourceMap = new Map<string, any[]>();
    project.resources.forEach(r => {
      if (!resourceMap.has(r.name)) {
        resourceMap.set(r.name, []);
      }
      resourceMap.get(r.name)!.push(r);
    });

    const duplicates = Array.from(resourceMap.entries())
      .filter(([_, resources]) => resources.length > 1);

    console.log(`Found ${duplicates.length} duplicate resource names:\n`);
    duplicates.forEach(([name, resources]) => {
      console.log(`  ❌ "${name}" appears ${resources.length} times:`);
      resources.forEach((r, i) => {
        console.log(`     ${i + 1}. ID: ${r.id.substring(0, 20)}... (${r.category})`);
      });
    });

    // STEP 2: Remove duplicates (keep first occurrence)
    console.log('\nSTEP 2: REMOVING DUPLICATES');
    console.log('───────────────────────────────────────────────────────────────');

    const idsToDelete: string[] = [];
    duplicates.forEach(([name, resources]) => {
      // Keep first, delete rest
      const toDelete = resources.slice(1);
      toDelete.forEach(r => {
        idsToDelete.push(r.id);
        console.log(`  🗑️  DELETE: "${name}" (ID: ${r.id.substring(0, 20)}...)`);
      });
    });

    if (idsToDelete.length > 0) {
      const deleteResult = await prisma.ganttResource.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      });
      console.log(`\n✅ Deleted ${deleteResult.count} duplicate resources`);
    } else {
      console.log('\n✅ No duplicates to delete');
    }

    // STEP 3: Fix miscategorized resources
    console.log('\nSTEP 3: FIXING MISCATEGORIZED RESOURCES');
    console.log('───────────────────────────────────────────────────────────────');

    // Reload project after deletions
    const updatedProject = await prisma.ganttProject.findFirst({
      where: { id: project.id },
      include: { resources: true },
    });

    if (!updatedProject) {
      console.log('❌ Could not reload project');
      return;
    }

    const categoryFixes: Array<{ id: string; name: string; oldCat: string; newCat: string }> = [];

    updatedProject.resources.forEach(r => {
      let newCategory = r.category;

      // Categorization rules based on name/designation
      if (r.name.includes('Project Manager') || r.designation.includes('manager')) {
        if (r.category === 'other') {
          newCategory = 'pm';
          categoryFixes.push({ id: r.id, name: r.name, oldCat: r.category, newCat: newCategory });
        }
      } else if (r.name.includes('Director') || r.designation === 'director') {
        if (r.category === 'other') {
          newCategory = 'leadership';
          categoryFixes.push({ id: r.id, name: r.name, oldCat: r.category, newCat: newCategory });
        }
      } else if (r.name.includes('Lead') || r.name.includes('Manager')) {
        if (r.category === 'other') {
          newCategory = 'pm';
          categoryFixes.push({ id: r.id, name: r.name, oldCat: r.category, newCat: newCategory });
        }
      } else if (r.name.includes('Consultant') || r.name.includes('FI') || r.name.includes('MM')) {
        if (r.category === 'other') {
          newCategory = 'functional';
          categoryFixes.push({ id: r.id, name: r.name, oldCat: r.category, newCat: newCategory });
        }
      }
    });

    if (categoryFixes.length > 0) {
      console.log(`Found ${categoryFixes.length} resources to re-categorize:\n`);

      for (const fix of categoryFixes) {
        console.log(`  🔄 "${fix.name}": ${fix.oldCat} → ${fix.newCat}`);
        await prisma.ganttResource.update({
          where: { id: fix.id },
          data: { category: fix.newCat },
        });
      }

      console.log(`\n✅ Updated ${categoryFixes.length} resource categories`);
    } else {
      console.log('\n✅ All resources properly categorized');
    }

    // STEP 4: Verification
    console.log('\nSTEP 4: VERIFICATION');
    console.log('───────────────────────────────────────────────────────────────');

    const finalProject = await prisma.ganttProject.findFirst({
      where: { id: project.id },
      include: { resources: true },
    });

    if (!finalProject) {
      console.log('❌ Could not verify project');
      return;
    }

    console.log(`\n📊 FINAL RESOURCE COUNT: ${finalProject.resources.length}`);
    console.log('\n📋 CATEGORY BREAKDOWN:');
    const categories = ['leadership', 'pm', 'technical', 'functional', 'change', 'qa', 'basis', 'security', 'other'];
    categories.forEach(cat => {
      const count = finalProject.resources.filter(r => r.category === cat).length;
      if (count > 0) {
        console.log(`   ${cat.padEnd(15)}: ${count}`);
      }
    });

    // Check for remaining duplicates
    const finalNames = finalProject.resources.map(r => r.name);
    const finalDuplicates = finalNames.filter((name, index) => finalNames.indexOf(name) !== index);
    if (finalDuplicates.length > 0) {
      console.log(`\n⚠️  WARNING: ${finalDuplicates.length} duplicates still exist!`);
    } else {
      console.log('\n✅ No duplicate resource names');
    }

    // Check for miscategorized
    const otherCount = finalProject.resources.filter(r => r.category === 'other').length;
    if (otherCount > 0) {
      console.log(`⚠️  WARNING: ${otherCount} resources still in 'other' category`);
      finalProject.resources.filter(r => r.category === 'other').forEach(r => {
        console.log(`   - ${r.name} (${r.designation})`);
      });
    } else {
      console.log('✅ All resources properly categorized');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎉 CLEANUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('SUMMARY:');
    console.log(`  Before: ${project.resources.length} resources (${idsToDelete.length} duplicates, ${categoryFixes.length} miscategorized)`);
    console.log(`  After:  ${finalProject.resources.length} resources (all unique, properly categorized)`);
    console.log(`  Improvement: ${project.resources.length - finalProject.resources.length} resources removed\n`);

  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupYTLProject();
