import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from 'reactflow';

interface EADiagramState {
  // Diagram data
  nodes: Node[];
  edges: Edge[];
  
  // Metrics
  totalEffort: number;
  totalCost: number;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<Node['data']>) => void;
  clearDiagram: () => void;
  calculateMetrics: () => void;
}

export const useEADiagramStore = create<EADiagramState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      totalEffort: 0,
      totalCost: 0,

      setNodes: (nodes) => {
        set({ nodes });
        get().calculateMetrics();
      },

      setEdges: (edges) => {
        set({ edges });
      },

      addNode: (node) => {
        set((state) => ({ nodes: [...state.nodes, node] }));
        get().calculateMetrics();
      },

      removeNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        }));
        get().calculateMetrics();
      },

      updateNode: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          ),
        }));
        get().calculateMetrics();
      },

      clearDiagram: () => {
        set({ nodes: [], edges: [], totalEffort: 0, totalCost: 0 });
      },

      calculateMetrics: () => {
        const { nodes } = get();
        const effort = nodes.reduce(
          (sum, n) => sum + (n.data.baseEffort || 0),
          0
        );
        // Assume MYR 3,500 per PD (blended rate)
        const cost = effort * 3500;
        set({ totalEffort: effort, totalCost: cost });
      },
    }),
    {
      name: 'ea-diagram-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);