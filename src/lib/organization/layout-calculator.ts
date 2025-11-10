/**
 * Organization Chart Layout Calculator
 *
 * Uses Dagre graph layout algorithm to automatically position org chart nodes.
 * Converts resource hierarchy into ReactFlow nodes and edges.
 */

import dagre from "dagre";
import type { Node, Edge } from "reactflow";
import type {
  Resource,
  ResourceCategory,
  ResourceDesignation,
  GanttProject,
} from "@/types/gantt-tool";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";

export interface OrgChartNode extends Node {
  data: {
    resource: Resource;
    label: string;
    category: ResourceCategory;
    designation: ResourceDesignation;
    email?: string;
    department?: string;
    location?: string;
    projectRole?: string;
    directReportsCount: number;
  };
}

export type OrgChartEdge = Edge & {
  data: {
    fromResourceId: string;
    toResourceId: string;
    type?: "solid" | "dotted"; // For primary vs secondary reporting
  };
};

export interface OrgChartLayout {
  nodes: OrgChartNode[];
  edges: OrgChartEdge[];
  rootNodes: OrgChartNode[]; // Resources with no manager (top of hierarchy)
}

export type LayoutAlgorithm = "TB" | "LR" | "compact" | "radial";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 140;
const RANK_SEPARATION = 180; // Vertical spacing between levels
const NODE_SEPARATION = 60; // Horizontal spacing between nodes

/**
 * Calculate org chart layout using Dagre
 */
export function calculateOrgChartLayout(
  resources: Resource[],
  algorithm: LayoutAlgorithm = "TB"
): OrgChartLayout {
  if (algorithm === "radial") {
    return calculateRadialLayout(resources);
  }
  if (algorithm === "compact") {
    return calculateCompactLayout(resources);
  }

  return calculateDagreLayout(resources, algorithm);
}

/**
 * Calculate layout using Dagre (TB or LR)
 */
function calculateDagreLayout(resources: Resource[], direction: "TB" | "LR"): OrgChartLayout {
  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure graph layout
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: direction === "LR" ? 300 : RANK_SEPARATION,
    nodesep: direction === "LR" ? 40 : NODE_SEPARATION,
    edgesep: 50,
    marginx: 50,
    marginy: 50,
  });

  // Count direct reports for each resource
  const directReportsCounts = new Map<string, number>();
  resources.forEach((resource) => {
    if (resource.managerResourceId) {
      const currentCount = directReportsCounts.get(resource.managerResourceId) || 0;
      directReportsCounts.set(resource.managerResourceId, currentCount + 1);
    }
  });

  // Add nodes to the graph
  resources.forEach((resource) => {
    dagreGraph.setNode(resource.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // Add edges (manager -> direct report relationships)
  const edges: OrgChartEdge[] = [];
  resources.forEach((resource) => {
    if (resource.managerResourceId) {
      dagreGraph.setEdge(resource.managerResourceId, resource.id);

      edges.push({
        id: `edge-${resource.managerResourceId}-${resource.id}`,
        source: resource.managerResourceId,
        target: resource.id,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
        data: {
          fromResourceId: resource.managerResourceId,
          toResourceId: resource.id,
        },
      });
    }
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Convert to ReactFlow nodes with calculated positions
  const nodes: OrgChartNode[] = resources.map((resource) => {
    const nodeWithPosition = dagreGraph.node(resource.id);
    const categoryInfo = RESOURCE_CATEGORIES[resource.category];

    return {
      id: resource.id,
      type: "orgChartNode", // Custom node type
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: {
        resource,
        label: resource.name,
        category: resource.category,
        designation: resource.designation,
        email: resource.email,
        department: resource.department,
        location: resource.location,
        projectRole: resource.projectRole,
        directReportsCount: directReportsCounts.get(resource.id) || 0,
      },
      draggable: true,
    };
  });

  // Identify root nodes (no manager)
  const rootNodes = nodes.filter((node) => !node.data.resource.managerResourceId);

  return {
    nodes,
    edges,
    rootNodes,
  };
}

/**
 * Get all ancestors (managers up the chain) for a resource
 */
export function getAncestors(resourceId: string, resources: Resource[]): Resource[] {
  const ancestors: Resource[] = [];
  const resource = resources.find((r) => r.id === resourceId);

  if (!resource) return ancestors;

  let currentManagerId = resource.managerResourceId;
  const visited = new Set<string>();

  while (currentManagerId) {
    // Prevent infinite loops
    if (visited.has(currentManagerId)) break;
    visited.add(currentManagerId);

    const manager = resources.find((r) => r.id === currentManagerId);
    if (manager) {
      ancestors.push(manager);
      currentManagerId = manager.managerResourceId;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Get all descendants (direct and indirect reports) for a resource
 */
export function getDescendants(managerId: string, resources: Resource[]): Resource[] {
  const descendants: Resource[] = [];
  const directReports = resources.filter((r) => r.managerResourceId === managerId);

  directReports.forEach((report) => {
    descendants.push(report);
    // Recursively get indirect reports
    const indirectReports = getDescendants(report.id, resources);
    descendants.push(...indirectReports);
  });

  return descendants;
}

/**
 * Get org chart statistics
 */
export function getOrgChartStats(resources: Resource[]): {
  totalResources: number;
  topLevelResources: number;
  maxDepth: number;
  avgDirectReports: number;
  categoryCounts: Record<ResourceCategory, number>;
  designationCounts: Record<ResourceDesignation, number>;
} {
  const topLevelResources = resources.filter((r) => !r.managerResourceId);

  // Calculate max depth
  let maxDepth = 0;
  resources.forEach((resource) => {
    const depth = getAncestors(resource.id, resources).length;
    if (depth > maxDepth) maxDepth = depth;
  });

  // Calculate average direct reports
  const directReportsCounts = new Map<string, number>();
  resources.forEach((resource) => {
    if (resource.managerResourceId) {
      const currentCount = directReportsCounts.get(resource.managerResourceId) || 0;
      directReportsCounts.set(resource.managerResourceId, currentCount + 1);
    }
  });

  const managersWithReports = Array.from(directReportsCounts.values());
  const avgDirectReports =
    managersWithReports.length > 0
      ? managersWithReports.reduce((sum, count) => sum + count, 0) / managersWithReports.length
      : 0;

  // Count by category
  const categoryCounts = {} as Record<ResourceCategory, number>;
  resources.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  // Count by designation
  const designationCounts = {} as Record<ResourceDesignation, number>;
  resources.forEach((r) => {
    designationCounts[r.designation] = (designationCounts[r.designation] || 0) + 1;
  });

  return {
    totalResources: resources.length,
    topLevelResources: topLevelResources.length,
    maxDepth: maxDepth + 1, // +1 because depth 0 = level 1
    avgDirectReports: Math.round(avgDirectReports * 10) / 10,
    categoryCounts,
    designationCounts,
  };
}

/**
 * Validate org chart structure
 */
export function validateOrgChart(resources: Resource[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for circular references
  resources.forEach((resource) => {
    if (resource.managerResourceId) {
      const ancestors = getAncestors(resource.id, resources);
      if (ancestors.some((a) => a.id === resource.id)) {
        errors.push(`Circular reporting detected for resource: ${resource.name}`);
      }
    }
  });

  // Check for invalid manager references
  resources.forEach((resource) => {
    if (resource.managerResourceId) {
      const managerExists = resources.some((r) => r.id === resource.managerResourceId);
      if (!managerExists) {
        errors.push(
          `Resource "${resource.name}" has invalid manager reference: ${resource.managerResourceId}`
        );
      }
    }
  });

  // Warn about resources with no manager
  const orphanCount = resources.filter((r) => !r.managerResourceId).length;
  if (orphanCount > 5) {
    warnings.push(
      `${orphanCount} resources have no manager assigned. Consider organizing the hierarchy.`
    );
  }

  // Warn about very deep hierarchies
  const stats = getOrgChartStats(resources);
  if (stats.maxDepth > 6) {
    warnings.push(
      `Organization hierarchy is ${stats.maxDepth} levels deep. Consider flattening for better communication.`
    );
  }

  // Warn about span of control issues
  if (stats.avgDirectReports > 10) {
    warnings.push(
      `Average span of control is ${stats.avgDirectReports}. Some managers may be overloaded.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate Work Allocation Layout
 *
 * Jobs/Ive: "Focus on what matters most - showing who's working on what"
 *
 * Groups resources by their phase assignments for a work-centric view
 */
export function calculateWorkAllocationLayout(project: GanttProject): OrgChartLayout {
  const NODE_WIDTH_COMPACT = 240;
  const NODE_HEIGHT_COMPACT = 120;
  const PHASE_GROUP_SPACING = 400;
  const NODE_SPACING = 280;
  const VERTICAL_SPACING = 160;

  const nodes: OrgChartNode[] = [];
  const edges: OrgChartEdge[] = [];

  // Group resources by their primary phase assignment
  const resourcesByPhase = new Map<string, Resource[]>();
  const unassignedResources: Resource[] = [];

  project.resources.forEach((resource) => {
    let assigned = false;

    // Check phase-level assignments first (PM resources)
    for (const phase of project.phases) {
      if (phase.phaseResourceAssignments?.some((a) => a.resourceId === resource.id)) {
        if (!resourcesByPhase.has(phase.id)) {
          resourcesByPhase.set(phase.id, []);
        }
        resourcesByPhase.get(phase.id)!.push(resource);
        assigned = true;
        break; // Assign to first phase found
      }
    }

    // If not assigned to a phase, check task assignments
    if (!assigned) {
      const tasksByPhase = new Map<string, number>();
      project.phases.forEach((phase) => {
        const taskCount = phase.tasks.filter((task) =>
          task.resourceAssignments?.some((a) => a.resourceId === resource.id)
        ).length;
        if (taskCount > 0) {
          tasksByPhase.set(phase.id, taskCount);
        }
      });

      if (tasksByPhase.size > 0) {
        // Assign to phase with most tasks
        const [primaryPhaseId] = Array.from(tasksByPhase.entries()).sort((a, b) => b[1] - a[1])[0];
        if (!resourcesByPhase.has(primaryPhaseId)) {
          resourcesByPhase.set(primaryPhaseId, []);
        }
        resourcesByPhase.get(primaryPhaseId)!.push(resource);
        assigned = true;
      }
    }

    if (!assigned) {
      unassignedResources.push(resource);
    }
  });

  // Count direct reports for each resource
  const directReportsCounts = new Map<string, number>();
  project.resources.forEach((resource) => {
    if (resource.managerResourceId) {
      const currentCount = directReportsCounts.get(resource.managerResourceId) || 0;
      directReportsCounts.set(resource.managerResourceId, currentCount + 1);
    }
  });

  let currentX = 50;

  // Layout each phase group
  project.phases.forEach((phase) => {
    const phaseResources = resourcesByPhase.get(phase.id) || [];
    if (phaseResources.length === 0) return;

    let yOffset = 100;

    phaseResources.forEach((resource, index) => {
      nodes.push({
        id: resource.id,
        type: "orgChartNode",
        position: {
          x: currentX,
          y: yOffset,
        },
        data: {
          resource,
          label: resource.name,
          category: resource.category,
          designation: resource.designation,
          email: resource.email,
          department: resource.department,
          location: resource.location,
          projectRole: resource.projectRole,
          directReportsCount: directReportsCounts.get(resource.id) || 0,
        },
        draggable: false,
      });

      yOffset += VERTICAL_SPACING;
    });

    currentX += PHASE_GROUP_SPACING;
  });

  // Add unassigned resources at the end
  if (unassignedResources.length > 0) {
    let yOffset = 100;
    unassignedResources.forEach((resource) => {
      nodes.push({
        id: resource.id,
        type: "orgChartNode",
        position: {
          x: currentX,
          y: yOffset,
        },
        data: {
          resource,
          label: resource.name,
          category: resource.category,
          designation: resource.designation,
          email: resource.email,
          department: resource.department,
          location: resource.location,
          projectRole: resource.projectRole,
          directReportsCount: directReportsCounts.get(resource.id) || 0,
        },
        draggable: false,
      });

      yOffset += VERTICAL_SPACING;
    });
  }

  return {
    nodes,
    edges, // No hierarchy edges in work allocation view
    rootNodes: nodes, // All nodes are "root" in this view
  };
}

/**
 * Calculate Radial Layout
 * Places root nodes in center and arranges reports in circles around them
 */
function calculateRadialLayout(resources: Resource[]): OrgChartLayout {
  const directReportsCounts = new Map<string, number>();
  resources.forEach((resource) => {
    if (resource.managerResourceId) {
      const currentCount = directReportsCounts.get(resource.managerResourceId) || 0;
      directReportsCounts.set(resource.managerResourceId, currentCount + 1);
    }
  });

  // Find root nodes (no manager)
  const rootResources = resources.filter((r) => !r.managerResourceId);

  // Build hierarchy levels
  const levels = new Map<number, Resource[]>();
  const resourceLevels = new Map<string, number>();

  function assignLevel(resource: Resource, level: number) {
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(resource);
    resourceLevels.set(resource.id, level);

    // Assign reports to next level
    const reports = resources.filter((r) => r.managerResourceId === resource.id);
    reports.forEach((report) => assignLevel(report, level + 1));
  }

  rootResources.forEach((root) => assignLevel(root, 0));

  const nodes: OrgChartNode[] = [];
  const edges: OrgChartEdge[] = [];

  const centerX = 0;
  const centerY = 0;
  const radiusIncrement = 400; // Distance between levels

  // Layout each level in a circle
  Array.from(levels.entries()).forEach(([level, levelResources]) => {
    const radius = level === 0 ? 0 : level * radiusIncrement;
    const angleStep = levelResources.length > 1 ? (2 * Math.PI) / levelResources.length : 0;

    levelResources.forEach((resource, index) => {
      const angle = angleStep * index - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      nodes.push({
        id: resource.id,
        type: "orgChartNode",
        position: { x, y },
        data: {
          resource,
          label: resource.name,
          category: resource.category,
          designation: resource.designation,
          email: resource.email,
          department: resource.department,
          location: resource.location,
          projectRole: resource.projectRole,
          directReportsCount: directReportsCounts.get(resource.id) || 0,
        },
        draggable: true,
      });

      // Add edge from manager
      if (resource.managerResourceId) {
        edges.push({
          id: `edge-${resource.managerResourceId}-${resource.id}`,
          source: resource.managerResourceId,
          target: resource.id,
          type: "smoothstep",
          animated: false,
          style: {
            stroke: "#94a3b8",
            strokeWidth: 2,
          },
          data: {
            fromResourceId: resource.managerResourceId,
            toResourceId: resource.id,
          },
        });
      }
    });
  });

  const rootNodes = nodes.filter((node) => !node.data.resource.managerResourceId);

  return {
    nodes,
    edges,
    rootNodes,
  };
}

/**
 * Calculate Compact Layout
 * Minimizes whitespace using tighter spacing
 */
function calculateCompactLayout(resources: Resource[]): OrgChartLayout {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure for compact layout with tighter spacing
  dagreGraph.setGraph({
    rankdir: "TB",
    ranksep: 100, // Tighter vertical spacing
    nodesep: 30, // Tighter horizontal spacing
    edgesep: 20,
    marginx: 30,
    marginy: 30,
  });

  const directReportsCounts = new Map<string, number>();
  resources.forEach((resource) => {
    if (resource.managerResourceId) {
      const currentCount = directReportsCounts.get(resource.managerResourceId) || 0;
      directReportsCounts.set(resource.managerResourceId, currentCount + 1);
    }
  });

  // Add nodes with smaller dimensions
  const compactWidth = 220;
  const compactHeight = 110;

  resources.forEach((resource) => {
    dagreGraph.setNode(resource.id, {
      width: compactWidth,
      height: compactHeight,
    });
  });

  const edges: OrgChartEdge[] = [];
  resources.forEach((resource) => {
    if (resource.managerResourceId) {
      dagreGraph.setEdge(resource.managerResourceId, resource.id);

      edges.push({
        id: `edge-${resource.managerResourceId}-${resource.id}`,
        source: resource.managerResourceId,
        target: resource.id,
        type: "step",
        animated: false,
        style: {
          stroke: "#94a3b8",
          strokeWidth: 1.5,
        },
        data: {
          fromResourceId: resource.managerResourceId,
          toResourceId: resource.id,
        },
      });
    }
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  const nodes: OrgChartNode[] = resources.map((resource) => {
    const nodeWithPosition = dagreGraph.node(resource.id);

    return {
      id: resource.id,
      type: "orgChartNode",
      position: {
        x: nodeWithPosition.x - compactWidth / 2,
        y: nodeWithPosition.y - compactHeight / 2,
      },
      data: {
        resource,
        label: resource.name,
        category: resource.category,
        designation: resource.designation,
        email: resource.email,
        department: resource.department,
        location: resource.location,
        projectRole: resource.projectRole,
        directReportsCount: directReportsCounts.get(resource.id) || 0,
      },
      draggable: true,
    };
  });

  const rootNodes = nodes.filter((node) => !node.data.resource.managerResourceId);

  return {
    nodes,
    edges,
    rootNodes,
  };
}
