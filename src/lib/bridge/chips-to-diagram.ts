import { SAP_MODULES } from '@/data/sap-modules-complete';
import { Chip } from '@/types/core';
import { Edge, MarkerType, Node } from 'reactflow';

const LAYERS = {
  business: { y: 0, height: 250 },
  integration: { y: 300, height: 180 },
  data: { y: 530, height: 180 },
  infrastructure: { y: 760, height: 180 },
};

// Map chip values to module IDs
const CHIP_TO_MODULES: Record<string, string[]> = {
  finance: ['Finance_1', 'Finance_2', 'Finance_3'],
  hr: ['HCM_1', 'HCM_2'],
  procurement: ['PROC_1', 'PROC_2'],
  sales: ['CX_1', 'CX_2'],
  inventory: ['SCM_1', 'SCM_2'],
  manufacturing: ['SCM_2', 'SCM_3'],
  analytics: ['Analytics_1', 'Analytics_2'],
};

function getLayerForCategory(category: string): keyof typeof LAYERS {
  const map: Record<string, keyof typeof LAYERS> = {
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

export function generateDiagramFromChips(chips: Chip[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedModules = new Set<string>();

  // Extract module chips
  const moduleChips = chips.filter((c) => c.kind === 'modules');

  moduleChips.forEach((chip) => {
    const moduleKeyword = chip.value.toLowerCase();
    const moduleIds = CHIP_TO_MODULES[moduleKeyword] || [];

    moduleIds.forEach((moduleId, index) => {
      if (addedModules.has(moduleId)) return;

      const module = SAP_MODULES[moduleId as keyof typeof SAP_MODULES];
      if (!module) return;

      const layerId = getLayerForCategory(module.category);
      const layer = LAYERS[layerId];

      // Auto-layout: distribute horizontally within layer
      const xPosition = 100 + nodes.length * 250;
      const yPosition = layer.y + 60;

      const node: Node = {
        id: `${moduleId}-${Date.now()}-${index}`,
        type: 'module',
        position: { x: xPosition, y: yPosition },
        data: {
          ...module,
          status: 'in-scope',
        },
      };

      nodes.push(node);
      addedModules.add(moduleId);
    });
  });

  // Always add Technical modules (mandatory)
  ['Technical_1', 'Technical_2'].forEach((techId, index) => {
    if (addedModules.has(techId)) return;

    const module = SAP_MODULES[techId as keyof typeof SAP_MODULES];
    if (!module) return;

    const node: Node = {
      id: `${techId}-${Date.now()}-${index}`,
      type: 'module',
      position: { x: 100 + nodes.length * 250, y: LAYERS.infrastructure.y + 60 },
      data: {
        ...module,
        status: 'in-scope',
      },
    };

    nodes.push(node);
    addedModules.add(techId);
  });

  // Create dependency edges
  nodes.forEach((node) => {
    const deps = node.data.dependencies || [];
    deps.forEach((depId: string) => {
      const targetNode = nodes.find((n) => n.data.id === depId);
      if (targetNode) {
        edges.push({
          id: `e-${node.id}-${targetNode.id}`,
          source: node.id,
          target: targetNode.id,
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
  });

  return { nodes, edges };
}