'use client';

import { useEADiagramStore } from '@/stores/ea-diagram-store';
import { ExternalLink, Maximize2, Package2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactFlow, {
    Background,
    MiniMap,
    Node,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useEAContext } from './EAProvider';

function EAContextPanelInner() {
  const { isPanelOpen, closePanel, highlightedModules } = useEAContext();
  const { nodes, edges, totalEffort, totalCost } = useEADiagramStore();
  const router = useRouter();

  if (!isPanelOpen) return null;

  // Apply highlighting to nodes
  const highlightedNodes: Node[] = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      highlighted: highlightedModules.includes(node.data.id),
    },
    style: {
      ...node.style,
      opacity: highlightedModules.length > 0 
        ? (highlightedModules.includes(node.data.id) ? 1 : 0.3)
        : 1,
    },
  }));

  return (
    <div className="fixed top-0 right-0 h-full w-[400px] bg-white border-l shadow-2xl z-30 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Architecture</h3>
          </div>
          <div className="flex gap-1">
            <Link
              href="/ea-diagram"
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Open full view"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </Link>
            <button
              onClick={closePanel}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500">Modules</div>
            <div className="text-lg font-bold text-gray-900">{nodes.length}</div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500">Effort</div>
            <div className="text-lg font-bold text-green-600">{totalEffort} PD</div>
          </div>
          <div className="bg-white rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500">Cost</div>
            <div className="text-lg font-bold text-purple-600">
              {(totalCost / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      </div>

      {/* Mini Diagram */}
      <div className="flex-1 relative bg-gray-50">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={highlightedNodes}
            edges={edges}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            preventScrolling={false}
            className="pointer-events-none"
          >
            <Background gap={12} size={0.5} color="#e5e7eb" />
            <MiniMap
              nodeColor={(node) => {
                if (node.data?.highlighted) return '#3b82f6';
                return '#cbd5e1';
              }}
              className="!bg-white !border"
              maskColor="rgba(0, 0, 0, 0.05)"
            />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No modules yet</p>
              <Link
                href="/ea-diagram"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
              >
                Build Architecture
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Overlay: Click to expand */}
        {nodes.length > 0 && (
          <div
            onClick={() => router.push('/ea-diagram')}
            className="absolute inset-0 bg-transparent hover:bg-blue-500/5 transition-colors cursor-pointer group"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-900">Open Full View</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module List */}
      <div className="border-t bg-white">
        <div className="p-3 border-b">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
            In-Scope Modules
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {nodes.length > 0 ? (
            <div className="divide-y">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    highlightedModules.includes(node.data.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => router.push('/ea-diagram')}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {node.data.name}
                      </div>
                      <div className="text-xs text-gray-500">{node.data.category}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-green-600 font-medium">
                          {node.data.baseEffort} PD
                        </span>
                        <span className="text-xs text-purple-600 font-medium">
                          {node.data.complexity}×
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">
                Drag modules onto the canvas to start building
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t bg-gray-50">
        <Link
          href="/ea-diagram"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Maximize2 className="w-4 h-4" />
          Edit Full Architecture
        </Link>
      </div>
    </div>
  );
}

export function EAContextPanel() {
  return (
    <ReactFlowProvider>
      <EAContextPanelInner />
    </ReactFlowProvider>
  );
}