/**
 * Button Visibility Scanner
 * Scans the codebase for buttons with potential visibility issues
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

interface ButtonIssue {
  file: string;
  line: number;
  type: "ghost-button" | "opacity-override" | "hover-only-visible" | "transparent-bg" | "ant-ghost";
  context: string;
  severity: "high" | "medium" | "low";
}

const issues: ButtonIssue[] = [];

// Problematic patterns to detect
const PATTERNS = {
  // Ghost buttons that might be invisible
  ghostButton: /variant=["']ghost["']|type=["']ghost["']/g,

  // Opacity overrides
  opacityStyle: /opacity:\s*0\.\d+|opacity-\d+/g,

  // Hover-only visibility
  hoverVisible: /opacity-0.*hover:opacity-\d+|invisible.*hover:visible/g,

  // Transparent backgrounds
  transparentBg: /bg-transparent|background:\s*transparent/g,

  // Ant Design ghost buttons
  antGhost: /<Button[^>]*\s+ghost/g,
};

function scanFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for ghost buttons
      if (PATTERNS.ghostButton.test(line)) {
        // Check if it has proper text color or hover state
        const hasTextColor = /text-\[|text-gray-|text-slate-|color:/i.test(line);
        const hasHoverState = /hover:/i.test(line);

        if (!hasTextColor || !hasHoverState) {
          issues.push({
            file: filePath,
            line: lineNumber,
            type: "ghost-button",
            context: line.trim().substring(0, 100),
            severity: "medium",
          });
        }
      }

      // Check for opacity overrides
      if (PATTERNS.opacityStyle.test(line)) {
        const hasButton = /(button|Button|btn)/i.test(line);
        if (hasButton) {
          issues.push({
            file: filePath,
            line: lineNumber,
            type: "opacity-override",
            context: line.trim().substring(0, 100),
            severity: "high",
          });
        }
      }

      // Check for hover-only visibility
      if (PATTERNS.hoverVisible.test(line)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type: "hover-only-visible",
          context: line.trim().substring(0, 100),
          severity: "high",
        });
      }

      // Check for transparent backgrounds on buttons
      if (PATTERNS.transparentBg.test(line) && /(button|Button|btn)/i.test(line)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type: "transparent-bg",
          context: line.trim().substring(0, 100),
          severity: "low",
        });
      }

      // Check for Ant Design ghost buttons
      if (PATTERNS.antGhost.test(line)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type: "ant-ghost",
          context: line.trim().substring(0, 100),
          severity: "medium",
        });
      }
    });
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error);
  }
}

function walkDirectory(dir: string, filePattern: RegExp): string[] {
  const files: string[] = [];

  // Skip these directories
  const skipDirs = ["node_modules", ".next", ".git", "dist", "build", ".gpt-backup"];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!skipDirs.includes(item)) {
          files.push(...walkDirectory(fullPath, filePattern));
        }
      } else if (filePattern.test(item)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip inaccessible directories
  }

  return files;
}

// Main scan
console.log("🔍 Scanning codebase for button visibility issues...\n");

const srcDir = join(process.cwd(), "src");
const componentFiles = walkDirectory(srcDir, /\.(tsx|jsx|ts|js)$/);

console.log(`📁 Found ${componentFiles.length} files to scan\n`);

let scannedCount = 0;
for (const file of componentFiles) {
  scanFile(file);
  scannedCount++;

  if (scannedCount % 50 === 0) {
    console.log(`   Scanned ${scannedCount}/${componentFiles.length} files...`);
  }
}

console.log(`\n✅ Scanned ${scannedCount} files\n`);

// Categorize issues
const highSeverity = issues.filter((i) => i.severity === "high");
const mediumSeverity = issues.filter((i) => i.severity === "medium");
const lowSeverity = issues.filter((i) => i.severity === "low");

// Generate report
const report = {
  summary: {
    totalFiles: componentFiles.length,
    totalIssues: issues.length,
    highSeverity: highSeverity.length,
    mediumSeverity: mediumSeverity.length,
    lowSeverity: lowSeverity.length,
  },
  issuesByType: {
    ghostButton: issues.filter((i) => i.type === "ghost-button").length,
    opacityOverride: issues.filter((i) => i.type === "opacity-override").length,
    hoverOnlyVisible: issues.filter((i) => i.type === "hover-only-visible").length,
    transparentBg: issues.filter((i) => i.type === "transparent-bg").length,
    antGhost: issues.filter((i) => i.type === "ant-ghost").length,
  },
  issues: issues.map((issue) => ({
    ...issue,
    file: issue.file.replace(process.cwd(), ""),
  })),
  timestamp: new Date().toISOString(),
};

// Save report
const reportPath = join(process.cwd(), "_audit", "button_visibility_report.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Console output
console.log("═══════════════════════════════════════════════════════");
console.log("  BUTTON VISIBILITY SCAN REPORT");
console.log("═══════════════════════════════════════════════════════\n");
console.log(`📊 Summary:`);
console.log(`   Total files scanned:    ${report.summary.totalFiles}`);
console.log(`   Total issues found:     ${report.summary.totalIssues}`);
console.log(`   High severity:          ${report.summary.highSeverity}`);
console.log(`   Medium severity:        ${report.summary.mediumSeverity}`);
console.log(`   Low severity:           ${report.summary.lowSeverity}\n`);

console.log(`🔍 Issues by Type:`);
console.log(`   Ghost buttons:          ${report.issuesByType.ghostButton}`);
console.log(`   Opacity overrides:      ${report.issuesByType.opacityOverride}`);
console.log(`   Hover-only visible:     ${report.issuesByType.hoverOnlyVisible}`);
console.log(`   Transparent bg:         ${report.issuesByType.transparentBg}`);
console.log(`   Ant Design ghost:       ${report.issuesByType.antGhost}\n`);

if (highSeverity.length > 0) {
  console.log(`⚠️  HIGH SEVERITY ISSUES (${highSeverity.length}):\n`);
  highSeverity.slice(0, 10).forEach((issue) => {
    console.log(`   ${issue.file}:${issue.line}`);
    console.log(`   Type: ${issue.type}`);
    console.log(`   ${issue.context}\n`);
  });

  if (highSeverity.length > 10) {
    console.log(`   ... and ${highSeverity.length - 10} more\n`);
  }
}

console.log(`📄 Full report saved to: ${reportPath}\n`);
console.log("═══════════════════════════════════════════════════════\n");
