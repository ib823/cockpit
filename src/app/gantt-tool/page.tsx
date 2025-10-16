/**
 * Gantt Tool - Main Page
 *
 * Standalone route for creating professional timeline visualizations.
 * No authentication required - fully client-side with localStorage persistence.
 */

import { GanttToolShell } from '@/components/gantt-tool/GanttToolShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gantt Chart Tool | Project Timeline Visualizer',
  description: 'Create professional project timelines with phases, tasks, milestones, and holidays. Export to PNG, PDF, or Excel.',
};

export default function GanttToolPage() {
  return <GanttToolShell />;
}
