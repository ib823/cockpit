/**
 * Build-time script to generate version information
 * Run during build to capture git commit hash and build timestamp
 */
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

interface VersionInfo {
  version: string;
  gitCommit: string;
  gitBranch: string;
  buildTime: string;
}

function getGitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

function getGitBranch(): string {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

function generateVersionInfo(): VersionInfo {
  // Read version from package.json
  const packageJson = require("../package.json");

  return {
    version: packageJson.version,
    gitCommit: getGitCommit(),
    gitBranch: getGitBranch(),
    buildTime: new Date().toISOString(),
  };
}

// Generate and write version.json
const versionInfo = generateVersionInfo();
const outputPath = join(__dirname, "../public/version.json");

writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log("✓ Version info generated:", versionInfo);
