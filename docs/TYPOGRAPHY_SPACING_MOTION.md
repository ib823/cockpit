# Typography, Spacing, and Motion Standards (C-06)

Status: Active
Last Updated: 2026-02-20

## Single Source of Truth

CSS variables in `src/styles/apple-design-system.css` are the canonical token source.
TypeScript constants in `src/lib/design-system/tokens.ts` mirror these for JS contexts.
Do not define new values outside these two files.

---

## Typography

### Font Families
| Token | Value | Usage |
|---|---|---|
| `--font-display` | SF Pro Display / system fallback | Headings, page titles |
| `--font-text` | SF Pro Text / system fallback | Body text, UI labels |
| `--font-mono` | SF Mono / monospace fallback | Code, data, technical values |

### Font Sizes (7-step scale)
| Token | Size | Usage |
|---|---|---|
| `--text-display-large` | 1.75rem (28px) | Page titles |
| `--text-display-medium` | 1.5rem (24px) | Section headers |
| `--text-display-small` | 1.25rem (20px) | Card titles, subheadings |
| `--text-body-large` | 0.9375rem (15px) | Emphasized body text |
| `--text-body` | 0.8125rem (13px) | Standard body text |
| `--text-detail` | 0.6875rem (11px) | Labels, captions, metadata |
| `--text-detail-small` | 0.625rem (10px) | Fine print, timestamps |

### Font Weights
| Token | Value |
|---|---|
| `--weight-regular` | 400 |
| `--weight-medium` | 500 |
| `--weight-semibold` | 600 |
| `--weight-bold` | 700 |

### Line Heights
| Token | Value | Usage |
|---|---|---|
| `--leading-tight` | 1.2 | Headings, single-line labels |
| `--leading-normal` | 1.5 | Body text |
| `--leading-relaxed` | 1.6 | Long-form reading |

### Letter Spacing
| Token | Value | Usage |
|---|---|---|
| `--tracking-tight` | -0.01em | Large display text |
| `--tracking-normal` | 0 | Body text |
| `--tracking-wide` | 0.01em | Uppercase labels, buttons |

### Pre-composed Utility Classes
Use these in HTML/JSX for consistent text styling:
- `.display-large`, `.display-medium`, `.display-small` — headings
- `.body-large`, `.body`, `.body-medium`, `.body-semibold` — body text
- `.text-primary` (#1D1D1F), `.text-secondary` (#636366), `.text-tertiary` (#AEAEB2)

### Rules
1. Always use token variables, never hardcoded `font-size` / `font-weight` values.
2. Prefer utility classes (`.display-large`) over manual composition of variables.
3. For responsive text, Tailwind's `text-{size}` classes use fluid `clamp()` — this is acceptable for Tailwind-based components.

---

## Spacing

### 8pt Grid Scale (15 steps)
| Token | Value | Typical Usage |
|---|---|---|
| `--space-0` | 0 | Reset |
| `--space-1` | 0.125rem (2px) | Hairline gaps |
| `--space-2` | 0.25rem (4px) | Tight inline spacing |
| `--space-3` | 0.375rem (6px) | Compact padding |
| `--space-4` | 0.5rem (8px) | Icon-text gaps, small padding |
| `--space-6` | 0.75rem (12px) | Card padding (compact) |
| `--space-8` | 1rem (16px) | Standard card padding |
| `--space-10` | 1.25rem (20px) | Section padding |
| `--space-12` | 1.5rem (24px) | Modal/dialog padding |
| `--space-16` | 2rem (32px) | Large section margins |
| `--space-20` | 2.5rem (40px) | Page section gaps |
| `--space-24` | 3rem (48px) | Hero spacing |
| `--space-32` | 4rem (64px) | Major layout divisions |
| `--space-40` | 5rem (80px) | Full-bleed section margins |
| `--space-48` | 6rem (96px) | Maximum spacing |

### Rules
1. Use `--space-*` variables for `padding`, `margin`, `gap` in CSS.
2. For Tailwind, use standard utility classes (`p-4`, `gap-3`, etc.) which align with the 4px base grid.
3. For JS-driven spacing (inline `style`), use the `SPACING` object from `tokens.ts`.
4. Vertical rhythm: prefer `--space-8` (16px) as the base unit for vertical spacing between blocks.

---

## Motion

### Duration Tokens
| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | 0ms | Immediate state change (no animation) |
| `--duration-quick` | 100ms | Micro-interactions (hover, focus) |
| `--duration-default` | 200ms | Standard transitions (toggle, expand) |
| `--duration-slow` | 300ms | Complex transitions (modal, drawer) |
| `--duration-slower` | 500ms | Page transitions, large reveals |

### Easing Functions
| Token | Curve | Usage |
|---|---|---|
| `--easing-default` | cubic-bezier(0.4, 0.0, 0.2, 1) | General purpose |
| `--easing-in` | cubic-bezier(0.4, 0.0, 1, 1) | Elements entering view |
| `--easing-out` | cubic-bezier(0.0, 0.0, 0.2, 1) | Elements exiting view |
| `--easing-in-out` | cubic-bezier(0.4, 0.0, 0.2, 1) | Symmetric transforms |
| `--easing-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | Apple-style bounce |

### Available Animations (from `motion.css`)
- `.animate-fade-in`, `.animate-fade-out` — opacity 0↔1
- `.animate-slide-up`, `.animate-slide-down` — vertical entry/exit
- `.animate-slide-left`, `.animate-slide-right` — horizontal entry/exit
- `.animate-scale-in` — scale from 0.95 to 1
- `.transition-fast` (100ms), `.transition-slow` (300ms) — quick transition helpers
- `.transition-colors`, `.transition-opacity`, `.transition-transform`, `.transition-all`
- `.hover-lift`, `.hover-scale` — interactive hover effects

### Accessibility
Both `apple-design-system.css` and `motion.css` include `@media (prefers-reduced-motion: reduce)` blocks that disable all animations. This is mandatory — never add animations without respecting this media query.

### Rules
1. Always use duration/easing tokens, never hardcoded `0.3s ease` values.
2. For transitions in CSS: `transition: property var(--duration-default) var(--easing-default)`.
3. For TypeScript contexts, use `getTransition()` from `tokens.ts`.
4. Every animated element must be invisible to `prefers-reduced-motion: reduce`.
5. Prefer CSS utility classes (`.animate-fade-in`) over custom `@keyframes` for standard patterns.
6. For Tailwind components, `animate-fade-in` and `animate-slide-up` are available via `tailwind.config.js`.

---

## Known Debt

1. **Tailwind/CSS token gap**: Tailwind animation durations (0.3s, 0.4s) don't match CSS tokens (100ms, 200ms, 300ms). New Tailwind animations should use token-aligned values.
2. **TypeScript/CSS naming mismatch**: CSS uses `--space-16` (32px) but TypeScript uses `SPACING[8]` (32px). Reference the CSS variable name in comments when using TypeScript constants.
3. **Scattered component animations**: Some components define custom `@keyframes` inline. These should migrate to `motion.css` when touched.
