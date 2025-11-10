# Cockpit Codebase - Complete Architecture Analysis

## 1. PROJECT TYPE & FRAMEWORK

**Framework Stack:**

- **Next.js 15.5.3** - React 19.1.1 meta-framework with App Router
- **React 19.1.1** - UI library (latest with experimental features)
- **TypeScript 5.x** - Strict type checking enabled
- **Bundler**: Webpack (via Next.js)
- **SSR/SSG**: Full server-side rendering with App Router

**Key Build Configuration** (`next.config.js`):

- React Compiler disabled (`reactCompiler: false`)
- TypeScript errors ignored during builds (checked separately in CI)
- ESLint disabled during builds (checked separately in CI)
- Comprehensive CSP (Content Security Policy) headers configured
- Service Worker support enabled
- Security headers: X-Frame-Options, X-Content-Type-Options, HSTS

---

## 2. COMPONENT ARCHITECTURE

### Component Hierarchy & Organization

```
src/components/
├── admin/                  # Admin-only features
│   ├── AccessCodeModal.tsx
│   ├── SecurityDashboardClient.tsx
│   └── UserManagementClient.tsx
│
├── layout/                 # Core layout components
│   ├── AppLayout.tsx       # Main app shell with header/navigation
│   ├── Header.tsx
│   ├── Container.tsx
│   ├── Section.tsx
│   └── Footer.tsx
│
├── project-v2/             # Modern project management UI (v2)
│   ├── ProjectShell.tsx     # Root project wrapper
│   ├── ProjectLayout.tsx    # Project-specific layout
│   ├── AppLayout.tsx        # Sub-app layout
│   ├── shared/              # Shared project components
│   │   ├── ResetButton.tsx
│   │   ├── ModeIndicator.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingState.tsx
│   │   ├── StatBadge.tsx
│   │   └── SlideOver.tsx
│   ├── modes/               # Different project modes
│   │   ├── ResourcePanelVibe.tsx
│   │   ├── ResourcePanelAntD.tsx
│   │   ├── PlanMode.tsx
│   │   ├── PresentMode.tsx
│   │   ├── CaptureMode.tsx
│   │   └── DecideMode.tsx
│   └── modals/
│       └── RegenerateModal.tsx
│
├── presales/               # Presales/RFP capture components
│   ├── ModeSelector.tsx
│   ├── ManualChipEntry.tsx
│   ├── CompletenessRing.tsx
│   ├── ChipCapture.tsx
│   ├── DecisionBar.tsx
│   ├── CriticalGapsAlert.tsx
│   └── GapCards.tsx
│
├── project/                # Legacy project components (v1)
│   ├── PhaseCard.tsx
│   ├── ChipsSidebar.tsx
│   ├── Inspector.tsx
│   ├── ProjectCanvas.tsx
│   ├── ResizablePanel.tsx
│   ├── PresentCanvas.tsx
│   ├── TimelineCanvas.tsx
│   ├── DecisionCanvas.tsx
│   ├── WorkflowProgress.tsx
│   └── CaptureCanvas.tsx
│
├── dashboard-v2/           # Modern dashboard (v2)
│   ├── panels/
│
├── data-display/           # Data visualization components
│   ├── Progress.tsx
│   ├── StatCard.tsx
│   ├── Card.tsx
│   └── Badge.tsx
│
├── domain/                 # Domain-specific components
│   ├── DecisionCard.tsx
│   ├── PhaseCard.tsx
│   ├── GanttChart.tsx
│   ├── ChatMessage.tsx
│   └── CelebrationModal.tsx
│
├── shared/                 # Shared UI components
│   ├── AriaLive.tsx        # Accessibility
│   ├── OfflineIndicator.tsx
│   ├── CommandPalette.tsx
│   ├── KeyboardShortcutsHelp.tsx
│   └── SkeletonLoaders.tsx
│
├── theme/                  # Theme management
│   └── ThemeProvider.tsx   # Light/Dark mode context
│
├── ui/                     # Low-level UI building blocks
│   ├── Container.tsx
│   ├── DecisionPill.tsx
│   ├── HexLoader.tsx
│   ├── LoadingScreen.tsx
│   ├── ResponsiveShell.tsx  # Responsive layout wrapper
│   ├── Typography.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── textarea.tsx
│   └── tooltip.tsx
│
├── timeline/               # Timeline visualization
│   └── core/               # Timeline engine
│
├── virtualized/            # Virtualized/windowed lists
├── forms/                  # Form-related components
├── login/                  # Authentication UI
├── onboarding/             # User onboarding flows
├── export/                 # Export functionality (PDF, Excel, etc.)
├── estimator/              # Estimation tools
├── gantt-tool/             # Gantt chart visualization
├── resource-planning/      # Resource allocation
├── decision-support/       # Decision-making support
├── collaboration/          # Real-time collaboration features
├── benchmarks/             # Benchmarking tools
└── organization/           # Organizational charts/structures
```

### UI Component Library (`src/ui/`)

Structured for consistency and type safety:

```
src/ui/
├── compat/
│   └── AntDThemeBridge.tsx    # Theme bridge between design system & Ant Design
├── components/                # Reusable component library
│   ├── Alert.tsx              # Alert/notification component
│   ├── Breadcrumb.tsx         # Navigation breadcrumbs
│   ├── Button.tsx             # Core button (design system)
│   ├── Checkbox.tsx           # Form checkbox
│   ├── Input.tsx              # Form input (Ant Design wrapper)
│   ├── Modal.tsx              # Modal dialog
│   ├── Pagination.tsx         # Data table pagination
│   ├── Progress.tsx           # Progress bar
│   ├── Select.tsx             # Dropdown select
│   ├── Skeleton.tsx           # Skeleton loading placeholder
│   ├── Tabs.tsx               # Tabbed interface
│   ├── Toggle.tsx             # Toggle switch
│   └── Tooltip.tsx            # Tooltip overlay
├── datagrid/
│   └── AntDataGrid.tsx        # Table/DataGrid wrapper
├── layout/
│   ├── AppShell.tsx           # Main app shell (sidebar + main content)
│   └── PageHeader.tsx         # Page header component
└── toast/
    └── ToastProvider.tsx      # Toast notification system (context-based)
```

**Total Component Count:** 214 TSX files in `/components/` + 18 in `/ui/`

---

## 3. STYLING ARCHITECTURE

### CSS Organization

**Core Style Files** (~883 lines total CSS):

```
src/styles/
├── tokens.css              (147 lines) - Design tokens & CSS variables
├── motion.css              (213 lines) - Animations & transitions
├── button-normalize.css    (226 lines) - Button resets/normalization
├── vibe-theme.css          (207 lines) - Theme customization
└── unified-theme.css       (90 lines)  - Unified theme definitions

+ app/globals.css            (776 lines) - Global styles & utilities
```

### Styling System: **Tailwind CSS 3.4.0 + CSS Variables + Ant Design**

**Multi-layered approach:**

1. **Tailwind CSS** - Utility-first framework
   - Custom screens: `xs` (475px), `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)
   - Fluid typography using `clamp()` for responsive text
   - Custom animations: fade-in, slide-up, slide-down, shake, focus-glow, pulse-slow
   - Custom spacing with `fluid-xs` through `fluid-2xl` (clamp-based)

2. **CSS Variables** - Design tokens system
   - Defined in `:root` and dark mode variants in `[data-theme='dark']`
   - Complete token set in `/src/styles/tokens.css`

3. **Ant Design Components** - Enterprise UI library
   - Integrated via `antd` v5.27.4
   - Theme bridging through `AntDThemeBridge.tsx`
   - ConfigProvider with custom component overrides

4. **CSS Modules** - Not used; prefers class-based styling

### Design Tokens System

**CSS Variables** (from `tokens.css`):

```css
/* Brand Colors */
--accent: #2563eb; /* Primary blue */
--accent-strong: #1d4ed8; /* Darker blue for hover */
--accent-subtle: #dbeafe; /* Light blue for backgrounds */

/* Greyscale (Neutral) */
--ink: #0f172a; /* Text color */
--ink-dim: #475569; /* Secondary text */
--ink-muted: #64748b; /* Tertiary text */

/* Surfaces */
--surface: #ffffff; /* Main background */
--surface-sub: #f8fafc; /* Secondary background */
--surface-raised: #ffffff; /* Elevated backgrounds */

/* Borders */
--line: #e5e7eb; /* Border color */

/* States */
--success: #16a34a;
--warn: #f59e0b;
--danger: #ef4444;

/* Focus */
--focus: #3b82f6;

/* Radii (8px base) */
--r-sm: 6px;
--r-md: 10px;
--r-lg: 14px;
--r-full: 9999px;

/* Spacing (8px grid) */
--s-4: 4px;
--s-8: 8px;
--s-12: 12px;
--s-16: 16px;
--s-20: 20px;
--s-24: 24px;
--s-32: 32px;
--s-40: 40px;
--s-48: 48px;
--s-64: 64px;

/* Shadows (subtle Apple-style) */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.12);

/* Motion */
--dur: 180ms; /* Standard duration */
--dur-slow: 300ms; /* Slow duration */
--ease: cubic-bezier(0.2, 0.8, 0.2, 1); /* Apple-style easing */

/* Z-index layers */
--z-dropdown: 1000;
--z-sticky: 1020;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-toast: 1060;
--z-tooltip: 1070;

/* Gantt Timeline Colors */
--g-grid: #eef2f6;
--g-weekend: rgba(2, 6, 23, 0.03);
--g-holiday: rgba(244, 63, 94, 0.06);
--g-bar: #111827; /* Gantt bars (dark charcoal) */
--g-bar-accent: var(--accent);
--g-bar-critical: #ef4444;
--g-bar-progress: #10b981;
```

**Dark Mode Support:**

- Class-based: `.dark` or `[data-theme='dark']` on `<html>`
- Full token remapping for dark backgrounds, text, borders
- Automatic via `prefers-color-scheme` media query

### Ant Design Integration

**Theme Bridge** (`AntDThemeBridge.tsx`):

- Reads CSS variables at runtime
- Maps to Ant Design ConfigProvider
- Supports both light and dark algorithms
- Component-level overrides for Modal, Dropdown, Select, Input, DatePicker, Form

**Ant Design Customizations:**

```typescript
ConfigProvider theme={{
  token: {
    colorPrimary,        // --accent
    colorSuccess,        // --success
    colorWarning,        // --warn
    colorError,          // --danger
    colorBgBase,         // --surface
    colorTextBase,       // --ink
    colorBorder,         // --line
    borderRadius: 10,    // --r-md
    fontFamily,          // --font-sans
  },
  algorithm: lightAlgorithm | darkAlgorithm,
  components: {
    Modal: { borderRadiusLG: 16, ... },
    Dropdown: { borderRadiusLG: 12, ... },
    Select: { controlHeight: 40, ... },
    Input: { controlHeight: 40, ... },
    Form: { labelFontSize: 14, ... },
  }
}}
```

### Typography System

**Font Stack:**

```css
--font-sans:
  -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
  "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
--font-mono: ui-monospace, "SF Mono", "Monaco", "Cascadia Code", "Courier New", monospace;
```

**Responsive Typography** (from Tailwind):

- Font sizes use `clamp()` for fluid scaling
- All sizes automatically responsive between mobile and desktop
- Example: `font-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)`

### Animation & Motion System

**Motion Tokens:**

- Duration: `--dur: 180ms` (standard), `--dur-slow: 300ms`
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (Apple-style ease-out)
- Accessibility: Respects `prefers-reduced-motion`

**Keyframe Animations:**

- `fade-in`, `fade-out` - Opacity transitions
- `slide-up`, `slide-down`, `slide-left`, `slide-right` - Transform-based
- `scale-in` - Scale from 0.96 to 1
- `slideInFromTop`, `fadeOutUp` - App-specific (notifications)
- `skeleton-pulse`, `shimmer` - Loading states
- `shake`, `ripple` - Interaction feedback

**Utility Classes** (motion.css):

- `.transition-fast`, `.transition-slow`
- `.transition-colors`, `.transition-opacity`, `.transition-transform`, `.transition-all`
- `.hover-lift`, `.hover-scale`
- `.animate-fade-in`, `.animate-slide-up`, etc.

---

## 4. RESPONSIVE DESIGN STRATEGY

### Breakpoints

**Tailwind Custom Screens:**

```javascript
screens: {
  'xs': '475px',    // Extra small (mobile landscape)
  'sm': '640px',    // Small (tablet)
  'md': '768px',    // Medium (tablet landscape)
  'lg': '1024px',   // Large (laptop)
  'xl': '1280px',   // Extra large (desktop)
  '2xl': '1536px',  // 2x extra large (large desktop)
}
```

**Mobile-First Approach:**

- Default styles for mobile
- Breakpoint prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### Fluid Typography & Spacing

**Clamp-based Responsive Values:**

```css
/* Font sizes scale fluidly */
font-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem)
font-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)
font-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem)
font-2xl: clamp(1.5rem, 1.3rem + 1vw, 1.875rem)

/* Spacing scales fluidly */
fluid-sm: clamp(0.5rem, 0.4rem + 0.5vw, 1rem)
fluid-md: clamp(1rem, 0.8rem + 1vw, 1.5rem)
fluid-lg: clamp(1.5rem, 1.2rem + 1.5vw, 2rem)
```

### Responsive Components

**ResponsiveShell Component** (`src/components/ui/ResponsiveShell.tsx`):

```typescript
interface ResponsiveShellProps {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  as?: "div" | "main" | "section" | "article";
}

// Padding scales per breakpoint:
// md: px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8
```

**ResponsiveGrid Component:**

```typescript
cols?: {
  default?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}
// Default: 1 column, 2 @ md, 3 @ lg
```

**ResponsiveStack Component:**

```typescript
spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
// Scales vertically across breakpoints
```

### Mobile-Specific Patterns

**Hidden Elements:**

- Desktop navigation: `hidden md:flex`
- Mobile navigation: `md:hidden`

**Responsive Sidebar:**

- Desktop: Persistent sidebar (240px or 64px)
- Mobile: Collapsible/hamburger menu

**Print Styles:**

```css
@media print {
  body {
    background: white;
    color: black;
  }
  .no-print {
    display: none !important;
  }
  a {
    text-decoration: underline;
  }
}
```

**Container Queries Support:**

```css
.content-max-w {
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}
```

---

## 5. LAYOUT COMPONENTS

### Core Layout System

**AppLayout** (`src/components/layout/AppLayout.tsx`):

- Ant Design `Layout` component wrapper
- Header with navigation, user menu, logout button
- Sticky header at top (z-50)
- Horizontal menu for navigation
- Content area with gray background
- Responsive: Full width, flexbox-based

**AppShell** (`src/ui/layout/AppShell.tsx`) - Alternative Layout:

- Sidebar + main content grid layout
- Collapsible sidebar (240px expanded, 64px collapsed)
- Mobile: Hamburger menu, top bar (12px height)
- Theme toggle button
- Responsive: Grid with `gridTemplateColumns`

**Container** (`src/components/layout/Container.tsx`):

- Max-width wrapper
- Centering utility
- Standard padding

**Section** (`src/components/layout/Section.tsx`):

- Semantic `<section>` wrapper
- Consistent spacing/padding

**Footer** (`src/components/layout/Footer.tsx`):

- Bottom page footer
- Semantic HTML structure

### Layout Wrapper Components

**ResponsiveShell** - General purpose responsive wrapper
**ResponsiveCard** - Card with responsive padding
**ResponsiveStack** - Vertical flex stack with responsive gaps
**ResponsiveGrid** - CSS grid with responsive column count

### Modal & Slide-Over Layout

**Modal.tsx** - Ant Design Modal wrapper

- Centered on screen
- Professional backdrop with blur effect
- Smooth fade-in animation (modalFadeIn keyframe)
- Custom sizing and positioning

**SlideOver.tsx** - Slide-in panel

- Part of project-v2 shared components
- Alternative to modal for side operations

---

## 6. MAIN APPLICATION ENTRY POINTS

### Root Entry Point

**`src/app/layout.tsx` (Root Layout):**

- Server component
- HTML structure setup
- Meta tags (title, description, favicons, manifest)
- Global script for initial loader (Lottie hex cube animation)
- Suspense boundary for OverlaySafety
- Providers wrapper

**`src/app/providers.tsx`:**

- Client component
- Provider hierarchy:
  1. `SessionProvider` (NextAuth)
  2. `QueryClientProvider` (TanStack React Query)
  3. `ThemeProvider` (Custom light/dark mode)
  4. `AntDThemeBridge` (Ant Design theme sync)
  5. `ToastProvider` (Toast notifications)
  6. Ant Design `App` component (message/modal/notification context)
  7. `OnboardingProvider` (Onboarding flow context)

### Page Routes

**Main entry:** `/` (`src/app/page.tsx`)

- Redirects to `/login` if not authenticated
- Redirects to `/dashboard` for regular users
- Redirects to `/admin` for admin users

**Key Routes:**

- `/login` - Authentication page
- `/dashboard` - Main dashboard
- `/project/*` - Project management (capture/plan/present/decide modes)
- `/admin/*` - Admin panel
- `/gantt/*` - Gantt chart visualization
- `/estimator` - Estimation tool
- `/settings/*` - User settings

**Key App Routing Files:**

```
src/app/
├── page.tsx                  # Root redirect logic
├── layout.tsx                # Root layout + providers
├── globals.css               # Global styles
├── dashboard/page.tsx        # Main dashboard
├── login/
│   ├── page.tsx
│   └── [mode]/page.tsx       # Login modes (passkey/magic/admin)
├── project/
│   ├── page.tsx              # Project router
│   ├── capture/page.tsx      # Capture mode
│   ├── plan/page.tsx         # Plan mode
│   ├── present/page.tsx      # Present mode
│   └── decide/page.tsx       # Decide mode
├── admin/
│   ├── page.tsx
│   ├── users/page.tsx
│   ├── security/page.tsx
│   └── ...
└── settings/
    └── security/page.tsx
```

### Initial Loader

**Hex Cube Animation** (Lottie-powered):

- Rendered via inline script in root layout
- Client-side only (prevents hydration mismatch)
- SVG-based 3D hex cube with rotation/scale animations
- Fades out on page load completion
- Colors: Shades of green (#b7e8c4 to #d0f5e8)

### Suspense & Streaming

**Suspense Boundaries:**

```tsx
<Suspense fallback={null}>
  <OverlaySafety />
</Suspense>
```

**OverlaySafety Component:**

- Prevents overlays from capturing clicks
- Marks invisible overlays with `pointer-events: none`

---

## 7. CONFIGURATION FILES & DESIGN TOKENS

### Core Config Files

**`tailwind.config.js`:**

- Content scanning: `./src/**/*.{js,ts,jsx,tsx,mdx}`
- Dark mode: Class-based (`class` or `[data-theme="dark"]`)
- Custom screens, spacing, font sizes, animations
- No Tailwind plugins

**`postcss.config.js`:**

```javascript
plugins: {
  tailwindcss: {},
  autoprefixer: {},
}
```

**`next.config.js`:**

- TypeScript: `ignoreBuildErrors: true` (checked in CI)
- ESLint: `ignoreDuringBuilds: true` (checked in CI)
- Security headers with CSP, HSTS, X-Frame-Options, etc.
- Service Worker configuration
- Webpack fallback config for Node.js modules in browser

**`tsconfig.json`:**

- `target: ES2017`, `module: esnext`
- `strict: true` (full type checking)
- Path alias: `@/*` -> `./src/*`
- JSX: `preserve` (for Next.js handling)

**`.env.example` & `.env.production.example`:**

- Database: `DATABASE_URL`
- NextAuth: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- API endpoints
- Feature flags
- Analytics keys

### Design System Configuration

**`src/lib/design-system.ts`:**

- Comprehensive design token definitions
- Spacing scale (8px grid)
- Typography scale (modular 1.25x ratio)
- Color palettes (primary blue, secondary purple, grays, states)
- Component-level styling presets
- Animation/motion configurations

**`src/styles/tokens.css`:**

- CSS custom properties (variables)
- Root color values
- Dark mode overrides
- Z-index scale
- All values correspond to design-system.ts

**`src/styles/motion.css`:**

- Motion tokens and timings
- Keyframe definitions
- Utility animation classes
- Accessibility: prefers-reduced-motion support

**`src/styles/button-normalize.css`:**

- Button reset styles
- Consistent button appearance across browsers
- Removes default UA button styling

### TypeScript & ESLint Config

**`tsconfig.json`:**

- Strict mode enabled
- Incremental builds
- Path aliases for clean imports
- Plugin: Next.js

**`.eslintrc.cjs`:**

- `eslint-config-next`
- TypeScript support via `@typescript-eslint`
- Rules configured for React 19 compatibility

### Prettier & Code Formatting

**`.prettierrc.json`:**

```json
{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true
}
```

---

## 8. BUILD & BUNDLER SETUP

### Build System

**Builder:** Next.js 15.5.3 (built on Webpack 5)

**Build Process** (`package.json`):

```bash
npm run build
# 1. Runs: prisma generate (database schema)
# 2. Runs: next build (Next.js compilation)

npm run dev
# Next.js development server with HMR
```

**Build Artifacts:**

- Output: `.next/` directory
- Server functions bundled separately
- Client bundles with code splitting
- Incremental builds enabled

### Bundling Strategy

**Code Splitting:**

- Next.js automatic code splitting per route
- Dynamic imports via `next/dynamic`
- React lazy + Suspense for component-level splitting

**Browser Polyfills:**

```javascript
// webpack config handles Node.js module fallbacks
config.resolve.fallback = {
  fs: false,
  net: false,
  crypto: false,
  path: false,
  // ... other Node built-ins
};
```

### Development Tools

**HMR (Hot Module Replacement):**

- Enabled by default in dev mode
- Preserves state across rebuilds

**Build Analyze:**

```bash
npm run analyze
# Bundles with Webpack Bundle Analyzer to see sizes
```

**TypeScript Checking:**

```bash
npm run typecheck
# Runs tsc without emit (separate from build)
```

**Linting:**

```bash
npm run lint
# Runs next lint with high warning threshold
```

### Dependencies Structure

**Core Framework:**

- `next@15.5.3`, `react@19.1.1`, `react-dom@19.1.1`

**State Management:**

- `zustand@5.0.8` - Lightweight state management
- `@tanstack/react-query@5.90.2` - Server state management

**UI Libraries:**

- `antd@5.27.4` - Enterprise UI components
- `lucide-react@0.544.0` - Icon library
- `framer-motion@12.23.22` - Animation library
- `clsx@2.1.1` - Utility for class name merging

**Forms & Data:**

- `react-hot-toast@2.6.0` - Toast notifications (alternative to custom)
- `zod@4.1.11` - Schema validation
- `fuse.js@7.1.0` - Fuzzy search

**Data Visualization:**

- `reactflow@11.11.4` - Node-graph visualization
- `vis-timeline@8.3.1` - Timeline component
- `dagre@0.8.5` - DAG layout algorithm
- `recharts@3.2.1` - React charts
- `chart.js@4.5.1` - Chart library
- `react-chartjs-2@5.3.1` - Chart.js wrapper

**Export/Report Generation:**

- `@react-pdf/renderer@4.3.1` - PDF generation
- `jspdf@3.0.3`, `jspdf-autotable@5.0.2` - PDF tables
- `html2canvas@1.4.1` - Screenshot to canvas
- `pptxgenjs@4.0.1` - PowerPoint generation
- `exceljs@4.4.0` - Excel file generation
- `xlsx@0.18.5` - Excel reading/writing

**Authentication:**

- `next-auth@4.24.11` - Session & auth
- `@auth/prisma-adapter@2.10.0` - Database adapter
- `@simplewebauthn/browser@13.2.2`, `@simplewebauthn/server@13.2.2` - Passkey support
- `jose@6.1.0` - JWT handling

**Security & Utilities:**

- `bcryptjs@3.0.2` - Password hashing
- `dompurify@3.2.7` - XSS prevention
- `speakeasy@2.0.0` - TOTP/2FA
- `qrcode@1.5.4` - QR code generation
- `@upstash/redis@1.35.4`, `@upstash/ratelimit@2.0.6` - Rate limiting

**Other:**

- `lodash@4.17.21` - Utility functions
- `date-fns@4.1.0`, `date-fns-tz@3.2.0` - Date manipulation
- `ua-parser-js@2.0.6` - User agent parsing
- `tailwindcss@3.4.0` - Utility CSS
- `prisma@6.18.0` - Database ORM

---

## 9. COMPLETE DIRECTORY STRUCTURE WITH PURPOSES

```
/workspaces/cockpit/
│
├── src/
│   ├── app/                          # Next.js App Router (routes & layouts)
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Root route (redirects)
│   │   ├── globals.css               # Global styles (776 lines)
│   │   ├── providers.tsx             # Provider hierarchy
│   │   ├── (routes)/                 # Route groups
│   │   │   ├── dashboard/
│   │   │   ├── login/
│   │   │   ├── project/
│   │   │   ├── admin/
│   │   │   ├── settings/
│   │   │   └── ...
│   │   ├── api/                      # API routes (Next.js route handlers)
│   │   └── ...
│   │
│   ├── components/                   # React components (214 TSX files)
│   │   ├── admin/                    # Admin features
│   │   ├── layout/                   # Layout wrappers (AppLayout, Container, Section)
│   │   ├── project-v2/               # Modern project UI
│   │   │   ├── shared/               # Shared project components
│   │   │   ├── modes/                # Capture/Plan/Present/Decide modes
│   │   │   └── modals/
│   │   ├── presales/                 # RFP capture
│   │   ├── project/                  # Legacy project UI
│   │   ├── dashboard-v2/             # Modern dashboard
│   │   ├── data-display/             # Visual components
│   │   ├── domain/                   # Domain-specific logic
│   │   ├── shared/                   # Shared utilities
│   │   ├── theme/                    # ThemeProvider
│   │   ├── ui/                       # UI building blocks
│   │   ├── timeline/                 # Timeline visualizations
│   │   ├── forms/                    # Form components
│   │   ├── login/                    # Auth UI
│   │   ├── export/                   # Export functionality
│   │   ├── estimator/                # Estimation tools
│   │   ├── gantt-tool/               # Gantt charts
│   │   ├── resource-planning/        # Resource allocation
│   │   └── ...
│   │
│   ├── ui/                           # UI component library (18 TSX files)
│   │   ├── compat/                   # Theme bridge
│   │   ├── components/               # Reusable components
│   │   ├── datagrid/                 # Table components
│   │   ├── layout/                   # Layout components
│   │   └── toast/                    # Toast system
│   │
│   ├── styles/                       # Global stylesheets
│   │   ├── tokens.css                # Design tokens (147 lines)
│   │   ├── motion.css                # Animations (213 lines)
│   │   ├── button-normalize.css      # Button resets (226 lines)
│   │   ├── vibe-theme.css            # Theme customization (207 lines)
│   │   └── unified-theme.css         # Theme unified (90 lines)
│   │
│   ├── lib/                          # Utilities & helpers
│   │   ├── design-system.ts          # Design tokens (TypeScript)
│   │   ├── auth.ts                   # Auth helpers
│   │   ├── db.ts                     # Database utilities
│   │   ├── chip-parser.ts            # Data parsing
│   │   ├── estimation-engine.ts      # Estimation logic
│   │   ├── export/                   # Export functionality
│   │   ├── cache/                    # Caching layer
│   │   ├── offline/                  # Offline support
│   │   └── ...
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useTheme.ts               # Theme management
│   │   ├── useKeyboardShortcuts.ts   # Keyboard handling
│   │   ├── useColorMorph.ts          # Color animations
│   │   └── ...
│   │
│   ├── stores/                       # Zustand state stores
│   │   ├── project-store.ts
│   │   ├── timeline-store.ts
│   │   ├── resource-planning-store.ts
│   │   ├── user-preferences-store.ts
│   │   └── ...
│   │
│   ├── types/                        # TypeScript type definitions
│   │
│   ├── utils/                        # Utility functions
│   │
│   ├── config/                       # Configuration
│   │   └── resources.json            # Resource definitions
│   │
│   └── data/                         # Sample/fixture data
│
├── public/                           # Static assets
│   ├── favicon.ico, favicon-*.png    # Favicons
│   ├── apple-touch-icon-*.png        # Apple icons
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   └── ...
│
├── prisma/                           # Database schema & migrations
│   ├── schema.prisma                 # Prisma ORM schema
│   └── migrations/                   # Database migrations
│
├── tests/                            # Test files
│   ├── auth/                         # Auth tests
│   ├── integration/                  # Integration tests
│   ├── e2e/                          # End-to-end tests (Playwright)
│   └── ...
│
├── scripts/                          # Build & utility scripts
│   ├── test-performance.ts
│   ├── rotate-secrets.ts
│   ├── generate-admin-code.ts
│   └── ...
│
├── .next/                            # Build output (gitignored)
│
├── node_modules/                     # Dependencies (gitignored)
│
├── Configuration Files:
│   ├── next.config.js                # Next.js configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── postcss.config.js             # PostCSS configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── .eslintrc.cjs                 # ESLint configuration
│   ├── .prettierrc.json              # Prettier formatting
│   ├── vitest.config.ts              # Vitest configuration
│   ├── playwright.config.ts          # Playwright E2E config
│   ├── package.json                  # Dependencies & scripts
│   ├── pnpm-lock.yaml                # Lock file (pnpm)
│   │
│   ├── .env.example                  # Environment template
│   ├── .env.production                # Production config
│   ├── .env.production.example       # Production template
│   │
│   ├── README.md                     # Project documentation
│   ├── CHANGELOG.md                  # Change history
│   │
│   ├── .gitignore                    # Git ignore rules
│   ├── .vercel/                      # Vercel deployment config
│   └── ...
```

---

## 10. RESPONSIVE DESIGN & MOBILE PATTERNS

### Responsive Layout Patterns

**1. Grid-based Responsive Layout:**

```tsx
<ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
  {/* Children scale across breakpoints */}
</ResponsiveGrid>
```

**2. Padding Scales by Viewport:**

```css
/* From ResponsiveShell */
px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8

/* Mobile: 1rem padding, Tablet: 1.5rem, Desktop: 2rem */
```

**3. Typography Scales Fluidly:**

```css
font-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
/* Automatically scales between viewport widths */
```

### Mobile-First Class Patterns

**Visibility Control:**

```tsx
{
  /* Desktop only */
}
<div className="hidden md:block">Desktop content</div>;

{
  /* Mobile only */
}
<div className="md:hidden">Mobile content</div>;
```

**Responsive Spacing:**

```tsx
<div className="space-y-2 sm:space-y-4 lg:space-y-6">{/* Gap increases at each breakpoint */}</div>
```

**Responsive Grid:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

### Mobile Navigation Pattern

**AppShell Component:**

- Desktop: Persistent sidebar
- Mobile: Hamburger menu + top bar
- Transition: Hidden sidebar at `md` breakpoint

```tsx
{
  /* Mobile menu toggle */
}
<div className="md:hidden sticky top-0 h-12 flex items-center">
  <button onClick={() => setOpen(!open)} aria-label="Toggle nav" />
</div>;

{
  /* Desktop sidebar */
}
<aside className="hidden md:flex flex-col" style={{ gridTemplateColumns: "240px 1fr" }}>
  {/* Sidebar nav */}
</aside>;
```

### Print Styles

**Print CSS:**

```css
@media print {
  body {
    background: white;
    color: black;
  }
  .no-print {
    display: none !important;
  }
  a {
    text-decoration: underline;
  }
  .max-w-container-xl {
    max-width: 100%;
  }
}
```

### Viewport Meta Tag

**HTML Meta (in layout.tsx):**

```html
<html lang="en">
  <body className="{inter.className}" suppressHydrationWarning></body>
</html>
```

(Note: Viewport meta configured via Next.js automatically)

---

## SUMMARY: Architecture Highlights

### Strengths

1. **Modern Stack**: Next.js 15 + React 19 + TypeScript
2. **Comprehensive Design System**: CSS variables + Tailwind + Ant Design bridge
3. **Component Library**: 230+ reusable components across two layers (UI + features)
4. **Responsive First**: Fluid typography, mobile-first breakpoints, Tailwind utility classes
5. **Theme Support**: Light/dark modes with CSS variable switching
6. **Animation System**: Subtle, accessible motion with prefers-reduced-motion support
7. **Type Safety**: Strict TypeScript, Zod validation
8. **Security**: CSP headers, auth guards, CSRF protection, sanitization
9. **Performance**: Code splitting, lazy loading, virtualization
10. **Accessibility**: ARIA live regions, keyboard shortcuts, semantic HTML

### Key Scalability Points

- Modular component structure (separate v1/v2 components)
- Store-based state management (Zustand)
- Server/client state separation (React Query)
- Design tokens centralized in CSS variables
- Clear dependency injection via providers
- Test-ready architecture (Vitest + Playwright)
