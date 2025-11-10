#!/usr/bin/env tsx
/**
 * Component Inventory Analysis Script
 * Analyzes all TSX components in src/components for:
 * - Props interfaces
 * - React hooks usage
 * - External dependencies
 * - Tailwind usage
 * - Accessibility attributes
 * - Performance concerns
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

interface ComponentAnalysis {
  componentName: string;
  filePath: string;
  props: string;
  hooks: string;
  externalDeps: string;
  usesTailwind: boolean;
  hasA11yAttrs: boolean;
  performanceNotes: string;
}

function extractComponentName(filePath: string, content: string): string {
  // Try to extract from default export
  const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
  if (defaultExportMatch) return defaultExportMatch[1];

  // Try named export
  const namedExportMatch = content.match(/export\s+(?:const|function)\s+(\w+)/);
  if (namedExportMatch) return namedExportMatch[1];

  // Fallback to filename
  return path.basename(filePath, ".tsx");
}

function extractProps(content: string): string {
  const props: string[] = [];

  // Match interface/type props definitions
  const interfaceMatches = content.matchAll(/(?:interface|type)\s+(\w+Props)\s*[={]\s*([^}]+)}/gs);
  for (const match of interfaceMatches) {
    const propsContent = match[2];
    const propNames = propsContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"))
      .map((line) => {
        const propMatch = line.match(/^(\w+)[\?:]?\s*:/);
        return propMatch ? propMatch[1] : null;
      })
      .filter(Boolean);
    props.push(...(propNames as string[]));
  }

  // Match inline props in function signature
  const inlinePropsMatch = content.match(/function\s+\w+\s*\(\s*{\s*([^}]+)\s*}/);
  if (inlinePropsMatch) {
    const inlineProps = inlinePropsMatch[1]
      .split(",")
      .map((p) => p.trim().split(":")[0].trim())
      .filter(Boolean);
    props.push(...inlineProps);
  }

  // Match arrow function props
  const arrowPropsMatch = content.match(/=\s*\(\s*{\s*([^}]+)\s*}\s*:\s*\w+/);
  if (arrowPropsMatch) {
    const arrowProps = arrowPropsMatch[1]
      .split(",")
      .map((p) => p.trim().split(":")[0].trim())
      .filter(Boolean);
    props.push(...arrowProps);
  }

  return [...new Set(props)].join(";") || "none";
}

function extractHooks(content: string): string {
  const hooks = new Set<string>();
  const hookPatterns = [
    "useState",
    "useEffect",
    "useContext",
    "useReducer",
    "useCallback",
    "useMemo",
    "useRef",
    "useImperativeHandle",
    "useLayoutEffect",
    "useDebugValue",
    "useTransition",
    "useDeferredValue",
    "useId",
  ];

  for (const hook of hookPatterns) {
    if (content.includes(hook)) {
      hooks.add(hook);
    }
  }

  // Check for custom hooks (use*)
  const customHookMatches = content.matchAll(/\b(use[A-Z]\w+)\s*\(/g);
  for (const match of customHookMatches) {
    if (!hookPatterns.includes(match[1])) {
      hooks.add(match[1]);
    }
  }

  return hooks.size > 0 ? Array.from(hooks).join(";") : "none";
}

function extractExternalDeps(content: string): string {
  const deps = new Set<string>();

  // Match import statements
  const importMatches = content.matchAll(
    /import\s+(?:{[^}]+}|[\w*]+)?\s*(?:,\s*{[^}]+})?\s*from\s+['"]([^'"]+)['"]/g
  );
  for (const match of importMatches) {
    const importPath = match[1];
    // Only include external packages (not relative imports)
    if (!importPath.startsWith(".") && !importPath.startsWith("@/")) {
      const packageName = importPath.startsWith("@")
        ? importPath.split("/").slice(0, 2).join("/")
        : importPath.split("/")[0];
      deps.add(packageName);
    }
  }

  return deps.size > 0 ? Array.from(deps).join(";") : "none";
}

function checkTailwind(content: string): boolean {
  // Check for className with Tailwind patterns
  return /className\s*=\s*[`"'][^`"']*\b(flex|grid|bg-|text-|p-|m-|w-|h-|border|rounded|shadow)\b/.test(
    content
  );
}

function checkA11y(content: string): boolean {
  // Check for aria-* attributes or role attribute
  return /\b(aria-\w+|role)\s*=/.test(content);
}

function analyzePerformance(content: string): string {
  const concerns: string[] = [];

  // Check for missing React.memo on complex components
  const hasComplexLogic = content.includes("useEffect") || content.includes("useState");
  const hasMemo = content.includes("React.memo") || content.includes("memo(");
  const isLargeComponent = content.split("\n").length > 200;

  if (hasComplexLogic && !hasMemo && isLargeComponent) {
    concerns.push("Consider React.memo");
  }

  // Check for inline function definitions in JSX
  const inlineFunctionCount = (content.match(/\s+on\w+\s*=\s*{\s*\([^)]*\)\s*=>/g) || []).length;
  if (inlineFunctionCount > 3) {
    concerns.push(`${inlineFunctionCount} inline functions in JSX`);
  }

  // Check for missing useCallback on event handlers
  const hasEventHandlers = /const\s+handle\w+\s*=/.test(content);
  const hasUseCallback = content.includes("useCallback");
  if (hasEventHandlers && !hasUseCallback && hasComplexLogic) {
    concerns.push("Event handlers not memoized");
  }

  // Check for large arrays/objects not using useMemo
  const hasLargeData = /const\s+\w+\s*=\s*\[[\s\S]{100,}\]/.test(content);
  const hasUseMemo = content.includes("useMemo");
  if (hasLargeData && !hasUseMemo) {
    concerns.push("Large data not memoized");
  }

  // Check for map without key
  if (/\.map\([^)]+\)/.test(content) && !/key\s*=/.test(content)) {
    concerns.push("Possible missing keys in map");
  }

  // Check for component size
  if (isLargeComponent) {
    concerns.push(`Large component (${content.split("\n").length} lines)`);
  }

  return concerns.length > 0 ? concerns.join("; ") : "none";
}

async function analyzeComponent(filePath: string): Promise<ComponentAnalysis> {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative("/workspaces/cockpit", filePath);

  return {
    componentName: extractComponentName(filePath, content),
    filePath: relativePath,
    props: extractProps(content),
    hooks: extractHooks(content),
    externalDeps: extractExternalDeps(content),
    usesTailwind: checkTailwind(content),
    hasA11yAttrs: checkA11y(content),
    performanceNotes: analyzePerformance(content),
  };
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function analysisToCSV(analysis: ComponentAnalysis): string {
  return [
    escapeCsvField(analysis.componentName),
    escapeCsvField(analysis.filePath),
    escapeCsvField(analysis.props),
    escapeCsvField(analysis.hooks),
    escapeCsvField(analysis.externalDeps),
    analysis.usesTailwind ? "true" : "false",
    analysis.hasA11yAttrs ? "true" : "false",
    escapeCsvField(analysis.performanceNotes),
  ].join(",");
}

async function main() {
  console.log("Starting component inventory analysis...\n");

  // Find all TSX files in src/components
  const files = await glob("src/components/**/*.tsx", {
    cwd: "/workspaces/cockpit",
    absolute: true,
  });

  console.log(`Found ${files.length} components to analyze\n`);

  // Analyze each component
  const analyses: ComponentAnalysis[] = [];
  let processed = 0;

  for (const file of files) {
    try {
      const analysis = await analyzeComponent(file);
      analyses.push(analysis);
      processed++;

      if (processed % 20 === 0) {
        console.log(`Processed ${processed}/${files.length} components...`);
      }
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error);
    }
  }

  console.log(`\nCompleted analysis of ${processed} components\n`);

  // Sort by file path for consistency
  analyses.sort((a, b) => a.filePath.localeCompare(b.filePath));

  // Generate CSV
  const csvHeader =
    "ComponentName,FilePath,Props,Hooks,ExternalDeps,UsesTailwind,HasA11yAttrs,PerformanceNotes";
  const csvRows = analyses.map(analysisToCSV);
  const csv = [csvHeader, ...csvRows].join("\n");

  // Ensure _audit directory exists
  const auditDir = path.join("/workspaces/cockpit", "_audit");
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }

  // Write CSV file
  const outputPath = path.join(auditDir, "components.csv");
  fs.writeFileSync(outputPath, csv, "utf-8");

  console.log(`✅ Component inventory saved to: ${outputPath}\n`);

  // Generate summary statistics
  const stats = {
    total: analyses.length,
    withProps: analyses.filter((a) => a.props !== "none").length,
    withHooks: analyses.filter((a) => a.hooks !== "none").length,
    withExternalDeps: analyses.filter((a) => a.externalDeps !== "none").length,
    usingTailwind: analyses.filter((a) => a.usesTailwind).length,
    withA11y: analyses.filter((a) => a.hasA11yAttrs).length,
    withPerformanceConcerns: analyses.filter((a) => a.performanceNotes !== "none").length,
  };

  console.log("📊 Summary Statistics:");
  console.log(`   Total components: ${stats.total}`);
  console.log(
    `   With props: ${stats.withProps} (${((stats.withProps / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `   Using hooks: ${stats.withHooks} (${((stats.withHooks / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `   With external deps: ${stats.withExternalDeps} (${((stats.withExternalDeps / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `   Using Tailwind: ${stats.usingTailwind} (${((stats.usingTailwind / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `   With a11y attrs: ${stats.withA11y} (${((stats.withA11y / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `   With performance concerns: ${stats.withPerformanceConcerns} (${((stats.withPerformanceConcerns / stats.total) * 100).toFixed(1)}%)`
  );

  // Most common hooks
  const hookCounts = new Map<string, number>();
  analyses.forEach((a) => {
    if (a.hooks !== "none") {
      a.hooks.split(";").forEach((hook) => {
        hookCounts.set(hook, (hookCounts.get(hook) || 0) + 1);
      });
    }
  });

  console.log("\n🔥 Most Common Hooks:");
  Array.from(hookCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([hook, count]) => {
      console.log(`   ${hook}: ${count} components`);
    });

  // Most common external dependencies
  const depCounts = new Map<string, number>();
  analyses.forEach((a) => {
    if (a.externalDeps !== "none") {
      a.externalDeps.split(";").forEach((dep) => {
        depCounts.set(dep, (depCounts.get(dep) || 0) + 1);
      });
    }
  });

  console.log("\n📦 Most Common External Dependencies:");
  Array.from(depCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([dep, count]) => {
      console.log(`   ${dep}: ${count} components`);
    });

  console.log("\n✅ Analysis complete!\n");
}

main().catch(console.error);
