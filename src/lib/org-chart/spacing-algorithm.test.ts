/**
 * Organization Chart Spacing Algorithm Tests
 *
 * Coverage Target: 10000% (Kiasu Level)
 * - Every function
 * - Every branch
 * - Every edge case
 * - Every mathematical property
 * - Every pixel value
 *
 * Test Philosophy (Steve Jobs/Jony Ive):
 * "We don't ship junk" - Every line must be proven correct
 *
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSubtreeWidth,
  centerParentOverChildren,
  calculateTreeLayout,
  validateGridAlignment,
  validateNoOverlaps,
  validateLayout,
  calculateConnectionPath,
  calculateAllConnectionPaths,
  CARD_WIDTH,
  CARD_HEIGHT,
  SIBLING_GAP,
  LEVEL_GAP,
  SUBTREE_GAP,
  CANVAS_MARGIN,
  type LayoutNode,
  type NodePosition
} from './spacing-algorithm';

// ============================================================================
// TEST SUITE 1: Constants Validation
// ============================================================================

describe('Design Constants (8pt Grid Compliance)', () => {
  it('CARD_WIDTH is multiple of 8', () => {
    expect(CARD_WIDTH % 8).toBe(0);
    expect(CARD_WIDTH).toBe(240); // 30 × 8pt
  });

  it('CARD_HEIGHT is multiple of 8', () => {
    expect(CARD_HEIGHT % 8).toBe(0);
    expect(CARD_HEIGHT).toBe(96); // 12 × 8pt
  });

  it('SIBLING_GAP is multiple of 8', () => {
    expect(SIBLING_GAP % 8).toBe(0);
    expect(SIBLING_GAP).toBe(80); // 10 × 8pt
  });

  it('LEVEL_GAP is multiple of 8', () => {
    expect(LEVEL_GAP % 8).toBe(0);
    expect(LEVEL_GAP).toBe(120); // 15 × 8pt
  });

  it('SUBTREE_GAP is multiple of 8', () => {
    expect(SUBTREE_GAP % 8).toBe(0);
    expect(SUBTREE_GAP).toBe(160); // 20 × 8pt
  });

  it('CANVAS_MARGIN is multiple of 8', () => {
    expect(CANVAS_MARGIN % 8).toBe(0);
    expect(CANVAS_MARGIN).toBe(80); // 10 × 8pt
  });

  it('SUBTREE_GAP is exactly 2× SIBLING_GAP (visual hierarchy)', () => {
    expect(SUBTREE_GAP).toBe(SIBLING_GAP * 2);
  });

  it('LEVEL_GAP is ~1.25× CARD_HEIGHT (clear hierarchy)', () => {
    expect(LEVEL_GAP / CARD_HEIGHT).toBeCloseTo(1.25, 2);
  });
});

// ============================================================================
// TEST SUITE 2: calculateSubtreeWidth - Basic Cases
// ============================================================================

describe('calculateSubtreeWidth - Basic Cases', () => {
  it('returns CARD_WIDTH for leaf node', () => {
    const leaf: LayoutNode = {
      id: 'leaf',
      children: []
    };
    expect(calculateSubtreeWidth(leaf)).toBe(CARD_WIDTH);
  });

  it('returns CARD_WIDTH for node with empty children array', () => {
    const node: LayoutNode = {
      id: 'node',
      children: []
    };
    expect(calculateSubtreeWidth(node)).toBe(240);
  });

  it('calculates width for parent with 1 child', () => {
    const parent: LayoutNode = {
      id: 'parent',
      children: [
        { id: 'child1', children: [] }
      ]
    };
    // Single child: max(240, 240) = 240
    expect(calculateSubtreeWidth(parent)).toBe(240);
  });

  it('calculates width for parent with 2 children', () => {
    const parent: LayoutNode = {
      id: 'parent',
      children: [
        { id: 'child1', children: [] },
        { id: 'child2', children: [] }
      ]
    };
    // Two children: 240 + 160 (gap) + 240 = 640
    expect(calculateSubtreeWidth(parent)).toBe(640);
  });

  it('calculates width for parent with 3 children', () => {
    const parent: LayoutNode = {
      id: 'parent',
      children: [
        { id: 'child1', children: [] },
        { id: 'child2', children: [] },
        { id: 'child3', children: [] }
      ]
    };
    // Three children: 240 + 160 + 240 + 160 + 240 = 1040
    expect(calculateSubtreeWidth(parent)).toBe(1040);
  });

  it('calculates width for parent with 10 children (wide tree)', () => {
    const children = Array.from({ length: 10 }, (_, i) => ({
      id: `child${i}`,
      children: []
    }));
    const parent: LayoutNode = {
      id: 'parent',
      children
    };
    // 10 children: 10 × 240 + 9 × 160 = 2400 + 1440 = 3840
    expect(calculateSubtreeWidth(parent)).toBe(3840);
  });
});

// ============================================================================
// TEST SUITE 3: calculateSubtreeWidth - Nested Cases
// ============================================================================

describe('calculateSubtreeWidth - Nested Trees', () => {
  it('calculates width for 2-level tree', () => {
    const tree: LayoutNode = {
      id: 'root',
      children: [
        {
          id: 'child1',
          children: [
            { id: 'grandchild1', children: [] },
            { id: 'grandchild2', children: [] }
          ]
        },
        { id: 'child2', children: [] }
      ]
    };
    // child1 subtree: 240 + 160 + 240 = 640
    // child2 subtree: 240
    // root: 640 + 160 + 240 = 1040
    expect(calculateSubtreeWidth(tree)).toBe(1040);
  });

  it('calculates width for 3-level tree', () => {
    const tree: LayoutNode = {
      id: 'root',
      children: [
        {
          id: 'child1',
          children: [
            {
              id: 'grandchild1',
              children: [
                { id: 'great1', children: [] },
                { id: 'great2', children: [] }
              ]
            }
          ]
        }
      ]
    };
    // great-grandchildren: 240 + 160 + 240 = 640
    // grandchild1: 640
    // child1: 640
    // root: 640
    expect(calculateSubtreeWidth(tree)).toBe(640);
  });

  it('calculates width for balanced binary tree (depth 3)', () => {
    const tree: LayoutNode = {
      id: 'root',
      children: [
        {
          id: 'left',
          children: [
            {
              id: 'left-left',
              children: [
                { id: 'll1', children: [] },
                { id: 'll2', children: [] }
              ]
            },
            {
              id: 'left-right',
              children: [
                { id: 'lr1', children: [] },
                { id: 'lr2', children: [] }
              ]
            }
          ]
        },
        {
          id: 'right',
          children: [
            {
              id: 'right-left',
              children: [
                { id: 'rl1', children: [] },
                { id: 'rl2', children: [] }
              ]
            },
            {
              id: 'right-right',
              children: [
                { id: 'rr1', children: [] },
                { id: 'rr2', children: [] }
              ]
            }
          ]
        }
      ]
    };
    // Leaf pairs: 240 + 160 + 240 = 640 each
    // Second level: 640 + 160 + 640 = 1440 each
    // Root: 1440 + 160 + 1440 = 3040
    expect(calculateSubtreeWidth(tree)).toBe(3040);
  });

  it('calculates width for unbalanced tree (left-heavy)', () => {
    const tree: LayoutNode = {
      id: 'root',
      children: [
        {
          id: 'left',
          children: [
            { id: 'l1', children: [] },
            { id: 'l2', children: [] },
            { id: 'l3', children: [] }
          ]
        },
        { id: 'right', children: [] }
      ]
    };
    // left: 240 + 160 + 240 + 160 + 240 = 1040
    // right: 240
    // root: 1040 + 160 + 240 = 1440
    expect(calculateSubtreeWidth(tree)).toBe(1440);
  });
});

// ============================================================================
// TEST SUITE 4: calculateSubtreeWidth - Edge Cases (Kiasu)
// ============================================================================

describe('calculateSubtreeWidth - Edge Cases', () => {
  it('handles single node tree', () => {
    const tree: LayoutNode = {
      id: 'only',
      children: []
    };
    expect(calculateSubtreeWidth(tree)).toBe(240);
  });

  it('handles extremely wide tree (100 siblings)', () => {
    const children = Array.from({ length: 100 }, (_, i) => ({
      id: `child${i}`,
      children: []
    }));
    const parent: LayoutNode = {
      id: 'parent',
      children
    };
    // 100 × 240 + 99 × 160 = 24000 + 15840 = 39840
    expect(calculateSubtreeWidth(parent)).toBe(39840);
  });

  it('handles extremely deep tree (100 levels)', () => {
    let current: LayoutNode = { id: 'leaf', children: [] };
    for (let i = 99; i >= 0; i--) {
      current = {
        id: `node${i}`,
        children: [current]
      };
    }
    // Single chain: always 240 at each level
    expect(calculateSubtreeWidth(current)).toBe(240);
  });

  it('result is always multiple of 8 (single child)', () => {
    const tree: LayoutNode = {
      id: 'parent',
      children: [{ id: 'child', children: [] }]
    };
    const width = calculateSubtreeWidth(tree);
    expect(width % 8).toBe(0);
  });

  it('result is always multiple of 8 (multiple children)', () => {
    const tree: LayoutNode = {
      id: 'parent',
      children: [
        { id: 'c1', children: [] },
        { id: 'c2', children: [] },
        { id: 'c3', children: [] }
      ]
    };
    const width = calculateSubtreeWidth(tree);
    expect(width % 8).toBe(0);
  });
});

// ============================================================================
// TEST SUITE 5: centerParentOverChildren
// ============================================================================

describe('centerParentOverChildren', () => {
  it('centers parent over single child', () => {
    // Child at 0, width 240
    // Center at 120
    // Parent card (240 wide) centered: 120 - 120 = 0
    const parentX = centerParentOverChildren(0, 240);
    expect(parentX).toBe(0);
  });

  it('centers parent over two children', () => {
    // Children span 0-640 (two cards + gap)
    // Center at 320
    // Parent: 320 - 120 = 200
    const parentX = centerParentOverChildren(0, 640);
    expect(parentX).toBe(200);
  });

  it('centers parent over three children', () => {
    // Children span 0-1040
    // Center at 520
    // Parent: 520 - 120 = 400
    const parentX = centerParentOverChildren(0, 1040);
    expect(parentX).toBe(400);
  });

  it('result is multiple of 8 (quantized)', () => {
    const parentX = centerParentOverChildren(0, 640);
    expect(parentX % 8).toBe(0);
  });

  it('works with non-zero start position', () => {
    // Children span 500-1140 (640 wide)
    // Center at 500 + 640/2 = 820
    // Parent: 820 - 120 = 700
    // Quantized: 704 (closest multiple of 8)
    const parentX = centerParentOverChildren(500, 640);
    expect(parentX).toBe(704); // Quantized to 8pt grid (700 → 704)
  });
});

// ============================================================================
// TEST SUITE 6: calculateTreeLayout - Basic Cases
// ============================================================================

describe('calculateTreeLayout - Basic Cases', () => {
  it('handles empty tree array', () => {
    const layout = calculateTreeLayout([]);
    expect(layout.positions.size).toBe(0);
    expect(layout.bounds.width).toBe(CANVAS_MARGIN * 2);
    expect(layout.bounds.height).toBe(CANVAS_MARGIN * 2);
  });

  it('positions single node at canvas margin', () => {
    const tree: LayoutNode[] = [
      { id: 'root', children: [] }
    ];
    const layout = calculateTreeLayout(tree);

    expect(layout.positions.size).toBe(1);
    const rootPos = layout.positions.get('root')!;
    expect(rootPos.x).toBe(CANVAS_MARGIN);
    expect(rootPos.y).toBe(CANVAS_MARGIN);
  });

  it('positions parent with 2 children', () => {
    const tree: LayoutNode[] = [
      {
        id: 'parent',
        children: [
          { id: 'child1', children: [] },
          { id: 'child2', children: [] }
        ]
      }
    ];
    const layout = calculateTreeLayout(tree);

    expect(layout.positions.size).toBe(3);

    // Get positions
    const parentPos = layout.positions.get('parent')!;
    const child1Pos = layout.positions.get('child1')!;
    const child2Pos = layout.positions.get('child2')!;

    // Verify all positions exist
    expect(parentPos).toBeDefined();
    expect(child1Pos).toBeDefined();
    expect(child2Pos).toBeDefined();

    // Children at correct Y position
    const expectedChildY = CANVAS_MARGIN + CARD_HEIGHT + LEVEL_GAP;
    expect(child1Pos.y).toBe(expectedChildY);
    expect(child2Pos.y).toBe(expectedChildY);

    // Children have correct spacing
    const gap = child2Pos.x - (child1Pos.x + CARD_WIDTH);
    expect(gap).toBe(SUBTREE_GAP);

    // Parent is centered over children (within subtree width = 640)
    // Subtree width: 240 + 160 + 240 = 640
    // Parent should be at subtreeStart + (640 - 240) / 2 = subtreeStart + 200
    // SubtreeStart = CANVAS_MARGIN = 80
    // So parent should be at 80 + 200 = 280
    expect(parentPos.x).toBe(280);
    expect(parentPos.y).toBe(CANVAS_MARGIN);
  });

  it('positions 3-level tree correctly', () => {
    const tree: LayoutNode[] = [
      {
        id: 'root',
        children: [
          {
            id: 'child',
            children: [
              { id: 'grandchild', children: [] }
            ]
          }
        ]
      }
    ];
    const layout = calculateTreeLayout(tree);

    const rootPos = layout.positions.get('root')!;
    const childPos = layout.positions.get('child')!;
    const grandchildPos = layout.positions.get('grandchild')!;

    // Vertical spacing
    expect(childPos.y).toBe(rootPos.y + CARD_HEIGHT + LEVEL_GAP);
    expect(grandchildPos.y).toBe(childPos.y + CARD_HEIGHT + LEVEL_GAP);

    // Horizontal alignment (all centered)
    expect(rootPos.x).toBe(childPos.x);
    expect(childPos.x).toBe(grandchildPos.x);
  });
});

// ============================================================================
// TEST SUITE 7: calculateTreeLayout - Complex Cases
// ============================================================================

describe('calculateTreeLayout - Complex Trees', () => {
  it('positions balanced binary tree correctly', () => {
    const tree: LayoutNode[] = [
      {
        id: 'root',
        children: [
          {
            id: 'left',
            children: [
              { id: 'left-left', children: [] },
              { id: 'left-right', children: [] }
            ]
          },
          {
            id: 'right',
            children: [
              { id: 'right-left', children: [] },
              { id: 'right-right', children: [] }
            ]
          }
        ]
      }
    ];
    const layout = calculateTreeLayout(tree);

    expect(layout.positions.size).toBe(7);

    // Check no overlaps
    const validation = validateNoOverlaps(layout.positions);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('handles multiple root trees', () => {
    const trees: LayoutNode[] = [
      {
        id: 'tree1',
        children: [
          { id: 'tree1-child', children: [] }
        ]
      },
      {
        id: 'tree2',
        children: [
          { id: 'tree2-child', children: [] }
        ]
      }
    ];
    const layout = calculateTreeLayout(trees);

    expect(layout.positions.size).toBe(4);

    const tree1Pos = layout.positions.get('tree1')!;
    const tree2Pos = layout.positions.get('tree2')!;

    // Second tree should be to the right with gap
    expect(tree2Pos.x).toBeGreaterThan(tree1Pos.x);
  });

  it('positions unbalanced tree (left-heavy)', () => {
    const tree: LayoutNode[] = [
      {
        id: 'root',
        children: [
          {
            id: 'left',
            children: [
              { id: 'l1', children: [] },
              { id: 'l2', children: [] },
              { id: 'l3', children: [] }
            ]
          },
          { id: 'right', children: [] }
        ]
      }
    ];
    const layout = calculateTreeLayout(tree);

    // Check no overlaps
    const validation = validateNoOverlaps(layout.positions);
    expect(validation.valid).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 8: Grid Alignment Validation
// ============================================================================

describe('validateGridAlignment', () => {
  it('passes for positions on 8pt grid', () => {
    const positions = new Map<string, NodePosition>([
      ['node1', { x: 80, y: 80 }],
      ['node2', { x: 320, y: 216 }],
      ['node3', { x: 560, y: 352 }]
    ]);

    const result = validateGridAlignment(positions);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails for X not on 8pt grid', () => {
    const positions = new Map<string, NodePosition>([
      ['node1', { x: 85, y: 80 }] // X not on grid
    ]);

    const result = validateGridAlignment(positions);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('x=85');
  });

  it('fails for Y not on 8pt grid', () => {
    const positions = new Map<string, NodePosition>([
      ['node1', { x: 80, y: 83 }] // Y not on grid
    ]);

    const result = validateGridAlignment(positions);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('y=83');
  });

  it('reports all misaligned nodes', () => {
    const positions = new Map<string, NodePosition>([
      ['node1', { x: 85, y: 80 }],
      ['node2', { x: 320, y: 219 }],
      ['node3', { x: 563, y: 355 }]
    ]);

    const result = validateGridAlignment(positions);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(4); // 3 X errors + 2 Y errors = but node2 has Y error
  });
});

// ============================================================================
// TEST SUITE 9: Overlap Validation
// ============================================================================

describe('validateNoOverlaps', () => {
  it('passes for non-overlapping nodes', () => {
    const positions = new Map<string, NodePosition>([
      ['node1', { x: 80, y: 80 }],
      ['node2', { x: 400, y: 80 }], // 400 - (80+240) = 80px gap
      ['node3', { x: 80, y: 300 }]  // Vertical separation
    ]);

    const result = validateNoOverlaps(positions);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails for horizontally overlapping nodes', () => {
    const positions = new Map<string, NodePosition>([
      ['node1', { x: 80, y: 80 }],
      ['node2', { x: 200, y: 80 }] // 200 < 80 + 240, overlaps!
    ]);

    const result = validateNoOverlaps(positions);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('overlap');
  });

  it('fails for vertically overlapping nodes', () => {
    const positions = new Map<string, NodePosition>([
      ['node1', { x: 80, y: 80 }],
      ['node2', { x: 100, y: 120 }] // x overlaps (100 < 80+240) AND y overlaps (120 < 80+96)
    ]);

    const result = validateNoOverlaps(positions);
    expect(result.valid).toBe(false);
  });

  it('passes for adjacent nodes (exactly touching)', () => {
    const positions = new Map<string, NodePosition>([
      ['node1', { x: 80, y: 80 }],
      ['node2', { x: 320, y: 80 }] // 320 = 80 + 240, exactly adjacent
    ]);

    // This should pass (no overlap, just touching)
    const result = validateNoOverlaps(positions);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 10: Full Layout Validation (Integration)
// ============================================================================

describe('Full Layout Validation', () => {
  it('validates simple tree layout', () => {
    const tree: LayoutNode[] = [
      {
        id: 'parent',
        children: [
          { id: 'child1', children: [] },
          { id: 'child2', children: [] }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);
    const validation = validateLayout(layout.positions, tree);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('validates complex tree layout', () => {
    const tree: LayoutNode[] = [
      {
        id: 'root',
        children: [
          {
            id: 'left',
            children: [
              { id: 'l1', children: [] },
              { id: 'l2', children: [] }
            ]
          },
          {
            id: 'right',
            children: [
              { id: 'r1', children: [] },
              { id: 'r2', children: [] },
              { id: 'r3', children: [] }
            ]
          }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);
    const validation = validateLayout(layout.positions, tree);

    expect(validation.valid).toBe(true);
  });

  it('validates wide tree layout (10 siblings)', () => {
    const children = Array.from({ length: 10 }, (_, i) => ({
      id: `child${i}`,
      children: []
    }));
    const tree: LayoutNode[] = [
      { id: 'parent', children }
    ];

    const layout = calculateTreeLayout(tree);
    const validation = validateLayout(layout.positions, tree);

    expect(validation.valid).toBe(true);
  });

  it('validates deep tree layout (10 levels)', () => {
    let current: LayoutNode = { id: 'leaf', children: [] };
    for (let i = 9; i >= 0; i--) {
      current = {
        id: `node${i}`,
        children: [current]
      };
    }

    const layout = calculateTreeLayout([current]);
    const validation = validateLayout(layout.positions, [current]);

    expect(validation.valid).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 11: Connection Path Geometry
// ============================================================================

describe('calculateConnectionPath', () => {
  it('generates valid SVG path for vertical connection', () => {
    const parentPos: NodePosition = { x: 80, y: 80 };
    const childPos: NodePosition = { x: 80, y: 296 }; // 80 + 96 + 120 = 296

    const path = calculateConnectionPath(parentPos, childPos);

    expect(path).toContain('M'); // Move command
    expect(path).toContain('C'); // Cubic bezier command
    expect(typeof path).toBe('string');
    expect(path.length).toBeGreaterThan(0);
  });

  it('generates valid SVG path for diagonal connection', () => {
    const parentPos: NodePosition = { x: 200, y: 80 };
    const childPos: NodePosition = { x: 80, y: 296 };

    const path = calculateConnectionPath(parentPos, childPos);

    expect(path).toContain('M');
    expect(path).toContain('C');
  });

  it('path starts at bottom center of parent', () => {
    const parentPos: NodePosition = { x: 100, y: 100 };
    const childPos: NodePosition = { x: 100, y: 316 };

    const path = calculateConnectionPath(parentPos, childPos);

    // Start point should be (100 + 120, 100 + 96) = (220, 196)
    expect(path).toContain(`M 220 196`);
  });

  it('path ends at top center of child', () => {
    const parentPos: NodePosition = { x: 100, y: 100 };
    const childPos: NodePosition = { x: 150, y: 316 };

    const path = calculateConnectionPath(parentPos, childPos);

    // End point should be (150 + 120, 316) = (270, 316)
    expect(path).toContain(`270 316`);
  });
});

describe('calculateAllConnectionPaths', () => {
  it('generates paths for parent-child connections', () => {
    const tree: LayoutNode[] = [
      {
        id: 'parent',
        children: [
          { id: 'child1', children: [] },
          { id: 'child2', children: [] }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);
    const paths = calculateAllConnectionPaths(layout.positions, tree);

    expect(paths.length).toBe(2);
    expect(paths[0].parentId).toBe('parent');
    expect(paths[0].childId).toBe('child1');
    expect(paths[1].parentId).toBe('parent');
    expect(paths[1].childId).toBe('child2');
  });

  it('generates paths for multi-level tree', () => {
    const tree: LayoutNode[] = [
      {
        id: 'root',
        children: [
          {
            id: 'child',
            children: [
              { id: 'grandchild', children: [] }
            ]
          }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);
    const paths = calculateAllConnectionPaths(layout.positions, tree);

    expect(paths.length).toBe(2);
    expect(paths.some(p => p.parentId === 'root' && p.childId === 'child')).toBe(true);
    expect(paths.some(p => p.parentId === 'child' && p.childId === 'grandchild')).toBe(true);
  });

  it('returns empty array for tree with no connections', () => {
    const tree: LayoutNode[] = [
      { id: 'single', children: [] }
    ];

    const layout = calculateTreeLayout(tree);
    const paths = calculateAllConnectionPaths(layout.positions, tree);

    expect(paths.length).toBe(0);
  });
});

// ============================================================================
// TEST SUITE 12: Mathematical Properties (Kiasu Validation)
// ============================================================================

describe('Mathematical Properties', () => {
  it('subtree width is monotonically increasing with children', () => {
    const widths: number[] = [];

    for (let n = 0; n <= 10; n++) {
      const children = Array.from({ length: n }, (_, i) => ({
        id: `c${i}`,
        children: []
      }));
      const parent: LayoutNode = { id: 'p', children };
      widths.push(calculateSubtreeWidth(parent));
    }

    // Each width should be >= previous
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]);
    }
  });

  it('parent X is always within children bounds', () => {
    const tree: LayoutNode[] = [
      {
        id: 'parent',
        children: [
          { id: 'c1', children: [] },
          { id: 'c2', children: [] },
          { id: 'c3', children: [] }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);
    const parentPos = layout.positions.get('parent')!;
    const c1Pos = layout.positions.get('c1')!;
    const c3Pos = layout.positions.get('c3')!;

    // Parent should be between leftmost and rightmost children
    expect(parentPos.x).toBeGreaterThanOrEqual(c1Pos.x);
    expect(parentPos.x + CARD_WIDTH).toBeLessThanOrEqual(c3Pos.x + CARD_WIDTH);
  });

  it('sibling nodes have consistent spacing', () => {
    const tree: LayoutNode[] = [
      {
        id: 'parent',
        children: [
          { id: 'c1', children: [] },
          { id: 'c2', children: [] },
          { id: 'c3', children: [] },
          { id: 'c4', children: [] }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);

    const c1Pos = layout.positions.get('c1')!;
    const c2Pos = layout.positions.get('c2')!;
    const c3Pos = layout.positions.get('c3')!;
    const c4Pos = layout.positions.get('c4')!;

    const gap1 = c2Pos.x - (c1Pos.x + CARD_WIDTH);
    const gap2 = c3Pos.x - (c2Pos.x + CARD_WIDTH);
    const gap3 = c4Pos.x - (c3Pos.x + CARD_WIDTH);

    expect(gap1).toBe(gap2);
    expect(gap2).toBe(gap3);
    expect(gap1).toBe(SUBTREE_GAP);
  });
});

// ============================================================================
// TEST SUITE 13: Performance Tests (Kiasu)
// ============================================================================

describe('Performance', () => {
  it('handles 100 nodes in reasonable time', () => {
    const children = Array.from({ length: 100 }, (_, i) => ({
      id: `child${i}`,
      children: []
    }));
    const tree: LayoutNode[] = [{ id: 'root', children }];

    const start = performance.now();
    const layout = calculateTreeLayout(tree);
    const duration = performance.now() - start;

    expect(layout.positions.size).toBe(101);
    expect(duration).toBeLessThan(100); // Should complete in <100ms
  });

  it('handles deep tree (100 levels) efficiently', () => {
    let current: LayoutNode = { id: 'leaf', children: [] };
    for (let i = 99; i >= 0; i--) {
      current = { id: `node${i}`, children: [current] };
    }

    const start = performance.now();
    const layout = calculateTreeLayout([current]);
    const duration = performance.now() - start;

    expect(layout.positions.size).toBe(101);
    expect(duration).toBeLessThan(100);
  });
});

// ============================================================================
// TEST SUITE 14: Regression Tests (Real-World Scenarios)
// ============================================================================

describe('Regression Tests - Real World Org Charts', () => {
  it('handles typical company org chart (CEO → VPs → Directors)', () => {
    const tree: LayoutNode[] = [
      {
        id: 'ceo',
        children: [
          {
            id: 'cto',
            children: [
              { id: 'eng-director-1', children: [] },
              { id: 'eng-director-2', children: [] }
            ]
          },
          {
            id: 'cfo',
            children: [
              { id: 'finance-director', children: [] }
            ]
          },
          {
            id: 'cmo',
            children: [
              { id: 'marketing-director-1', children: [] },
              { id: 'marketing-director-2', children: [] },
              { id: 'marketing-director-3', children: [] }
            ]
          }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);
    const validation = validateLayout(layout.positions, tree);

    expect(validation.valid).toBe(true);
    expect(layout.positions.size).toBe(10);
  });

  it('handles SAP project org chart (from template)', () => {
    const tree: LayoutNode[] = [
      {
        id: 'pm',
        children: [
          {
            id: 'fi-lead',
            children: [
              { id: 'fi-consultant-1', children: [] },
              { id: 'fi-consultant-2', children: [] }
            ]
          },
          {
            id: 'mm-lead',
            children: [
              { id: 'mm-consultant', children: [] }
            ]
          },
          {
            id: 'client-director',
            children: []
          }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);
    const validation = validateLayout(layout.positions, tree);

    expect(validation.valid).toBe(true);
  });

  it('reproduces the Image #1 scenario (overlapping fix)', () => {
    // This is the exact scenario from the user's screenshot
    const tree: LayoutNode[] = [
      {
        id: 'manager',
        children: [
          { id: 'peer1', children: [] },
          { id: 'peer2', children: [] },
          { id: 'peer3', children: [] },
          { id: 'peer4', children: [] }
        ]
      }
    ];

    const layout = calculateTreeLayout(tree);

    // Verify no overlaps
    const validation = validateNoOverlaps(layout.positions);
    expect(validation.valid).toBe(true);

    // Verify proper spacing
    const peer1 = layout.positions.get('peer1')!;
    const peer2 = layout.positions.get('peer2')!;
    const peer3 = layout.positions.get('peer3')!;
    const peer4 = layout.positions.get('peer4')!;

    const gap1 = peer2.x - (peer1.x + CARD_WIDTH);
    const gap2 = peer3.x - (peer2.x + CARD_WIDTH);
    const gap3 = peer4.x - (peer3.x + CARD_WIDTH);

    // All gaps should be SUBTREE_GAP (160px)
    expect(gap1).toBe(SUBTREE_GAP);
    expect(gap2).toBe(SUBTREE_GAP);
    expect(gap3).toBe(SUBTREE_GAP);

    // Total width should be: 4 cards + 3 gaps = 4×240 + 3×160 = 1440px
    const totalWidth = peer4.x + CARD_WIDTH - peer1.x;
    expect(totalWidth).toBe(1440);
  });
});
