'use client';

import { useEADiagramStore } from '@/stores/ea-diagram-store';
import { useEffect } from 'react';
import { useReactFlow } from 'reactflow';

export function KeyboardShortcuts() {
  const { deleteElements, getNodes, getEdges } = useReactFlow();
  const { clearDiagram } = useEADiagramStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected nodes
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = getNodes().filter((n) => n.selected);
        const selectedEdges = getEdges().filter((e) => e.selected);
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          deleteElements({ nodes: selectedNodes, edges: selectedEdges });
        }
      }

      // Clear all (Cmd/Ctrl + K)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (confirm('Clear entire diagram?')) {
          clearDiagram();
        }
      }

      // Fit view (Cmd/Ctrl + 0)
      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        // Zoom to fit handled by React Flow
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteElements, getNodes, getEdges, clearDiagram]);

  return null;
}