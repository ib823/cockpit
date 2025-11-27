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
import { useEffect } from "react";

export default function OrganizationChartPage() {
  const router = useRouter();
  const { currentProject } = useGanttToolStoreV2();

  // Debug logging
  useEffect(() => {
    console.log("🔍 OrganizationChartPage mounted");
    console.log("🔍 currentProject:", currentProject);
    console.log("🔍 currentProject exists?", !!currentProject);
  }, [currentProject]);

  // Don't redirect immediately - give store time to hydrate
  // Only redirect after a delay if still no project
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentProject) {
        console.warn("⚠️ No project loaded after 1 second, redirecting to dashboard");
        router.push("/dashboard");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentProject, router]);

  if (!currentProject) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        color: "#86868B",
      }}>
        Loading project...
      </div>
    );
  }

  return (
    <OrgChartHarmonyV2
      onClose={() => router.back()}
      project={currentProject}
    />
  );
}
