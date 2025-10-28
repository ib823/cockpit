# Keystone Development - Phase 1: Foundation & Formula Engine

## Context
You are building an SAP S/4HANA estimation and project planning web app. Tech stack:
- Next.js 15 (App Router) + React 19 + TypeScript
- Prisma + PostgreSQL
- Ant Design 5.27.4
- Zustand (UI state) + TanStack Query (server state)
- Vitest + Playwright (testing)

**Current codebase state:**
- Basic Next.js scaffold exists in `/src`
- Prisma client configured with User model
- NextAuth working
- Some estimator UI components exist but incomplete

## Current Task: Phase 1 - Foundation & Formula Engine

### 1. Database Schema Update

**Create/update** `prisma/schema.prisma`:

Add these models (reference Addendum Section 10 for complete schema):
```prisma
model Organization {
  id       String   @id @default(cuid())
  name     String
  settings Json
  members  TeamMember[]
  scenarios Scenario[]
}

model TeamMember {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  role           UserRole @default(VIEWER)
  // ... add other fields from spec
}

enum UserRole {
  ADMIN
  OWNER
  EDITOR
  VIEWER
}

model Lob {
  id                   String   @id @default(cuid())
  lobName              String   @unique
  l3Count              Int
  releaseTag           String
  navigatorSectionUrl  String
  l3ScopeItems         L3ScopeItem[]
}

model L3ScopeItem {
  id                  String   @id @default(cuid())
  lobId               String
  lob                 Lob      @relation(fields: [lobId], references: [id])
  module              String?
  l3Code              String   @unique
  l3Name              String
  processNavigatorUrl String
  formerCode          String?
  releaseTag          String
  complexityMetrics   ComplexityMetrics?
  integrationDetails  IntegrationDetails?
}

model ComplexityMetrics {
  l3Id               String   @id
  l3ScopeItem        L3ScopeItem @relation(fields: [l3Id], references: [id], onDelete: Cascade)
  defaultTier        String
  coefficient        Float?
  tierRationale      String
  crossModuleTouches String?
  localizationFlag   Boolean  @default(false)
  extensionRisk      String
}

model IntegrationDetails {
  l3Id                        String   @id
  l3ScopeItem                 L3ScopeItem @relation(fields: [l3Id], references: [id], onDelete: Cascade)
  integrationPackageAvailable String
  testScriptExists            Boolean  @default(true)
}

model Scenario {
  id              String   @id @default(cuid())
  userId          String
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id])
  name            String
  inputs          Json     // EstimatorInputs
  totalMD         Float
  durationMonths  Float
  pmoMD           Float
  phases          Json     // PhaseBreakdown[]
  startDate       DateTime?
  resources       Json?    // ResourceAllocation[]
  versions        ScenarioVersion[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ScenarioVersion {
  id            String   @id @default(cuid())
  scenarioId    String
  scenario      Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  versionNumber Int
  label         String?
  snapshot      Json
  changes       Json?
  changeReason  String?
  createdBy     String
  createdAt     DateTime @default(now())
}

model AuditLog {
  id             String   @id @default(cuid())
  organizationId String?
  actorId        String
  actorEmail     String
  action         String
  entityType     String
  entityId       String
  changes        Json?
  metadata       Json?
  ipAddress      String
  userAgent      String
  timestamp      DateTime @default(now())
}
2. L3 Catalog Seed Script
Create prisma/seed.ts:
Parse the 293 L3 items from the SQL batches in Document 3 (attached). Structure:

12 LOBs (Finance, Sourcing & Procurement, Sales, Manufacturing, etc.)
293 L3 items with complexity metrics
Integration details for each item

Example structure:
typescriptconst lobData = [
  { lobName: 'Finance', l3Count: 52, releaseTag: '2508', navigatorSectionUrl: '...' },
  // ... 11 more LOBs
];

const l3Items = [
  {
    lobName: 'Finance',
    module: 'Accounting',
    l3Code: 'J58',
    l3Name: 'Accounting and Financial Close',
    processNavigatorUrl: 'https://me.sap.com/processnavigator/SolmanItems/J58',
    releaseTag: '2508',
    complexityMetrics: {
      defaultTier: 'C',
      coefficient: 0.010,
      tierRationale: 'End-to-end orchestration...',
      crossModuleTouches: 'FI↔CO',
      localizationFlag: false,
      extensionRisk: 'Low'
    },
    integrationDetails: {
      integrationPackageAvailable: 'Yes',
      testScriptExists: true
    }
  },
  // ... 292 more items (extract from Document 3 SQL inserts)
];
Create API route app/api/l3-catalog/route.ts:
typescriptexport async function GET() {
  const items = await prisma.l3ScopeItem.findMany({
    include: {
      lob: true,
      complexityMetrics: true,
      integrationDetails: true
    },
    orderBy: [
      { lob: { lobName: 'asc' } },
      { l3Code: 'asc' }
    ]
  });
  return Response.json(items);
}
3. Formula Engine (Web Worker)
Install dependencies:
bashnpm install comlink
npm install -D @types/comlink
Create lib/estimator/types.ts:
typescriptexport interface EstimatorInputs {
  profileIndex: number;
  selectedL3Items: L3ScopeItem[];
  integrations: number;
  customForms: number;
  fitToStandard: number; // 0.0 to 1.0 (100%)
  legalEntities: number;
  countries: number;
  languages: number;
  fte: number;
  utilization: number; // 0.0 to 1.0
  overlapFactor: number; // 0.0 to 1.0
}

export interface PhaseBreakdown {
  phaseName: 'Prepare' | 'Explore' | 'Realize' | 'Deploy' | 'Run';
  effortMD: number;
  durationMonths: number;
}

export interface EstimatorResults {
  totalMD: number;
  durationMonths: number;
  pmoMD: number;
  phases: PhaseBreakdown[];
  capacityPerMonth: number;
  coefficients: {
    Sb: number;
    Pc: number;
    Os: number;
  };
}

export interface Profile {
  name: string;
  baseFT: number; // Baseline functional/technical MD
  basis: number; // Fixed Basis MD
  securityAuth: number; // Fixed Security MD
}

export const DEFAULT_PROFILE: Profile = {
  name: 'Malaysia Mid-Market',
  baseFT: 378,
  basis: 24,
  securityAuth: 8
};
Create lib/estimator/formula-engine.ts:
typescriptimport type { EstimatorInputs, EstimatorResults, PhaseBreakdown, Profile } from './types';

const PMO_MONTHLY_RATE = 16.25; // MD per month
const WORKING_DAYS_PER_MONTH = 22;
const PHASE_WEIGHTS = {
  Prepare: 0.10,
  Explore: 0.25,
  Realize: 0.45,
  Deploy: 0.15,
  Run: 0.05
};

export class FormulaEngine {
  /**
   * Calculate Scope Breadth coefficient (Sb)
   * Sb = Σ(L3 coefficients) + (integrations × 0.02)
   */
  calculateScopeBreadth(selectedItems: EstimatorInputs['selectedL3Items'], integrations: number): number {
    const itemCoefficients = selectedItems
      .filter(item => item.complexityMetrics?.defaultTier !== 'D') // Tier D excluded
      .reduce((sum, item) => sum + (item.complexityMetrics?.coefficient || 0), 0);
    
    const integrationFactor = integrations * 0.02;
    
    return itemCoefficients + integrationFactor;
  }

  /**
   * Calculate Process Complexity coefficient (Pc)
   * Pc = (customForms - baseline) × 0.01 + (1 - fitToStandard) × 0.25
   */
  calculateProcessComplexity(customForms: number, fitToStandard: number): number {
    const BASELINE_FORMS = 4;
    const extraForms = Math.max(0, customForms - BASELINE_FORMS);
    const formsFactor = extraForms * 0.01;
    
    const fitGap = Math.max(0, 1 - fitToStandard);
    const fitFactor = fitGap * 0.25;
    
    return formsFactor + fitFactor;
  }

  /**
   * Calculate Organizational Scale coefficient (Os)
   * Os = (entities - 1) × 0.03 + (countries - 1) × 0.05 + (languages - 1) × 0.02
   */
  calculateOrgScale(legalEntities: number, countries: number, languages: number): number {
    const entitiesFactor = Math.max(0, legalEntities - 1) * 0.03;
    const countriesFactor = Math.max(0, countries - 1) * 0.05;
    const languagesFactor = Math.max(0, languages - 1) * 0.02;
    
    return entitiesFactor + countriesFactor + languagesFactor;
  }

  /**
   * Main calculation with PMO iteration
   * Formula: E_total = E_FT + E_fixed + E_PMO
   * Duration = (E_total / Capacity) × OverlapFactor
   * E_PMO = Duration × PMO_rate (iterative)
   */
  calculateTotal(inputs: EstimatorInputs, profile: Profile): EstimatorResults {
    // Step 1: Calculate coefficients
    const Sb = this.calculateScopeBreadth(inputs.selectedL3Items, inputs.integrations);
    const Pc = this.calculateProcessComplexity(inputs.customForms, inputs.fitToStandard);
    const Os = this.calculateOrgScale(inputs.legalEntities, inputs.countries, inputs.languages);

    // Step 2: Calculate functional/technical effort
    const E_FT = profile.baseFT * (1 + Sb) * (1 + Pc) * (1 + Os);
    const E_fixed = profile.basis + profile.securityAuth;

    // Step 3: Calculate capacity
    const capacity = inputs.fte * WORKING_DAYS_PER_MONTH * inputs.utilization;

    // Step 4: Iterative calculation for PMO (converges in 2-3 iterations)
    let D = 0;
    let E_PMO = 0;
    const MAX_ITERATIONS = 5;
    const CONVERGENCE_THRESHOLD = 0.01;

    // Initial estimate without PMO
    D = ((E_FT + E_fixed) / capacity) * inputs.overlapFactor;
    
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const D_prev = D;
      E_PMO = D * PMO_MONTHLY_RATE;
      D = ((E_FT + E_fixed + E_PMO) / capacity) * inputs.overlapFactor;
      
      // Check convergence
      if (Math.abs(D - D_prev) < CONVERGENCE_THRESHOLD) {
        break;
      }
    }

    const E_total = E_FT + E_fixed + E_PMO;

    // Step 5: Distribute across phases
    const phases: PhaseBreakdown[] = Object.entries(PHASE_WEIGHTS).map(([name, weight]) => ({
      phaseName: name as PhaseBreakdown['phaseName'],
      effortMD: E_total * weight,
      durationMonths: D * weight
    }));

    return {
      totalMD: E_total,
      durationMonths: D,
      pmoMD: E_PMO,
      phases,
      capacityPerMonth: capacity,
      coefficients: { Sb, Pc, Os }
    };
  }
}

export const formulaEngine = new FormulaEngine();
Create lib/estimator/formula-worker.ts (Web Worker):
typescriptimport { expose } from 'comlink';
import { FormulaEngine } from './formula-engine';
import type { EstimatorInputs, EstimatorResults, Profile } from './types';

const engine = new FormulaEngine();

const workerAPI = {
  calculateTotal(inputs: EstimatorInputs, profile: Profile): EstimatorResults {
    return engine.calculateTotal(inputs, profile);
  }
};

expose(workerAPI);

export type FormulaWorkerAPI = typeof workerAPI;
Create lib/estimator/use-formula-worker.ts (React hook):
typescriptimport { useEffect, useRef } from 'react';
import { wrap, Remote } from 'comlink';
import type { FormulaWorkerAPI } from './formula-worker';

export function useFormulaWorker() {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Remote<FormulaWorkerAPI> | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./formula-worker.ts', import.meta.url),
      { type: 'module' }
    );
    apiRef.current = wrap<FormulaWorkerAPI>(workerRef.current);

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return apiRef.current;
}
4. Estimator Store (Zustand)
Create stores/estimator-store.ts:
typescriptimport { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { EstimatorInputs, EstimatorResults, L3ScopeItem, Profile } from '@/lib/estimator/types';
import { DEFAULT_PROFILE } from '@/lib/estimator/types';

interface EstimatorState {
  // Inputs
  profile: Profile;
  selectedL3Items: L3ScopeItem[];
  integrations: number;
  customForms: number;
  fitToStandard: number;
  legalEntities: number;
  countries: number;
  languages: number;
  fte: number;
  utilization: number;
  overlapFactor: number;
  
  // Results
  results: EstimatorResults | null;
  isCalculating: boolean;
  
  // Actions
  setProfile: (profile: Profile) => void;
  setL3Items: (items: L3ScopeItem[]) => void;
  setIntegrations: (count: number) => void;
  setCustomForms: (count: number) => void;
  setFitToStandard: (value: number) => void;
  setLegalEntities: (count: number) => void;
  setCountries: (count: number) => void;
  setLanguages: (count: number) => void;
  setFTE: (fte: number) => void;
  setUtilization: (value: number) => void;
  setOverlapFactor: (value: number) => void;
  setResults: (results: EstimatorResults) => void;
  setCalculating: (isCalculating: boolean) => void;
  reset: () => void;
}

const initialState = {
  profile: DEFAULT_PROFILE,
  selectedL3Items: [],
  integrations: 0,
  customForms: 4, // Baseline
  fitToStandard: 1.0, // 100%
  legalEntities: 1,
  countries: 1,
  languages: 1,
  fte: 5.6,
  utilization: 0.8,
  overlapFactor: 0.75,
  results: null,
  isCalculating: false,
};

export const useEstimatorStore = create<EstimatorState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setProfile: (profile) => set({ profile }),
      setL3Items: (items) => set({ selectedL3Items: items }),
      setIntegrations: (count) => set({ integrations: count }),
      setCustomForms: (count) => set({ customForms: count }),
      setFitToStandard: (value) => set({ fitToStandard: value }),
      setLegalEntities: (count) => set({ legalEntities: count }),
      setCountries: (count) => set({ countries: count }),
      setLanguages: (count) => set({ languages: count }),
      setFTE: (fte) => set({ fte }),
      setUtilization: (value) => set({ utilization: value }),
      setOverlapFactor: (value) => set({ overlapFactor: value }),
      setResults: (results) => set({ results }),
      setCalculating: (isCalculating) => set({ isCalculating }),
      
      reset: () => set(initialState),
    }),
    { name: 'EstimatorStore' }
  )
);
5. Unit Tests
Create lib/estimator/__tests__/formula-engine.test.ts:
typescriptimport { describe, it, expect } from 'vitest';
import { FormulaEngine } from '../formula-engine';
import { DEFAULT_PROFILE } from '../types';
import type { EstimatorInputs } from '../types';

describe('FormulaEngine', () => {
  const engine = new FormulaEngine();

  describe('calculateScopeBreadth', () => {
    it('calculates zero for no items', () => {
      const Sb = engine.calculateScopeBreadth([], 0);
      expect(Sb).toBe(0);
    });

    it('sums L3 coefficients correctly', () => {
      const items = [
        { complexityMetrics: { defaultTier: 'A', coefficient: 0.006 } },
        { complexityMetrics: { defaultTier: 'B', coefficient: 0.008 } },
      ] as any;
      
      const Sb = engine.calculateScopeBreadth(items, 0);
      expect(Sb).toBeCloseTo(0.014, 3);
    });

    it('adds integration factor', () => {
      const Sb = engine.calculateScopeBreadth([], 5);
      expect(Sb).toBeCloseTo(0.10, 2);
    });

    it('excludes Tier D items', () => {
      const items = [
        { complexityMetrics: { defaultTier: 'A', coefficient: 0.006 } },
        { complexityMetrics: { defaultTier: 'D', coefficient: null } },
      ] as any;
      
      const Sb = engine.calculateScopeBreadth(items, 0);
      expect(Sb).toBeCloseTo(0.006, 3);
    });
  });

  describe('calculateProcessComplexity', () => {
    it('returns zero for baseline forms and 100% fit', () => {
      const Pc = engine.calculateProcessComplexity(4, 1.0);
      expect(Pc).toBe(0);
    });

    it('adds factor for extra forms', () => {
      const Pc = engine.calculateProcessComplexity(6, 1.0);
      expect(Pc).toBeCloseTo(0.02, 2);
    });

    it('adds factor for fit-to-standard gap', () => {
      const Pc = engine.calculateProcessComplexity(4, 0.8);
      expect(Pc).toBeCloseTo(0.05, 2);
    });
  });

  describe('calculateOrgScale', () => {
    it('returns zero for single entity/country/language', () => {
      const Os = engine.calculateOrgScale(1, 1, 1);
      expect(Os).toBe(0);
    });

    it('calculates correctly for multiple entities', () => {
      const Os = engine.calculateOrgScale(3, 2, 2);
      expect(Os).toBeCloseTo(0.13, 2); // 2*0.03 + 1*0.05 + 1*0.02
    });
  });

  describe('calculateTotal - Baseline Example', () => {
    it('matches specification example: 467 MD, 3.6 months', () => {
      const inputs: EstimatorInputs = {
        profileIndex: 0,
        selectedL3Items: [], // Sb = 0.15 (simulated below)
        integrations: 0,
        customForms: 4,
        fitToStandard: 1.0,
        legalEntities: 1,
        countries: 1,
        languages: 1,
        fte: 5.6,
        utilization: 0.8,
        overlapFactor: 0.75,
      };

      // Manually inject Sb=0.15 by adding items with total coefficient 0.15
      const mockItems = [
        { 
          id: '1',
          l3Code: 'J58',
          l3Name: 'Accounting',
          complexityMetrics: { defaultTier: 'C', coefficient: 0.15 } 
        }
      ] as any;
      inputs.selectedL3Items = mockItems;

      const results = engine.calculateTotal(inputs, DEFAULT_PROFILE);

      expect(results.totalMD).toBeCloseTo(467, 0);
      expect(results.durationMonths).toBeCloseTo(3.6, 1);
      expect(results.pmoMD).toBeCloseTo(57, 1);
      expect(results.coefficients.Sb).toBeCloseTo(0.15, 2);
      expect(results.coefficients.Pc).toBe(0);
      expect(results.coefficients.Os).toBe(0);
    });
  });

  describe('Phase distribution', () => {
    it('distributes effort across 5 phases', () => {
      const inputs: EstimatorInputs = {
        profileIndex: 0,
        selectedL3Items: [],
        integrations: 0,
        customForms: 4,
        fitToStandard: 1.0,
        legalEntities: 1,
        countries: 1,
        languages: 1,
        fte: 5.6,
        utilization: 0.8,
        overlapFactor: 0.75,
      };

      const results = engine.calculateTotal(inputs, DEFAULT_PROFILE);

      expect(results.phases).toHaveLength(5);
      expect(results.phases[0].phaseName).toBe('Prepare');
      expect(results.phases[4].phaseName).toBe('Run');
      
      // Sum should equal total
      const sumEffort = results.phases.reduce((sum, p) => sum + p.effortMD, 0);
      expect(sumEffort).toBeCloseTo(results.totalMD, 1);
    });
  });
});
Acceptance Criteria
✅ Database schema includes all 8 models (Organization, TeamMember, Lob, L3ScopeItem, ComplexityMetrics, IntegrationDetails, Scenario, ScenarioVersion, AuditLog)
✅ Seed script successfully loads 293 L3 items from Document 3
✅ GET /api/l3-catalog returns all 293 items with relations
✅ Formula engine calculates baseline (378 MD → 467 MD, 3.6 months) accurately
✅ Web Worker compiles without errors
✅ Zustand store manages all estimator inputs
✅ Unit tests pass with >90% coverage
✅ PMO iteration converges in <5 iterations
Files to Create/Modify
Database:

prisma/schema.prisma (UPDATE - add 8 models)
prisma/seed.ts (CREATE - parse Document 3 SQL)

API:

app/api/l3-catalog/route.ts (CREATE)

Formula Engine:

lib/estimator/types.ts (CREATE)
lib/estimator/formula-engine.ts (CREATE)
lib/estimator/formula-worker.ts (CREATE - Web Worker)
lib/estimator/use-formula-worker.ts (CREATE - React hook)

State Management:

stores/estimator-store.ts (CREATE)

Testing:

lib/estimator/__tests__/formula-engine.test.ts (CREATE)

Configuration:

package.json (UPDATE - add comlink)
next.config.js (UPDATE if needed for Web Worker)

Testing
bash# Unit tests
npm run test:unit -- formula-engine.test.ts

# All tests
npm test

# Type checking
npm run typecheck
Validation Steps
After completing this phase, run:
bash# 1. Check database schema
npx prisma db push
npx prisma studio
# ✅ VALIDATION: Tables exist: Organization, Lob, L3ScopeItem, ComplexityMetrics, Scenario, AuditLog

# 2. Seed L3 catalog
npm run db:seed
curl http://localhost:3000/api/l3-catalog | jq 'length'
# ✅ VALIDATION: Returns 293

# 3. Test formula calculation
npm run test:unit -- formula-engine.test.ts
# ✅ VALIDATION: All tests pass
# ✅ Baseline example: 467 MD, 3.6 months

# 4. Check Web Worker compiles
npm run build
# ✅ VALIDATION: No errors, formula-worker.ts bundles

# 5. Type check
npm run typecheck
# ✅ VALIDATION: No TypeScript errors
Reference Documents

Specification: /docs/SAP_COCKPIT_UX_ARCHITECTURE_SPECIFICATION.md

Section 5: Complete formula with worked example
Section 4.2: Database schema with Prisma models


Addendum: /docs/ADDENDUM.md

Section 10: Enhanced database schema
Section 3.1: Web Worker implementation


Document 3: L3 Catalog SQL (293 items in batches)

Extract from Batch 1-11 SQL INSERT statements



Output Format
Provide:

All code files (complete contents, not diffs)
Database migration commands
npm install commands for new packages
Summary of implementation with file tree
Known issues or incomplete items
Test results showing pass/fail

Critical Rules
❌ Do NOT use placeholder comments like "// Add more items"
❌ Do NOT use mock data - implement real formula logic
❌ Do NOT skip error handling in async operations
❌ Do NOT skip TypeScript types - use strict mode
❌ Do NOT hardcode - use constants and configuration
✅ DO implement complete logic for all 293 L3 items
✅ DO add JSDoc comments for complex functions
✅ DO validate inputs (e.g., FTE > 0, utilization 0-1)
✅ DO handle edge cases (empty L3 selection, Tier D items)

Begin implementation for Phase 1: Foundation & Formula Engine.

**Key Improvements:**
1. ✅ Complete file list with all paths
2. ✅ Filled acceptance criteria with measurable outcomes
3. ✅ Included formula details with worked example
4. ✅ Specified L3 data structure and parsing strategy
5. ✅ Added Web Worker setup with Comlink
6. ✅ Included complete code templates
7. ✅ Clear validation steps with expected outputs
8. ✅ Removed placeholder "[X]"

# Phase 2-7: Complete Prompts for Claude Code

---

# **PHASE 2: ESTIMATOR UI**

```markdown
# Keystone Development - Phase 2: Estimator UI

## Context
Tech stack: Next.js 15 + React 19 + TypeScript + Ant Design 5.27.4 + Zustand + TanStack Query

**Prerequisites completed:**
- ✅ Database with 293 L3 items seeded
- ✅ Formula engine working (467 MD baseline)
- ✅ Zustand store configured
- ✅ API route /api/l3-catalog functional

## Tasks

### 1. L3 Catalog Modal with Virtual Scrolling

**Install:**
```bash
npm install react-window react-virtualized-auto-sizer
```

**Create** `components/estimator/L3CatalogModal.tsx`:
- Virtual scrolling (renders only visible ~20 items)
- Search bar with real-time filter
- Tier badges (A/B/C/D with colors)
- Checkbox selection
- Group by LOB with expand/collapse
- Selected count + total coefficient display
- "Apply Selection" button

**Create** `components/estimator/VirtualizedL3List.tsx`:
```typescript
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface L3Item {
  id: string;
  l3Code: string;
  l3Name: string;
  tier: string;
  coefficient: number;
  lob: { lobName: string };
}

export function VirtualizedL3List({ 
  items, 
  selectedIds, 
  onToggle 
}: { 
  items: L3Item[]; 
  selectedIds: Set<string>; 
  onToggle: (id: string) => void;
}) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    return (
      <div style={style} className="flex items-center p-2 hover:bg-gray-50">
        <Checkbox checked={selectedIds.has(item.id)} onChange={() => onToggle(item.id)} />
        <span className="ml-2 font-mono text-xs">{item.l3Code}</span>
        <span className="ml-2 flex-1">{item.l3Name}</span>
        <TierBadge tier={item.tier} />
        <span className="ml-2 text-gray-500">{item.coefficient}</span>
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List height={height} itemCount={items.length} itemSize={48} width={width}>
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}
```

### 2. Input Controls Panel

**Create** `components/estimator/InputPanel.tsx`:
- Profile selector (dropdown with Malaysia Mid-Market default)
- Scope Breadth section:
  - "Select L3 Items" button → opens modal
  - Selected count display
  - Integrations slider (0-10)
  - Current Sb coefficient display
- Process Complexity section:
  - Custom forms input (default 4)
  - Fit-to-standard slider (0-100%, default 100%)
  - Current Pc display
- Org Scale section:
  - Legal entities input (default 1)
  - Countries input (default 1)
  - Languages input (default 1)
  - Current Os display
- Capacity section:
  - FTE slider (1-20, default 5.6)
  - Utilization slider (0-100%, default 80%)
  - Overlap factor slider (0-100%, default 75%)

**Create** `components/estimator/ScopeBreadth.tsx`
**Create** `components/estimator/ProcessComplexity.tsx`
**Create** `components/estimator/OrgScale.tsx`
**Create** `components/estimator/Capacity.tsx`

### 3. Results Panel

**Create** `components/estimator/ResultsPanel.tsx`:
```typescript
import { Card, Statistic, Table, Button, Collapse } from 'antd';
import { useEstimatorStore } from '@/stores/estimator-store';

export function ResultsPanel() {
  const results = useEstimatorStore(state => state.results);
  
  if (!results) return <Card>Configure inputs to see estimate</Card>;

  const phaseColumns = [
    { title: 'Phase', dataIndex: 'phaseName', key: 'phaseName' },
    { title: 'Effort (MD)', dataIndex: 'effortMD', key: 'effortMD', render: (v: number) => v.toFixed(1) },
    { title: 'Duration (mo)', dataIndex: 'durationMonths', key: 'duration', render: (v: number) => v.toFixed(1) },
  ];

  return (
    <div className="space-y-4">
      <Card title="Total Estimate">
        <div className="grid grid-cols-3 gap-4">
          <Statistic title="Total Effort" value={results.totalMD} suffix="MD" precision={0} />
          <Statistic title="Duration" value={results.durationMonths} suffix="months" precision={1} />
          <Statistic title="PMO Effort" value={results.pmoMD} suffix="MD" precision={0} />
        </div>
      </Card>

      <Card title="Phase Breakdown">
        <Table 
          dataSource={results.phases} 
          columns={phaseColumns} 
          pagination={false}
          rowKey="phaseName"
        />
      </Card>

      <Collapse>
        <Collapse.Panel header="🔢 Formula Transparency" key="1">
          <pre className="text-xs bg-gray-50 p-4 rounded">
            {`E_FT = ${results.totalMD - results.pmoMD} MD
Sb = ${results.coefficients.Sb.toFixed(3)}
Pc = ${results.coefficients.Pc.toFixed(3)}
Os = ${results.coefficients.Os.toFixed(3)}

D_raw = E_FT / Capacity
E_PMO = D × ${16.25} MD/month = ${results.pmoMD.toFixed(1)} MD
D_final = ${results.durationMonths.toFixed(2)} months`}
          </pre>
        </Collapse.Panel>
      </Collapse>

      <div className="flex gap-2">
        <Button type="primary" size="large">Save Scenario</Button>
        <Button size="large">Generate Timeline →</Button>
      </div>
    </div>
  );
}
```

### 4. TanStack Query Integration

**Install:**
```bash
npm install @tanstack/react-query
```

**Create** `app/providers.tsx`:
```typescript
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Create** `hooks/use-l3-catalog.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';

export function useL3Catalog() {
  return useQuery({
    queryKey: ['l3-catalog'],
    queryFn: async () => {
      const res = await fetch('/api/l3-catalog');
      if (!res.ok) throw new Error('Failed to fetch L3 catalog');
      return res.json();
    },
  });
}
```

**Create** `hooks/use-scenarios.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const res = await fetch('/api/scenarios');
      if (!res.ok) throw new Error('Failed to fetch scenarios');
      return res.json();
    },
  });
}

export function useSaveScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scenario: any) => {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
      });
      if (!res.ok) throw new Error('Failed to save scenario');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}
```

### 5. Live Calculation Hook

**Create** `hooks/use-live-calculation.ts`:
```typescript
import { useEffect } from 'react';
import { useEstimatorStore } from '@/stores/estimator-store';
import { useFormulaWorker } from '@/lib/estimator/use-formula-worker';

export function useLiveCalculation() {
  const worker = useFormulaWorker();
  const store = useEstimatorStore();

  useEffect(() => {
    if (!worker) return;

    const inputs = {
      profileIndex: 0,
      selectedL3Items: store.selectedL3Items,
      integrations: store.integrations,
      customForms: store.customForms,
      fitToStandard: store.fitToStandard,
      legalEntities: store.legalEntities,
      countries: store.countries,
      languages: store.languages,
      fte: store.fte,
      utilization: store.utilization,
      overlapFactor: store.overlapFactor,
    };

    store.setCalculating(true);

    worker.calculateTotal(inputs, store.profile).then(results => {
      store.setResults(results);
      store.setCalculating(false);
    });
  }, [
    worker,
    store.selectedL3Items,
    store.integrations,
    store.customForms,
    store.fitToStandard,
    store.legalEntities,
    store.countries,
    store.languages,
    store.fte,
    store.utilization,
    store.overlapFactor,
  ]);
}
```

### 6. Main Estimator Page

**Update** `app/estimator/page.tsx`:
```typescript
'use client';
import { InputPanel } from '@/components/estimator/InputPanel';
import { ResultsPanel } from '@/components/estimator/ResultsPanel';
import { useLiveCalculation } from '@/hooks/use-live-calculation';

export default function EstimatorPage() {
  useLiveCalculation(); // Triggers calculation on input changes

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div>
        <h2 className="text-xl font-bold mb-4">Estimator Inputs</h2>
        <InputPanel />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Estimate Results</h2>
        <ResultsPanel />
      </div>
    </div>
  );
}
```

## Acceptance Criteria
✅ L3 modal opens in <500ms  
✅ Virtual scrolling renders only ~20 items  
✅ Search filters 293 items in <100ms  
✅ Changing FTE updates results within 100ms  
✅ All input controls connected to Zustand store  
✅ Formula transparency panel shows coefficients  
✅ TanStack Query caches L3 catalog  
✅ Save scenario button triggers mutation  

## Files to Create/Modify
- `components/estimator/L3CatalogModal.tsx` (CREATE)
- `components/estimator/VirtualizedL3List.tsx` (CREATE)
- `components/estimator/TierBadge.tsx` (CREATE)
- `components/estimator/InputPanel.tsx` (CREATE)
- `components/estimator/ScopeBreadth.tsx` (CREATE)
- `components/estimator/ProcessComplexity.tsx` (CREATE)
- `components/estimator/OrgScale.tsx` (CREATE)
- `components/estimator/Capacity.tsx` (CREATE)
- `components/estimator/ResultsPanel.tsx` (CREATE)
- `app/providers.tsx` (CREATE)
- `hooks/use-l3-catalog.ts` (CREATE)
- `hooks/use-scenarios.ts` (CREATE)
- `hooks/use-live-calculation.ts` (CREATE)
- `app/estimator/page.tsx` (UPDATE)
- `app/layout.tsx` (UPDATE - wrap with Providers)

## Validation Steps
```bash
# 1. Check virtual scrolling performance
npm run dev
# Open http://localhost:3000/estimator
# Open L3 modal, inspect DOM
# ✅ Only ~20 <div> elements rendered

# 2. Test search performance
# Type "accounting" in search
# ✅ Filter completes <100ms

# 3. Test calculation updates
# Adjust FTE slider from 5.6 to 7.0
# ✅ Results update instantly

# 4. Test TanStack Query caching
# Open Network tab
# Navigate away and back to /estimator
# ✅ No new API call (cached)

# 5. Visual check
npm run storybook
# ✅ All components render correctly
```

## Documents to Attach
1. SAP_COCKPIT_UX_ARCHITECTURE_SPECIFICATION.md (Section 3.1 - Estimator Screen)
2. ADDENDUM.md (Section 3.4 - Virtual Scrolling example)

## Output Format
1. All component files (complete code)
2. npm install commands
3. Summary with file tree
4. Test results
5. Known issues
```

---

# **PHASE 3: TIMELINE & GANTT**

```markdown
# Keystone Development - Phase 3: Timeline & Gantt

## Context
Tech stack: Next.js 15 + TypeScript + vis-timeline 7.7.x + Zustand

**Prerequisites completed:**
- ✅ Estimator UI with live calculation
- ✅ Phase breakdown from formula engine
- ✅ Results stored in Zustand

## Tasks

### 1. vis-timeline Integration

**Install:**
```bash
npm install vis-timeline vis-data
npm install -D @types/vis-timeline @types/vis-data
```

**Create** `components/timeline/VisGanttChart.tsx`:
```typescript
'use client';
import { useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import type { PhaseBreakdown } from '@/lib/estimator/types';

interface GanttProps {
  phases: PhaseBreakdown[];
  startDate: Date;
  onPhaseUpdate?: (phases: PhaseBreakdown[]) => void;
  editable?: boolean;
}

export function VisGanttChart({ phases, startDate, onPhaseUpdate, editable = true }: GanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let currentDate = new Date(startDate);
    const items = phases.map((phase, idx) => {
      const start = new Date(currentDate);
      const durationDays = phase.durationMonths * 22; // Working days
      const end = new Date(start);
      end.setDate(end.getDate() + durationDays);
      
      currentDate = new Date(end);

      return {
        id: idx,
        content: `${phase.phaseName} (${phase.effortMD.toFixed(0)} MD)`,
        start,
        end,
        className: `phase-${phase.phaseName.toLowerCase()}`,
        editable: { updateTime: editable, updateGroup: false },
      };
    });

    const options = {
      editable: editable,
      stack: false,
      orientation: 'top',
      zoomMin: 1000 * 60 * 60 * 24 * 7, // 1 week
      zoomMax: 1000 * 60 * 60 * 24 * 365, // 1 year
      start: startDate,
      end: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +1 week buffer
    };

    timelineRef.current = new Timeline(containerRef.current, items, options);

    if (onPhaseUpdate) {
      timelineRef.current.on('changed', () => {
        const updatedItems = timelineRef.current?.itemsData.get();
        if (updatedItems) {
          const updatedPhases = updatedItems.map((item: any, idx: number) => ({
            ...phases[idx],
            durationMonths: (new Date(item.end).getTime() - new Date(item.start).getTime()) / (1000 * 60 * 60 * 24 * 22),
          }));
          onPhaseUpdate(updatedPhases);
        }
      });
    }

    return () => {
      timelineRef.current?.destroy();
    };
  }, [phases, startDate, editable, onPhaseUpdate]);

  return <div ref={containerRef} className="h-96 border rounded" />;
}
```

**Create** `app/globals.css` (add styles):
```css
.phase-prepare { background-color: #91d5ff; border-color: #40a9ff; }
.phase-explore { background-color: #b7eb8f; border-color: #52c41a; }
.phase-realize { background-color: #ffd591; border-color: #fa8c16; }
.phase-deploy { background-color: #ffadd2; border-color: #eb2f96; }
.phase-run { background-color: #d3adf7; border-color: #722ed1; }
```

### 2. Resource Allocation Table

**Create** `components/timeline/ResourceTable.tsx`:
```typescript
import { Table, InputNumber, Button } from 'antd';
import { useState } from 'react';

interface Resource {
  role: string;
  fte: number;
  ratePerDay: number;
  phases: string[];
  totalCost: number;
}

export function ResourceTable({ 
  initialResources,
  onResourcesChange 
}: { 
  initialResources: Resource[];
  onResourcesChange: (resources: Resource[]) => void;
}) {
  const [resources, setResources] = useState(initialResources);

  const columns = [
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { 
      title: 'FTE', 
      dataIndex: 'fte', 
      key: 'fte',
      render: (value: number, record: Resource, index: number) => (
        <InputNumber 
          min={0.1} 
          max={10} 
          step={0.1} 
          value={value}
          onChange={(val) => {
            const updated = [...resources];
            updated[index].fte = val || 0;
            updated[index].totalCost = calculateCost(updated[index]);
            setResources(updated);
            onResourcesChange(updated);
          }}
        />
      )
    },
    { 
      title: 'Rate/Day', 
      dataIndex: 'ratePerDay', 
      key: 'rate',
      render: (v: number) => `$${v}` 
    },
    { title: 'Phases', dataIndex: 'phases', key: 'phases', render: (p: string[]) => p.join(', ') },
    { title: 'Total Cost', dataIndex: 'totalCost', key: 'cost', render: (v: number) => `$${v.toLocaleString()}` },
  ];

  return (
    <div>
      <Table 
        dataSource={resources} 
        columns={columns} 
        pagination={false}
        rowKey="role"
        summary={() => {
          const totalFTE = resources.reduce((sum, r) => sum + r.fte, 0);
          const totalCost = resources.reduce((sum, r) => sum + r.totalCost, 0);
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={1}><strong>{totalFTE.toFixed(1)} FTE</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
              <Table.Summary.Cell index={3} />
              <Table.Summary.Cell index={4}><strong>${totalCost.toLocaleString()}</strong></Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
      <Button className="mt-4" onClick={() => {/* Add resource logic */}}>+ Add Resource</Button>
    </div>
  );
}

function calculateCost(resource: Resource): number {
  // Placeholder: should calculate based on phase durations
  return resource.fte * resource.ratePerDay * 22 * 4; // 4 months avg
}
```

### 3. Timeline Store

**Create** `stores/timeline-store.ts`:
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PhaseBreakdown } from '@/lib/estimator/types';

interface Resource {
  role: string;
  fte: number;
  ratePerDay: number;
  phases: string[];
  totalCost: number;
}

interface TimelineState {
  startDate: Date | null;
  endDate: Date | null;
  phases: PhaseBreakdown[];
  resources: Resource[];
  isLocked: boolean;
  
  setStartDate: (date: Date) => void;
  setPhases: (phases: PhaseBreakdown[]) => void;
  setResources: (resources: Resource[]) => void;
  toggleLock: () => void;
  syncFromEstimator: (phases: PhaseBreakdown[]) => void;
}

const defaultResources: Resource[] = [
  { role: 'Project Manager', fte: 1.0, ratePerDay: 180, phases: ['Prepare', 'Explore', 'Realize', 'Deploy', 'Run'], totalCost: 0 },
  { role: 'Functional Consultant', fte: 2.5, ratePerDay: 150, phases: ['Explore', 'Realize', 'Deploy'], totalCost: 0 },
  { role: 'Technical Consultant', fte: 1.6, ratePerDay: 160, phases: ['Realize', 'Deploy'], totalCost: 0 },
  { role: 'Basis Consultant', fte: 0.5, ratePerDay: 140, phases: ['Explore', 'Realize', 'Deploy'], totalCost: 0 },
  { role: 'Change Manager', fte: 0.5, ratePerDay: 120, phases: ['Deploy', 'Run'], totalCost: 0 },
];

export const useTimelineStore = create<TimelineState>()(
  devtools(
    (set, get) => ({
      startDate: null,
      endDate: null,
      phases: [],
      resources: defaultResources,
      isLocked: false,
      
      setStartDate: (date) => set({ startDate: date }),
      
      setPhases: (phases) => {
        set({ phases });
        // Calculate end date
        const totalMonths = phases.reduce((sum, p) => sum + p.durationMonths, 0);
        if (get().startDate) {
          const end = new Date(get().startDate!);
          end.setMonth(end.getMonth() + totalMonths);
          set({ endDate: end });
        }
      },
      
      setResources: (resources) => set({ resources }),
      
      toggleLock: () => set((state) => ({ isLocked: !state.isLocked })),
      
      syncFromEstimator: (phases) => {
        if (!get().isLocked) {
          set({ phases });
        }
      },
    }),
    { name: 'TimelineStore' }
  )
);
```

### 4. Bidirectional Sync

**Update** `hooks/use-live-calculation.ts`:
```typescript
import { useEffect } from 'react';
import { useEstimatorStore } from '@/stores/estimator-store';
import { useTimelineStore } from '@/stores/timeline-store';
import { useFormulaWorker } from '@/lib/estimator/use-formula-worker';

export function useLiveCalculation() {
  const worker = useFormulaWorker();
  const estimatorStore = useEstimatorStore();
  const timelineStore = useTimelineStore();

  useEffect(() => {
    if (!worker) return;

    const inputs = { /* ... */ };
    
    estimatorStore.setCalculating(true);

    worker.calculateTotal(inputs, estimatorStore.profile).then(results => {
      estimatorStore.setResults(results);
      estimatorStore.setCalculating(false);
      
      // Sync to timeline
      timelineStore.syncFromEstimator(results.phases);
    });
  }, [/* dependencies */]);
}
```

**Create** `components/timeline/SyncControls.tsx`:
```typescript
import { Button, Switch, Space } from 'antd';
import { LockOutlined, UnlockOutlined, SyncOutlined } from '@ant-design/icons';
import { useTimelineStore } from '@/stores/timeline-store';

export function SyncControls() {
  const { isLocked, toggleLock } = useTimelineStore();
  
  return (
    <Space>
      <Switch
        checkedChildren={<LockOutlined />}
        unCheckedChildren={<UnlockOutlined />}
        checked={isLocked}
        onChange={toggleLock}
      />
      <span>{isLocked ? 'Timeline Locked' : 'Auto-sync Enabled'}</span>
      <Button icon={<SyncOutlined />} disabled={isLocked}>Force Sync</Button>
    </Space>
  );
}
```

### 5. Holiday Calendar Support

**Create** `app/api/holidays/route.ts`:
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const year = searchParams.get('year');

  if (!country || !year) {
    return Response.json({ error: 'Missing country or year' }, { status: 400 });
  }

  // Fetch from database or hardcoded calendars
  const holidays = await prisma.holidayCalendar.findUnique({
    where: { country_year: { country, year: parseInt(year) } }
  });

  return Response.json(holidays?.holidays || []);
}
```

**Seed holidays** in `prisma/seed.ts`:
```typescript
const malaysiaHolidays2025 = [
  { date: '2025-01-25', name: 'Chinese New Year' },
  { date: '2025-03-31', name: 'Hari Raya Aidilfitri' },
  { date: '2025-08-31', name: 'Merdeka Day' },
  { date: '2025-09-16', name: 'Malaysia Day' },
  { date: '2025-12-25', name: 'Christmas' },
];

await prisma.holidayCalendar.create({
  data: {
    country: 'MY',
    year: 2025,
    holidays: malaysiaHolidays2025,
  },
});
```

### 6. Main Timeline Page

**Create** `app/timeline/page.tsx`:
```typescript
'use client';
import { useState } from 'react';
import { Card, DatePicker, Button } from 'antd';
import { VisGanttChart } from '@/components/timeline/VisGanttChart';
import { ResourceTable } from '@/components/timeline/ResourceTable';
import { SyncControls } from '@/components/timeline/SyncControls';
import { useTimelineStore } from '@/stores/timeline-store';
import { useEstimatorStore } from '@/stores/estimator-store';

export default function TimelinePage() {
  const { phases, resources, startDate, setStartDate, setPhases, setResources } = useTimelineStore();
  const estimatorResults = useEstimatorStore(state => state.results);

  const handleStartDateChange = (date: any) => {
    setStartDate(date?.toDate() || new Date());
  };

  return (
    <div className="p-4 space-y-4">
      <Card title="Project Schedule">
        <div className="flex gap-4 items-center mb-4">
          <DatePicker onChange={handleStartDateChange} placeholder="Select start date" />
          <SyncControls />
        </div>
        
        {startDate && phases.length > 0 ? (
          <VisGanttChart 
            phases={phases} 
            startDate={startDate}
            onPhaseUpdate={setPhases}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            Select a start date and ensure estimator has calculated phases
          </div>
        )}
      </Card>

      <Card title="Resource Allocation">
        <ResourceTable 
          initialResources={resources}
          onResourcesChange={setResources}
        />
      </Card>

      <div className="flex gap-2">
        <Button type="primary">Save Timeline</Button>
        <Button>Export Schedule</Button>
      </div>
    </div>
  );
}
```

## Acceptance Criteria
✅ Gantt renders 5 SAP Activate phases  
✅ Dragging phase updates duration  
✅ Resource FTE changes sync to estimator  
✅ Lock prevents auto-sync  
✅ Holiday calendar excludes weekends  
✅ Start date picker works  
✅ vis-timeline compiles without errors  

## Files to Create/Modify
- `components/timeline/VisGanttChart.tsx` (CREATE)
- `components/timeline/ResourceTable.tsx` (CREATE)
- `components/timeline/SyncControls.tsx` (CREATE)
- `stores/timeline-store.ts` (CREATE)
- `app/timeline/page.tsx` (CREATE)
- `app/api/holidays/route.ts` (CREATE)
- `prisma/schema.prisma` (UPDATE - add HolidayCalendar model)
- `prisma/seed.ts` (UPDATE - seed holidays)
- `app/globals.css` (UPDATE - add phase styles)
- `hooks/use-live-calculation.ts` (UPDATE - add sync)

## Validation Steps
```bash
# 1. Test Gantt rendering
npm run dev
# Navigate to /timeline
# ✅ 5 phase bars visible

# 2. Test drag functionality
# Drag Realize phase by 1 week
# ✅ Duration recalculates

# 3. Test sync
# Change FTE in resource table
# Navigate to /estimator
# ✅ FTE updated in estimator

# 4. Test lock
# Toggle "Lock Timeline"
# Change FTE in estimator
# ✅ Timeline does NOT update

# 5. Test holidays
curl http://localhost:3000/api/holidays?country=MY&year=2025
# ✅ Returns Malaysian holidays
```

## Documents to Attach
1. SAP_COCKPIT_UX_ARCHITECTURE_SPECIFICATION.md (Section 3.3 - Timeline)
2. ADDENDUM.md (Section 3.3 - vis-timeline implementation)

## Output Format
1. All component files
2. npm install commands
3. Summary
4. Test results
```

---

# **PHASE 4: DECISION SUPPORT**

```markdown
# Keystone Development - Phase 4: Decision Support Features

## Context
Tech stack: Next.js 15 + TypeScript + Recharts + Zustand

**Prerequisites completed:**
- ✅ Estimator with deterministic calculation
- ✅ Timeline with Gantt chart
- ✅ Phase breakdown available

## Tasks

### 1. PERT Uncertainty Engine

**Create** `lib/estimator/pert-engine.ts`:
```typescript
export interface PERTInputs {
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
}

export interface PERTResults {
  expected: number;
  standardDeviation: number;
  variance: number;
  confidenceInterval: {
    p50: number;
    p80: number;
    p90: number;
  };
}

export class PERTEngine {
  calculate(inputs: PERTInputs): PERTResults {
    const { optimistic: O, mostLikely: M, pessimistic: P } = inputs;
    
    const expected = (O + 4 * M + P) / 6;
    const stdDev = (P - O) / 6;
    const variance = stdDev ** 2;
    
    return {
      expected,
      standardDeviation: stdDev,
      variance,
      confidenceInterval: {
        p50: expected,
        p80: expected + 0.84 * stdDev,
        p90: expected + 1.28 * stdDev,
      }
    };
  }

  addUncertainty(
    baselineMonths: number,
    confidenceLevel: 'low' | 'medium' | 'high'
  ): PERTResults {
    const multipliers = {
      low: { O: 0.85, M: 1.0, P: 1.15 },
      medium: { O: 0.80, M: 1.0, P: 1.30 },
      high: { O: 0.70, M: 1.0, P: 1.50 },
    };
    
    const mult = multipliers[confidenceLevel];
    
    return this.calculate({
      optimistic: baselineMonths * mult.O,
      mostLikely: baselineMonths * mult.M,
      pessimistic: baselineMonths * mult.P,
    });
  }
}

export const pertEngine = new PERTEngine();
```

**Create** `components/estimator/ConfidenceRibbon.tsx`:
```typescript
import { Card, Statistic, Progress, Alert, Select } from 'antd';
import { useState } from 'react';
import { pertEngine } from '@/lib/estimator/pert-engine';
import { useEstimatorStore } from '@/stores/estimator-store';

export function ConfidenceRibbon() {
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const results = useEstimatorStore(state => state.results);
  
  if (!results) return null;
  
  const pertResults = pertEngine.addUncertainty(results.durationMonths, confidence);
  
  return (
    <Card title="Uncertainty Analysis">
      <div className="mb-4">
        <Select value={confidence} onChange={setConfidence} className="w-full">
          <Select.Option value="low">Low Uncertainty</Select.Option>
          <Select.Option value="medium">Medium Uncertainty</Select.Option>
          <Select.Option value="high">High Uncertainty</Select.Option>
        </Select>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Statistic 
          title="Best Case (P10)" 
          value={pertResults.expected - 1.28 * pertResults.standardDeviation} 
          suffix="mo" 
          precision={1} 
        />
        <Statistic 
          title="Expected (P50)" 
          value={pertResults.expected} 
          suffix="mo" 
          precision={1} 
        />
        <Statistic 
          title="Buffer (P90)" 
          value={pertResults.confidenceInterval.p90} 
          suffix="mo" 
          precision={1} 
        />
      </div>
      
      <Alert
        message="Risk Assessment"
        description={`There's a 90% chance the project will complete within ${pertResults.confidenceInterval.p90.toFixed(1)} months.`}
        type="info"
        showIcon
      />
    </Card>
  );
}
```

### 2. Sensitivity Analysis (Tornado Chart)

**Create** `lib/estimator/sensitivity-analysis.ts`:
```typescript
import { formulaEngine } from './formula-engine';
import type { EstimatorInputs, Profile } from './types';

export interface SensitivityResult {
  variable: string;
  baseline: number;
  lowImpact: number;
  highImpact: number;
  range: number;
}

export function performSensitivity(
  baseInputs: EstimatorInputs,
  profile: Profile
): SensitivityResult[] {
  const variables = [
    { name: 'FTE', field: 'fte' as const, delta: 0.2 },
    { name: 'Scope Breadth', field: 'selectedL3Items' as const, delta: 0.2 },
    { name: 'Utilization', field: 'utilization' as const, delta: 0.1 },
    { name: 'Overlap Factor', field: 'overlapFactor' as const, delta: 0.1 },
    { name: 'Integrations', field: 'integrations' as const, delta: 2 },
  ];

  const baseline = formulaEngine.calculateTotal(baseInputs, profile);

  return variables.map(v => {
    let lowInputs = { ...baseInputs };
    let highInputs = { ...baseInputs };

    if (v.field === 'fte') {
      lowInputs.fte = baseInputs.fte * (1 - v.delta);
      highInputs.fte = baseInputs.fte * (1 + v.delta);
    } else if (v.field === 'utilization') {
      lowInputs.utilization = Math.max(0.5, baseInputs.utilization * (1 - v.delta));
      highInputs.utilization = Math.min(1.0, baseInputs.utilization * (1 + v.delta));
    } else if (v.field === 'overlapFactor') {
      lowInputs.overlapFactor = Math.max(0.6, baseInputs.overlapFactor * (1 - v.delta));
      highInputs.overlapFactor = Math.min(1.0, baseInputs.overlapFactor * (1 + v.delta));
    } else if (v.field === 'integrations') {
      lowInputs.integrations = Math.max(0, baseInputs.integrations - v.delta);
      highInputs.integrations = baseInputs.integrations + v.delta;
    } else if (v.field === 'selectedL3Items') {
      // Simulate adding/removing 20% of items
      const itemCount = baseInputs.selectedL3Items.length;
      const delta = Math.floor(itemCount * v.delta);
      lowInputs.selectedL3Items = baseInputs.selectedL3Items.slice(0, itemCount - delta);
      highInputs.selectedL3Items = [...baseInputs.selectedL3Items]; // Keep same for high
    }

    const lowResult = formulaEngine.calculateTotal(lowInputs, profile);
    const highResult = formulaEngine.calculateTotal(highInputs, profile);

    return {
      variable: v.name,
      baseline: baseline.durationMonths,
      lowImpact: lowResult.durationMonths,
      highImpact: highResult.durationMonths,
      range: Math.abs(highResult.durationMonths - lowResult.durationMonths),
    };
  }).sort((a, b) => b.range - a.range);
}
```

**Create** `components/estimator/TornadoChart.tsx`:
```typescript
import { Card, Alert } from 'antd';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, Tooltip, Cell } from 'recharts';
import { performSensitivity } from '@/lib/estimator/sensitivity-analysis';
import { useEstimatorStore } from '@/stores/estimator-store';

export function TornadoChart() {
  const store = useEstimatorStore();
  
  if (!store.results) return null;
  
  const inputs = {
    profileIndex: 0,
    selectedL3Items: store.selectedL3Items,
    integrations: store.integrations,
    customForms: store.customForms,
    fitToStandard: store.fitToStandard,
    legalEntities: store.legalEntities,
    countries: store.countries,
    languages: store.languages,
    fte: store.fte,
    utilization: store.utilization,
    overlapFactor: store.overlapFactor,
  };
  
  const sensitivity = performSensitivity(inputs, store.profile);
  
  const data = sensitivity.map(s => ({
    variable: s.variable,
    low: s.lowImpact - s.baseline,
    high: s.highImpact - s.baseline,
  }));

  return (
    <Card title="Sensitivity Analysis: What Moves the Estimate?">
      <BarChart
        width={600}
        height={300}
        data={data}
        layout="vertical"
        margin={{ left: 120 }}
      >
        <XAxis type="number" />
        <YAxis type="category" dataKey="variable" width={100} />
        <ReferenceLine x={0} stroke="#666" />
        <Tooltip />
        <Bar dataKey="low" fill="#ff4d4f" stackId="a" />
        <Bar dataKey="high" fill="#52c41a" stackId="a" />
      </BarChart>
      
      <Alert
        className="mt-4"
        message={`${data[0].variable} has the highest impact on duration`}
        type="warning"
      />
    </Card>
  );
}
```

### 3. Goal-Seek Optimization

**Create** `lib/estimator/goal-seek.ts`:
```typescript
import { formulaEngine } from './formula-engine';
import type { EstimatorInputs, Profile } from './types';

export interface GoalSeekParams {
  targetMonths: number;
  currentInputs: EstimatorInputs;
  profile: Profile;
  constraints: {
    maxFTE?: number;
    minUtilization?: number;
    fixedScope?: boolean;
  };
}

export interface OptimizationSuggestion {
  scenario: string;
  adjustments: { field: string; from: number; to: number }[];
  achievesGoal: boolean;
  costImpact: number;
  riskScore: number;
}

export function goalSeekOptimizer(params: GoalSeekParams): OptimizationSuggestion[] {
  const { targetMonths, currentInputs, profile, constraints } = params;
  const currentResult = formulaEngine.calculateTotal(currentInputs, profile);
  const suggestions: OptimizationSuggestion[] = [];

  // Strategy 1: Increase FTE
  if (!constraints.maxFTE || currentInputs.fte < constraints.maxFTE) {
    const requiredCapacity = (currentResult.totalMD / targetMonths) / (22 * currentInputs.utilization * currentInputs.overlapFactor);
    const requiredFTE = requiredCapacity;
    
    if (requiredFTE <= (constraints.maxFTE || 20)) {
      suggestions.push({
        scenario: 'Add Resources',
        adjustments: [{ field: 'FTE', from: currentInputs.fte, to: requiredFTE }],
        achievesGoal: true,
        costImpact: (requiredFTE - currentInputs.fte) * 22 * 150 * targetMonths,
        riskScore: 3,
      });
    }
  }

  // Strategy 2: Reduce scope
  if (!constraints.fixedScope) {
    const targetMD = targetMonths * currentInputs.fte * 22 * currentInputs.utilization * currentInputs.overlapFactor;
    const requiredReduction = Math.max(0, (currentResult.totalMD - targetMD) / currentResult.totalMD);
    
    suggestions.push({
      scenario: 'Reduce Scope',
      adjustments: [{ field: 'L3 Items', from: currentInputs.selectedL3Items.length, to: Math.floor(currentInputs.selectedL3Items.length * (1 - requiredReduction)) }],
      achievesGoal: requiredReduction <= 0.3,
      costImpact: 0,
      riskScore: 7,
    });
  }

  // Strategy 3: Increase utilization
  const maxUtilization = constraints.minUtilization || 0.90;
  if (currentInputs.utilization < maxUtilization) {
    suggestions.push({
      scenario: 'Intensify Schedule',
      adjustments: [
        { field: 'Utilization', from: currentInputs.utilization, to: maxUtilization },
        { field: 'Overlap', from: currentInputs.overlapFactor, to: 0.65 },
      ],
      achievesGoal: targetMonths >= currentResult.durationMonths * 0.85,
      costImpact: 0,
      riskScore: 8,
    });
  }

  return suggestions.sort((a, b) => a.riskScore - b.riskScore);
}
```

**Create** `components/timeline/OptimizationModal.tsx`:
```typescript
import { Modal, List, Button, Tag } from 'antd';
import { goalSeekOptimizer } from '@/lib/estimator/goal-seek';
import { useEstimatorStore } from '@/stores/estimator-store';

interface Props {
  targetDate: Date;
  open: boolean;
  onClose: () => void;
}

export function OptimizationModal({ targetDate, open, onClose }: Props) {
  const store = useEstimatorStore();
  
  if (!store.results) return null;
  
  const targetMonths = (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  
  const suggestions = goalSeekOptimizer({
    targetMonths,
    currentInputs: {
      profileIndex: 0,
      selectedL3Items: store.selectedL3Items,
      integrations: store.integrations,
      customForms: store.customForms,
      fitToStandard: store.fitToStandard,
      legalEntities: store.legalEntities,
      countries: store.countries,
      languages: store.languages,
      fte: store.fte,
      utilization: store.utilization,
      overlapFactor: store.overlapFactor,
    },
    profile: store.profile,
    constraints: {},
  });

  return (
    <Modal 
      title={`Achieve Target: ${targetDate.toLocaleDateString()}`} 
      open={open} 
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <List
        dataSource={suggestions}
        renderItem={s => (
          <List.Item
            actions={[
              <Button type="primary" disabled={!s.achievesGoal}>Apply</Button>
            ]}
          >
            <List.Item.Meta
              title={
                <div className="flex items-center gap-2">
                  {s.scenario}
                  <Tag color={s.riskScore <= 3 ? 'green' : s.riskScore <= 6 ? 'orange' : 'red'}>
                    Risk: {s.riskScore}/10
                  </Tag>
                </div>
              }
              description={
                <>
                  {s.adjustments.map(a => (
                    <div key={a.field}>
                      {a.field}: {a.from.toFixed(1)} → {a.to.toFixed(1)}
                    </div>
                  ))}
                  <Tag color={s.costImpact > 0 ? 'red' : 'green'}>
                    {s.costImpact > 0 ? '+' : ''}${s.costImpact.toLocaleString()}
                  </Tag>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
```

### 4. Scenario Comparison Screen

**Create** `app/compare/page.tsx`:
```typescript
'use client';
import { Card, Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';

export default function ComparePage() {
  const { data: scenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const res = await fetch('/api/scenarios');
      return res.json();
    },
  });

  const columns = [
    { title: 'Scenario', dataIndex: 'name', key: 'name' },
    { 
      title: 'Effort (MD)', 
      dataIndex: 'totalMD', 
      key: 'totalMD',
      render: (v: number, record: any, index: number) => {
        if (index === 0) return v.toFixed(0);
        const baseline = scenarios[0].totalMD;
        const diff = ((v - baseline) / baseline * 100).toFixed(0);
        return (
          <span>
            {v.toFixed(0)} 
            <Tag color={v > baseline ? 'red' : 'green'} className="ml-2">
              {v > baseline ? '+' : ''}{diff}%
            </Tag>
          </span>
        );
      }
    },
    { 
      title: 'Duration (mo)', 
      dataIndex: 'durationMonths', 
      key: 'duration',
      render: (v: number, record: any, index: number) => {
        if (index === 0) return v.toFixed(1);
        const baseline = scenarios[0].durationMonths;
        const diff = ((v - baseline) / baseline * 100).toFixed(0);
        return (
          <span>
            {v.toFixed(1)} 
            <Tag color={v > baseline ? 'red' : 'green'} className="ml-2">
              {v > baseline ? '+' : ''}{diff}%
            </Tag>
          </span>
        );
      }
    },
    { 
      title: 'FTE', 
      dataIndex: ['inputs', 'fte'], 
      key: 'fte',
      render: (v: number) => v.toFixed(1) 
    },
  ];

  return (
    <div className="p-4">
      <Card title="Scenario Comparison">
        <Table 
          dataSource={scenarios?.slice(0, 3)} 
          columns={columns} 
          pagination={false}
          rowKey="id"
        />
      </Card>
    </div>
  );
}
```

### 5. Unit Tests

**Create** `lib/estimator/__tests__/pert-engine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { pertEngine } from '../pert-engine';

describe('PERTEngine', () => {
  it('calculates expected value correctly', () => {
    const result = pertEngine.calculate({
      optimistic: 3,
      mostLikely: 4,
      pessimistic: 6
    });
    
    expect(result.expected).toBeCloseTo(4.17, 2);
    expect(result.standardDeviation).toBeCloseTo(0.5, 1);
  });

  it('calculates P90 correctly', () => {
    const result = pertEngine.calculate({
      optimistic: 3,
      mostLikely: 4,
      pessimistic: 6
    });
    
    expect(result.confidenceInterval.p90).toBeCloseTo(4.81, 2); // 4.17 + 1.28*0.5
  });

  it('adds uncertainty to baseline', () => {
    const result = pertEngine.addUncertainty(4, 'medium');
    
    expect(result.expected).toBeCloseTo(4, 1);
    expect(result.confidenceInterval.p90).toBeGreaterThan(4);
  });
});
```

## Acceptance Criteria
✅ PERT P90 calculation matches formula  
✅ Tornado chart identifies highest-impact variable  
✅ Goal-seek suggests valid optimizations  
✅ Scenario comparison shows % diffs  
✅ Confidence ribbon displays P50/P80/P90  
✅ Unit tests pass  

## Files to Create/Modify
- `lib/estimator/pert-engine.ts` (CREATE)
- `lib/estimator/sensitivity-analysis.ts` (CREATE)
- `lib/estimator/goal-seek.ts` (CREATE)
- `components/estimator/ConfidenceRibbon.tsx` (CREATE)
- `components/estimator/TornadoChart.tsx` (CREATE)
- `components/timeline/OptimizationModal.tsx` (CREATE)
- `app/compare/page.tsx` (CREATE)
- `lib/estimator/__tests__/pert-engine.test.ts` (CREATE)

## Validation Steps
```bash
# 1. Test PERT
npm run test:unit -- pert-engine.test.ts
# ✅ P90 = expected + 1.28*stdDev

# 2. Test sensitivity
# Visit /estimator, click "Sensitivity Analysis"
# ✅ Tornado chart shows FTE has highest impact

# 3. Test goal-seek
# Click "Optimize for Target Date"
# ✅ Suggests adding FTE or reducing scope

# 4. Test comparison
# Navigate to /compare with 3 scenarios
# ✅ Shows % differences
```

## Documents to Attach
1. ADDENDUM.md (Section 5.1-5.3 - PERT, Sensitivity, Goal-Seek)

## Output Format
1. All files
2. npm commands
3. Summary
4. Test results
```

---

# **PHASE 5: EXPORTS & SECURITY**

```markdown
# Keystone Development - Phase 5: Exports & Security

## Context
Tech stack: Next.js 15 + Puppeteer + PptxGenJS + Prisma

**Prerequisites completed:**
- ✅ Scenarios saved in database
- ✅ Phase breakdown available
- ✅ Timeline data structured

## Tasks

### 1. Puppeteer PDF Generation

**Install:**
```bash
npm install puppeteer
npm install -D @types/puppeteer
```

**Create** `lib/export/pdf-generator.ts`:
```typescript
import puppeteer from 'puppeteer';
import type { Scenario } from '@prisma/client';

export async function generatePDF(scenario: Scenario): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #0070f3; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; }
    .formula { background: #f9f9f9; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>SAP S/4HANA Estimate: ${scenario.name}</h1>
  <p>Generated: ${new Date().toLocaleDateString()}</p>
  
  <h2>Summary</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Effort</td><td>${scenario.totalMD.toFixed(0)} MD</td></tr>
    <tr><td>Duration</td><td>${scenario.durationMonths.toFixed(1)} months</td></tr>
    <tr><td>PMO Effort</td><td>${scenario.pmoMD.toFixed(0)} MD</td></tr>
  </table>

  <h2>Phase Breakdown</h2>
  <table>
    <tr><th>Phase</th><th>Effort (MD)</th><th>Duration (mo)</th></tr>
    ${(scenario.phases as any[]).map(p => `
      <tr>
        <td>${p.phaseName}</td>
        <td>${p.effortMD.toFixed(1)}</td>
        <td>${p.durationMonths.toFixed(2)}</td>
      </tr>
    `).join('')}
  </table>

  <h2>Formula Transparency</h2>
  <div class="formula">
    <strong>Calculation:</strong><br/>
    E_FT = Base × (1 + Sb) × (1 + Pc) × (1 + Os)<br/>
    E_total = E_FT + E_fixed + E_PMO<br/>
    D = (E_total / Capacity) × Overlap<br/>
    <br/>
    <strong>Values:</strong><br/>
    Total Effort: ${scenario.totalMD.toFixed(0)} MD<br/>
    Duration: ${scenario.durationMonths.toFixed(2)} months<br/>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  
  await browser.close();
  return pdf;
}
```

**Create** `app/api/export/pdf/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { generatePDF } from '@/lib/export/pdf-generator';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { scenarioId } = await req.json();
  
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId, userId: session.user.id }
  });

  if (!scenario) return Response.json({ error: 'Not found' }, { status: 404 });

  const pdf = await generatePDF(scenario);

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="SAP_Estimate_${scenario.name}.pdf"`,
    },
  });
}
```

### 2. PowerPoint Export

**Install:**
```bash
npm install pptxgenjs
```

**Create** `lib/export/powerpoint-generator.ts`:
```typescript
import PptxGenJS from 'pptxgenjs';
import type { Scenario } from '@prisma/client';

export async function generatePowerPoint(scenario: Scenario): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Slide 1: Title
  const slide1 = pptx.addSlide();
  slide1.addText('SAP S/4HANA Implementation Estimate', {
    x: 1, y: 2, w: 8, h: 1.5,
    fontSize: 32, bold: true, color: '0070f3', align: 'center'
  });
  slide1.addText(scenario.name, {
    x: 1, y: 3.5, w: 8, h: 1,
    fontSize: 24, align: 'center'
  });

  // Slide 2: Executive Summary
  const slide2 = pptx.addSlide();
  slide2.addText('Executive Summary', { x: 0.5, y: 0.5, fontSize: 28, bold: true });
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Effort', `${scenario.totalMD.toFixed(0)} MD`],
    ['Duration', `${scenario.durationMonths.toFixed(1)} months`],
    ['PMO Effort', `${scenario.pmoMD.toFixed(0)} MD`],
  ];
  
  slide2.addTable(summaryData, {
    x: 1, y: 1.5, w: 8, h: 2,
    fontSize: 14,
    border: { pt: 1, color: 'CFCFCF' },
    fill: { color: 'F0F0F0' },
  });

  // Slide 3: Phase Breakdown
  const slide3 = pptx.addSlide();
  slide3.addText('Phase Breakdown', { x: 0.5, y: 0.5, fontSize: 28, bold: true });
  
  const phases = scenario.phases as any[];
  const phaseData = [
    ['Phase', 'Effort (MD)', 'Duration (mo)'],
    ...phases.map(p => [p.phaseName, p.effortMD.toFixed(1), p.durationMonths.toFixed(2)])
  ];
  
  slide3.addTable(phaseData, {
    x: 1, y: 1.5, w: 8, h: 3,
    fontSize: 12,
  });

  // Slide 4: Gantt Chart (placeholder)
  const slide4 = pptx.addSlide();
  slide4.addText('Project Timeline', { x: 0.5, y: 0.5, fontSize: 28, bold: true });
  slide4.addText('[Gantt Chart Placeholder]', { x: 2, y: 3, fontSize: 18, color: '999999' });

  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  return buffer;
}
```

**Create** `app/api/export/powerpoint/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { generatePowerPoint } from '@/lib/export/powerpoint-generator';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { scenarioId } = await req.json();
  
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId, userId: session.user.id }
  });

  if (!scenario) return Response.json({ error: 'Not found' }, { status: 404 });

  const pptx = await generatePowerPoint(scenario);

  return new Response(pptx, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="SAP_Estimate_${scenario.name}.pptx"`,
    },
  });
}
```

### 3. CSV Export

**Create** `app/api/export/csv/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scenarioId = searchParams.get('scenarioId');

  if (!scenarioId) return Response.json({ error: 'Missing scenarioId' }, { status: 400 });

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId, userId: session.user.id }
  });

  if (!scenario) return Response.json({ error: 'Not found' }, { status: 404 });

  const phases = scenario.phases as any[];
  const csv = [
    ['Phase', 'Effort (MD)', 'Duration (months)'],
    ...phases.map(p => [p.phaseName, p.effortMD.toFixed(1), p.durationMonths.toFixed(2)]),
    [],
    ['Total', scenario.totalMD.toFixed(0), scenario.durationMonths.toFixed(1)],
  ].map(row => row.join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="SAP_Estimate_${scenario.name}.csv"`,
    },
  });
}
```

### 4. RBAC Implementation

**Update** `prisma/schema.prisma`:
```prisma
enum UserRole {
  ADMIN
  OWNER
  EDITOR
  VIEWER
}

model User {
  id        String       @id @default(cuid())
  email     String       @unique
  role      UserRole     @default(VIEWER)
  memberships TeamMember[]
}

model TeamMember {
  id             String       @id @default(cuid())
  userId         String
  user           User         @relation(fields: [userId], references: [id])
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  role           UserRole     @default(VIEWER)
  
  @@unique([userId, organizationId])
}
```

**Create** `lib/auth/rbac.ts`:
```typescript
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

const roleHierarchy = {
  [UserRole.VIEWER]: 0,
  [UserRole.EDITOR]: 1,
  [UserRole.OWNER]: 2,
  [UserRole.ADMIN]: 3,
};

export async function requireRole(requiredRole: UserRole): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user?.id) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) return false;

  return roleHierarchy[user.role as UserRole] >= roleHierarchy[requiredRole];
}

export async function canEditScenario(scenarioId: string): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user?.id) return false;

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId }
  });

  if (!scenario) return false;

  // Owner can always edit
  if (scenario.userId === session.user.id) return true;

  // Admin can edit all
  return await requireRole(UserRole.ADMIN);
}
```

**Update** `app/api/scenarios/[id]/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { canEditScenario } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const canEdit = await canEditScenario(params.id);
  if (!canEdit) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const scenario = await prisma.scenario.update({
    where: { id: params.id },
    data: body,
  });

  return Response.json(scenario);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const canEdit = await canEditScenario(params.id);
  if (!canEdit) return Response.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.scenario.delete({ where: { id: params.id } });
  return Response.json({ success: true });
}
```

### 5. Audit Logging

**Create** `lib/audit/logger.ts`:
```typescript
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
}

export async function logAudit(params: {
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: any;
  metadata?: any;
  req: Request;
}) {
  const session = await getServerSession();
  if (!session?.user) return;

  await prisma.auditLog.create({
    data: {
      organizationId: null, // Add org ID if multi-tenant
      actorId: session.user.id,
      actorEmail: session.user.email!,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes,
      metadata: params.metadata,
      ipAddress: params.req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: params.req.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
    },
  });
}
```

**Update** `app/api/scenarios/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  
  const scenario = await prisma.scenario.create({
    data: {
      userId: session.user.id,
      ...body,
    },
  });

  await logAudit({
    action: AuditAction.CREATE,
    entityType: 'scenario',
    entityId: scenario.id,
    metadata: { name: scenario.name },
    req,
  });

  return Response.json(scenario);
}
```

**Create** `app/api/audit-logs/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { requireRole, UserRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const canView = await requireRole(UserRole.OWNER);
  if (!canView) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const scenarioId = searchParams.get('scenarioId');

  const logs = await prisma.auditLog.findMany({
    where: scenarioId ? { entityId: scenarioId } : undefined,
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  return Response.json(logs);
}
```

## Acceptance Criteria
✅ PDF export includes formulas  
✅ PowerPoint has 4+ slides  
✅ CSV exports phase breakdown  
✅ VIEWER cannot delete scenarios  
✅ ADMIN can edit all scenarios  
✅ Audit logs capture CREATE/UPDATE/DELETE/EXPORT  

## Files to Create/Modify
- `lib/export/pdf-generator.ts` (CREATE)
- `lib/export/powerpoint-generator.ts` (CREATE)
- `app/api/export/pdf/route.ts` (CREATE)
- `app/api/export/powerpoint/route.ts` (CREATE)
- `app/api/export/csv/route.ts` (CREATE)
- `lib/auth/rbac.ts` (CREATE)
- `lib/audit/logger.ts` (CREATE)
- `app/api/scenarios/[id]/route.ts` (UPDATE - add RBAC)
- `app/api/scenarios/route.ts` (UPDATE - add audit log)
- `app/api/audit-logs/route.ts` (CREATE)
- `prisma/schema.prisma` (UPDATE - add UserRole enum)

## Validation Steps
```bash
# 1. Test PDF export
curl -X POST http://localhost:3000/api/export/pdf \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"abc123"}' \
  --output test.pdf
# ✅ Opens with formulas

# 2. Test PowerPoint
# Download from UI
# ✅ Has title, summary, phases slides

# 3. Test CSV
curl http://localhost:3000/api/export/csv?scenarioId=abc123
# ✅ Returns CSV

# 4. Test RBAC
# Login as VIEWER, try DELETE
# ✅ Returns 403

# 5. Test audit log
curl http://localhost:3000/api/audit-logs?scenarioId=abc123
# ✅ Shows CREATE event
```

## Documents to Attach
1. ADDENDUM.md (Section 4 - Security & RBAC)

## Output Format
1. All files
2. npm commands
3. Summary
4. Test results
```

---

# **PHASE 6: TESTING & ACCESSIBILITY**

```markdown
# Keystone Development - Phase 6: Testing & Accessibility

## Context
Tech stack: Vitest + Playwright + @axe-core/playwright + Storybook

**Prerequisites completed:**
- ✅ All features implemented (Phases 1-5)
- ✅ Formula engine, timeline, exports working

## Tasks

### 1. Unit Tests (Vitest)

**Install:**
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

**Create** `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Create** `vitest.setup.ts`:
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
afterEach(() => cleanup());
```

**Create** `lib/estimator/__tests__/sensitivity-analysis.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { performSensitivity } from '../sensitivity-analysis';
import { DEFAULT_PROFILE } from '../types';

describe('Sensitivity Analysis', () => {
  it('identifies FTE as highest impact variable', () => {
    const inputs = {
      profileIndex: 0,
      selectedL3Items: [],
      integrations: 0,
      customForms: 4,
      fitToStandard: 1.0,
      legalEntities: 1,
      countries: 1,
      languages: 1,
      fte: 5.6,
      utilization: 0.8,
      overlapFactor: 0.75,
    };

    const results = performSensitivity(inputs, DEFAULT_PROFILE);

    expect(results[0].variable).toBe('FTE');
    expect(results[0].range).toBeGreaterThan(0);
  });

  it('returns results sorted by impact', () => {
    const inputs = { /* ... */ };
    const results = performSensitivity(inputs, DEFAULT_PROFILE);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].range).toBeGreaterThanOrEqual(results[i].range);
    }
  });
});
```

**Create** `lib/estimator/__tests__/goal-seek.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { goalSeekOptimizer } from '../goal-seek';
import { DEFAULT_PROFILE } from '../types';

describe('Goal Seek Optimizer', () => {
  it('suggests adding FTE for tight timeline', () => {
    const suggestions = goalSeekOptimizer({
      targetMonths: 2.5,
      currentInputs: {
        profileIndex: 0,
        selectedL3Items: [],
        integrations: 0,
        customForms: 4,
        fitToStandard: 1.0,
        legalEntities: 1,
        countries: 1,
        languages: 1,
        fte: 5.6,
        utilization: 0.8,
        overlapFactor: 0.75,
      },
      profile: DEFAULT_PROFILE,
      constraints: {},
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].scenario).toContain('Resources');
  });

  it('sorts by risk score (lowest first)', () => {
    const suggestions = goalSeekOptimizer({ /* ... */ });

    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1].riskScore).toBeLessThanOrEqual(suggestions[i].riskScore);
    }
  });
});
```

**Update** `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 2. E2E Tests (Playwright)

**Install:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Create** `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Create** `tests/e2e/estimator-flow.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('complete estimation flow', async ({ page }) => {
  await page.goto('/estimator');

  // Wait for page load
  await expect(page.locator('h2:has-text("Estimator Inputs")')).toBeVisible();

  // Adjust FTE
  const fteSlider = page.locator('input[type="range"]').first();
  await fteSlider.fill('7.0');

  // Verify results update
  await expect(page.locator('[data-testid="total-md"]')).toContainText(/\d+/);

  // Open L3 catalog
  await page.click('text=Select from Catalog');
  await expect(page.locator('[data-testid="l3-modal"]')).toBeVisible();

  // Search and select item
  await page.fill('[placeholder="Search items..."]', 'Accounting');
  await page.click('text=J58');
  await page.click('text=Apply Selection');

  // Save scenario
  await page.click('text=Save Scenario');
  await page.fill('[placeholder="Scenario name"]', 'E2E Test');
  await page.click('button:has-text("Save")');

  // Verify saved
  await expect(page.locator('text=Saved successfully')).toBeVisible({ timeout: 5000 });
});

test('L3 catalog performance', async ({ page }) => {
  await page.goto('/estimator');

  const startTime = Date.now();
  await page.click('text=Select from Catalog');
  await page.waitForSelector('[data-testid="l3-modal"]');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(500);

  // Check virtual scrolling
  const renderedItems = await page.locator('[data-testid="l3-item"]').count();
  expect(renderedItems).toBeLessThan(50); // Not all 293
});
```

**Create** `tests/e2e/timeline.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('timeline sync with estimator', async ({ page }) => {
  await page.goto('/estimator');

  // Set FTE
  await page.fill('[data-testid="fte-input"]', '7.0');

  // Navigate to timeline
  await page.click('text=Generate Timeline');
  await page.waitForURL('/timeline');

  // Check FTE reflected
  const resourceRow = page.locator('table tr:has-text("Project Manager")');
  await expect(resourceRow).toBeVisible();
});
```

### 3. Accessibility Tests

**Install:**
```bash
npm install -D @axe-core/playwright
```

**Create** `tests/a11y/estimator.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('estimator meets WCAG 2.2 AA', async ({ page }) => {
  await page.goto('/estimator');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('keyboard navigation works', async ({ page }) => {
  await page.goto('/estimator');

  // Tab through controls
  await page.keyboard.press('Tab');
  const focused1 = await page.evaluate(() => document.activeElement?.tagName);
  expect(['SELECT', 'BUTTON', 'INPUT']).toContain(focused1);

  // Open L3 modal with keyboard
  await page.keyboard.press('Enter');
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Close with Escape
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});
```

**Create** `tests/a11y/timeline.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('timeline meets WCAG 2.2 AA', async ({ page }) => {
  await page.goto('/timeline');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### 4. Storybook Component Library

**Install:**
```bash
npx storybook@latest init
```

**Create** `components/estimator/InputPanel.stories.tsx`:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { InputPanel } from './InputPanel';

const meta: Meta<typeof InputPanel> = {
  title: 'Estimator/InputPanel',
  component: InputPanel,
};

export default meta;
type Story = StoryObj<typeof InputPanel>;

export const Default: Story = {};

export const WithSelectedItems: Story = {
  parameters: {
    store: {
      selectedL3Items: [
        { id: '1', l3Code: 'J58', l3Name: 'Accounting', tier: 'C', coefficient: 0.010 },
      ],
    },
  },
};
```

**Create** `.storybook/preview.tsx`:
```typescript
import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
  },
};

export default preview;
```

### 5. Performance Benchmarks

**Create** `tests/performance/calculation-speed.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { formulaEngine } from '@/lib/estimator/formula-engine';
import { DEFAULT_PROFILE } from '@/lib/estimator/types';

describe('Performance Benchmarks', () => {
  it('formula calculation completes in <50ms (p95)', () => {
    const inputs = {
      profileIndex: 0,
      selectedL3Items: [],
      integrations: 5,
      customForms: 6,
      fitToStandard: 0.9,
      legalEntities: 2,
      countries: 2,
      languages: 2,
      fte: 7.0,
      utilization: 0.85,
      overlapFactor: 0.7,
    };

    const times: number[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      formulaEngine.calculateTotal(inputs, DEFAULT_PROFILE);
      const end = performance.now();
      times.push(end - start);
    }

    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(iterations * 0.95)];

    expect(p95).toBeLessThan(50);
  });
});
```

**Update** `package.json`:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/a11y",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## Acceptance Criteria
✅ Unit test coverage >90%  
✅ All E2E tests pass  
✅ 0 accessibility violations  
✅ Keyboard navigation works  
✅ Formula calculation <50ms (p95)  
✅ Components render in Storybook  

## Files to Create/Modify
- `vitest.config.ts` (CREATE)
- `vitest.setup.ts` (CREATE)
- `playwright.config.ts` (CREATE)
- `lib/estimator/__tests__/sensitivity-analysis.test.ts` (CREATE)
- `lib/estimator/__tests__/goal-seek.test.ts` (CREATE)
- `tests/e2e/estimator-flow.spec.ts` (CREATE)
- `tests/e2e/timeline.spec.ts` (CREATE)
- `tests/a11y/estimator.spec.ts` (CREATE)
- `tests/a11y/timeline.spec.ts` (CREATE)
- `tests/performance/calculation-speed.test.ts` (CREATE)
- `components/estimator/InputPanel.stories.tsx` (CREATE)
- `.storybook/preview.tsx` (CREATE)
- `package.json` (UPDATE - add test scripts)

## Validation Steps
```bash
# 1. Run unit tests
npm run test:coverage
# ✅ Coverage >90%

# 2. Run E2E tests
npm run test:e2e
# ✅ All pass

# 3. Run accessibility tests
npm run test:a11y
# ✅ 0 violations

# 4. Run Storybook
npm run storybook
# ✅ Components render

# 5. Performance benchmark
npm run test -- performance
# ✅ p95 <50ms
```

## Documents to Attach
1. ADDENDUM.md (Section 9 - Testing Strategy)

## Output Format
1. All test files
2. npm commands
3. Summary
4. Test coverage report
```

---

# **PHASE 7: POLISH & DEPLOY**

```markdown
# Keystone Development - Phase 7: Polish & Deployment

## Context
Final phase: i18n, progressive disclosure, command palette, production deployment

**Prerequisites completed:**
- ✅ All features working (Phases 1-6)
- ✅ Tests passing
- ✅ Accessibility validated

## Tasks

### 1. Internationalization (i18n)

**Install:**
```bash
npm install next-intl
```

**Create** `i18n.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
```

**Create** `messages/en.json`:
```json
{
  "estimator": {
    "title": "Keystone Estimator",
    "scopeBreadth": "Scope Breadth (Sb)",
    "l3Selection": "Select L3 Items",
    "totalEffort": "Total Effort",
    "duration": "Duration",
    "saveScenario": "Save Scenario",
    "phases": {
      "prepare": "Prepare",
      "explore": "Explore",
      "realize": "Realize",
      "deploy": "Deploy",
      "run": "Run"
    }
  }
}
```

**Create** `messages/zh.json`:
```json
{
  "estimator": {
    "title": "SAP 驾驶舱估算器",
    "scopeBreadth": "范围广度 (Sb)",
    "l3Selection": "选择 L3 项目",
    "totalEffort": "总工作量",
    "duration": "持续时间",
    "saveScenario": "保存场景",
    "phases": {
      "prepare": "准备",
      "explore": "探索",
      "realize": "实现",
      "deploy": "部署",
      "run": "运行"
    }
  }
}
```

**Update** `next.config.js`:
```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

export default withNextIntl({
  // ... existing config
});
```

**Update** `app/estimator/page.tsx`:
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function EstimatorPage() {
  const t = useTranslations('estimator');

  return (
    <div>
      <h1>{t('title')}</h1>
      {/* ... */}
    </div>
  );
}
```

### 2. Progressive Disclosure (Novice/Expert Mode)

**Create** `stores/preferences-store.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  expertMode: boolean;
  showFormulas: boolean;
  defaultProfile: string;
  
  toggleExpertMode: () => void;
  setShowFormulas: (show: boolean) => void;
  setDefaultProfile: (profile: string) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      expertMode: false,
      showFormulas: false,
      defaultProfile: 'malaysia-mid-market',
      
      toggleExpertMode: () => set((state) => ({ expertMode: !state.expertMode })),
      setShowFormulas: (show) => set({ showFormulas: show }),
      setDefaultProfile: (profile) => set({ defaultProfile: profile }),
    }),
    { name: 'user-preferences' }
  )
);
```

**Update** `components/estimator/InputPanel.tsx`:
```typescript
import { Switch } from 'antd';
import { usePreferences } from '@/stores/preferences-store';

export function InputPanel() {
  const { expertMode, toggleExpertMode } = usePreferences();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Switch checked={expertMode} onChange={toggleExpertMode} />
        <span>{expertMode ? 'Expert Mode' : 'Simple Mode'}</span>
      </div>

      {expertMode ? (
        <>
          <ScopeBreadth showAdvanced />
          <ProcessComplexity showFormCalculator />
          <OrgScale showPerCountryBreakdown />
        </>
      ) : (
        <>
          <ProfileSelector />
          <SimpleSlider label="Team Size" />
          <SimpleSlider label="Timeline Preference" />
        </>
      )}
    </div>
  );
}
```

### 3. Command Palette

**Install:**
```bash
npm install cmdk
```

**Create** `components/common/CommandPalette.tsx`:
```typescript
'use client';
import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Type a command..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => router.push('/estimator')}>
            Go to Estimator
          </Command.Item>
          <Command.Item onSelect={() => router.push('/timeline')}>
            Go to Timeline
          </Command.Item>
          <Command.Item onSelect={() => router.push('/compare')}>
            Compare Scenarios
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Actions">
          <Command.Item>Save Scenario (Ctrl+S)</Command.Item>
          <Command.Item>Generate Timeline</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

**Update** `app/layout.tsx`:
```typescript
import { CommandPalette } from '@/components/common/CommandPalette';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
```

### 4. Production Deployment (Vercel)

**Create** `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

**Create** `.env.production` (template):
```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

**Create** `scripts/migrate-prod.sh`:
```bash
#!/bin/bash
npx prisma migrate deploy
npx prisma db seed
```

**Update** `package.json`:
```json
{
  "scripts": {
    "build": "next build",
    "postinstall": "prisma generate",
    "db:migrate:prod": "bash scripts/migrate-prod.sh"
  }
}
```

### 5. Monitoring Setup

**Create** `lib/monitoring/sentry.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
```

**Create** `lib/monitoring/posthog.ts`:
```typescript
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
  });
}

export const trackEvent = {
  estimatorCalculated: (data: any) => posthog.capture('estimator_calculated', data),
  scenarioSaved: (data: any) => posthog.capture('scenario_saved', data),
  exportGenerated: (data: any) => posthog.capture('export_generated', data),
};
```

**Create** `app/error.tsx`:
```typescript
'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>
  );
}
```

### 6. Production Checklist

**Create** `docs/DEPLOYMENT.md`:
```markdown
# Deployment Checklist

## Pre-Deployment
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables configured in Vercel
- [ ] Database migrations ready

## Database
- [ ] Run `npx prisma migrate deploy` in production
- [ ] Seed L3 catalog: `npm run db:seed`
- [ ] Verify 293 items loaded

## Monitoring
- [ ] Sentry DSN configured
- [ ] PostHog key configured
- [ ] Error tracking tested

## Post-Deployment
- [ ] Smoke test: create scenario
- [ ] Smoke test: export PDF
- [ ] Smoke test: accessibility (axe extension)
- [ ] Monitor Sentry for errors
- [ ] Monitor PostHog for events
```

## Acceptance Criteria
✅ UI displays in English and Chinese  
✅ Expert mode shows advanced controls  
✅ Command palette opens with Ctrl+K  
✅ Deployed to Vercel  
✅ Database migrated in production  
✅ Sentry captures errors  
✅ PostHog tracks events  

## Files to Create/Modify
- `i18n.ts` (CREATE)
- `messages/en.json` (CREATE)
- `messages/zh.json` (CREATE)
- `messages/de.json` (CREATE - German)
- `messages/es.json` (CREATE - Spanish)
- `stores/preferences-store.ts` (CREATE)
- `components/common/CommandPalette.tsx` (CREATE)
- `lib/monitoring/sentry.ts` (CREATE)
- `lib/monitoring/posthog.ts` (CREATE)
- `app/error.tsx` (CREATE)
- `vercel.json` (CREATE)
- `.env.production` (CREATE template)
- `scripts/migrate-prod.sh` (CREATE)
- `docs/DEPLOYMENT.md` (CREATE)
- `next.config.js` (UPDATE - add i18n)
- `app/layout.tsx` (UPDATE - add CommandPalette)

## Validation Steps
```bash
# 1. Test i18n
# Visit /zh/estimator
# ✅ UI in Chinese

# 2. Test command palette
# Press Ctrl+K
# ✅ Modal opens

# 3. Production build
npm run build
# ✅ No errors

# 4. Deploy to Vercel
vercel --prod
# ✅ Deployment successful

# 5. Verify monitoring
# Visit app, trigger error
# ✅ Error appears in Sentry
```

## Documents to Attach
1. ADDENDUM.md (Section 11 - Progressive Disclosure, Section 12 - i18n)

## Output Format
1. All files
2. Deployment commands
3. Summary
4. Production URL
```

---

**END OF ALL PROMPTS**