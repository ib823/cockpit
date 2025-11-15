/**
 * Validate Store Imports - Ecosystem Integration Check
 *
 * This script scans the entire codebase to ensure all files that use
 * useGanttToolStore have the proper import statement.
 *
 * Part of comprehensive ecosystem integration validation.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface ValidationResult {
  file: string;
  hasUsage: boolean;
  hasImport: boolean;
  hasCorrectImport: boolean;
  status: "✅ OK" | "❌ MISSING_IMPORT" | "⚠️  WRONG_IMPORT" | "ℹ️  MARKDOWN";
  lineNumbers: number[];
  importLine?: string;
}

const results: ValidationResult[] = [];
let totalFiles = 0;
let passedFiles = 0;
let failedFiles = 0;
let markdownFiles = 0;

console.log("🔍 Scanning codebase for store import issues...\n");

// Get all files that mention useGanttToolStore
const grepOutput = execSync(
  'grep -r "useGanttToolStore" --include="*.ts" --include="*.tsx" src/',
  { encoding: "utf-8", cwd: process.cwd() }
).trim();

const fileMatches = grepOutput.split("\n");
const fileSet = new Set<string>();

fileMatches.forEach((line) => {
  const match = line.match(/^([^:]+):/);
  if (match) {
    fileSet.add(match[1]);
  }
});

console.log(`📁 Found ${fileSet.size} source files using useGanttToolStore\n`);

// Check each file
fileSet.forEach((filePath) => {
  totalFiles++;

  // Skip if markdown (shouldn't happen with our grep, but safety check)
  if (filePath.endsWith(".md")) {
    markdownFiles++;
    results.push({
      file: filePath,
      hasUsage: true,
      hasImport: false,
      hasCorrectImport: false,
      status: "ℹ️  MARKDOWN",
      lineNumbers: [],
    });
    return;
  }

  // Read file content
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");

  // Find all lines with useGanttToolStore
  const usageLines: number[] = [];
  lines.forEach((line, index) => {
    if (line.includes("useGanttToolStore")) {
      usageLines.push(index + 1);
    }
  });

  // Check for import statements
  const importRegex1 = /import.*useGanttToolStore.*from.*@\/stores\/gantt-tool-store-v2/;
  const importRegex2 = /from.*useGanttToolStore.*=.*require/;
  const correctImportPattern = /import\s+\{[^}]*useGanttToolStoreV2 as useGanttToolStore[^}]*\}\s+from\s+["']@\/stores\/gantt-tool-store-v2["']/;
  const alternativePattern = /import\s+\{[^}]*useGanttToolStoreV2[^}]*\}\s+from\s+["']@\/stores\/gantt-tool-store-v2["']/;

  let hasImport = false;
  let hasCorrectImport = false;
  let importLine = "";

  lines.forEach((line, index) => {
    if (importRegex1.test(line) || importRegex2.test(line)) {
      hasImport = true;
      importLine = line.trim();

      if (correctImportPattern.test(line) || alternativePattern.test(line)) {
        hasCorrectImport = true;
      }
    }
  });

  // Determine status
  let status: ValidationResult["status"];
  if (!hasImport) {
    status = "❌ MISSING_IMPORT";
    failedFiles++;
  } else if (!hasCorrectImport) {
    status = "⚠️  WRONG_IMPORT";
    failedFiles++;
  } else {
    status = "✅ OK";
    passedFiles++;
  }

  results.push({
    file: filePath,
    hasUsage: true,
    hasImport,
    hasCorrectImport,
    status,
    lineNumbers: usageLines,
    importLine,
  });
});

// Sort results: failed first, then warnings, then passed
results.sort((a, b) => {
  const priority = { "❌ MISSING_IMPORT": 0, "⚠️  WRONG_IMPORT": 1, "✅ OK": 2, "ℹ️  MARKDOWN": 3 };
  return priority[a.status] - priority[b.status];
});

// Print results
console.log("═══════════════════════════════════════════════════════════════\n");
console.log("📊 VALIDATION RESULTS\n");
console.log("═══════════════════════════════════════════════════════════════\n");

// Print failures and warnings first
const issues = results.filter((r) => r.status === "❌ MISSING_IMPORT" || r.status === "⚠️  WRONG_IMPORT");

if (issues.length > 0) {
  console.log("🚨 ISSUES FOUND:\n");
  issues.forEach((result) => {
    console.log(`${result.status} ${result.file}`);
    console.log(`   Lines: ${result.lineNumbers.join(", ")}`);
    if (result.importLine) {
      console.log(`   Import: ${result.importLine}`);
    }
    console.log("");
  });
}

// Print passing files
const passing = results.filter((r) => r.status === "✅ OK");
if (passing.length > 0) {
  console.log("✅ PASSING FILES:\n");
  passing.forEach((result) => {
    console.log(`${result.status} ${result.file}`);
  });
  console.log("");
}

// Summary
console.log("═══════════════════════════════════════════════════════════════\n");
console.log("📈 SUMMARY\n");
console.log("═══════════════════════════════════════════════════════════════\n");
console.log(`Total source files checked: ${totalFiles}`);
console.log(`✅ Passed: ${passedFiles}`);
console.log(`❌ Failed: ${failedFiles}`);
console.log(`ℹ️  Markdown (skipped): ${markdownFiles}`);
console.log("");

if (failedFiles === 0) {
  console.log("🎉 ALL CHECKS PASSED! No store import issues found.\n");
  process.exit(0);
} else {
  console.log(`⚠️  ${failedFiles} FILE(S) NEED ATTENTION\n`);
  console.log("Recommended fixes:");
  console.log("1. Add missing imports: import { useGanttToolStoreV2 as useGanttToolStore } from '@/stores/gantt-tool-store-v2'");
  console.log("2. Or for architecture pages: use useArchitectureStore instead\n");
  process.exit(1);
}
