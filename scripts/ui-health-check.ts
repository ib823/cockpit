#!/usr/bin/env tsx
/**
 * UI Health Check Script
 * Enforces Ant Design-only architecture and design system compliance
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface HealthReport {
  antComponentUsage: number;
  customComponentUsage: number;
  tailwindClassUsage: number;
  nonAntImports: string[];
  gridVariance: number;
  a11yViolations: number;
  score: number;
  passed: boolean;
}

const SRC_DIR = join(process.cwd(), 'src');
const FAIL_THRESHOLDS = {
  maxTailwindClasses: 0,
  maxNonAntImports: 0,
  maxGridVariance: 1, // pixels
  minA11yScore: 95, // percentage
};

async function analyzeComponentUsage(): Promise<{ ant: number; custom: number }> {
  console.log('📊 Analyzing component usage...');

  const files = await glob('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });
  let antUsage = 0;
  let customUsage = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');

    // Count Ant Design imports
    const antImports = content.match(/from ['"]antd['"]/g);
    if (antImports) antUsage += antImports.length;

    // Count custom component directories
    if (file.includes('/components/ui/') ||
        file.includes('/app/_components/ui/') ||
        file.includes('/ui/components/')) {
      customUsage++;
    }
  }

  return { ant: antUsage, custom: customUsage };
}

async function detectTailwindUsage(): Promise<number> {
  console.log('🎨 Detecting Tailwind class usage...');

  const files = await glob('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });
  let count = 0;

  const tailwindPattern = /className=['"][^'"]*\b(px|py|pt|pr|pb|pl|m[xytrbl]?|gap|text|leading|shadow|rounded|bg|border)-[^'"]*['"]/g;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const matches = content.match(tailwindPattern);
    if (matches) {
      count += matches.length;
      console.log(`  ⚠️  Found ${matches.length} Tailwind classes in ${file}`);
    }
  }

  return count;
}

async function detectNonAntImports(): Promise<string[]> {
  console.log('📦 Detecting non-Ant UI library imports...');

  const files = await glob('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });
  const violations: string[] = [];

  const bannedPatterns = [
    /@radix-ui/,
    /@mui/,
    /@chakra-ui/,
    /@mantine/,
    /react-hot-toast/,
    /react-hook-form/,
    /lucide-react/,
  ];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');

    for (const pattern of bannedPatterns) {
      if (pattern.test(content)) {
        const match = content.match(new RegExp(`from ['"]${pattern.source}[^'"]*['"]`));
        if (match) {
          violations.push(`${file}: ${match[0]}`);
        }
      }
    }
  }

  return violations;
}

function calculateHealthScore(report: Omit<HealthReport, 'score' | 'passed'>): number {
  let score = 100;

  // Penalize custom components (should be near zero)
  const customRatio = report.customComponentUsage / (report.antComponentUsage + report.customComponentUsage);
  score -= customRatio * 40;

  // Penalize Tailwind usage (should be zero)
  score -= Math.min(report.tailwindClassUsage, 30);

  // Penalize non-Ant imports (should be zero)
  score -= Math.min(report.nonAntImports.length * 5, 30);

  return Math.max(0, Math.round(score));
}

async function runHealthCheck(): Promise<HealthReport> {
  console.log('🏥 Running UI Health Check...\n');

  const componentUsage = await analyzeComponentUsage();
  const tailwindCount = await detectTailwindUsage();
  const nonAntImports = await detectNonAntImports();

  const report: Omit<HealthReport, 'score' | 'passed'> = {
    antComponentUsage: componentUsage.ant,
    customComponentUsage: componentUsage.custom,
    tailwindClassUsage: tailwindCount,
    nonAntImports,
    gridVariance: 0, // Would require canvas computation
    a11yViolations: 0, // Would require axe-core runtime
  };

  const score = calculateHealthScore(report);
  const passed =
    tailwindCount <= FAIL_THRESHOLDS.maxTailwindClasses &&
    nonAntImports.length <= FAIL_THRESHOLDS.maxNonAntImports &&
    score >= 70;

  return { ...report, score, passed };
}

async function printReport(report: HealthReport): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('UI HEALTH REPORT');
  console.log('='.repeat(60));
  console.log(`\n✅ Ant Design component usage: ${report.antComponentUsage}`);
  console.log(`⚠️  Custom component files: ${report.customComponentUsage}`);
  console.log(`🚫 Tailwind class usages: ${report.tailwindClassUsage}`);
  console.log(`🚫 Non-Ant UI imports: ${report.nonAntImports.length}`);

  if (report.nonAntImports.length > 0) {
    console.log('\nNon-Ant imports found:');
    report.nonAntImports.slice(0, 10).forEach(imp => console.log(`  - ${imp}`));
    if (report.nonAntImports.length > 10) {
      console.log(`  ... and ${report.nonAntImports.length - 10} more`);
    }
  }

  console.log(`\n📊 Overall Health Score: ${report.score}/100`);
  console.log(`\n${report.passed ? '✅ PASSED' : '❌ FAILED'} - ${report.passed ? 'UI health check passed' : 'UI health check failed'}\n`);
}

// Run check
runHealthCheck()
  .then(report => {
    printReport(report);
    process.exit(report.passed ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Health check failed with error:', err);
    process.exit(1);
  });
