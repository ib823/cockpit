/**
 * Contrast Ratio Analysis Script
 *
 * Calculates WCAG 2.1 contrast ratios for all design token combinations
 * and generates a comprehensive accessibility report.
 */

interface ContrastResult {
  foregroundColor: string;
  foregroundName: string;
  backgroundColor: string;
  backgroundName: string;
  contrastRatio: number;
  aaPassNormal: boolean;
  aaPassLarge: boolean;
  aaaPassNormal: boolean;
  aaaPassLarge: boolean;
  severity: "pass" | "warning" | "fail";
  recommendation: string;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance per WCAG 2.1
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio per WCAG 2.1
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Evaluate a color combination
 */
function evaluateCombination(
  foreground: string,
  foregroundName: string,
  background: string,
  backgroundName: string
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  // WCAG 2.1 Level AA: 4.5:1 for normal text, 3:1 for large text
  // WCAG 2.1 Level AAA: 7:1 for normal text, 4.5:1 for large text
  const aaPassNormal = ratio >= 4.5;
  const aaPassLarge = ratio >= 3.0;
  const aaaPassNormal = ratio >= 7.0;
  const aaaPassLarge = ratio >= 4.5;

  let severity: "pass" | "warning" | "fail";
  let recommendation: string;

  if (aaaPassNormal) {
    severity = "pass";
    recommendation = "Excellent contrast - passes AAA for all text sizes";
  } else if (aaPassNormal) {
    severity = "pass";
    recommendation = "Good contrast - passes AA for all text sizes";
  } else if (aaPassLarge) {
    severity = "warning";
    recommendation = "Only use for large text (18px+ or 14px+ bold) - fails AA for normal text";
  } else {
    severity = "fail";
    recommendation = "Insufficient contrast - do not use for text";
  }

  return {
    foregroundColor: foreground,
    foregroundName,
    backgroundColor: background,
    backgroundName,
    contrastRatio: Math.round(ratio * 100) / 100,
    aaPassNormal,
    aaPassLarge,
    aaaPassNormal,
    aaaPassLarge,
    severity,
    recommendation,
  };
}

/**
 * Main analysis
 */
function analyzeContrast(): ContrastResult[] {
  const results: ContrastResult[] = [];

  // Define color combinations to test
  const combinations = [
    // Light mode - text on backgrounds
    { fg: "#0f172a", fgName: "Primary Text", bg: "#ffffff", bgName: "White Background" },
    { fg: "#475569", fgName: "Secondary Text", bg: "#ffffff", bgName: "White Background" },
    { fg: "#64748b", fgName: "Muted Text", bg: "#ffffff", bgName: "White Background" },
    { fg: "#6b7280", fgName: "Gray Text", bg: "#ffffff", bgName: "White Background" },
    { fg: "#0f172a", fgName: "Primary Text", bg: "#f8fafc", bgName: "Subtle Background" },
    { fg: "#475569", fgName: "Secondary Text", bg: "#f8fafc", bgName: "Subtle Background" },
    { fg: "#64748b", fgName: "Muted Text", bg: "#f8fafc", bgName: "Subtle Background" },
    { fg: "#0f172a", fgName: "Primary Text", bg: "#f9fafb", bgName: "Surface Background" },

    // Light mode - brand colors
    { fg: "#2563eb", fgName: "Primary Brand", bg: "#ffffff", bgName: "White Background" },
    { fg: "#1d4ed8", fgName: "Primary Brand Hover", bg: "#ffffff", bgName: "White Background" },
    { fg: "#ffffff", fgName: "White Text", bg: "#2563eb", bgName: "Primary Brand Background" },
    {
      fg: "#ffffff",
      fgName: "White Text",
      bg: "#1d4ed8",
      bgName: "Primary Brand Hover Background",
    },
    { fg: "#2563eb", fgName: "Primary Brand", bg: "#dbeafe", bgName: "Primary Subtle Background" },
    {
      fg: "#1d4ed8",
      fgName: "Primary Brand Hover",
      bg: "#dbeafe",
      bgName: "Primary Subtle Background",
    },

    // Light mode - state colors
    { fg: "#16a34a", fgName: "Success Text", bg: "#ffffff", bgName: "White Background" },
    { fg: "#16a34a", fgName: "Success Text", bg: "#dcfce7", bgName: "Success Background" },
    { fg: "#15803d", fgName: "Success Dark", bg: "#dcfce7", bgName: "Success Background" },
    { fg: "#0f172a", fgName: "Primary Text", bg: "#dcfce7", bgName: "Success Background" },

    { fg: "#f59e0b", fgName: "Warning Text", bg: "#ffffff", bgName: "White Background" },
    { fg: "#f59e0b", fgName: "Warning Text", bg: "#fef3c7", bgName: "Warning Background" },
    { fg: "#d97706", fgName: "Warning Dark", bg: "#fef3c7", bgName: "Warning Background" },
    { fg: "#92400e", fgName: "Warning Darker", bg: "#fef3c7", bgName: "Warning Background" },
    { fg: "#0f172a", fgName: "Primary Text", bg: "#fef3c7", bgName: "Warning Background" },

    { fg: "#ef4444", fgName: "Danger Text", bg: "#ffffff", bgName: "White Background" },
    { fg: "#ef4444", fgName: "Danger Text", bg: "#fee2e2", bgName: "Danger Background" },
    { fg: "#dc2626", fgName: "Danger Dark", bg: "#fee2e2", bgName: "Danger Background" },
    { fg: "#b91c1c", fgName: "Danger Darker", bg: "#fee2e2", bgName: "Danger Background" },
    { fg: "#0f172a", fgName: "Primary Text", bg: "#fee2e2", bgName: "Danger Background" },

    // Light mode - Gantt colors
    { fg: "#111827", fgName: "Gantt Bar", bg: "#eef2f6", bgName: "Gantt Grid" },
    { fg: "#2563eb", fgName: "Gantt Bar Accent", bg: "#eef2f6", bgName: "Gantt Grid" },
    { fg: "#ef4444", fgName: "Gantt Bar Critical", bg: "#eef2f6", bgName: "Gantt Grid" },
    { fg: "#10b981", fgName: "Gantt Bar Progress", bg: "#eef2f6", bgName: "Gantt Grid" },
    { fg: "#9ca3af", fgName: "Gantt Baseline", bg: "#eef2f6", bgName: "Gantt Grid" },
    { fg: "#fb923c", fgName: "Gantt Today", bg: "#eef2f6", bgName: "Gantt Grid" },
    { fg: "#6b7280", fgName: "Gantt Link", bg: "#eef2f6", bgName: "Gantt Grid" },
    { fg: "#ffffff", fgName: "White Text", bg: "#111827", bgName: "Gantt Bar" },
    { fg: "#ffffff", fgName: "White Text", bg: "#2563eb", bgName: "Gantt Bar Accent" },
    { fg: "#ffffff", fgName: "White Text", bg: "#ef4444", bgName: "Gantt Bar Critical" },
    { fg: "#ffffff", fgName: "White Text", bg: "#10b981", bgName: "Gantt Bar Progress" },

    // Dark mode - text on backgrounds
    { fg: "#e5e7eb", fgName: "Dark: Primary Text", bg: "#0b0f17", bgName: "Dark: Base Background" },
    {
      fg: "#cbd5e1",
      fgName: "Dark: Secondary Text",
      bg: "#0b0f17",
      bgName: "Dark: Base Background",
    },
    { fg: "#94a3b8", fgName: "Dark: Muted Text", bg: "#0b0f17", bgName: "Dark: Base Background" },
    {
      fg: "#e5e7eb",
      fgName: "Dark: Primary Text",
      bg: "#0f1520",
      bgName: "Dark: Subtle Background",
    },
    {
      fg: "#cbd5e1",
      fgName: "Dark: Secondary Text",
      bg: "#0f1520",
      bgName: "Dark: Subtle Background",
    },
    { fg: "#94a3b8", fgName: "Dark: Muted Text", bg: "#0f1520", bgName: "Dark: Subtle Background" },
    {
      fg: "#e5e7eb",
      fgName: "Dark: Primary Text",
      bg: "#1a1f2e",
      bgName: "Dark: Surface Background",
    },
    {
      fg: "#cbd5e1",
      fgName: "Dark: Secondary Text",
      bg: "#1a1f2e",
      bgName: "Dark: Surface Background",
    },

    // Dark mode - brand colors
    {
      fg: "#2563eb",
      fgName: "Dark: Primary Brand",
      bg: "#0b0f17",
      bgName: "Dark: Base Background",
    },
    {
      fg: "#1d4ed8",
      fgName: "Dark: Primary Brand Hover",
      bg: "#0b0f17",
      bgName: "Dark: Base Background",
    },
    {
      fg: "#e5e7eb",
      fgName: "Dark: Primary Text",
      bg: "#2563eb",
      bgName: "Dark: Primary Brand Background",
    },
    {
      fg: "#e5e7eb",
      fgName: "Dark: Primary Text",
      bg: "#1e3a8a",
      bgName: "Dark: Primary Subtle Background",
    },

    // Dark mode - state colors
    { fg: "#16a34a", fgName: "Dark: Success Text", bg: "#0b0f17", bgName: "Dark: Base Background" },
    {
      fg: "#16a34a",
      fgName: "Dark: Success Text",
      bg: "#14532d",
      bgName: "Dark: Success Background",
    },
    {
      fg: "#e5e7eb",
      fgName: "Dark: Primary Text",
      bg: "#14532d",
      bgName: "Dark: Success Background",
    },

    { fg: "#f59e0b", fgName: "Dark: Warning Text", bg: "#0b0f17", bgName: "Dark: Base Background" },
    {
      fg: "#f59e0b",
      fgName: "Dark: Warning Text",
      bg: "#78350f",
      bgName: "Dark: Warning Background",
    },
    {
      fg: "#e5e7eb",
      fgName: "Dark: Primary Text",
      bg: "#78350f",
      bgName: "Dark: Warning Background",
    },

    { fg: "#ef4444", fgName: "Dark: Danger Text", bg: "#0b0f17", bgName: "Dark: Base Background" },
    {
      fg: "#ef4444",
      fgName: "Dark: Danger Text",
      bg: "#7f1d1d",
      bgName: "Dark: Danger Background",
    },
    {
      fg: "#e5e7eb",
      fgName: "Dark: Primary Text",
      bg: "#7f1d1d",
      bgName: "Dark: Danger Background",
    },

    // Dark mode - Gantt colors
    { fg: "#e5e7eb", fgName: "Dark: Gantt Bar", bg: "#1f2937", bgName: "Dark: Gantt Grid" },
    { fg: "#6b7280", fgName: "Dark: Gantt Baseline", bg: "#1f2937", bgName: "Dark: Gantt Grid" },
    { fg: "#0b0f17", fgName: "Dark: Base Background", bg: "#e5e7eb", bgName: "Dark: Gantt Bar" },

    // Additional critical combinations
    { fg: "#1890ff", fgName: "Ant Design Primary", bg: "#ffffff", bgName: "White Background" },
    { fg: "#ffffff", fgName: "White Text", bg: "#1890ff", bgName: "Ant Design Primary Background" },
    { fg: "#a855f7", fgName: "Purple Accent", bg: "#ffffff", bgName: "White Background" },
    { fg: "#ffffff", fgName: "White Text", bg: "#a855f7", bgName: "Purple Accent Background" },

    // Border colors (for visibility)
    { fg: "#e5e7eb", fgName: "Light Border", bg: "#ffffff", bgName: "White Background" },
    { fg: "#d1d5db", fgName: "Strong Border", bg: "#ffffff", bgName: "White Background" },
    { fg: "#1f2937", fgName: "Dark: Border", bg: "#0b0f17", bgName: "Dark: Base Background" },
  ];

  // Evaluate each combination
  for (const combo of combinations) {
    results.push(evaluateCombination(combo.fg, combo.fgName, combo.bg, combo.bgName));
  }

  return results;
}

/**
 * Generate CSV output
 */
function generateCSV(results: ContrastResult[]): string {
  const header =
    "ForegroundColor,ForegroundName,BackgroundColor,BackgroundName,ContrastRatio,AA_Normal,AA_Large,AAA_Normal,AAA_Large,Severity,Recommendation\n";

  const rows = results.map((result) => {
    return [
      result.foregroundColor,
      `"${result.foregroundName}"`,
      result.backgroundColor,
      `"${result.backgroundName}"`,
      result.contrastRatio.toFixed(2),
      result.aaPassNormal ? "PASS" : "FAIL",
      result.aaPassLarge ? "PASS" : "FAIL",
      result.aaaPassNormal ? "PASS" : "FAIL",
      result.aaaPassLarge ? "PASS" : "FAIL",
      result.severity.toUpperCase(),
      `"${result.recommendation}"`,
    ].join(",");
  });

  return header + rows.join("\n");
}

/**
 * Generate Markdown report
 */
function generateMarkdown(results: ContrastResult[]): string {
  const fails = results.filter((r) => r.severity === "fail");
  const warnings = results.filter((r) => r.severity === "warning");
  const passes = results.filter((r) => r.severity === "pass");
  const aaaCompliant = results.filter((r) => r.aaaPassNormal);

  let md = `# Contrast Ratio Analysis Report

**Generated:** ${new Date().toISOString()}

## Executive Summary

- **Total Combinations Tested:** ${results.length}
- **Failures (< 3:1):** ${fails.length}
- **Warnings (3:1 - 4.5:1):** ${warnings.length}
- **Passes (≥ 4.5:1):** ${passes.length}
- **AAA Compliant (≥ 7:1):** ${aaaCompliant.length}

### WCAG 2.1 Compliance Levels

- **Level AA:** Minimum contrast ratio of 4.5:1 for normal text (< 18px or < 14px bold), 3:1 for large text
- **Level AAA:** Minimum contrast ratio of 7:1 for normal text, 4.5:1 for large text

---

`;

  // Critical Failures
  if (fails.length > 0) {
    md += `## 🔴 Critical Failures (${fails.length})

These combinations fail WCAG AA and should NOT be used for any text.

| Foreground | Background | Ratio | Recommendation |
|------------|-----------|-------|----------------|
`;
    fails.forEach((result) => {
      md += `| ${result.foregroundName}<br/>\`${result.foregroundColor}\` | ${result.backgroundName}<br/>\`${result.backgroundColor}\` | **${result.contrastRatio}:1** | ${result.recommendation} |\n`;
    });
    md += "\n";
  }

  // Warnings
  if (warnings.length > 0) {
    md += `## ⚠️ Warnings (${warnings.length})

These combinations pass AA for large text only (≥18px or ≥14px bold).

| Foreground | Background | Ratio | Recommendation |
|------------|-----------|-------|----------------|
`;
    warnings.forEach((result) => {
      md += `| ${result.foregroundName}<br/>\`${result.foregroundColor}\` | ${result.backgroundName}<br/>\`${result.backgroundColor}\` | **${result.contrastRatio}:1** | ${result.recommendation} |\n`;
    });
    md += "\n";
  }

  // Top Performers
  const topPerformers = results
    .filter((r) => r.contrastRatio >= 10)
    .sort((a, b) => b.contrastRatio - a.contrastRatio)
    .slice(0, 10);

  if (topPerformers.length > 0) {
    md += `## ✅ Top Performers (Ratio ≥ 10:1)

These combinations provide excellent contrast for maximum accessibility.

| Foreground | Background | Ratio | Level |
|------------|-----------|-------|-------|
`;
    topPerformers.forEach((result) => {
      md += `| ${result.foregroundName}<br/>\`${result.foregroundColor}\` | ${result.backgroundName}<br/>\`${result.backgroundColor}\` | **${result.contrastRatio}:1** | AAA |\n`;
    });
    md += "\n";
  }

  // Mode-specific analysis
  md += `## Light Mode Analysis

`;

  const lightResults = results.filter(
    (r) => !r.foregroundName.startsWith("Dark:") && !r.backgroundName.startsWith("Dark:")
  );
  const lightFails = lightResults.filter((r) => r.severity === "fail");
  const lightWarnings = lightResults.filter((r) => r.severity === "warning");

  md += `- **Total:** ${lightResults.length} combinations
- **Failures:** ${lightFails.length}
- **Warnings:** ${lightWarnings.length}
- **Pass Rate:** ${(((lightResults.length - lightFails.length - lightWarnings.length) / lightResults.length) * 100).toFixed(1)}%

`;

  md += `## Dark Mode Analysis

`;

  const darkResults = results.filter(
    (r) => r.foregroundName.startsWith("Dark:") || r.backgroundName.startsWith("Dark:")
  );
  const darkFails = darkResults.filter((r) => r.severity === "fail");
  const darkWarnings = darkResults.filter((r) => r.severity === "warning");

  md += `- **Total:** ${darkResults.length} combinations
- **Failures:** ${darkFails.length}
- **Warnings:** ${darkWarnings.length}
- **Pass Rate:** ${(((darkResults.length - darkFails.length - darkWarnings.length) / darkResults.length) * 100).toFixed(1)}%

`;

  // Detailed recommendations
  md += `---

## Remediation Recommendations

### High Priority Fixes

`;

  if (fails.length > 0) {
    md += `#### 1. Address Critical Failures

${fails.length} color combination(s) fail WCAG AA minimum standards:

`;
    fails.forEach((result, index) => {
      md += `**${index + 1}.** ${result.foregroundName} on ${result.backgroundName} (${result.contrastRatio}:1)
- **Current:** \`${result.foregroundColor}\` on \`${result.backgroundColor}\`
- **Issue:** Contrast ratio is below 3:1 minimum
- **Fix Options:**
  - Darken the foreground color
  - Lighten the background color
  - Use a different color combination entirely
  - Add a semi-transparent overlay to improve contrast

`;
    });
  }

  if (warnings.length > 0) {
    md += `#### 2. Improve Warning Cases

${warnings.length} combination(s) only pass for large text:

`;
    warnings.forEach((result, index) => {
      md += `**${index + 1}.** ${result.foregroundName} on ${result.backgroundName} (${result.contrastRatio}:1)
- **Current:** \`${result.foregroundColor}\` on \`${result.backgroundColor}\`
- **Issue:** Contrast ratio is between 3:1 and 4.5:1
- **Fix Options:**
  - Only use for large text (≥18px or ≥14px bold)
  - Increase contrast to reach 4.5:1 for normal text support
  - Consider using for headings and UI elements only

`;
    });
  }

  // Best practices
  md += `### Best Practices

1. **Primary Text:** Aim for 7:1 or higher (AAA level) for body text
2. **Secondary Text:** Minimum 4.5:1 (AA level) for all readable text
3. **Large Text:** Can use 3:1 minimum for headings ≥18px or ≥14px bold
4. **UI Components:** Minimum 3:1 for interactive elements and icons
5. **State Indicators:** Success/warning/danger colors should meet AA when used for text
6. **Dark Mode:** Maintain same contrast standards as light mode

### Testing Tools

- **Browser DevTools:** Most modern browsers include contrast ratio checkers
- **axe DevTools:** Browser extension for automated accessibility testing
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Color Contrast Analyzer:** Desktop app for Windows/macOS

### Implementation Strategy

1. **Immediate:** Fix all critical failures (< 3:1 ratio)
2. **Short-term:** Address warnings, especially for commonly used text
3. **Long-term:** Aim for AAA compliance (≥7:1) for all body text
4. **Ongoing:** Test all new color combinations before deployment

---

## Detailed Results

### All Combinations

| Foreground | Background | Ratio | AA Normal | AA Large | AAA Normal | AAA Large | Status |
|------------|-----------|-------|-----------|----------|------------|-----------|--------|
`;

  results.forEach((result) => {
    const statusEmoji =
      result.severity === "fail" ? "🔴" : result.severity === "warning" ? "⚠️" : "✅";
    md += `| ${result.foregroundName}<br/>\`${result.foregroundColor}\` | ${result.backgroundName}<br/>\`${result.backgroundColor}\` | ${result.contrastRatio}:1 | ${result.aaPassNormal ? "✓" : "✗"} | ${result.aaPassLarge ? "✓" : "✗"} | ${result.aaaPassNormal ? "✓" : "✗"} | ${result.aaaPassLarge ? "✓" : "✗"} | ${statusEmoji} |\n`;
  });

  md += `\n---

## References

- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast and Color Accessibility](https://webaim.org/articles/contrast/)
- [MDN: Color Contrast](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast)

---

*This report was generated automatically. Manual verification is recommended for critical use cases.*
`;

  return md;
}

/**
 * Main execution
 */
function main() {
  console.log("Analyzing contrast ratios...\n");

  const results = analyzeContrast();

  // Generate CSV
  const csv = generateCSV(results);
  console.log("CSV generated. Sample:");
  console.log(csv.split("\n").slice(0, 5).join("\n"));
  console.log(`... (${results.length} total rows)\n`);

  // Generate Markdown
  const markdown = generateMarkdown(results);
  console.log("Markdown report generated.\n");

  // Output results
  const fs = require("fs");
  const path = require("path");

  const auditDir = path.join(process.cwd(), "_audit");
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }

  fs.writeFileSync(path.join(auditDir, "contrast-findings.csv"), csv, "utf-8");
  fs.writeFileSync(path.join(auditDir, "contrast-analysis.md"), markdown, "utf-8");

  console.log("✅ Files written:");
  console.log(`   - ${path.join(auditDir, "contrast-findings.csv")}`);
  console.log(`   - ${path.join(auditDir, "contrast-analysis.md")}`);

  // Summary
  const fails = results.filter((r) => r.severity === "fail").length;
  const warnings = results.filter((r) => r.severity === "warning").length;
  const passes = results.filter((r) => r.severity === "pass").length;

  console.log("\n📊 Summary:");
  console.log(`   Total combinations: ${results.length}`);
  console.log(`   Failures: ${fails}`);
  console.log(`   Warnings: ${warnings}`);
  console.log(`   Passes: ${passes}`);
}

main();
