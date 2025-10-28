#!/usr/bin/env tsx
/**
 * Generate additional insights from component analysis
 * Creates actionable reports for refactoring priorities
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComponentData {
  componentName: string;
  filePath: string;
  props: string;
  hooks: string;
  externalDeps: string;
  usesTailwind: boolean;
  hasA11yAttrs: boolean;
  performanceNotes: string;
}

function parseCSV(csvContent: string): ComponentData[] {
  const lines = csvContent.split('\n').slice(1); // Skip header
  return lines
    .filter(line => line.trim())
    .map(line => {
      // Simple CSV parsing (handles quoted fields)
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current); // Last field

      return {
        componentName: fields[0] || '',
        filePath: fields[1] || '',
        props: fields[2] || 'none',
        hooks: fields[3] || 'none',
        externalDeps: fields[4] || 'none',
        usesTailwind: fields[5] === 'true',
        hasA11yAttrs: fields[6] === 'true',
        performanceNotes: fields[7] || 'none'
      };
    });
}

function generatePriorityList(components: ComponentData[]): string {
  let output = '# Component Refactoring Priority List\n\n';
  output += 'Generated: ' + new Date().toISOString().split('T')[0] + '\n\n';

  // Critical: No A11y and Large
  const criticalA11y = components.filter(c =>
    !c.hasA11yAttrs &&
    c.performanceNotes.includes('Large component')
  );

  output += '## 🚨 Critical Priority: Accessibility + Size\n\n';
  output += `${criticalA11y.length} components need both accessibility improvements and refactoring\n\n`;

  criticalA11y
    .sort((a, b) => {
      const aSize = parseInt(a.performanceNotes.match(/(\d+) lines/)?.[1] || '0');
      const bSize = parseInt(b.performanceNotes.match(/(\d+) lines/)?.[1] || '0');
      return bSize - aSize;
    })
    .slice(0, 20)
    .forEach((c, i) => {
      const lines = c.performanceNotes.match(/(\d+) lines/)?.[1] || '?';
      output += `${i + 1}. **${c.componentName}** (${lines} lines)\n`;
      output += `   - Path: \`${c.filePath}\`\n`;
      output += `   - Issues: ${c.performanceNotes.split(';').map(s => s.trim()).join(', ')}\n`;
      output += `   - Add: ARIA labels, keyboard navigation, focus management\n\n`;
    });

  // High: Performance Issues
  const highPerf = components.filter(c =>
    c.performanceNotes !== 'none' &&
    (c.performanceNotes.includes('React.memo') || c.performanceNotes.includes('inline functions'))
  );

  output += '\n## ⚠️ High Priority: Performance Optimization\n\n';
  output += `${highPerf.length} components need performance improvements\n\n`;

  highPerf
    .sort((a, b) => {
      const aIssues = a.performanceNotes.split(';').length;
      const bIssues = b.performanceNotes.split(';').length;
      return bIssues - aIssues;
    })
    .slice(0, 20)
    .forEach((c, i) => {
      output += `${i + 1}. **${c.componentName}**\n`;
      output += `   - Path: \`${c.filePath}\`\n`;
      output += `   - Issues: ${c.performanceNotes.split(';').map(s => s.trim()).join(', ')}\n\n`;
    });

  // Medium: Missing A11y
  const mediumA11y = components.filter(c =>
    !c.hasA11yAttrs &&
    !c.performanceNotes.includes('Large component') &&
    c.hooks !== 'none' // Interactive components
  );

  output += '\n## 🟡 Medium Priority: Accessibility Only\n\n';
  output += `${mediumA11y.length} interactive components need accessibility attributes\n\n`;

  mediumA11y
    .slice(0, 30)
    .forEach((c, i) => {
      output += `${i + 1}. **${c.componentName}** - \`${c.filePath}\`\n`;
    });

  return output;
}

function generateDependencyReport(components: ComponentData[]): string {
  let output = '# Dependency Analysis Report\n\n';
  output += 'Generated: ' + new Date().toISOString().split('T')[0] + '\n\n';

  // Analyze dependency combinations
  const depCombos = new Map<string, number>();
  components.forEach(c => {
    if (c.externalDeps !== 'none') {
      const deps = c.externalDeps.split(';').sort().join('+');
      depCombos.set(deps, (depCombos.get(deps) || 0) + 1);
    }
  });

  output += '## Most Common Dependency Combinations\n\n';
  Array.from(depCombos.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([combo, count]) => {
      output += `- ${combo.replace(/\+/g, ' + ')} (${count} components)\n`;
    });

  // Date library analysis
  const dateFns = components.filter(c => c.externalDeps.includes('date-fns'));
  const dayjs = components.filter(c => c.externalDeps.includes('dayjs'));

  output += '\n## Date Library Usage\n\n';
  output += `- **date-fns**: ${dateFns.length} components\n`;
  output += `- **dayjs**: ${dayjs.length} components\n`;
  output += '\n**Recommendation:** Standardize on date-fns (more widely used)\n\n';

  if (dayjs.length > 0) {
    output += '### Components using dayjs (migrate to date-fns):\n\n';
    dayjs.forEach(c => {
      output += `- ${c.componentName} - \`${c.filePath}\`\n`;
    });
  }

  // Ant Design vs Tailwind
  const antd = components.filter(c => c.externalDeps.includes('antd'));
  const tailwind = components.filter(c => c.usesTailwind);
  const both = components.filter(c => c.externalDeps.includes('antd') && c.usesTailwind);

  output += '\n## Styling Analysis\n\n';
  output += `- **Ant Design only**: ${antd.length - both.length} components\n`;
  output += `- **Tailwind only**: ${tailwind.length - both.length} components\n`;
  output += `- **Both**: ${both.length} components\n`;
  output += `- **Neither**: ${components.length - antd.length - tailwind.length + both.length} components\n`;

  return output;
}

function generateHookPatterns(components: ComponentData[]): string {
  let output = '# React Hooks Usage Patterns\n\n';
  output += 'Generated: ' + new Date().toISOString().split('T')[0] + '\n\n';

  // Components with many hooks
  const manyHooks = components
    .filter(c => c.hooks !== 'none')
    .map(c => ({
      ...c,
      hookCount: c.hooks.split(';').length
    }))
    .sort((a, b) => b.hookCount - a.hookCount);

  output += '## Components with Most Hooks\n\n';
  output += '(May indicate complexity that should be refactored)\n\n';

  manyHooks.slice(0, 20).forEach((c, i) => {
    output += `${i + 1}. **${c.componentName}** (${c.hookCount} hooks)\n`;
    output += `   - Hooks: ${c.hooks.split(';').join(', ')}\n`;
    output += `   - Path: \`${c.filePath}\`\n\n`;
  });

  // Hook combinations
  const useState_useEffect = components.filter(c =>
    c.hooks.includes('useState') && c.hooks.includes('useEffect')
  );
  const useState_useCallback = components.filter(c =>
    c.hooks.includes('useState') && c.hooks.includes('useCallback')
  );
  const useMemo_useCallback = components.filter(c =>
    c.hooks.includes('useMemo') && c.hooks.includes('useCallback')
  );

  output += '\n## Common Hook Combinations\n\n';
  output += `- **useState + useEffect**: ${useState_useEffect.length} components (lifecycle management)\n`;
  output += `- **useState + useCallback**: ${useState_useCallback.length} components (optimized event handlers)\n`;
  output += `- **useMemo + useCallback**: ${useMemo_useCallback.length} components (fully optimized)\n`;

  // Components using store hooks
  const storeHooks = ['useGanttToolStoreV2', 'useTimelineStore', 'usePresalesStore', 'useProjectStore'];

  output += '\n## State Management Patterns\n\n';
  storeHooks.forEach(hook => {
    const comps = components.filter(c => c.hooks.includes(hook));
    output += `### ${hook} (${comps.length} components)\n\n`;
    comps.forEach(c => {
      output += `- ${c.componentName} - \`${c.filePath}\`\n`;
    });
    output += '\n';
  });

  return output;
}

function generateAccessibilityReport(components: ComponentData[]): string {
  let output = '# Accessibility Remediation Guide\n\n';
  output += 'Generated: ' + new Date().toISOString().split('T')[0] + '\n\n';

  const withA11y = components.filter(c => c.hasA11yAttrs);
  const withoutA11y = components.filter(c => !c.hasA11yAttrs);

  output += '## Current State\n\n';
  output += `- ✅ With accessibility: ${withA11y.length} (${(withA11y.length/components.length*100).toFixed(1)}%)\n`;
  output += `- ❌ Without accessibility: ${withoutA11y.length} (${(withoutA11y.length/components.length*100).toFixed(1)}%)\n\n`;

  output += '## Good Examples (Components with A11y)\n\n';
  output += 'Use these as reference when adding accessibility to other components:\n\n';

  withA11y.forEach(c => {
    output += `- ${c.componentName} - \`${c.filePath}\`\n`;
  });

  // Group components needing a11y by directory
  const byDir = new Map<string, ComponentData[]>();
  withoutA11y.forEach(c => {
    const dir = path.dirname(c.filePath);
    if (!byDir.has(dir)) {
      byDir.set(dir, []);
    }
    byDir.get(dir)!.push(c);
  });

  output += '\n## Components Needing A11y (by directory)\n\n';
  Array.from(byDir.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([dir, comps]) => {
      output += `### ${dir} (${comps.length} components)\n\n`;
      comps.forEach(c => {
        output += `- [ ] ${c.componentName}\n`;
      });
      output += '\n';
    });

  output += '\n## Accessibility Checklist for Each Component\n\n';
  output += '- [ ] All interactive elements have accessible names (aria-label or visible text)\n';
  output += '- [ ] Buttons have type="button" (unless type="submit")\n';
  output += '- [ ] Form inputs have associated labels\n';
  output += '- [ ] Custom controls have appropriate role attributes\n';
  output += '- [ ] Dynamic content updates use aria-live regions\n';
  output += '- [ ] Keyboard navigation works (tab order, enter/space activation)\n';
  output += '- [ ] Focus is visible (outline or custom focus styles)\n';
  output += '- [ ] Color is not the only way to convey information\n';
  output += '- [ ] Heading levels are semantic (h1, h2, h3 in order)\n';
  output += '- [ ] Images have alt text (or role="presentation" if decorative)\n';

  return output;
}

async function main() {
  const csvPath = path.join('/workspaces/cockpit', '_audit', 'components.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const components = parseCSV(csvContent);

  console.log(`Loaded ${components.length} components from CSV\n`);

  // Generate reports
  const auditDir = path.join('/workspaces/cockpit', '_audit');

  console.log('Generating priority list...');
  const priorityList = generatePriorityList(components);
  fs.writeFileSync(
    path.join(auditDir, 'refactoring-priorities.md'),
    priorityList
  );

  console.log('Generating dependency report...');
  const depReport = generateDependencyReport(components);
  fs.writeFileSync(
    path.join(auditDir, 'dependency-analysis.md'),
    depReport
  );

  console.log('Generating hook patterns...');
  const hookPatterns = generateHookPatterns(components);
  fs.writeFileSync(
    path.join(auditDir, 'hook-patterns.md'),
    hookPatterns
  );

  console.log('Generating accessibility report...');
  const a11yReport = generateAccessibilityReport(components);
  fs.writeFileSync(
    path.join(auditDir, 'accessibility-remediation.md'),
    a11yReport
  );

  console.log('\n✅ All insight reports generated!\n');
  console.log('Generated files:');
  console.log('  - _audit/refactoring-priorities.md');
  console.log('  - _audit/dependency-analysis.md');
  console.log('  - _audit/hook-patterns.md');
  console.log('  - _audit/accessibility-remediation.md');
}

main().catch(console.error);
