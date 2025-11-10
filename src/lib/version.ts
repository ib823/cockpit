/**
 * Version utility for accessing build and version information
 */

export interface VersionInfo {
  version: string;
  gitCommit: string;
  gitBranch: string;
  buildTime: string;
}

/**
 * Get version information from build-time generated data
 * Falls back to package.json version if build data unavailable
 */
export async function getVersionInfo(): Promise<VersionInfo> {
  try {
    const response = await fetch("/version.json");
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("Could not fetch version.json, using fallback");
  }

  // Fallback: read from package.json (won't have git info)
  return {
    version: process.env.npm_package_version || "0.1.0",
    gitCommit: "dev",
    gitBranch: "dev",
    buildTime: new Date().toISOString(),
  };
}

/**
 * Format version info for display
 */
export function formatVersionDisplay(info: VersionInfo): string {
  return `v${info.version} (${info.gitCommit})`;
}

/**
 * Format full version info with timestamp
 */
export function formatVersionFull(info: VersionInfo): string {
  const buildDate = new Date(info.buildTime).toLocaleDateString();
  return `Version ${info.version} • ${info.gitCommit} • ${buildDate}`;
}
