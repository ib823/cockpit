/**
 * IndexedDB Recovery Utility
 *
 * Provides functions to inspect and recover data from IndexedDB
 * that may not have been synced to the server.
 */

import type { GanttProject, Resource } from "@/types/gantt-tool";

const DB_NAME = "gantt_tool_local_v1";
const DB_VERSION = 1;
const PROJECTS_STORE = "projects";

interface RecoveryReport {
  projectId: string;
  projectName: string;
  hasLocalData: boolean;
  resourcesWithCompanyName: Array<{
    resourceId: string;
    resourceName: string;
    companyName: string;
  }>;
  orgChartData: {
    hasCompanyLogos: boolean;
    logoCount: number;
    companyNames: string[];
  };
  localUpdatedAt?: string;
  needsSync?: boolean;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
        projectStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
  });
}

/**
 * Get all projects from IndexedDB
 */
export async function getAllLocalProjects(): Promise<GanttProject[]> {
  try {
    const db = await openDB();
    const tx = db.transaction([PROJECTS_STORE], "readonly");
    const store = tx.objectStore(PROJECTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[Recovery] Failed to get local projects:", error);
    return [];
  }
}

/**
 * Get a specific project from IndexedDB
 */
export async function getLocalProject(projectId: string): Promise<GanttProject | null> {
  try {
    const db = await openDB();
    const tx = db.transaction([PROJECTS_STORE], "readonly");
    const store = tx.objectStore(PROJECTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[Recovery] Failed to get local project:", error);
    return null;
  }
}

/**
 * Generate a recovery report for all local projects
 * This shows what data exists in IndexedDB that may not be on the server
 */
export async function generateRecoveryReport(): Promise<RecoveryReport[]> {
  const localProjects = await getAllLocalProjects();
  const reports: RecoveryReport[] = [];

  for (const project of localProjects) {
    const localMeta = project as any;

    const resourcesWithCompany = (project.resources || [])
      .filter((r: Resource) => r.companyName)
      .map((r: Resource) => ({
        resourceId: r.id,
        resourceName: r.name,
        companyName: r.companyName!,
      }));

    const orgChartPro = project.orgChartPro || {};
    const companyLogos = orgChartPro.companyLogos || {};
    const logoKeys = Object.keys(companyLogos);

    reports.push({
      projectId: project.id,
      projectName: project.name,
      hasLocalData: true,
      resourcesWithCompanyName: resourcesWithCompany,
      orgChartData: {
        hasCompanyLogos: logoKeys.length > 0,
        logoCount: logoKeys.length,
        companyNames: logoKeys,
      },
      localUpdatedAt: localMeta.localUpdatedAt,
      needsSync: localMeta.needsSync,
    });
  }

  return reports;
}

/**
 * Extract recoverable resource data from IndexedDB
 * Returns only resources that have companyName set
 */
export async function getRecoverableResourceData(projectId: string): Promise<{
  projectId: string;
  projectName: string;
  resources: Array<{
    id: string;
    name: string;
    companyName: string;
    managerResourceId?: string;
  }>;
} | null> {
  const project = await getLocalProject(projectId);
  if (!project) return null;

  const recoverableResources = (project.resources || [])
    .filter((r: Resource) => r.companyName)
    .map((r: Resource) => ({
      id: r.id,
      name: r.name,
      companyName: r.companyName!,
      managerResourceId: r.managerResourceId || undefined,
    }));

  return {
    projectId: project.id,
    projectName: project.name,
    resources: recoverableResources,
  };
}

/**
 * Push recovered resource data to the server
 * This updates resources with their companyName from IndexedDB
 * Uses the dedicated /recover endpoint that only updates specified fields
 */
export async function pushRecoveredDataToServer(projectId: string): Promise<{
  success: boolean;
  updatedCount: number;
  errors: string[];
}> {
  const recoverable = await getRecoverableResourceData(projectId);
  if (!recoverable || recoverable.resources.length === 0) {
    return { success: true, updatedCount: 0, errors: [] };
  }

  const errors: string[] = [];
  let updatedCount = 0;

  try {
    // Use the dedicated recovery endpoint that only updates specified fields
    const response = await fetch(`/api/gantt-tool/projects/${projectId}/recover`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resources: recoverable.resources.map(r => ({
          id: r.id,
          companyName: r.companyName,
          managerResourceId: r.managerResourceId || null,
        })),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      updatedCount = result.resourcesUpdated || 0;
      if (result.errors && result.errors.length > 0) {
        errors.push(...result.errors);
      }
      console.log(`[Recovery] Successfully pushed ${updatedCount} resources to server`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      errors.push(`Server error: ${errorData.error || response.statusText}`);
    }
  } catch (error) {
    errors.push(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return {
    success: errors.length === 0,
    updatedCount,
    errors,
  };
}

/**
 * Browser console helper - prints recovery report
 * Call this from browser console: window.__recoveryReport()
 */
export function installConsoleHelpers(): void {
  if (typeof window !== "undefined") {
    (window as any).__recoveryReport = async () => {
      console.log("[Recovery] Generating recovery report...");
      const reports = await generateRecoveryReport();

      console.log("\n=== IndexedDB Recovery Report ===\n");

      if (reports.length === 0) {
        console.log("No local data found in IndexedDB.");
        return;
      }

      for (const report of reports) {
        console.log(`Project: ${report.projectName} (${report.projectId})`);
        console.log(`  Local updated: ${report.localUpdatedAt || "N/A"}`);
        console.log(`  Needs sync: ${report.needsSync ? "YES" : "No"}`);
        console.log(`  Resources with companyName: ${report.resourcesWithCompanyName.length}`);

        if (report.resourcesWithCompanyName.length > 0) {
          console.log("    Company assignments:");
          report.resourcesWithCompanyName.forEach(r => {
            console.log(`      - ${r.resourceName}: "${r.companyName}"`);
          });
        }

        console.log(`  Company logos: ${report.orgChartData.logoCount}`);
        if (report.orgChartData.logoCount > 0) {
          console.log(`    Companies: ${report.orgChartData.companyNames.join(", ")}`);
        }
        console.log("");
      }

      console.log("To recover data for a project, run:");
      console.log("  window.__recoverProject('PROJECT_ID')");

      return reports;
    };

    (window as any).__recoverProject = async (projectId: string) => {
      console.log(`[Recovery] Attempting to recover data for project: ${projectId}`);
      const result = await pushRecoveredDataToServer(projectId);

      if (result.success) {
        console.log(`[Recovery] SUCCESS: Updated ${result.updatedCount} resources`);
        console.log("[Recovery] Please refresh the page to see the recovered data.");
      } else {
        console.error("[Recovery] FAILED:", result.errors);
      }

      return result;
    };

    (window as any).__recoverAllProjects = async () => {
      console.log("[Recovery] Attempting to recover all projects...");
      const reports = await generateRecoveryReport();
      const results: Array<{ projectId: string; projectName: string; result: any }> = [];

      for (const report of reports) {
        if (report.resourcesWithCompanyName.length > 0) {
          console.log(`[Recovery] Processing: ${report.projectName}`);
          const result = await pushRecoveredDataToServer(report.projectId);
          results.push({
            projectId: report.projectId,
            projectName: report.projectName,
            result,
          });
        }
      }

      console.log("\n=== Recovery Results ===");
      for (const r of results) {
        const status = r.result.success ? "SUCCESS" : "FAILED";
        console.log(`${r.projectName}: ${status} (${r.result.updatedCount} resources)`);
      }

      return results;
    };

    console.log("[Recovery] Console helpers installed. Available commands:");
    console.log("  window.__recoveryReport() - Show what data is in IndexedDB");
    console.log("  window.__recoverProject('ID') - Push recovered data to server");
    console.log("  window.__recoverAllProjects() - Recover all projects");
  }
}
