# Cockpit Codebase - Quick Reference Guide

## Framework Stack at a Glance

```
Next.js 15.5.3 (App Router)
├── React 19.1.1
├── TypeScript 5 (strict)
├── Tailwind CSS 3.4.0
├── Ant Design 5.27.4
├── Zustand 5.0.8
└── React Query 5.90.2
```

## Component Counts

| Layer                 | Count   | Location           |
| --------------------- | ------- | ------------------ |
| UI Library Components | 18      | `/src/ui/`         |
| Feature Components    | 214     | `/src/components/` |
| **Total**             | **232** | **Combined**       |

## Directory Map

```
src/
├── app/                    # Routes (Next.js App Router)
├── components/             # Feature components (214 files)
├── ui/                     # UI library (18 files)
├── styles/                 # CSS files (883 lines total)
├── lib/                    # Utilities & helpers
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state stores
├── types/                  # TypeScript definitions
├── config/                 # Configuration
└── data/                   # Sample data
```

## Styling System (3 Layers)

### 1. CSS Variables (Design Tokens)

**Source:** `src/styles/tokens.css` (147 lines)

```css
Colors:    --accent (#2563eb), --success, --warn, --danger
Spacing:   --s-4 through --s-64 (8px grid)
Radii:     --r-sm, --r-md, --r-lg, --r-full
Shadows:   --shadow-sm, --shadow-md, --shadow-lg
Motion:    --dur (180ms), --ease (apple style)
Z-Index:   --z-dropdown (1000) → --z-tooltip (1070)
```

### 2. Tailwind CSS

**File:** `tailwind.config.js`

```
Screens:   xs (475px), sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
Approach:  Mobile-first (default mobile, sm:, md:, lg:, xl: prefixes)
Typography: Fluid via clamp() - scales between min/preferred/max
```

### 3. Ant Design Theme Bridge

**File:** `src/ui/compat/AntDThemeBridge.tsx`

Maps CSS variables → Ant Design ConfigProvider at runtime

## Responsive Breakpoints

```
xs: 475px  (mobile landscape)
sm: 640px  (tablet)
md: 768px  (tablet landscape) ← Main breakpoint
lg: 1024px (laptop)
xl: 1280px (desktop)
2xl: 1536px (wide screens)
```

## Layout Components

| Component         | Purpose                                    | Location              |
| ----------------- | ------------------------------------------ | --------------------- |
| `AppLayout`       | Main app shell (header + content)          | `/components/layout/` |
| `AppShell`        | Sidebar + main (desktop/mobile responsive) | `/ui/layout/`         |
| `ResponsiveShell` | Responsive wrapper (max-width + padding)   | `/components/ui/`     |
| `ResponsiveGrid`  | Responsive grid (1→2→3 cols)               | `/components/ui/`     |
| `ResponsiveStack` | Responsive vertical stack                  | `/components/ui/`     |
| `ResponsiveCard`  | Responsive card with padding               | `/components/ui/`     |

## Theme Management

**Theme Provider:** `src/components/theme/ThemeProvider.tsx`

```typescript
// Usage
const { theme, setTheme } = useTheme();
// Values: 'light' | 'dark' | 'system'
// Applied to: <html> element class + data-theme attribute
// Persisted: localStorage
```

**Dark Mode CSS Variables:**

```css
:root[data-theme="dark"],
:root.dark {
  --ink: #e5e7eb;
  --surface: #0b0f17;
  --line: #1f2937;
  /* Full palette remapped */
}
```

## Key Entry Points

| Route              | File                               | Purpose                                          |
| ------------------ | ---------------------------------- | ------------------------------------------------ |
| `/`                | `src/app/page.tsx`                 | Root redirect (to /login, /dashboard, or /admin) |
| `/login`           | `src/app/login/page.tsx`           | Authentication                                   |
| `/dashboard`       | `src/app/dashboard/page.tsx`       | Main dashboard                                   |
| `/project/capture` | `src/app/project/capture/page.tsx` | RFP capture                                      |
| `/project/plan`    | `src/app/project/plan/page.tsx`    | Project planning                                 |
| `/project/present` | `src/app/project/present/page.tsx` | Presentation                                     |
| `/project/decide`  | `src/app/project/decide/page.tsx`  | Decision support                                 |
| `/admin`           | `src/app/admin/page.tsx`           | Admin panel                                      |

## Provider Hierarchy

```
<html>
  <body>
    <Providers>
      <SessionProvider>           ← NextAuth
        <QueryClientProvider>     ← React Query
          <ThemeProvider>         ← Light/Dark mode
            <AntDThemeBridge>     ← Ant Design theme sync
              <ToastProvider>     ← Notifications
                <App>             ← Ant Design context
                  <OnboardingProvider>
                    {children}
                  </OnboardingProvider>
                </App>
              </ToastProvider>
            </AntDThemeBridge>
          </ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </Providers>
  </body>
</html>
```

## State Management

| Library     | Purpose                        | Location                |
| ----------- | ------------------------------ | ----------------------- |
| Zustand     | Local state (11 stores)        | `src/stores/`           |
| React Query | Server state + caching         | Integrated in providers |
| Context     | Theme, Toast, Auth, Onboarding | Via `useContext` hooks  |

**Store Files:**

- `project-store.ts` - Project data
- `timeline-store.ts` - Timeline UI state
- `resource-planning-store.ts` - Resource allocation
- `user-preferences-store.ts` - User settings
- ... (7 more stores)

## CSS File Summary

| File                          | Lines     | Purpose                                      |
| ----------------------------- | --------- | -------------------------------------------- |
| `app/globals.css`             | 776       | Global styles, utilities, component patterns |
| `styles/tokens.css`           | 147       | Design tokens (CSS variables)                |
| `styles/motion.css`           | 213       | Animations, transitions, keyframes           |
| `styles/button-normalize.css` | 226       | Button resets, normalization                 |
| `styles/vibe-theme.css`       | 207       | Theme customizations                         |
| `styles/unified-theme.css`    | 90        | Unified theme definitions                    |
| **TOTAL**                     | **1,659** | —                                            |

## Design Tokens Reference

### Colors

```
Primary:     #2563eb (blue)
Success:     #16a34a (green)
Warning:     #f59e0b (amber)
Error:       #ef4444 (red)
```

### Spacing (8px Grid)

```
--s-4:  4px     --s-8:   8px    --s-12:  12px
--s-16: 16px    --s-20:  20px   --s-24:  24px
--s-32: 32px    --s-40:  40px   --s-48:  48px
--s-64: 64px
```

### Border Radius

```
--r-sm:   6px
--r-md:   10px
--r-lg:   14px
--r-full: 9999px (circle)
```

### Shadows

```
--shadow-sm: 0 1px 2px rgba(0,0,0,0.06)
--shadow-md: 0 8px 24px rgba(0,0,0,0.08)
--shadow-lg: 0 20px 40px rgba(0,0,0,0.12)
```

### Motion

```
--dur:      180ms (standard)
--dur-slow: 300ms (slow)
--ease:     cubic-bezier(0.2, 0.8, 0.2, 1) [Apple-style]
```

## Common Responsive Patterns

### Visibility

```tsx
// Desktop only
<div className="hidden md:block">Desktop content</div>

// Mobile only
<div className="md:hidden">Mobile content</div>
```

### Spacing Scales

```tsx
// Responsive padding
<div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
  Responsive padding (mobile → tablet → desktop)
</div>

// Responsive gaps
<div className="space-y-2 sm:space-y-4 lg:space-y-6">
  Responsive vertical spacing
</div>
```

### Grid Layouts

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  1 col (mobile) → 2 cols (tablet) → 3 cols (desktop)
</div>
```

### Typography

```css
/* Font sizes scale fluidly */
font-sm:   clamp(0.875rem, 0.8rem + 0.375vw, 1rem)
font-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)
font-lg:   clamp(1.125rem, 1rem + 0.625vw, 1.25rem)
font-2xl:  clamp(1.5rem, 1.3rem + 1vw, 1.875rem)
```

## Build & Scripts

```bash
npm run dev          # Start dev server (HMR enabled)
npm run build        # Production build
npm run start        # Run production build
npm run typecheck    # TypeScript checking
npm run lint         # ESLint checking
npm run format       # Prettier formatting
npm run test         # Run Vitest
npm run analyze      # Analyze bundle size
```

## Key Dependencies

| Package               | Version  | Purpose          |
| --------------------- | -------- | ---------------- |
| next                  | 15.5.3   | Framework        |
| react                 | 19.1.1   | UI library       |
| typescript            | 5.x      | Type checking    |
| tailwindcss           | 3.4.0    | Utility CSS      |
| antd                  | 5.27.4   | Enterprise UI    |
| zustand               | 5.0.8    | State management |
| @tanstack/react-query | 5.90.2   | Server state     |
| lucide-react          | 0.544.0  | Icons            |
| framer-motion         | 12.23.22 | Animations       |
| zod                   | 4.1.11   | Validation       |
| next-auth             | 4.24.11  | Authentication   |

## Security Headers (next.config.js)

```
✓ Content-Security-Policy (CSP)
✓ X-Frame-Options: DENY
✓ X-Content-Type-Options: nosniff
✓ Strict-Transport-Security (HSTS)
✓ Referrer-Policy: strict-origin-when-cross-origin
✓ Service Worker: allowed
```

## Accessibility Features

```
✓ ARIA live regions (AriaLive component)
✓ Keyboard shortcuts (useKeyboardShortcuts hook)
✓ Focus visible states (CSS focus-visible)
✓ Reduced motion support (@media prefers-reduced-motion)
✓ Semantic HTML (Layout, Section, etc.)
✓ Color contrast WCAG AA compliant
```

## Next Steps for New Developers

1. **Understand the structure:**
   - Read `CODEBASE_ARCHITECTURE.md` for detailed overview
2. **Review key files:**
   - `src/app/layout.tsx` - Root layout
   - `src/app/providers.tsx` - Provider setup
   - `src/styles/tokens.css` - Design tokens
   - `tailwind.config.js` - Tailwind configuration

3. **Explore components:**
   - `/src/ui/` - UI building blocks
   - `/src/components/` - Feature components

4. **Check styling:**
   - CSS variables in `src/styles/`
   - Tailwind utilities in `tailwind.config.js`
   - Component-specific styles in component files

5. **Test locally:**
   ```bash
   npm install
   npm run dev
   # Visit http://localhost:3000
   ```

---

**Complete documentation:** See `CODEBASE_ARCHITECTURE.md` for comprehensive details.
