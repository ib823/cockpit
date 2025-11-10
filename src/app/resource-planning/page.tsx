import { ResourcePlanningShell } from "@/components/resource-planning";

// Disable static generation due to infinite loop in build
export const dynamic = "force-dynamic";

export default function ResourcePlanningPage() {
  return <ResourcePlanningShell />;
}
