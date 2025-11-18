/**
 * Organization Chart Spacing Algorithm
 *
 * Based on Reingold-Tilford "Tidier Drawings of Trees" (1981)
 * Enhanced with Apple Human Interface Guidelines compliance
 *
 * Design Philosophy (Steve Jobs/Jony Ive):
 * - Deep simplicity: Mathematically elegant, not patch-worked
 * - Pixel-perfect precision: All values justified from 8pt grid
 * - God is in the details: Every measurement has rationale
 *
 * @version 1.0.0
 * @compliance Apple HIG 2024-2025
 */

// ============================================================================
// CONSTANTS: 8pt Grid System (Apple HIG Compliant)
// ============================================================================

/**
 * Card dimensions following 8pt grid
 *
 * Rationale:
 * - Width 240px (30 × 8pt): Golden ratio ~1.6, fits 2-line titles
 * - Height 96px (12 × 8pt): Minimal for icon + title + metadata
 */
export const CARD_WIDTH = 240;
export const CARD_HEIGHT = 96;

/**
 * Horizontal gap between sibling nodes
 *
 * Rationale: 80px (10 × 8pt)
 * - ~33% of card width for visual balance
 * - Comfortable reading distance between cards
 * - Prevents visual clustering
 */
export const SIBLING_GAP = 80;

/**
 * Vertical gap between tree levels
 *
 * Rationale: 120px (15 × 8pt)
 * - 1.25× card height for clear hierarchy
 * - Sufficient space for connection lines
 * - Emphasizes parent-child relationship
 */
export const LEVEL_GAP = 120;

/**
 * Gap between distinct subtrees (siblings with children)
 *
 * Rationale: 160px (20 × 8pt)
 * - 2× sibling gap for distinct subtree boundaries
 * - Prevents visual confusion between subtrees
 * - Creates clear "families" in the tree
 */
export const SUBTREE_GAP = 160;

/**
 * Canvas margin (breathing room)
 *
 * Rationale: 80px (10 × 8pt)
 * - Follows Apple's generous whitespace principle
 * - Prevents cards from touching edges
 * - Creates focus on content
 */
export const CANVAS_MARGIN = 80;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Minimal tree node structure for layout calculations
 */
export interface LayoutNode {
  id: string;
  children: LayoutNode[];
}

/**
 * Node position in 2D space
 * All coordinates are pixel values, multiples of 8
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Complete layout result
 */
export interface LayoutResult {
  positions: Map<string, NodePosition>;
  bounds: {
    width: number;
    height: number;
  };
}

/**
 * Internal node with layout metadata
 */
interface LayoutTreeNode extends LayoutNode {
  // Relative position within its level
  x: number;
  y: number;
  // Subtree dimensions
  subtreeWidth: number;
  // Tree depth (0 = root)
  depth: number;
  // Layout metadata
  mod: number; // X-offset modifier from Reingold-Tilford
}

// ============================================================================
// CORE ALGORITHM: Subtree Width Calculation
// ============================================================================

/**
 * Calculate the total width required for a subtree
 *
 * Algorithm:
 * 1. Leaf node: Returns CARD_WIDTH (240px)
 * 2. Parent node: Sum of children widths + gaps between them
 * 3. Result: Maximum of (children span, CARD_WIDTH)
 *
 * Time Complexity: O(n) where n = number of nodes in subtree
 * Space Complexity: O(h) where h = height of subtree (recursion stack)
 *
 * @param node - Tree node to calculate width for
 * @returns Total width in pixels (always multiple of 8)
 *
 * @example
 * // Leaf node
 * calculateSubtreeWidth({ id: 'A', children: [] })
 * // Returns: 240
 *
 * @example
 * // Parent with 2 children
 * calculateSubtreeWidth({
 *   id: 'P',
 *   children: [
 *     { id: 'A', children: [] },
 *     { id: 'B', children: [] }
 *   ]
 * })
 * // Returns: 640 (240 + 160 + 240)
 */
export function calculateSubtreeWidth(node: LayoutNode): number {
  // Base case: Leaf node
  if (node.children.length === 0) {
    return CARD_WIDTH;
  }

  // Recursive case: Sum children + gaps
  let totalWidth = 0;

  for (let i = 0; i < node.children.length; i++) {
    const childWidth = calculateSubtreeWidth(node.children[i]);
    totalWidth += childWidth;

    // Add gap between siblings (not after last child)
    if (i < node.children.length - 1) {
      totalWidth += SUBTREE_GAP;
    }
  }

  // Parent must accommodate its full children span
  // But minimum width is one card
  return Math.max(totalWidth, CARD_WIDTH);
}

// ============================================================================
// CORE ALGORITHM: Parent Centering
// ============================================================================

/**
 * Calculate parent X position to center it over its children
 *
 * Algorithm:
 * 1. Find center point of children's horizontal span
 * 2. Position parent card centered on that point
 * 3. Quantize to 8pt grid for pixel-perfect alignment
 *
 * @param childrenStartX - Left edge of first child
 * @param childrenTotalWidth - Total width of all children + gaps
 * @returns Parent X coordinate (multiple of 8)
 *
 * @example
 * centerParentOverChildren(0, 640)
 * // Children span 0-640px, center at 320px
 * // Parent card (240px wide) centered: 320 - 120 = 200px
 * // Returns: 200
 */
export function centerParentOverChildren(
  childrenStartX: number,
  childrenTotalWidth: number
): number {
  // Find center of children's span
  const childrenCenterX = childrenStartX + childrenTotalWidth / 2;

  // Center parent card over that point
  const parentX = childrenCenterX - CARD_WIDTH / 2;

  // Quantize to 8pt grid (optional, for perfect alignment)
  // This ensures no sub-pixel rendering
  return Math.round(parentX / 8) * 8;
}

// ============================================================================
// MAIN LAYOUT ALGORITHM: Reingold-Tilford Enhanced
// ============================================================================

/**
 * Calculate positions for all nodes in tree
 *
 * Implementation of Reingold-Tilford algorithm with Apple enhancements:
 * 1. Optimal horizontal positioning (R-T algorithm)
 * 2. 8pt grid quantization (Apple HIG)
 * 3. Generous breathing room (Apple design philosophy)
 * 4. Clear hierarchy through spacing (visual design)
 *
 * @param roots - Array of root nodes (supports multiple trees)
 * @returns Layout result with positions and bounds
 *
 * @example
 * const layout = calculateTreeLayout([
 *   {
 *     id: 'CEO',
 *     children: [
 *       { id: 'CTO', children: [] },
 *       { id: 'CFO', children: [] }
 *     ]
 *   }
 * ]);
 * // Returns positions map and canvas bounds
 */
export function calculateTreeLayout(roots: LayoutNode[]): LayoutResult {
  const positions = new Map<string, NodePosition>();

  if (roots.length === 0) {
    return {
      positions,
      bounds: { width: CANVAS_MARGIN * 2, height: CANVAS_MARGIN * 2 }
    };
  }

  // Current X position for placing next tree
  let currentX = CANVAS_MARGIN;
  let maxDepth = 0;

  // Process each root tree
  for (let rootIndex = 0; rootIndex < roots.length; rootIndex++) {
    const root = roots[rootIndex];

    // Add gap between multiple root trees
    if (rootIndex > 0) {
      currentX += SUBTREE_GAP * 2; // Extra space between separate trees
    }

    // Calculate positions for this tree
    const treePositions = calculateTreePositions(root, currentX, CANVAS_MARGIN);

    // Merge into main positions map
    for (const [id, pos] of treePositions.positions.entries()) {
      positions.set(id, pos);
    }

    // Update for next tree
    currentX += treePositions.bounds.width;
    maxDepth = Math.max(maxDepth, treePositions.bounds.maxDepth);
  }

  // Calculate total canvas dimensions
  const totalWidth = currentX + CANVAS_MARGIN;
  const totalHeight = CANVAS_MARGIN + (maxDepth + 1) * (CARD_HEIGHT + LEVEL_GAP);

  return {
    positions,
    bounds: {
      width: totalWidth,
      height: totalHeight
    }
  };
}

/**
 * Calculate positions for a single tree (internal helper)
 */
function calculateTreePositions(
  root: LayoutNode,
  offsetX: number,
  offsetY: number
): {
  positions: Map<string, NodePosition>;
  bounds: { width: number; maxDepth: number };
} {
  const positions = new Map<string, NodePosition>();

  // Calculate subtree widths for all nodes
  const subtreeWidths = new Map<string, number>();
  function calculateWidths(node: LayoutNode): number {
    const width = calculateSubtreeWidth(node);
    subtreeWidths.set(node.id, width);
    // Recursively populate map for all descendants
    for (const child of node.children) {
      calculateWidths(child);
    }
    return width;
  }
  calculateWidths(root);

  // Position nodes recursively
  let maxDepth = 0;

  function positionNode(
    node: LayoutNode,
    subtreeStartX: number,
    y: number,
    depth: number
  ): void {
    maxDepth = Math.max(maxDepth, depth);

    if (node.children.length === 0) {
      // Leaf node: position directly
      positions.set(node.id, { x: subtreeStartX, y });
      return;
    }

    // Position children first
    const childY = y + CARD_HEIGHT + LEVEL_GAP;
    let childX = subtreeStartX;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childWidth = subtreeWidths.get(child.id)!;

      // Position child at its subtree start position
      positionNode(child, childX, childY, depth + 1);

      // Move to next child position
      childX += childWidth;
      if (i < node.children.length - 1) {
        childX += SUBTREE_GAP;
      }
    }

    // Position parent centered over children
    const nodeWidth = subtreeWidths.get(node.id)!;
    const parentX = subtreeStartX + (nodeWidth - CARD_WIDTH) / 2;
    // Quantize to 8pt grid
    const quantizedParentX = Math.round(parentX / 8) * 8;
    positions.set(node.id, { x: quantizedParentX, y });
  }

  // Start positioning from root
  positionNode(root, offsetX, offsetY, 0);

  const rootWidth = subtreeWidths.get(root.id)!;

  return {
    positions,
    bounds: {
      width: rootWidth,
      maxDepth
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate that all positions are on 8pt grid
 *
 * @param positions - Map of node positions to validate
 * @returns Validation result with any errors found
 */
export function validateGridAlignment(
  positions: Map<string, NodePosition>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [id, pos] of positions.entries()) {
    if (pos.x % 8 !== 0) {
      errors.push(`Node ${id} x=${pos.x} not on 8pt grid (should be ${Math.round(pos.x / 8) * 8})`);
    }
    if (pos.y % 8 !== 0) {
      errors.push(`Node ${id} y=${pos.y} not on 8pt grid (should be ${Math.round(pos.y / 8) * 8})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if two rectangles overlap
 *
 * Rectangles overlap if they intersect in BOTH dimensions
 * (not just touching at edges)
 */
function rectanglesOverlap(
  r1: { left: number; right: number; top: number; bottom: number },
  r2: { left: number; right: number; top: number; bottom: number }
): boolean {
  // Check for non-overlap (easier to reason about)
  // Rectangles DON'T overlap if:
  // - r1 is completely to the left of r2, OR
  // - r1 is completely to the right of r2, OR
  // - r1 is completely above r2, OR
  // - r1 is completely below r2

  const noOverlap =
    r1.right <= r2.left ||  // r1 left of r2
    r1.left >= r2.right ||  // r1 right of r2
    r1.bottom <= r2.top ||  // r1 above r2
    r1.top >= r2.bottom;    // r1 below r2

  // If they don't NOT overlap, they overlap
  return !noOverlap;
}

/**
 * Validate that no nodes overlap
 *
 * @param positions - Map of node positions to validate
 * @returns Validation result with any overlaps found
 */
export function validateNoOverlaps(
  positions: Map<string, NodePosition>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Convert positions to bounding boxes
  const boxes = Array.from(positions.entries()).map(([id, pos]) => ({
    id,
    left: pos.x,
    right: pos.x + CARD_WIDTH,
    top: pos.y,
    bottom: pos.y + CARD_HEIGHT
  }));

  // Check all pairs for overlap
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (rectanglesOverlap(boxes[i], boxes[j])) {
        errors.push(
          `Nodes ${boxes[i].id} and ${boxes[j].id} overlap ` +
          `(${boxes[i].left},${boxes[i].top}) vs (${boxes[j].left},${boxes[j].top})`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive validation of layout
 *
 * Checks:
 * 1. All positions on 8pt grid
 * 2. No node overlaps
 * 3. Parent centered over children (within 8px tolerance)
 * 4. Minimum spacing requirements met
 *
 * @param positions - Map of node positions to validate
 * @param tree - Original tree structure for validation
 * @returns Validation result with all errors
 */
export function validateLayout(
  positions: Map<string, NodePosition>,
  tree: LayoutNode[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check grid alignment
  const gridResult = validateGridAlignment(positions);
  errors.push(...gridResult.errors);

  // Check no overlaps
  const overlapResult = validateNoOverlaps(positions);
  errors.push(...overlapResult.errors);

  // TODO: Add more sophisticated validation
  // - Parent centering validation
  // - Minimum spacing validation
  // - Depth level alignment validation

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// CONNECTION LINE GEOMETRY
// ============================================================================

/**
 * Calculate bezier curve path for connection line
 *
 * Creates smooth organic curve from parent to child
 * Using Apple's signature spring physics control points
 *
 * @param parentPos - Parent node position
 * @param childPos - Child node position
 * @returns SVG path string
 */
export function calculateConnectionPath(
  parentPos: NodePosition,
  childPos: NodePosition
): string {
  // Start: Bottom center of parent card
  const startX = parentPos.x + CARD_WIDTH / 2;
  const startY = parentPos.y + CARD_HEIGHT;

  // End: Top center of child card
  const endX = childPos.x + CARD_WIDTH / 2;
  const endY = childPos.y;

  // Control points for smooth curve (40% interpolation)
  // This creates natural, organic feel per Apple design
  const controlY1 = startY + (endY - startY) * 0.4;
  const controlY2 = endY - (endY - startY) * 0.4;

  // SVG cubic bezier path
  return `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;
}

/**
 * Calculate all connection paths for a tree
 *
 * @param positions - Map of node positions
 * @param tree - Tree structure defining parent-child relationships
 * @returns Array of connection path data
 */
export function calculateAllConnectionPaths(
  positions: Map<string, NodePosition>,
  tree: LayoutNode[]
): Array<{
  parentId: string;
  childId: string;
  path: string;
}> {
  const paths: Array<{ parentId: string; childId: string; path: string }> = [];

  function traverse(node: LayoutNode): void {
    const parentPos = positions.get(node.id);
    if (!parentPos) return;

    for (const child of node.children) {
      const childPos = positions.get(child.id);
      if (!childPos) continue;

      paths.push({
        parentId: node.id,
        childId: child.id,
        path: calculateConnectionPath(parentPos, childPos)
      });

      traverse(child);
    }
  }

  tree.forEach(traverse);
  return paths;
}

/**
 * PeerLink interface (MUST match types/gantt-tool.ts)
 */
export interface PeerLink {
  id: string;
  resource1Id: string;
  resource2Id: string;
  createdAt: string;
}

/**
 * Calculate peer connection paths (EXPLICIT PEER LINKS ONLY)
 *
 * Creates horizontal lines ONLY for explicitly linked peers (user-created via drag-drop).
 * NO automatic connections - peer links are created when user drags a card and drops it on LEFT/RIGHT zone.
 *
 * Design Philosophy:
 * - Peer lines = explicit user intent, not automatic assumptions
 * - User controls which resources are linked as peers
 * - Dotted line style (1.5px, subtle appearance)
 * - Gentle bezier curve (10% control point ratio for Apple aesthetic)
 *
 * @param positions - Map of node positions
 * @param explicitPeerLinks - Array of explicit peer link objects created by user
 * @returns Array of peer connection path data (only for explicitly linked pairs)
 */
export function calculatePeerConnectionPaths(
  positions: Map<string, NodePosition>,
  explicitPeerLinks: PeerLink[]
): Array<{
  peer1Id: string;
  peer2Id: string;
  path: string;
}> {
  const paths: Array<{ peer1Id: string; peer2Id: string; path: string }> = [];

  // Process ONLY explicit peer links (no automatic connections)
  for (const peerLink of explicitPeerLinks) {
    const leftPos = positions.get(peerLink.resource1Id);
    const rightPos = positions.get(peerLink.resource2Id);

    if (!leftPos || !rightPos) continue; // Skip if either node position not found

    // Determine which node is on the left (for proper line direction)
    const isLeftToRight = leftPos.x < rightPos.x;
    const startPos = isLeftToRight ? leftPos : rightPos;
    const endPos = isLeftToRight ? rightPos : leftPos;
    const peer1Id = isLeftToRight ? peerLink.resource1Id : peerLink.resource2Id;
    const peer2Id = isLeftToRight ? peerLink.resource2Id : peerLink.resource1Id;

    // Calculate connection points (center-right of left card, center-left of right card)
    const startX = startPos.x + CARD_WIDTH; // Right edge of left card
    const startY = startPos.y + (CARD_HEIGHT / 2); // Vertical center

    const endX = endPos.x; // Left edge of right card
    const endY = endPos.y + (CARD_HEIGHT / 2); // Vertical center

    // Create gentle horizontal bezier curve (10% control point ratio for subtle curve)
    const horizontalDistance = endX - startX;
    const controlPointOffset = horizontalDistance * 0.1; // 10% curve (Apple aesthetic)

    const controlX1 = startX + controlPointOffset;
    const controlY1 = startY;

    const controlX2 = endX - controlPointOffset;
    const controlY2 = endY;

    const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

    paths.push({
      peer1Id,
      peer2Id,
      path,
    });
  }

  return paths;
}
