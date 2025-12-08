/**
 * Org Chart Auto-Organize Algorithm
 *
 * Generates a hierarchical org chart layout based on:
 * 1. Category tiers (vertical layers)
 * 2. Designation seniority (vertical ordering within tiers)
 * 3. Same designation/category = same horizontal level
 *
 * Vertical Hierarchy (Category Tiers):
 * - Tier 0: Leadership (top)
 * - Tier 1: Project Management, Quality Assurance (same level)
 * - Tier 2: Functional, Technical, Basis, Security (same level)
 * - Tier 3: Change, Client, Other (bottom)
 *
 * Within each category tier, cards are arranged vertically by designation:
 * - Principal (top)
 * - Director
 * - Senior Manager
 * - Manager
 * - Senior Consultant
 * - Consultant
 * - Analyst
 * - Subcontractor (bottom)
 *
 * Cards with same category AND same designation are placed side by side (same Y level).
 *
 * Group cards: The resource with highest category tier + highest designation
 * drives the group's position in the hierarchy.
 */

import type { Resource, ResourceCategory, ResourceDesignation, ResourceGroup } from "@/types/gantt-tool";

// Category tier - determines vertical position (lower = higher on chart)
// Categories in the same tier are placed at the same base Y level
export const CATEGORY_TIER: Record<ResourceCategory, number> = {
  leadership: 0, // Tier 0: Top leadership
  pm: 1, // Tier 1: PM and QA (same level)
  qa: 1, // Tier 1: PM and QA (same level)
  functional: 2, // Tier 2: Delivery teams (same level)
  technical: 2, // Tier 2: Delivery teams (same level)
  basis: 2, // Tier 2: Delivery teams (same level)
  security: 2, // Tier 2: Delivery teams (same level)
  change: 3, // Tier 3: Support/other
  client: 3, // Tier 3: External/other
  other: 3, // Tier 3: Other
};

// Designation seniority - determines vertical position within category (lower = higher)
export const DESIGNATION_SENIORITY: Record<ResourceDesignation, number> = {
  principal: 0,
  director: 1,
  senior_manager: 2,
  manager: 3,
  senior_consultant: 4,
  consultant: 5,
  analyst: 6,
  subcontractor: 7,
};

// Legacy hierarchy for compatibility
const CATEGORY_HIERARCHY: Record<ResourceCategory, number> = {
  leadership: 1,
  pm: 2,
  change: 3,
  qa: 4,
  functional: 5,
  technical: 6,
  basis: 7,
  security: 8,
  client: 10,
  other: 9,
};

// Categories that report to PM
const PM_SUBORDINATE_CATEGORIES: ResourceCategory[] = ["change"];

// Categories that are delivery teams (need team leads)
const TEAM_CATEGORIES: ResourceCategory[] = ["functional", "technical", "basis", "security", "qa"];

interface OrgAssignment {
  resourceId: string;
  managerId: string | null;
}

/**
 * Detects teams within a category based on department field
 * Returns map of department -> resources
 */
function detectTeams(resources: Resource[], category: ResourceCategory): Map<string, Resource[]> {
  const categoryResources = resources.filter(r => r.category === category);
  const teams = new Map<string, Resource[]>();

  categoryResources.forEach(r => {
    const team = r.department || r.projectRole || "General";
    if (!teams.has(team)) {
      teams.set(team, []);
    }
    teams.get(team)!.push(r);
  });

  return teams;
}

/**
 * Finds the most senior resource within a group
 */
function findMostSenior(resources: Resource[]): Resource | null {
  if (resources.length === 0) return null;

  return resources.reduce((senior, current) => {
    const seniorRank = DESIGNATION_SENIORITY[senior.designation] ?? 99;
    const currentRank = DESIGNATION_SENIORITY[current.designation] ?? 99;
    return currentRank < seniorRank ? current : senior;
  });
}

/**
 * Finds the most senior resource in a category
 */
function findCategoryLead(resources: Resource[], category: ResourceCategory): Resource | null {
  const categoryResources = resources.filter(r => r.category === category);
  return findMostSenior(categoryResources);
}

/**
 * Auto-organize resources into a standard enterprise hierarchy
 *
 * Returns array of { resourceId, managerId } assignments
 */
export function autoOrganizeHierarchy(resources: Resource[]): OrgAssignment[] {
  const assignments: OrgAssignment[] = [];
  const assignedIds = new Set<string>();

  // Step 1: Find Leadership (Steering Committee level)
  const leadershipResources = resources.filter(r => r.category === "leadership");
  const topLeader = findMostSenior(leadershipResources);

  // All leadership resources are roots (steering committee members)
  leadershipResources.forEach(r => {
    assignments.push({ resourceId: r.id, managerId: null });
    assignedIds.add(r.id);
  });

  // If no leadership, find the most senior person overall as root
  if (!topLeader) {
    const overallSenior = findMostSenior(resources);
    if (overallSenior && !assignedIds.has(overallSenior.id)) {
      assignments.push({ resourceId: overallSenior.id, managerId: null });
      assignedIds.add(overallSenior.id);
    }
  }

  // Step 2: Organize PM under top leadership
  const pmResources = resources.filter(r => r.category === "pm");
  const pmLead = findMostSenior(pmResources);

  pmResources.forEach(r => {
    if (!assignedIds.has(r.id)) {
      // PM reports to top leader
      const manager = topLeader?.id || null;
      assignments.push({ resourceId: r.id, managerId: manager });
      assignedIds.add(r.id);
    }
  });

  // Step 3: Change Management under PM Lead
  const changeResources = resources.filter(r => r.category === "change");
  changeResources.forEach(r => {
    if (!assignedIds.has(r.id)) {
      const manager = pmLead?.id || topLeader?.id || null;
      assignments.push({ resourceId: r.id, managerId: manager });
      assignedIds.add(r.id);
    }
  });

  // Step 4: QA under top leadership or PM
  const qaResources = resources.filter(r => r.category === "qa");
  const qaLead = findMostSenior(qaResources);

  qaResources.forEach(r => {
    if (!assignedIds.has(r.id)) {
      // QA Lead reports to top leader, others report to QA Lead
      if (r.id === qaLead?.id) {
        assignments.push({ resourceId: r.id, managerId: topLeader?.id || null });
      } else {
        assignments.push({ resourceId: r.id, managerId: qaLead?.id || topLeader?.id || null });
      }
      assignedIds.add(r.id);
    }
  });

  // Step 5: Organize team-based categories (functional, technical, basis, security)
  const teamCategories: ResourceCategory[] = ["functional", "technical", "basis", "security"];

  teamCategories.forEach(category => {
    const teams = detectTeams(resources, category);
    const categoryLead = findCategoryLead(resources, category);

    // Category lead reports to top leadership
    if (categoryLead && !assignedIds.has(categoryLead.id)) {
      assignments.push({ resourceId: categoryLead.id, managerId: topLeader?.id || null });
      assignedIds.add(categoryLead.id);
    }

    teams.forEach((teamMembers, teamName) => {
      const teamLead = findMostSenior(teamMembers);

      teamMembers.forEach(r => {
        if (!assignedIds.has(r.id)) {
          // Team lead reports to category lead
          if (r.id === teamLead?.id) {
            const manager = categoryLead?.id !== r.id ? categoryLead?.id : topLeader?.id;
            assignments.push({ resourceId: r.id, managerId: manager || null });
          } else {
            // Team members report to team lead
            assignments.push({ resourceId: r.id, managerId: teamLead?.id || categoryLead?.id || null });
          }
          assignedIds.add(r.id);
        }
      });
    });
  });

  // Step 6: Handle 'other' category - report to PM or top leader
  const otherResources = resources.filter(r => r.category === "other");
  otherResources.forEach(r => {
    if (!assignedIds.has(r.id)) {
      assignments.push({ resourceId: r.id, managerId: pmLead?.id || topLeader?.id || null });
      assignedIds.add(r.id);
    }
  });

  // Ensure all resources are assigned
  resources.forEach(r => {
    if (!assignedIds.has(r.id)) {
      assignments.push({ resourceId: r.id, managerId: topLeader?.id || null });
    }
  });

  return assignments;
}

/**
 * Get category groups for visual grouping in org chart
 */
export function getCategoryGroups(resources: Resource[]): Map<ResourceCategory, Resource[]> {
  const groups = new Map<ResourceCategory, Resource[]>();

  resources.forEach(r => {
    if (!groups.has(r.category)) {
      groups.set(r.category, []);
    }
    groups.get(r.category)!.push(r);
  });

  // Sort each group by seniority
  groups.forEach((members, category) => {
    members.sort((a, b) => {
      const aRank = DESIGNATION_SENIORITY[a.designation] ?? 99;
      const bRank = DESIGNATION_SENIORITY[b.designation] ?? 99;
      return aRank - bRank;
    });
  });

  return groups;
}

/**
 * Get hierarchy statistics
 */
export function getHierarchyStats(resources: Resource[]): {
  totalResources: number;
  rootCount: number;
  maxDepth: number;
  categoryBreakdown: Record<ResourceCategory, number>;
} {
  const validIds = new Set(resources.map(r => r.id));
  const roots = resources.filter(r => !r.managerResourceId || !validIds.has(r.managerResourceId));

  // Calculate max depth
  const getDepth = (resourceId: string, visited: Set<string> = new Set()): number => {
    if (visited.has(resourceId)) return 0;
    visited.add(resourceId);

    const children = resources.filter(r => r.managerResourceId === resourceId);
    if (children.length === 0) return 1;

    return 1 + Math.max(...children.map(c => getDepth(c.id, visited)));
  };

  const maxDepth = roots.length > 0 ? Math.max(...roots.map(r => getDepth(r.id))) : 0;

  // Category breakdown
  const categoryBreakdown: Record<ResourceCategory, number> = {
    leadership: 0,
    pm: 0,
    change: 0,
    qa: 0,
    functional: 0,
    technical: 0,
    basis: 0,
    security: 0,
    client: 0,
    other: 0,
  };

  resources.forEach(r => {
    categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1;
  });

  return {
    totalResources: resources.length,
    rootCount: roots.length,
    maxDepth,
    categoryBreakdown,
  };
}

// ============================================================================
// Hierarchical Auto-Arrange Algorithm (Pixel-Perfect)
// ============================================================================

export interface HierarchyPosition {
  resourceId: string;
  x: number;
  y: number;
}

export interface GroupHierarchyPosition {
  groupId: string;
  x: number;
  y: number;
}

interface LayoutConfig {
  cardWidth: number;
  cardHeight: number;
  horizontalGap: number; // Consistent gap between cards horizontally (same row)
  rowGap: number; // Consistent gap between rows vertically
  padding: number; // Canvas edge padding
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  cardWidth: 280,
  cardHeight: 120,
  horizontalGap: 48, // Consistent 48px horizontal gap
  rowGap: 48, // Consistent 48px vertical gap between all rows
  padding: 80,
};

interface HierarchyItem {
  id: string;
  type: "resource" | "group";
  category: ResourceCategory;
  designation: ResourceDesignation;
  name: string;
}

export function getGroupDominantResource(
  group: ResourceGroup,
  resources: Resource[]
): Resource | null {
  const groupMembers = resources.filter(r => group.resourceIds.includes(r.id));
  if (groupMembers.length === 0) return null;

  return groupMembers.reduce((dominant, current) => {
    const dominantTier = CATEGORY_TIER[dominant.category] ?? 99;
    const currentTier = CATEGORY_TIER[current.category] ?? 99;
    if (currentTier < dominantTier) return current;
    if (currentTier > dominantTier) return dominant;

    const dominantSeniority = DESIGNATION_SENIORITY[dominant.designation] ?? 99;
    const currentSeniority = DESIGNATION_SENIORITY[current.designation] ?? 99;
    return currentSeniority < dominantSeniority ? current : dominant;
  });
}

/**
 * Pixel-perfect hierarchical positioning algorithm
 *
 * Layout structure (tree/hierarchy form):
 * - Row grouping by (TIER, DESIGNATION) - NOT by category
 * - Items in the same tier with same designation = same horizontal row
 * - Within a row, items sorted by: category → name (for visual grouping)
 * - All gaps are IDENTICAL for pixel-perfect alignment
 *
 * Example:
 * - Row 0: Leadership Principal
 * - Row 1: Leadership Director
 * - Row 2: PM Manager, QA Manager (same row - both Tier 1, Manager)
 * - Row 3: Functional Senior Consultant, Technical Senior Consultant (same row - both Tier 2)
 */
export function calculateHierarchicalPositions(
  resources: Resource[],
  groups: ResourceGroup[],
  config: Partial<LayoutConfig> = {}
): {
  resourcePositions: HierarchyPosition[];
  groupPositions: GroupHierarchyPosition[];
} {
  const cfg: LayoutConfig = { ...DEFAULT_LAYOUT_CONFIG, ...config };

  // Ensure all config values are integers for pixel-perfect rendering
  const cardWidth = Math.round(cfg.cardWidth);
  const cardHeight = Math.round(cfg.cardHeight);
  const horizontalGap = Math.round(cfg.horizontalGap);
  const rowGap = Math.round(cfg.rowGap);
  const padding = Math.round(cfg.padding);

  // Track grouped resources
  const groupedResourceIds = new Set<string>();
  groups.forEach(g => g.resourceIds.forEach(id => groupedResourceIds.add(id)));

  // Build items list (ungrouped resources + groups)
  const items: HierarchyItem[] = [];

  resources.forEach(r => {
    if (!groupedResourceIds.has(r.id)) {
      items.push({
        id: r.id,
        type: "resource",
        category: r.category,
        designation: r.designation,
        name: r.name,
      });
    }
  });

  groups.forEach(g => {
    const dominant = getGroupDominantResource(g, resources);
    if (dominant) {
      items.push({
        id: g.id,
        type: "group",
        category: dominant.category,
        designation: dominant.designation,
        name: g.name,
      });
    }
  });

  // Group items into rows by (TIER, DESIGNATION) only
  // This ensures items from different categories but same tier+designation are on the same row
  type RowKey = string;
  const rowsMap = new Map<RowKey, HierarchyItem[]>();

  items.forEach(item => {
    const tier = CATEGORY_TIER[item.category] ?? 99;
    const seniority = DESIGNATION_SENIORITY[item.designation] ?? 99;
    // Row key: tier-designation (NOT category)
    const key: RowKey = `${String(tier).padStart(2, "0")}-${String(seniority).padStart(2, "0")}`;

    if (!rowsMap.has(key)) {
      rowsMap.set(key, []);
    }
    rowsMap.get(key)!.push(item);
  });

  // Sort items within each row by: category → name (for visual grouping)
  rowsMap.forEach(rowItems => {
    rowItems.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });
  });

  // Sort row keys (tier first, then designation)
  const sortedRowKeys = Array.from(rowsMap.keys()).sort();

  // Build ordered rows array
  const rows: HierarchyItem[][] = sortedRowKeys.map(key => rowsMap.get(key)!);

  // Calculate max row width for centering
  const rowWidths = rows.map(row =>
    row.length * cardWidth + (row.length - 1) * horizontalGap
  );
  const maxRowWidth = Math.max(...rowWidths, cardWidth);

  // Calculate positions with CONSISTENT gaps
  const positions = new Map<string, { x: number; y: number }>();

  rows.forEach((row, rowIndex) => {
    // Y position: consistent spacing for all rows
    const y = padding + rowIndex * (cardHeight + rowGap);

    // X position: center the row
    const rowWidth = row.length * cardWidth + (row.length - 1) * horizontalGap;
    const offsetX = Math.round((maxRowWidth - rowWidth) / 2);

    row.forEach((item, colIndex) => {
      const x = padding + offsetX + colIndex * (cardWidth + horizontalGap);
      positions.set(item.id, { x, y });
    });
  });

  // Build result arrays
  const resourcePositions: HierarchyPosition[] = [];
  const groupPositions: GroupHierarchyPosition[] = [];

  items.forEach(item => {
    const pos = positions.get(item.id);
    if (!pos) return;

    if (item.type === "resource") {
      resourcePositions.push({ resourceId: item.id, x: pos.x, y: pos.y });
    } else {
      groupPositions.push({ groupId: item.id, x: pos.x, y: pos.y });
    }
  });

  // Position grouped resources below their group card
  groups.forEach(group => {
    const groupPos = positions.get(group.id);
    if (!groupPos) return;

    const members = resources
      .filter(r => group.resourceIds.includes(r.id))
      .sort((a, b) => {
        const tierA = CATEGORY_TIER[a.category] ?? 99;
        const tierB = CATEGORY_TIER[b.category] ?? 99;
        if (tierA !== tierB) return tierA - tierB;
        const senA = DESIGNATION_SENIORITY[a.designation] ?? 99;
        const senB = DESIGNATION_SENIORITY[b.designation] ?? 99;
        return senA - senB;
      });

    members.forEach((member, idx) => {
      resourcePositions.push({
        resourceId: member.id,
        x: groupPos.x,
        y: groupPos.y + (idx + 1) * (cardHeight + rowGap),
      });
    });
  });

  return { resourcePositions, groupPositions };
}
