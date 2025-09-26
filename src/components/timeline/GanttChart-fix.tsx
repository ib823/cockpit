'use client';

import { useTimelineStore } from '@/stores/timeline-store';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMemo, useRef } from 'react';

const ITEM_TYPE = 'PHASE';

// ... rest of your drag drop code but with this at the top:

export default function GanttChart() {
  // Get phases from store, not props
  const { phases = [], selectedPhaseId, selectPhase } = useTimelineStore();
  
  // Safety check
  if (!phases || phases.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center">
        <p className="text-gray-500">No timeline generated yet. Select packages and click Generate Timeline.</p>
      </div>
    );
  }

  // Rest of the original drag-drop code here...
  // Copy the rest from the .broken file but ensure phases comes from store
}
