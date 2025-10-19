/**
 * Gantt Tool - Main Page
 *
 * Standalone route for creating professional timeline visualizations.
 * No authentication required - fully client-side with localStorage persistence.
 */

'use client';

import { GanttToolShell } from '@/components/gantt-tool/GanttToolShell';
import { App as AntApp } from 'antd';

export default function GanttToolPage() {
  return (
    <AntApp>
      <GanttToolShell />
    </AntApp>
  );
}
