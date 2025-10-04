"use client";

import { ProjectShell } from "@/components/project-v2/ProjectShell";

/**
 * New Project Page - Steve Jobs-level UX Transformation
 *
 * Features:
 * - Mode-specific layouts (not one-size-fits-all)
 * - Smooth animations and transitions
 * - Beautiful empty states
 * - Keyboard navigation
 * - Presentation mode
 *
 * Routes:
 * /project - Automatically opens in last used mode (or 'capture')
 *
 * Keyboard shortcuts:
 * - Cmd/Ctrl + 1/2/3/4: Switch modes
 * - ESC: Exit present mode
 * - Arrow keys: Navigate slides in present mode
 */
export default function ProjectPage() {
  return <ProjectShell />;
}
