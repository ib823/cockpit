# Apple Design Principles for Org Chart Implementation
## Steve Jobs & Jony Ive Design Philosophy Applied

**Document Version:** 1.0
**Date:** 2025-11-13
**Status:** Active Design Standard
**Compliance Level:** Pixel-Perfect, 10000% Coverage Required

---

## Executive Summary

This document establishes the **absolute design standards** for the Organization Chart feature, following Steve Jobs and Jony Ive's uncompromising design philosophy. Every pixel, every spacing value, every animation must be justified and perfect.

> "Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs

> "To be truly simple, you have to go really deep." — Jony Ive

---

## Part 1: Foundational Philosophy

### 1.1 Core Principles from Jobs/Ive Era

#### **Principle 1: Deep Simplicity**
- **Definition:** Not merely visual minimalism, but understanding the essence of the problem
- **Application:** Spacing algorithm must be mathematically elegant, not patch-worked
- **Measurement:** Can explain algorithm in 3 sentences or less

#### **Principle 2: Pixel-Perfect Precision**
- **Definition:** Every measurement justified, no arbitrary values
- **Application:** All spacing derives from 8pt grid system
- **Measurement:** Zero exceptions to grid system

#### **Principle 3: God is in the Details**
- **Definition:** Obsessive attention to micro-interactions
- **Application:** Bezier curves match Apple's signature spring physics
- **Measurement:** 60fps animations, no jank

#### **Principle 4: Design as Conversation**
- **Definition:** Iterative refinement through constant questioning
- **Application:** Every layout decision has documented rationale
- **Measurement:** Can answer "why" for every spacing value

#### **Principle 5: Focus & Empathy**
- **Definition:** Ruthlessly eliminate what doesn't serve the user
- **Application:** Progressive disclosure - show only what's needed
- **Measurement:** Zero cognitive overload indicators

---

## Part 2: Apple Human Interface Guidelines Analysis

### 2.1 Official HIG Principles (2024-2025)

#### **Clarity**
```
Components:
├── Legible typography (SF Pro, 11px minimum)
├── Sharp icons (at least @2x resolution)
├── Strong visual hierarchy (size, color, spacing)
└── Focus on essential elements
```

**Applied to Org Chart:**
- Role titles: 15px SF Pro Semibold (600)
- Designation badges: 11px SF Pro Medium (500)
- Icons: 16px minimum (2px stroke)
- Card hierarchy: shadow + border + color

#### **Deference**
```
Components:
├── Content takes center stage
├── Fluid animations (not distracting)
├── Translucent/subtle UI elements
└── Breathing room (negative space)
```

**Applied to Org Chart:**
- Cards are content, controls are invisible until needed
- Connection lines: 0.5 opacity (subtle, not dominant)
- Drop zones: 0 opacity → 1 on drag (progressive disclosure)
- Canvas margins: 80px minimum (breathing room)

#### **Depth**
```
Components:
├── Visual layering (z-index hierarchy)
├── Smooth transitions (spatial awareness)
├── Logical hierarchy (tree structure)
└── Shadow elevations
```

**Applied to Org Chart:**
- Cards: z-index 1
- Connection lines: z-index 0
- Drag overlay: z-index 1000
- Shadows: sm (rest) → xl (active)

### 2.2 Spacing System

#### **8pt Grid Foundation**
```
Base Unit: 8px (1 unit)

Spacing Scale:
├── --space-1:  8px   (0.5rem)  → Tight padding
├── --space-2:  16px  (1rem)    → Default padding
├── --space-3:  24px  (1.5rem)  → Comfortable padding
├── --space-4:  32px  (2rem)    → Section spacing
├── --space-5:  40px  (2.5rem)  → Component gaps
├── --space-6:  48px  (3rem)    → Generous spacing
├── --space-8:  64px  (4rem)    → Major sections
├── --space-10: 80px  (5rem)    → Canvas margins
└── --space-12: 96px  (6rem)    → Large gaps
```

**Rationale:** Apple's ecosystem consistency - iOS, macOS, visionOS all use 8pt grid

#### **Touch Targets**
```
Minimum: 44px × 44px (Apple HIG requirement)
Comfortable: 48px × 48px (recommended)

Applied:
├── Main action buttons: 48px
├── Edge add buttons: 24px (hover-only, intentional precision)
└── Drag handles: 32px (comfortable grip)
```

### 2.3 Typography System

#### **SF Pro Scale**
```
Font Family: SF Pro Display, SF Pro Text

Scale:
├── 11px → Minimum (badges, labels)
├── 13px → Body (descriptions)
├── 15px → Subheading (role titles)
├── 17px → Heading (section titles)
├── 20px → Large heading (page titles)
└── 28px+ → Display (hero text)

Weights:
├── 400 → Regular (body text)
├── 500 → Medium (emphasis)
├── 600 → Semibold (headings)
└── 700 → Bold (high emphasis)
```

**Applied to Org Chart Cards:**
- Role title: 15px / 600 (primary focus)
- Company name: 13px / 400 (secondary)
- Designation badge: 11px / 500 (label)

### 2.4 Color System

#### **Semantic Colors**
```css
Primary Action: #007AFF (Apple Blue)
├── Used for: Primary buttons, selected states, focus rings
├── Hover: #0051D5 (darker)
└── Active: #0040C0 (darkest)

Success: #34C759 (Apple Green)
├── Used for: Confirmations, positive feedback
└── Applied: Bottom drop zones (reports to)

Warning: #FF9500 (Apple Orange)
├── Used for: Alerts, cautions
└── Applied: Left/right drop zones (peers)

Destructive: #FF3B30 (Apple Red)
├── Used for: Deletions, errors
└── Applied: Delete buttons, invalid drops

Neutral:
├── Background: #FAFAFA (canvas)
├── Cards: #FFFFFF (pure white)
├── Borders: #E0E0E0 (light gray)
├── Text primary: #1D1D1F (near black)
└── Text secondary: #86868B (gray)
```

### 2.5 Animation System

#### **Signature Spring Physics**
```css
--easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Characteristics:**
- Overshoots slightly (1.56 control point)
- Creates playful, organic feel
- 60fps performance target
- Apple's DNA since iOS 7

**Applied to:**
- Card drop success: 0.6s spring bounce
- Zoom transitions: 0.3s spring
- Drop zone activation: 0.2s ease
- Connection line updates: 0.3s smooth

#### **Duration Guidelines**
```
Micro-interactions: 100-200ms (instant feel)
Standard: 200-300ms (smooth)
Emphasis: 300-600ms (noticeable)
Dramatic: 600ms+ (hero moments)
```

---

## Part 3: Tree Layout Algorithm - Mathematical Foundation

### 3.1 Problem Analysis

**Current Issue (from Image #1):**
```
Problem: Nodes overlapping horizontally
Root Cause: Spacing calculation doesn't account for FULL subtree width
Visual Evidence: Red box shows 4 nodes stacked with insufficient gaps
```

**Mathematical Requirements:**
1. Each node must have space for its entire subtree below it
2. Siblings must not overlap their subtrees
3. Parent must center above children's total span
4. Spacing must follow 8pt grid system

### 3.2 Academic Foundation: Reingold-Tilford Algorithm

**Reference:** "Tidier Drawings of Trees" (Reingold & Tilford, 1981)

**Core Principles:**
1. **Aesthetic Rules:**
   - Parent centered over children
   - Nodes at same depth on same horizontal line
   - Tree symmetric around parent
   - Subtrees drawn identically regardless of position

2. **Space Efficiency:**
   - Subtrees as close as possible without overlap
   - O(n) time complexity
   - Minimal canvas width

**Our Implementation (Apple-Enhanced):**
```
Standard R-T Algorithm + Apple Enhancements:

1. Base R-T: Optimal horizontal positioning
2. + 8pt grid quantization (round to nearest 8px)
3. + Generous breathing room (minimum gaps)
4. + Responsive scaling (auto-fit vs scrollable)
5. + Animated transitions (spring physics)
```

### 3.3 Spacing Formula Derivation

#### **Constants (8pt Grid Compliant)**
```typescript
// Card Dimensions
const CARD_WIDTH = 240;   // 30 × 8pt units
const CARD_HEIGHT = 96;   // 12 × 8pt units

// Spacing (derived from Apple HIG)
const SIBLING_GAP = 80;      // 10 × 8pt (comfortable)
const LEVEL_GAP = 120;       // 15 × 8pt (clear hierarchy)
const CANVAS_MARGIN = 80;    // 10 × 8pt (breathing room)

// Subtree separation (generous for clarity)
const SUBTREE_GAP = 160;     // 20 × 8pt (2x sibling gap)
```

**Rationale for Values:**

| Value | Calculation | Justification |
|-------|-------------|---------------|
| 240px | 30 × 8 | Golden ratio ~1.6 (iPhone proportions), fits 2-line title |
| 96px | 12 × 8 | Minimal height for icon + title + metadata |
| 80px | 10 × 8 | ~33% of card width (visual balance) |
| 120px | 15 × 8 | 1.25× card height (clear level separation) |
| 160px | 20 × 8 | 2× sibling gap (distinct subtree boundaries) |

#### **Subtree Width Calculation**
```typescript
function calculateSubtreeWidth(node: TreeNode): number {
  // Base case: Leaf node
  if (node.children.length === 0) {
    return CARD_WIDTH;  // 240px
  }

  // Recursive case: Sum of children + gaps
  let totalWidth = 0;

  for (let i = 0; i < node.children.length; i++) {
    const childWidth = calculateSubtreeWidth(node.children[i]);
    totalWidth += childWidth;

    // Add gap between siblings (not after last child)
    if (i < node.children.length - 1) {
      totalWidth += SUBTREE_GAP;  // 160px
    }
  }

  // Parent must be at least as wide as its card
  // But allocate space for full children span
  return Math.max(totalWidth, CARD_WIDTH);
}
```

**Example Calculation:**
```
Tree Structure:
    Manager (M)
    /    |    \
   A     B     C
        / \
       D   E

Step 1: Calculate leaf widths
- A: 240px (leaf)
- D: 240px (leaf)
- E: 240px (leaf)
- C: 240px (leaf)

Step 2: Calculate B's subtree
- B = D + gap + E
- B = 240 + 160 + 240 = 640px

Step 3: Calculate M's subtree
- M = A + gap + B + gap + C
- M = 240 + 160 + 640 + 160 + 240 = 1440px

Step 4: Position nodes
- A: x = 0
- B: x = 240 + 160 = 400
  - D: x = 400
  - E: x = 400 + 240 + 160 = 800
- C: x = 1080
- M: centered = (1440 - 240) / 2 = 600

Result: No overlaps, visually balanced ✓
```

#### **Parent Centering Algorithm**
```typescript
function centerParentOverChildren(
  parentWidth: number,
  childrenTotalWidth: number,
  childrenStartX: number
): number {
  // Find center of children's span
  const childrenCenterX = childrenStartX + (childrenTotalWidth / 2);

  // Center parent card over that point
  const parentX = childrenCenterX - (parentWidth / 2);

  // Quantize to 8pt grid (optional, for perfect alignment)
  return Math.round(parentX / 8) * 8;
}
```

### 3.4 Connection Line Geometry

#### **Bezier Curve Mathematics**
```typescript
// Start: Bottom center of parent card
const startX = parentX + (CARD_WIDTH / 2);
const startY = parentY + CARD_HEIGHT;

// End: Top center of child card
const endX = childX + (CARD_WIDTH / 2);
const endY = childY;

// Control points for smooth curve
const controlY1 = startY + (endY - startY) * 0.4;  // 40% down
const controlY2 = endY - (endY - startY) * 0.4;    // 40% up

// SVG path
const path = `M ${startX} ${startY}
              C ${startX} ${controlY1},
                ${endX} ${controlY2},
                ${endX} ${endY}`;
```

**Rationale:**
- 40% control points: Natural curve (not too tight, not too loose)
- Vertical control: Horizontal alignment maintained
- Symmetric: Curve enters/exits at same angle

### 3.5 Responsive Scaling Strategy

#### **Auto-Fit Mode (≤6 nodes)**
```typescript
const calculateAutoFitScale = (
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number
): number => {
  const padding = 80;  // Breathing room

  const availableWidth = containerWidth - padding;
  const availableHeight = containerHeight - padding;

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;

  // Use smaller scale (fit both dimensions)
  // Never zoom beyond 100% (maintains clarity)
  return Math.min(scaleX, scaleY, 1.0);
};
```

**Threshold Justification:**
- ≤6 nodes: Fits comfortably on 1920×1080 screen at 100% scale
- >6 nodes: Requires scrolling/panning for legibility

#### **Scrollable Mode (>6 nodes)**
```typescript
// Keep 1:1 scale (100%) for readability
// Enable pan/zoom controls
// Maintain minimum 11px font size (HIG requirement)
```

---

## Part 4: Implementation Requirements

### 4.1 Code Quality Standards

#### **TypeScript Strictness**
```typescript
// tsconfig.json requirements
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

#### **Function Purity**
```typescript
// ✓ GOOD: Pure function
function calculateSubtreeWidth(node: TreeNode): number {
  // No side effects, deterministic
}

// ✗ BAD: Impure function
function calculateAndUpdate(node: TreeNode) {
  setNodePositions(...)  // Side effect
}
```

#### **Single Responsibility**
```typescript
// ✓ GOOD: One job per function
function calculatePositions(tree: TreeNode[]): PositionMap { }
function renderNodes(positions: PositionMap): JSX.Element[] { }
function renderConnections(positions: PositionMap): JSX.Element[] { }

// ✗ BAD: God function
function renderTree() {
  // Calculate, render, animate all in one
}
```

### 4.2 Performance Requirements

#### **60fps Animation Target**
```typescript
// Use transform (GPU-accelerated)
// NOT left/top (CPU-heavy)

// ✓ GOOD
<div style={{
  transform: `translate(${x}px, ${y}px)`,
  transition: 'transform 300ms var(--easing-spring)'
}} />

// ✗ BAD
<div style={{
  left: `${x}px`,
  top: `${y}px`,
  transition: 'left 300ms, top 300ms'
}} />
```

#### **React Performance**
```typescript
// Memoize expensive calculations
const subtreeWidths = useMemo(
  () => calculateAllSubtreeWidths(tree),
  [tree]
);

// Avoid inline object creation
const nodeStyle = useMemo(
  () => ({ transform: `translate(${x}px, ${y}px)` }),
  [x, y]
);
```

### 4.3 Accessibility Requirements

#### **Keyboard Navigation**
```typescript
// Required key bindings
- Tab: Navigate between nodes
- Enter: Select/edit node
- Escape: Cancel edit/selection
- Arrow keys: Navigate tree structure
- Cmd/Ctrl + Plus: Zoom in
- Cmd/Ctrl + Minus: Zoom out
- Cmd/Ctrl + 0: Reset zoom
```

#### **Screen Reader Support**
```typescript
<div
  role="tree"
  aria-label="Organization chart"
>
  <div
    role="treeitem"
    aria-level={depth}
    aria-expanded={hasChildren ? isExpanded : undefined}
    aria-label={`${roleTitle}, ${designation}, reports to ${parentTitle}`}
  >
    {children}
  </div>
</div>
```

#### **Reduced Motion**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4.4 Testing Requirements (10000% Coverage)

#### **Unit Tests (Vitest)**
```typescript
describe('calculateSubtreeWidth', () => {
  it('returns CARD_WIDTH for leaf node', () => {
    const leaf: TreeNode = { id: '1', children: [] };
    expect(calculateSubtreeWidth(leaf)).toBe(240);
  });

  it('sums children widths + gaps for parent', () => {
    const parent: TreeNode = {
      id: '1',
      children: [
        { id: '2', children: [] },
        { id: '3', children: [] }
      ]
    };
    // 240 + 160 + 240 = 640
    expect(calculateSubtreeWidth(parent)).toBe(640);
  });

  it('handles deep nesting correctly', () => {
    // 5-level tree test
  });

  it('handles wide trees (10+ siblings)', () => {
    // Wide tree test
  });
});
```

**Coverage Targets:**
- Line coverage: 100%
- Branch coverage: 100%
- Function coverage: 100%
- Statement coverage: 100%

#### **Integration Tests (Playwright)**
```typescript
test('drag and drop updates spacing correctly', async ({ page }) => {
  // 1. Render initial tree
  // 2. Drag node B under node A
  // 3. Verify no overlaps (getBoundingClientRect)
  // 4. Verify spacing follows 8pt grid
  // 5. Verify animations complete
  // 6. Take screenshot for visual regression
});

test('zoom maintains spacing ratios', async ({ page }) => {
  // Test at 50%, 100%, 150% zoom levels
});
```

#### **Visual Regression Tests (Chromatic)**
```typescript
// Capture screenshots of:
- Empty state
- Single node
- 2-level tree (1 parent, 3 children)
- 3-level tree (complex)
- 5-level tree (deep)
- Wide tree (10 siblings)
- Drag states (all drop zones active)
- Zoom states (auto-fit, 50%, 100%, 150%)
- Dark mode (future)
- Mobile responsive (future)
```

#### **Performance Tests (Lighthouse)**
```
Metrics:
- First Contentful Paint: < 1.0s
- Time to Interactive: < 2.0s
- Cumulative Layout Shift: < 0.1
- Largest Contentful Paint: < 2.0s
```

#### **Accessibility Tests (axe-core)**
```typescript
test('org chart meets WCAG 2.1 AA', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Part 5: Quality Assurance Protocol

### 5.1 Pre-Implementation Checklist

- [ ] Design principles documented and approved
- [ ] Algorithm mathematically proven correct
- [ ] All spacing values justified (8pt grid)
- [ ] Performance budget established
- [ ] Accessibility requirements defined
- [ ] Test cases written (before implementation)

### 5.2 Implementation Checklist

- [ ] Code follows TypeScript strict mode
- [ ] Functions are pure and single-responsibility
- [ ] All measurements use design tokens
- [ ] Animations use spring physics
- [ ] GPU-accelerated transforms used
- [ ] Memoization applied to expensive calculations
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation fully implemented

### 5.3 Testing Checklist

#### **Functional Tests**
- [ ] Leaf node width = 240px ✓
- [ ] 2-child parent width = 640px (240+160+240) ✓
- [ ] 3-child parent width = 1040px (240+160+240+160+240) ✓
- [ ] Parent centers over children ✓
- [ ] Siblings don't overlap ✓
- [ ] Deep nesting (5+ levels) works ✓
- [ ] Wide trees (10+ siblings) work ✓
- [ ] Circular dependency detection works ✓
- [ ] Drag-drop updates spacing ✓
- [ ] Zoom maintains ratios ✓

#### **Technical Tests**
- [ ] Unit test coverage = 100% ✓
- [ ] Integration test coverage = 100% ✓
- [ ] Performance: 60fps animations ✓
- [ ] Performance: <2s Time to Interactive ✓
- [ ] Memory: No leaks after 1000 operations ✓
- [ ] Bundle size: <50kb gzipped ✓

#### **UI/UX Tests**
- [ ] All spacing multiples of 8px ✓
- [ ] Font sizes ≥11px ✓
- [ ] Touch targets ≥44px ✓
- [ ] Contrast ratios ≥4.5:1 ✓
- [ ] Animations <300ms feel instant ✓
- [ ] Spring physics feel natural ✓
- [ ] No layout shift (CLS < 0.1) ✓
- [ ] Visual regression: 0 pixel differences ✓
- [ ] Accessibility: 0 violations ✓
- [ ] Keyboard: All functions accessible ✓

#### **Edge Cases (Kiasu 10000% Coverage)**
- [ ] Empty tree (0 nodes) ✓
- [ ] Single node (1 node) ✓
- [ ] Flat tree (1 parent, 100 children) ✓
- [ ] Deep tree (100 levels) ✓
- [ ] Unbalanced tree (left heavy, right light) ✓
- [ ] Extreme zoom (10%, 1000%) ✓
- [ ] Rapid drag-drop (stress test) ✓
- [ ] Viewport resize during drag ✓
- [ ] Browser zoom (50%-200%) ✓
- [ ] Touch devices (iPad, tablets) ✓
- [ ] High DPI displays (Retina, 4K) ✓
- [ ] Slow network (3G simulation) ✓
- [ ] Screen readers (VoiceOver, NVDA, JAWS) ✓
- [ ] Reduced motion preference ✓
- [ ] Dark mode (prepared) ✓

### 5.4 Pixel-Perfect Validation

#### **Manual Inspection Protocol**
```
For each test case:

1. Take screenshot at 100% zoom (no browser zoom)
2. Open in design tool (Figma/Sketch)
3. Overlay 8pt grid
4. Measure each spacing value
5. Verify all values are multiples of 8
6. Check alignment of elements
7. Verify no sub-pixel rendering
8. Compare bezier curves to specification
9. Document any deviations
10. Re-implement if deviation found

Tolerance: 0 pixels
```

#### **Automated Validation**
```typescript
function validateSpacing(positions: PositionMap): ValidationResult {
  const errors: string[] = [];

  // Check all positions are 8pt grid aligned
  for (const [id, pos] of positions.entries()) {
    if (pos.x % 8 !== 0) {
      errors.push(`Node ${id} x=${pos.x} not on 8pt grid`);
    }
    if (pos.y % 8 !== 0) {
      errors.push(`Node ${id} y=${pos.y} not on 8pt grid`);
    }
  }

  // Check no overlaps
  const boxes = Array.from(positions.entries()).map(([id, pos]) => ({
    id,
    left: pos.x,
    right: pos.x + CARD_WIDTH,
    top: pos.y,
    bottom: pos.y + CARD_HEIGHT
  }));

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesOverlap(boxes[i], boxes[j])) {
        errors.push(`Nodes ${boxes[i].id} and ${boxes[j].id} overlap`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Part 6: Success Criteria

### 6.1 Definition of Done

A feature is **DONE** when:

1. ✅ **Functionally Complete**
   - All user stories implemented
   - All acceptance criteria met
   - No known bugs

2. ✅ **Technically Sound**
   - Code review approved (2+ reviewers)
   - 100% test coverage
   - 0 TypeScript errors
   - 0 ESLint warnings
   - Performance budget met

3. ✅ **Pixel Perfect**
   - 0 pixel deviations from spec
   - All values on 8pt grid
   - Visual regression tests pass
   - Manual inspection approved

4. ✅ **Accessible**
   - WCAG 2.1 AA compliant
   - Keyboard navigation complete
   - Screen reader tested
   - Reduced motion supported

5. ✅ **Documented**
   - Architecture decisions recorded
   - API reference complete
   - User guide updated
   - Change log entry added

### 6.2 Sign-Off Required

Before deployment, sign-off required from:
- [ ] Design Lead (pixel-perfect validation)
- [ ] Engineering Lead (code quality)
- [ ] QA Lead (test coverage)
- [ ] Accessibility Expert (a11y compliance)
- [ ] Product Owner (user acceptance)

---

## Part 7: Conclusion

This document establishes the **non-negotiable standards** for the Organization Chart feature. Every decision is justified, every value is intentional, every pixel is perfect.

> "We don't ship junk." — Steve Jobs

The spacing overlap issue identified in Image #1 will be resolved through:
1. Correct implementation of Reingold-Tilford algorithm
2. Apple-enhanced spacing (8pt grid, generous gaps)
3. Mathematical proof of correctness
4. 10000% test coverage
5. Pixel-perfect validation

**Next Steps:**
1. Implement corrected spacing algorithm
2. Execute comprehensive test suite
3. Generate compliance report
4. Submit for review

---

**Document Owner:** Development Team
**Last Updated:** 2025-11-13
**Review Cycle:** Before each release
**Status:** ✅ Active and Enforced
