/**
 * Organization Chart Page
 *
 * Accessed from Gantt Tool toolbar
 * Uses current project from store
 */

"use client";

import { useRouter } from "next/navigation";
import { OrgChartHarmonyV2 } from "@/components/gantt-tool/OrgChartHarmonyV2";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { logger } from "@/lib/logger";
import { useEffect } from "react";
import { AuthShell, AuthStatus } from "@/components/ds/AuthShell";

export default function OrganizationChartPage() {
  const router = useRouter();
  const { currentProject } = useGanttToolStoreV2();

  // Project state is monitored via currentProject dependency below

  // Don't redirect immediately - give store time to hydrate
  // Only redirect after a delay if still no project
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentProject) {
        logger.warn("No project loaded after 1 second, redirecting to dashboard");
        router.push("/dashboard");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentProject, router]);

  if (!currentProject) {
    // The store may still be hydrating from IndexedDB, so this is a wait
    // rather than an error. It is a live region: without one, a screen-reader
    // user gets silence and then, a second later, a different page.
    return (
      <AuthShell title="Organization chart">
        <AuthStatus message="Loading project…" />
      </AuthShell>
    );
  }

  return (
    <OrgChartHarmonyV2
      onClose={() => router.back()}
      project={currentProject}
    />
  );
}
