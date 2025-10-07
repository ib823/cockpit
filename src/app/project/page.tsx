/**
 * Project Route - /project
 *
 * Main entry point for the enhanced 4-mode workflow
 * Uses ProjectShell to orchestrate: Capture → Decide → Plan → Present
 */

import { ProjectShell } from "@/components/project-v2/ProjectShell";

// Disable static generation for this page since it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function ProjectPage() {
  return <ProjectShell />;
}