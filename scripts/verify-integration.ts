/**
 * Integration Verification Script
 * Verifies all touchpoints are correctly updated to use holidays array
 * Jobs/Ive Standard: Complete ecosystem validation
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  file: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  lineNumber?: number;
}

const results: CheckResult[] = [];

function checkFile(filePath: string, checks: Array<{pattern: RegExp, shouldMatch: boolean, description: string}>) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    results.push({
      file: filePath,
      status: 'FAIL',
      details: 'File not found'
    });
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  checks.forEach(check => {
    const matches = content.match(check.pattern);
    const hasMatch = matches !== null && matches.length > 0;

    if (hasMatch === check.shouldMatch) {
      results.push({
        file: filePath,
        status: 'PASS',
        details: check.description
      });
    } else {
      // Find line number for better debugging
      let lineNumber: number | undefined;
      if (!check.shouldMatch && hasMatch) {
        // Found something that shouldn't be there
        for (let i = 0; i < lines.length; i++) {
          if (check.pattern.test(lines[i])) {
            lineNumber = i + 1;
            break;
          }
        }
      }

      results.push({
        file: filePath,
        status: 'FAIL',
        details: check.description,
        lineNumber
      });
    }
  });
}

console.log('🔍 Starting Integration Verification\n');
console.log('='.repeat(80));
console.log('\n## Verifying Deletion Impact Modals\n');

// Check TaskDeletionImpactModal.tsx
checkFile('src/components/gantt-tool/TaskDeletionImpactModal.tsx', [
  {
    pattern: /import.*GanttHoliday.*from.*@\/types\/gantt-tool/,
    shouldMatch: true,
    description: 'Imports GanttHoliday type'
  },
  {
    pattern: /holidays:\s*GanttHoliday\[\]/,
    shouldMatch: true,
    description: 'Interface uses holidays: GanttHoliday[]'
  },
  {
    pattern: /region.*ABMY.*ABSG.*ABVN/,
    shouldMatch: false,
    description: 'Does NOT use region string parameter'
  },
  {
    pattern: /calculateWorkingDaysInclusive\([\s\S]*?,[\s\S]*?holidays[\s\S]*?\)/,
    shouldMatch: true,
    description: 'Passes holidays to calculateWorkingDaysInclusive'
  }
]);

// Check PhaseDeletionImpactModal.tsx
checkFile('src/components/gantt-tool/PhaseDeletionImpactModal.tsx', [
  {
    pattern: /import.*GanttHoliday.*from.*@\/types\/gantt-tool/,
    shouldMatch: true,
    description: 'Imports GanttHoliday type'
  },
  {
    pattern: /holidays:\s*GanttHoliday\[\]/,
    shouldMatch: true,
    description: 'Interface uses holidays: GanttHoliday[]'
  },
  {
    pattern: /region.*ABMY.*ABSG.*ABVN/,
    shouldMatch: false,
    description: 'Does NOT use region string parameter'
  },
  {
    pattern: /calculateWorkingDaysInclusive\([\s\S]*?,[\s\S]*?holidays[\s\S]*?\)/,
    shouldMatch: true,
    description: 'Passes holidays to calculateWorkingDaysInclusive'
  }
]);

console.log('\n## Verifying Integration Points\n');

// Check GanttCanvasV3.tsx
checkFile('src/components/gantt-tool/GanttCanvasV3.tsx', [
  {
    pattern: /PhaseDeletionImpactModal[\s\S]*?holidays=\{currentProject\.holidays/,
    shouldMatch: true,
    description: 'PhaseDeletionImpactModal receives holidays from currentProject'
  },
  {
    pattern: /TaskDeletionImpactModal[\s\S]*?holidays=\{currentProject\.holidays/,
    shouldMatch: true,
    description: 'TaskDeletionImpactModal receives holidays from currentProject'
  },
  {
    pattern: /PhaseDeletionImpactModal[\s\S]*?region=/,
    shouldMatch: false,
    description: 'PhaseDeletionImpactModal does NOT receive region prop'
  },
  {
    pattern: /TaskDeletionImpactModal[\s\S]*?region=/,
    shouldMatch: false,
    description: 'TaskDeletionImpactModal does NOT receive region prop'
  }
]);

// Check GanttSidePanel.tsx
checkFile('src/components/gantt-tool/GanttSidePanel.tsx', [
  {
    pattern: /TaskDeletionImpactModal[\s\S]*?holidays=\{currentProject\.holidays/,
    shouldMatch: true,
    description: 'TaskDeletionImpactModal receives holidays from currentProject'
  },
  {
    pattern: /PhaseDeletionImpactModal[\s\S]*?holidays=\{currentProject\.holidays/,
    shouldMatch: true,
    description: 'PhaseDeletionImpactModal receives holidays from currentProject'
  }
]);

console.log('\n## Verifying Working Days Library\n');

// Check working-days.ts
checkFile('src/lib/gantt-tool/working-days.ts', [
  {
    pattern: /import.*GanttHoliday.*from.*@\/types\/gantt-tool/,
    shouldMatch: true,
    description: 'Imports GanttHoliday type'
  },
  {
    pattern: /function\s+isHoliday\s*\([^)]*holidays:\s*GanttHoliday\[\]/,
    shouldMatch: true,
    description: 'isHoliday accepts holidays: GanttHoliday[]'
  },
  {
    pattern: /function\s+isWorkingDay\s*\([^)]*holidays:\s*GanttHoliday\[\]/,
    shouldMatch: true,
    description: 'isWorkingDay accepts holidays: GanttHoliday[]'
  },
  {
    pattern: /function\s+calculateWorkingDaysInclusive\s*\([^)]*holidays:\s*GanttHoliday\[\]/,
    shouldMatch: true,
    description: 'calculateWorkingDaysInclusive accepts holidays: GanttHoliday[]'
  },
  {
    pattern: /holidays\.some\(/,
    shouldMatch: true,
    description: 'Uses holidays.some() array method'
  }
]);

console.log('\n## Verifying Store Integration\n');

// Check gantt-tool-store-v2.ts
checkFile('src/stores/gantt-tool-store-v2.ts', [
  {
    pattern: /currentProject\.holidays/,
    shouldMatch: true,
    description: 'Store exposes currentProject.holidays'
  },
  {
    pattern: /calculateWorkingDaysInclusive\([^)]*,\s*currentProject\.holidays\s*\)/,
    shouldMatch: true,
    description: 'Store passes currentProject.holidays to working-days functions'
  }
]);

console.log('\n' + '='.repeat(80));
console.log('\n## INTEGRATION VERIFICATION SUMMARY\n');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const warnings = results.filter(r => r.status === 'WARNING').length;
const total = results.length;

console.log(`Total Checks: ${total}`);
console.log(`Passed: ${passed} ✓`);
console.log(`Failed: ${failed} ❌`);
console.log(`Warnings: ${warnings} ⚠️`);
console.log(`Pass Rate: ${((passed / total) * 100).toFixed(2)}%`);

if (failed > 0) {
  console.log('\n❌ Failed Checks:\n');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ${r.file}${r.lineNumber ? `:${r.lineNumber}` : ''}`);
    console.log(`    ${r.details}\n`);
  });
}

if (warnings > 0) {
  console.log('\n⚠️  Warnings:\n');
  results.filter(r => r.status === 'WARNING').forEach(r => {
    console.log(`  ${r.file}${r.lineNumber ? `:${r.lineNumber}` : ''}`);
    console.log(`    ${r.details}\n`);
  });
}

if (failed === 0) {
  console.log('\n✅ ALL INTEGRATION CHECKS PASSED!');
  console.log('✓ All files correctly updated');
  console.log('✓ No region parameters found');
  console.log('✓ All functions accept holidays array');
  console.log('✓ Complete ecosystem integration verified');
  process.exit(0);
} else {
  console.log('\n⚠️  Integration verification incomplete. Please review failures above.');
  process.exit(1);
}
