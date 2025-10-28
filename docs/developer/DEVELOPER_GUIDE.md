# DEVELOPER_GUIDE.md

This file provides guidance for developers when working with code in this repository.

## Project Overview

**Keystone** - A Next.js application that transforms SAP implementation presales workflows from weeks into minutes. Extracts requirements from RFPs, makes key decisions, and generates project timelines with cost estimates.

**Tech Stack:**

- Next.js 15 (App Router) with TypeScript
- Zustand for state management with localStorage persistence
- Tailwind CSS + Framer Motion for UI
- Vitest for testing
- Prisma + PostgreSQL (database schema defined, optional backend)

## Common Commands

### Development

```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run typecheck        # TypeScript validation (NOT type-check)
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without writing
```

### Testing

```bash
npm test                     # Run all tests with Vitest (watch mode)
npm test -- --run            # Run tests once without watch
npm test -- <file-pattern>   # Run specific test file(s)
npm run test:integration     # Integration tests only
npm run test:e2e            # E2E tests only
npm run test:coverage       # Generate coverage report
```

**Example: Run single test file:**
```bash
npm test -- input-sanitizer.test.ts --run
npm test -- production-readiness.test.ts
```

### Analysis

```bash
npm run analyze     # Bundle size analysis (ANALYZE=true next build)
npm audit          # Check for security vulnerabilities
```

## Architecture Overview

### State Management (3 Zustand Stores)

The application uses three interconnected Zustand stores with localStorage persistence:

1. **presales-store** (`src/stores/presales-store.ts`)
   - Manages "chips" (extracted requirements from RFPs)
   - Tracks decisions (module combo, pricing, SSO mode, etc.)
   - Calculates completeness score (0-100%) with gap analysis
   - Modes: capture → decide → plan → review → present
   - Auto-transit when completeness >= 65% and no critical gaps

2. **timeline-store** (`src/stores/timeline-store.ts`)
   - Manages project phases, resources, and timeline calculations
   - Generates timelines from SAP package selections
   - Calculates costs, dates, and working days
   - Handles phase dependencies and intelligent sequencing
   - View modes: daily/weekly/biweekly/monthly zoom levels

3. **project-store** (`src/stores/project-store.ts`)
   - Orchestrates the entire workflow (4 modes)
   - Syncs presales → timeline conversion
   - Tracks manual overrides on generated timelines
   - Debounced auto-regeneration (500ms)
   - Resizable panel state (left/right panel widths)

**Store synchronization:** When presales chips/decisions change → project-store marks timeline stale → auto-regenerates in plan mode

### Data Flow Architecture

```
RFP Text Input → Chip Parser → Presales Store → Bridge → Timeline Store
                     ↓              ↓              ↓           ↓
                 10 chip types  Completeness  Scenario    Phase
                 + confidence   validation    Generator   Generation
```

**Key modules:**

- **chip-parser.ts**: Extracts structured data from unstructured RFP text
- **presales-to-timeline-bridge.ts**: Converts chips → ClientProfile + SAP packages
- **scenario-generator.ts**: Generates baseline project plans from chips
- **phase-generation.ts**: Creates timeline phases with intelligent sequencing
- **date-calculations.ts**: Business day calculations with holiday support

### UI Architecture (4 Modes)

The new UX follows Steve Jobs principles (see COMPLETE_UX_TRANSFORMATION.md):

**Unified Workflow (`/project`):**

1. **Capture** - Extract requirements from RFPs (chip extraction)
2. **Decide** - Make key decisions (modules, pricing, SSO)
3. **Plan** - Generate and refine timeline
4. **Present** - Client-ready presentation mode (full-screen)

**Components structure:**

- `src/components/project-v2/ProjectShell.tsx` - Main orchestrator
- `src/components/project-v2/modes/` - Mode-specific views
- `src/components/presales/` - Chip capture & decision components
- `src/components/timeline/` - Timeline visualization & controls

### Data Catalogs

- **sap-catalog.ts** - SAP modules, packages, and complexities
- **resource-catalog.ts** - Resource roles, rates by region (ABMY/ABSG/ABVN)
- **holidays.ts** - Regional holidays for date calculations

### Security & Performance

**Security measures** (see next.config.js):
- CSP headers with strict content policy (no unsafe-eval in production)
- Input sanitization on all user data (input-sanitizer.ts)
- Rate limiting on computation-heavy operations (100 chips per 60s)
- Error sanitization to prevent information leakage
- XSS protection: DOMPurify + protocol filtering (javascript:, data:, vbscript:)
- Prototype pollution prevention in estimation-engine.ts

**Performance optimizations:**
- Lazy loading: PlanMode & PresentMode components (25% bundle reduction)
- React memoization: useMemo/useCallback in heavy components
- Early returns in computed values (timeline-store.ts)
- All performance tests passing (50 phases < 5ms)

## Path Aliases

All imports use `@/*` alias:

```typescript
import { usePresalesStore } from "@/stores/presales-store";
import { Chip } from "@/types/core";
```

Configured in tsconfig.json: `"@/*": ["./src/*"]`

## Testing Strategy

**Test organization:**
- Unit tests: `src/__tests__/` (chip-parser, input-sanitizer, estimation-guardrails)
- Integration tests: `tests/integration/` (presales-to-timeline, timeline-generation-flow)
- Production tests: `tests/production/production-readiness.test.ts`
- Vitest config: `vitest.config.ts` with jsdom environment
- Setup file: `tests/setup.ts`

**Key test files:**
- `production-readiness.test.ts` - Must-pass tests before deployment (security, performance, data integrity)
- `input-sanitizer.test.ts` - XSS/DoS prevention tests
- `presales-chip-extraction.test.ts` - Chip parsing regression tests

**Running specific tests:**
```bash
# Run all tests
npm test -- --run

# Run production tests only
npm test -- production-readiness.test.ts --run

# Run security tests
npm test -- input-sanitizer.test.ts --run

# Run with coverage
npm run test:coverage
```

**Known test failures (as of current state - 8/244 tests failing):**
- Presales-timeline flow: Compliance multiplier calculation - test expects different calculation
- Presales-timeline flow: Total multiplier cap at 5.0x - not implemented
- Presales-timeline flow: Negative employee count handling - not implemented
- Presales-timeline flow: High complexity warning generation - not implemented
- Timeline generation flow: Visual phase editing integration - setPhases/setSelectedPackages usage
- Production readiness: Corrupted localStorage handling - test environment issue (store already initialized)

## Key Patterns

### Completeness Validation

The completeness algorithm (presales-store.ts:192-297) is critical:

- 0% score if no chips (shows all gaps)
- Weighted scoring: country (15), industry (15), modules (15), legal entities (15), etc.
- Minimum 65% + no critical gaps to proceed to decide mode
- Bonus points for chip quantity and quality (confidence > 0.6)

### Timeline Generation

Two-step process:

1. Bridge converts chips → ClientProfile + package selection
2. ScenarioGenerator creates phases with effort estimation
3. Timeline store renders with date calculations

### Manual Overrides

Users can manually edit generated timelines:

- Overrides stored in project-store
- Preserved across regenerations
- Shows warning before regenerating with active overrides

## Common Gotchas & Critical Fixes

### Known Issues & Solutions

1. **Store persistence:** Stores persist to localStorage. Clear with `localStorage.clear()` or use `store.reset()`
2. **Chip types vs kind:** Old code used `kind`, new uses `type` (ChipType)
3. **Business day calculations:** All dates use business day offsets from PROJECT_BASE_DATE (2024-01-01)
4. **Mode transitions:** Only presales-store has auto-transit, project-store is manual
5. **Phase colors:** Stored separately in `phaseColors` Record, not on phase objects
6. **TypeScript command:** Use `npm run typecheck` (NOT `npm run type-check`)
7. **Lazy loading imports:** PlanMode & PresentMode use lazy loading - don't import directly in ProjectShell

### Critical Methods (Already Implemented)

**timeline-store.ts:**
- ✅ `setPhases(phases: Phase[])` - Bulk update phases (line 290)
- ✅ `setSelectedPackages(packages: string[])` - Bulk update packages (line 47)
- ✅ Early return optimization in `getProjectCost()` (line 589)

**project-store.ts:**
- ✅ `regenerateTimeline(force)` - Uses bulk `setPhases()` (line 122-125)
- ✅ Proper logging and error handling

**PlanMode.tsx:**
- ✅ useEffect includes `regenerateTimeline` in dependencies (line 63)
- ✅ useMemo/useCallback for performance (lines 66-74)

**presales-to-timeline-bridge.ts:**
- ✅ XSS sanitization with `sanitizeChipValue()` (line 11-19)
- ✅ Phase sanitization with `sanitizePhase()` (line 25-43)

## Database (Optional)

Prisma schema defined in `prisma/schema.prisma` but currently unused:

- App runs entirely client-side with localStorage
- Backend models: Project, Chip, Decision, Scenario, Timeline
- Database optional for future collaboration/persistence features

## Current State

The app underwent a complete UX transformation (Oct 2025):

- New magic timeline with instant gratification (example shown immediately)
- Steve Jobs-inspired design principles (focus, simplicity, delight)
- Main workflow available at `/project` route

Active development focus: Project V2 workflow (4-mode UX)
