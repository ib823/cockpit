'use client';

import { generateDiagramFromChips } from '@/lib/bridge/chips-to-diagram';
import { useEADiagramStore } from '@/stores/ea-diagram-store';
import { usePresalesStore } from '@/stores/presales-store';
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  NodeTypes,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HelpOverlay } from './HelpOverlay';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { ModuleCatalog } from './ModuleCatalog';
import { ModuleDetailsPanel } from './ModuleDetailsPanel';
import { ModuleNode } from './ModuleNode';

// Layer definitions (matching the visual style from the image)
const LAYERS = [
  { 
    id: 'business', 
    name: 'Business Layer', 
    y: 0, 
    height: 250, 
    color: 'rgba(239, 246, 255, 0.6)', // Light blue
    borderColor: '#dbeafe'
  },
  { 
    id: 'integration', 
    name: 'Integration Layer', 
    y: 300, 
    height: 180, 
    color: 'rgba(240, 253, 244, 0.6)', // Light green
    borderColor: '#dcfce7'
  },
  { 
    id: 'data', 
    name: 'Data Layer', 
    y: 530, 
    height: 180, 
    color: 'rgba(254, 243, 199, 0.6)', // Light yellow
    borderColor: '#fef3c7'
  },
  { 
    id: 'infrastructure', 
    name: 'Infrastructure Layer', 
    y: 760, 
    height: 180, 
    color: 'rgba(254, 242, 242, 0.6)', // Light red
    borderColor: '#fee2e2'
  },
];

const nodeTypes: NodeTypes = {
  module: ModuleNode,
};

// Helper: Determine layer based on category
function getLayerForCategory(category: string): string {
  const map: Record<string, string> = {
    Finance: 'business',
    HCM: 'business',
    SCM: 'business',
    CX: 'business',
    Analytics: 'business',
    Procurement: 'business',
    Industry: 'business',
    Technical: 'infrastructure',
    Compliance: 'infrastructure',
  };
  return map[category] || 'infrastructure';
}

export function EACanvas() {
  const { 
    nodes: storedNodes, 
    edges: storedEdges,
    totalEffort,
    totalCost,
    setNodes: setStoredNodes,
    setEdges: setStoredEdges,
  } = useEADiagramStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(storedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(storedEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Sync to store when nodes/edges change (debounced)
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      const timeoutId = setTimeout(() => {
        const currentNodes = changes.reduce(
          (acc: Node[], change: any) => {
            if (change.type === 'remove') {
              return acc.filter((n) => n.id !== change.id);
            }
            return acc;
          },
          nodes
        );
        setStoredNodes(currentNodes);
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [onNodesChange, nodes, setStoredNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      const timeoutId = setTimeout(() => {
        setStoredEdges(edges);
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [onEdgesChange, edges, setStoredEdges]
  );

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Handle drop from catalog
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const moduleData = event.dataTransfer.getData('application/reactflow');
      if (!moduleData) return;

      const module = JSON.parse(moduleData);
      
      // Get layer for this module
      const layerId = getLayerForCategory(module.category);
      const layer = LAYERS.find((l) => l.id === layerId)!;

      // Calculate position (respect layer boundaries)
      const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 100,
        y: layer.y + 60, // Position within layer
      };

      const newNode: Node = {
        id: `${module.id}-${Date.now()}`,
        type: 'module',
        position,
        data: {
          ...module,
          status: 'in-scope',
        },
      };

      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        
        // Auto-create dependency edges
        const newEdgesToAdd: Edge[] = [];
        
        // Check if new node depends on existing nodes
        if (module.dependencies && Array.isArray(module.dependencies)) {
          module.dependencies.forEach((depId: string) => {
            const depNode = updatedNodes.find((n) => n.data.id === depId);
            if (depNode) {
              const edgeId = `e-${newNode.id}-${depNode.id}`;
              newEdgesToAdd.push({
                id: edgeId,
                source: newNode.id,
                target: depNode.id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#3b82f6',
                },
              });
            }
          });
        }

        // Check if existing nodes depend on new node
        updatedNodes.forEach((existingNode) => {
          if (existingNode.id === newNode.id) return;
          
          const deps = existingNode.data.dependencies || [];
          if (deps.includes(module.id)) {
            const edgeId = `e-${existingNode.id}-${newNode.id}`;
            
            // Avoid duplicates
            if (!newEdgesToAdd.some(e => e.id === edgeId)) {
              newEdgesToAdd.push({
                id: edgeId,
                source: existingNode.id,
                target: newNode.id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#3b82f6',
                },
              });
            }
          }
        });

        // Add edges if any
        if (newEdgesToAdd.length > 0) {
          setEdges((eds) => {
            const existingEdgeIds = new Set(eds.map(e => e.id));
            const uniqueNewEdges = newEdgesToAdd.filter(e => !existingEdgeIds.has(e.id));
            return eds.concat(uniqueNewEdges);
          });
        }

        // Update store
        setTimeout(() => setStoredNodes(updatedNodes), 100);

        return updatedNodes;
      });
    },
    [setNodes, setEdges, setStoredNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle generate from chips
  const handleGenerateFromChips = useCallback(() => {
    const { chips } = usePresalesStore.getState();
    
    if (chips.length === 0) {
      alert('No RFP chips found. Please go to Presales page and parse an RFP first.');
      return;
    }

    const { nodes: generatedNodes, edges: generatedEdges } = generateDiagramFromChips(chips);
    
    setNodes(generatedNodes);
    setEdges(generatedEdges);
    setStoredNodes(generatedNodes);
    setStoredEdges(generatedEdges);
  }, [setNodes, setEdges, setStoredNodes, setStoredEdges]);

  // Listen for generate event from header button
  useEffect(() => {
    const handleGenerate = () => {
      handleGenerateFromChips();
    };
    
    window.addEventListener('generate-from-chips', handleGenerate);
    return () => window.removeEventListener('generate-from-chips', handleGenerate);
  }, [handleGenerateFromChips]);

  return (
    <div className="flex h-full">
      <KeyboardShortcuts />
      <HelpOverlay />
      
      <ModuleCatalog />
      
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          {/* Layer backgrounds */}
          {LAYERS.map((layer) => (
            <div
              key={layer.id}
              style={{
                position: 'absolute',
                top: layer.y,
                left: -5000,
                right: -5000,
                height: layer.height,
                backgroundColor: layer.color,
                borderTop: `2px solid ${layer.borderColor}`,
                borderBottom: `1px solid ${layer.borderColor}`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <div className="absolute top-3 left-4 text-sm font-bold text-gray-700 uppercase tracking-wider opacity-70">
                {layer.name}
              </div>
            </div>
          ))}
          
          <Background 
            gap={20} 
            size={1} 
            color="#e5e7eb"
          />
          <Controls 
            className="bg-white shadow-lg rounded-lg border"
          />
          <MiniMap 
            nodeColor={(node) => {
              const status = node.data?.status || 'in-scope';
              const colors = {
                'in-scope': '#3b82f6',
                'future': '#f59e0b',
                'excluded': '#9ca3af',
              };
              return colors[status as keyof typeof colors] || '#3b82f6';
            }}
            className="bg-white shadow-lg rounded-lg border"
            maskColor="rgba(0, 0, 0, 0.05)"
          />
        </ReactFlow>

        {/* Module Details Panel */}
        <ModuleDetailsPanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
        />

        {/* Footer with metrics */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t px-6 py-3 flex justify-between items-center shadow-lg">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Modules:</span>
              <span className="font-semibold text-gray-900">{nodes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Total Effort:</span>
              <span className="font-semibold text-gray-900">{totalEffort} PD</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Estimated Cost:</span>
              <span className="font-semibold text-green-600">
                MYR {totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm('Clear entire diagram? This cannot be undone.')) {
                  useEADiagramStore.getState().clearDiagram();
                  setNodes([]);
                  setEdges([]);
                }
              }}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Clear Diagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}