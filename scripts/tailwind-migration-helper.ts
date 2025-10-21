#!/usr/bin/env tsx
/**
 * Tailwind Migration Helper
 *
 * Identifies files with Tailwind classes and suggests migration patterns
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

interface FileWithTailwind {
  path: string;
  classCount: number;
  suggestedPriority: 'high' | 'medium' | 'low';
  patterns: string[];
}

const TAILWIND_PATTERNS = [
  { pattern: /className=["'][^"']*\b(flex|inline-flex)\b/g, suggestion: 'Replace with <Flex> component' },
  { pattern: /className=["'][^"']*\b(grid|grid-cols-\d+)\b/g, suggestion: 'Replace with <Row><Col> components' },
  { pattern: /className=["'][^"']*\b(p-\d+|px-\d+|py-\d+)\b/g, suggestion: 'Replace with token.padding* in style' },
  { pattern: /className=["'][^"']*\b(m-\d+|mx-\d+|my-\d+)\b/g, suggestion: 'Replace with token.margin* in style' },
  { pattern: /className=["'][^"']*\bbg-(blue|red|green|gray|yellow)-\d+\b/g, suggestion: 'Replace with token.color* in style' },
  { pattern: /className=["'][^"']*\btext-(sm|lg|xl|2xl)\b/g, suggestion: 'Replace with <Typography> component' },
  { pattern: /className=["'][^"']*\brounded(-\w+)?\b/g, suggestion: 'Replace with token.borderRadius* in style' },
  { pattern: /className=["'][^"']*\bshadow(-\w+)?\b/g, suggestion: 'Replace with token.boxShadow* in style' },
];

function scanDirectory(dir: string, files: FileWithTailwind[] = []): FileWithTailwind[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) {
        scanDirectory(fullPath, files);
      }
    } else if (entry.match(/\.(tsx?|jsx?)$/)) {
      const content = readFileSync(fullPath, 'utf-8');
      const classMatches = content.match(/className=["'][^"']*\b(flex|grid|p-|m-|px-|py-|bg-|text-|rounded|shadow)/g);

      if (classMatches) {
        const patterns: string[] = [];

        for (const { pattern, suggestion } of TAILWIND_PATTERNS) {
          if (pattern.test(content)) {
            patterns.push(suggestion);
          }
        }

        const classCount = classMatches.length;
        const priority = classCount >= 100 ? 'high' : classCount >= 50 ? 'medium' : 'low';

        files.push({
          path: fullPath.replace(process.cwd() + '/', ''),
          classCount,
          suggestedPriority: priority,
          patterns: [...new Set(patterns)],
        });
      }
    }
  }

  return files;
}

console.log('🔍 Scanning for files with Tailwind classes...\n');

const files = scanDirectory(join(process.cwd(), 'src'));
files.sort((a, b) => b.classCount - a.classCount);

const totalClasses = files.reduce((sum, f) => sum + f.classCount, 0);
const highPriority = files.filter(f => f.suggestedPriority === 'high');
const mediumPriority = files.filter(f => f.suggestedPriority === 'medium');
const lowPriority = files.filter(f => f.suggestedPriority === 'low');

console.log(`📊 Summary:`);
console.log(`  Total files: ${files.length}`);
console.log(`  Total Tailwind class usages: ${totalClasses}`);
console.log(`  High priority (100+ classes): ${highPriority.length} files`);
console.log(`  Medium priority (50-99 classes): ${mediumPriority.length} files`);
console.log(`  Low priority (<50 classes): ${lowPriority.length} files\n`);

console.log(`🚀 High Priority Files (${highPriority.length}):\n`);
highPriority.slice(0, 10).forEach(file => {
  console.log(`  📄 ${file.path} (${file.classCount} classes)`);
  file.patterns.forEach(pattern => {
    console.log(`     └─ ${pattern}`);
  });
  console.log('');
});

if (highPriority.length > 10) {
  console.log(`  ... and ${highPriority.length - 10} more high-priority files\n`);
}

console.log('\n📖 Migration Guide: docs/TAILWIND_TO_ANT_MIGRATION.md');
console.log('🛡️  ESLint Config: .eslintrc.tailwind-ban.json');
console.log('\n💡 Suggested approach:');
console.log('  1. Start with high-priority files (biggest impact)');
console.log('  2. Use migration patterns from docs/TAILWIND_TO_ANT_MIGRATION.md');
console.log('  3. Test visually after each file');
console.log('  4. Commit frequently');
console.log('  5. Run `npm run lint` to catch new Tailwind usage\n');
