# Holistic Redesign V2: System-Level Transformation

**Source:** UX_UI_AUDIT_COMPLETE.md
**Version:** 2.0
**Date:** 2025-10-06
**Authors:** Steve Jobs + Jony Ive + Kiasu Engineer

---

## 🎯 EXECUTIVE DECISION

### The Core Problem (Theme Clusters)

After analyzing all local issues from the audit, **four systemic problems** emerge:

#### 1. **Identity Crisis** (Disconnected Experiences)
- **Symptoms:** Two tools (`/estimator` + `/project`) serve same persona but no data bridge
- **Root cause:** Built sequentially without unified mental model
- **Impact:** Users re-enter data, maintain two workflows, feel tool fragmentation
- **Audit refs:** Section 2.1 (Estimator disconnected), Section 4.2 (Data disconnects)

#### 2. **Incomplete Value Chain** (Missing Links)
- **Symptoms:** OptimizeMode placeholder, no PDF export, L3Selector lacks search
- **Root cause:** Feature delivery prioritized over complete user journey
- **Impact:** Users hit dead ends, can't finish what they started
- **Audit refs:** Section 1.5 (Optimize incomplete), Section 1.4 (Present no export)

#### 3. **State Fragmentation** (Data Silos)
- **Symptoms:** 3 Zustand stores (presales/timeline/project) don't share unified model
- **Root cause:** Domain-driven design without integration layer
- **Impact:** Data sync issues, regeneration risk, no single source of truth
- **Audit refs:** Section 4.1 (Store analysis), Section 1.3 (Timeline stale warnings)

#### 4. **Emotional Flatness** (No Delight Moments)
- **Symptoms:** Functional but not memorable, no pre-login appreciation, admin feels like chore
- **Root cause:** UX designed for tasks, not feelings
- **Impact:** No viral hooks, no habit formation, no word-of-mouth
- **Audit refs:** Section 1.1-1.4 (Emotional gaps), Section 6 (Flow analysis)

---

## 🏗️ FINAL STANCE: 3-Tier Product Architecture

### Decision Matrix

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Keep separate tools | Simpler to maintain | User confusion, data re-entry | ❌ REJECT |
| Full merge into one | Unified experience | Loss of quick-estimate path | ❌ REJECT |
| **3-Tier unified flow** | Progressive disclosure, single mental model, data continuity | Requires bridge + state unification | ✅ **CHOSEN** |

### The 3-Tier Model

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: QUICK ESTIMATOR                                     │
│ Time: 30 seconds                                             │
│ User intent: "Ballpark number for client call tomorrow"     │
│ Entry: /estimator or / (landing with "Quick Estimate" CTA)  │
│ Output: Total MD, Duration, Confidence %                     │
│ Bridge: "Build Full Plan →" button (data carries forward)   │
└─────────────────────────────────────────────────────────────┘
                           ↓ (optional)
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: PROJECT BUILDER                                     │
│ Time: 5-10 minutes                                           │
│ User intent: "Detailed proposal for RFP response"           │
│ Entry: /project or from Tier 1 bridge                       │
│ Flow: Capture → Decide → Plan (Optimize merged here)        │
│ Output: Timeline with phases, resources, tasks, costs       │
│ Bridge: "Present to Client →" button                        │
└─────────────────────────────────────────────────────────────┘
                           ↓ (required)
┌─────────────────────────────────────────────────────────────┐
│ TIER 3: PRESENTATION STUDIO                                 │
│ Time: 2 minutes                                              │
│ User intent: "Client-ready slides and PDF"                  │
│ Entry: From Tier 2 Plan mode                                │
│ Flow: Generate slides → Customize → Export PDF/PPTX         │
│ Output: Branded proposal document                           │
│ Loop back: "Edit Project →" returns to Tier 2               │
└─────────────────────────────────────────────────────────────┘
```

**Key insight:** Each tier is **optional entry point** but **data flows down seamlessly**.

---

## 🗺️ UNIFIED INFORMATION ARCHITECTURE

### Navigation Structure (Final)

```
/ (Landing Page)
├── Quick Estimate (30s) ────→ /estimator
├── Full Project Plan (10m) ──→ /project?mode=capture
└── Admin Dashboard ──────────→ /admin

/estimator
├── [Formula inputs]
├── [Live calculation]
└── CTA: "Build Full Plan →" ─→ /project?mode=plan&source=estimator

/project (unified 4-mode flow)
├── mode=capture (Extract from RFP)
├── mode=decide (5 strategic decisions)
├── mode=plan (Timeline + Resources + RICEFW) ← OptimizeMode MERGED HERE
└── mode=present (Slides + Export)

/admin
├── Dashboard (KPIs, health signals)
├── User Management (access codes, approvals)
├── System Audit (logs, compliance)
└── Settings (email, branding)
```

### OptimizeMode Resolution: **MERGE INTO PLANMODE**

**Why merge (not remove):**
- RICEFW objects are valuable (custom development estimation)
- Resource planning belongs with timeline editing (same mental context)
- OptimizeMode as separate mode = artificial split

**How to merge:**
```typescript
// PlanMode becomes multi-tab view
<PlanMode>
  <TabBar>
    <Tab active>Timeline & Phases</Tab>
    <Tab>Resources & Team</Tab>
    <Tab>RICEFW Objects</Tab>
  </TabBar>

  {activeTab === 'timeline' && <JobsGanttChart />}
  {activeTab === 'resources' && <ResourcePanel phases={phases} />}
  {activeTab === 'ricefw' && <RicefwPanel items={ricefwItems} />}
</PlanMode>
```

**What changes in code:**
- `src/components/project-v2/modes/OptimizeMode.tsx` → DELETE
- `src/components/project-v2/modes/PlanMode.tsx` → ADD tab navigation
- `src/stores/project-store.ts` → Remove `optimize` from mode enum
- `src/components/project-v2/ProjectShell.tsx` → Remove OptimizeMode lazy import
- Mobile nav: 5 buttons → 4 buttons (remove Optimize icon)

**Navigation updates:**
```diff
- <button onClick={() => setMode('optimize')}>Optimize</button>
+ {/* Removed - now tab inside Plan */}
```

**Acceptance criteria:**
- [ ] ResourcePanel fully functional (no placeholder text)
- [ ] RICEFW panel accessible via tab
- [ ] No broken links to `/project?mode=optimize`
- [ ] Mobile nav shows 4 modes (Capture, Decide, Plan, Present)

---

## 🔄 STATE UNIFICATION MODEL

### Current Problem (3 Fragmented Stores)

```typescript
// presales-store.ts
chips[], decisions, completeness

// timeline-store.ts
phases[], selectedPackages

// project-store.ts
mode, timelineIsStale, manualOverrides
```

**Issues:**
- No single source of truth for "project"
- Regeneration requires manual sync across stores
- Estimator data can't persist to project stores
- No undo/redo possible (changes scattered)

### New Model: Unified Project Store

```typescript
// src/stores/unified-project-store.ts

interface UnifiedProject {
  // Metadata
  id: string;
  name: string;
  source: 'estimator' | 'rfp-extraction' | 'manual';
  createdAt: Date;
  updatedAt: Date;

  // Tier 1 data (Estimator)
  estimate?: {
    totalMD: number;
    bce: number;
    multipliers: { sb: number; pc: number; osg: number };
    fw: number;
    confidence: number;
    inputs: EstimatorInputs; // Raw inputs for re-calculation
  };

  // Tier 2 data (Project Builder)
  presales: {
    chips: Chip[];
    decisions: Record<DecisionKey, string>;
    completeness: { score: number; gaps: string[] };
  };

  timeline: {
    phases: Phase[];
    selectedPackages: string[];
    ricefwItems: RicefwItem[];
    manualOverrides: Record<string, any>;
  };

  // Tier 3 data (Presentation)
  presentation: {
    slides: Slide[];
    templateId: string;
    clientLogo?: string;
    exportedAt?: Date;
  };

  // Navigation state
  currentMode: 'capture' | 'decide' | 'plan' | 'present';
  currentTier: 1 | 2 | 3;
}

interface UnifiedProjectStore {
  projects: UnifiedProject[];
  activeProjectId: string | null;

  // Actions
  createProject: (source: UnifiedProject['source']) => string;
  loadProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<UnifiedProject>) => void;
  deleteProject: (id: string) => void;

  // Tier transitions
  promoteToTier2: (estimatorData: EstimatorInputs) => void;
  promoteToTier3: () => void;

  // Sync helpers
  syncChipsToTimeline: () => void;
  syncDecisionsToPhases: () => void;
  regenerateTimeline: (force?: boolean) => void;

  // History (for undo/redo)
  history: UnifiedProject[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
}
```

**Migration path:**
1. Create `unified-project-store.ts` with backward-compatible getters
2. Add data migration utility: `migrateFromLegacyStores()`
3. Update components to use unified store (1 at a time)
4. Deprecate old stores once migration complete
5. Add localStorage versioning for safe upgrades

**What changes in code:**
- `src/stores/unified-project-store.ts` → NEW
- `src/lib/store-migration.ts` → NEW (migration utilities)
- All mode components → Update hooks to `useUnifiedProject()`
- `src/app/estimator/page.tsx` → Save to unified store on changes

---

## 🌉 ESTIMATOR → PROJECT BRIDGE (Detailed Design)

### User Journey

```
User on /estimator:
1. Fills inputs (profile, L3 items, org data)
2. Sees estimate (180 MD, 6 months, 75% confidence)
3. Clicks "Build Full Plan →" button

System:
1. Converts estimator inputs → chips (convertEstimateToChips)
2. Pre-fills decisions based on profile (moduleCombo, rateRegion)
3. Saves to unified project store
4. Redirects to /project?mode=plan&source=estimator

User on /project:
1. Lands in PlanMode with timeline already generated
2. Sees banner: "Timeline from Quick Estimate • Edit details in Decide mode"
3. Can edit phases directly OR go back to Capture/Decide to refine
```

### Implementation Spec

**File: `src/lib/estimator/to-chips-converter.ts` (NEW)**

```typescript
import { Chip, ChipType } from '@/types/core';
import { EstimatorInputs } from './formula-engine';
import { sanitizeInput } from '@/lib/input-sanitizer';

export function convertEstimateToChips(inputs: EstimatorInputs): Chip[] {
  const chips: Chip[] = [];
  const timestamp = Date.now();

  // Module selection
  if (inputs.modules.length > 0) {
    chips.push({
      id: `chip-modules-${timestamp}`,
      type: 'modules' as ChipType,
      value: sanitizeInput(inputs.modules.join(', ')),
      confidence: 1.0,
      source: 'estimator',
      raw: inputs.modules.join(', '),
    });
  }

  // L3 scope items
  if (inputs.l3Items.length > 0) {
    chips.push({
      id: `chip-scope-${timestamp}`,
      type: 'scope' as ChipType,
      value: `${inputs.l3Items.length} L3 scope items`,
      confidence: 1.0,
      source: 'estimator',
      raw: inputs.l3Items.map(i => i.name).join(', '),
    });
  }

  // Geography
  chips.push({
    id: `chip-country-${timestamp}`,
    type: 'country' as ChipType,
    value: `${inputs.countries} ${inputs.countries === 1 ? 'country' : 'countries'}`,
    confidence: 1.0,
    source: 'estimator',
    raw: String(inputs.countries),
  });

  // Legal entities
  chips.push({
    id: `chip-entities-${timestamp}`,
    type: 'legal_entities' as ChipType,
    value: `${inputs.entities} legal ${inputs.entities === 1 ? 'entity' : 'entities'}`,
    confidence: 1.0,
    source: 'estimator',
    raw: String(inputs.entities),
  });

  // Languages
  chips.push({
    id: `chip-language-${timestamp}`,
    type: 'language' as ChipType,
    value: `${inputs.languages} ${inputs.languages === 1 ? 'language' : 'languages'}`,
    confidence: 1.0,
    source: 'estimator',
    raw: String(inputs.languages),
  });

  // Peak sessions (users)
  chips.push({
    id: `chip-users-${timestamp}`,
    type: 'employee_count' as ChipType,
    value: `${inputs.peakSessions} peak concurrent users`,
    confidence: 0.8, // Lower confidence - proxy metric
    source: 'estimator',
    raw: String(inputs.peakSessions),
  });

  return chips;
}

export function extractDecisionsFromProfile(
  profile: ProfilePreset
): Partial<Record<DecisionKey, string>> {
  return {
    moduleCombo: profile.modules.includes('S/4HANA') ? 'finance_p2p' : 'finance_only',
    deployment: 'cloud', // Default assumption
    rateRegion: 'ABMY', // From estimator context
    // ssoMode and bankingPath left unset - user must decide
  };
}
```

**File: `src/app/estimator/page.tsx` (MODIFY)**

```typescript
// Add at top
import { useUnifiedProjectStore } from '@/stores/unified-project-store';
import { convertEstimateToChips, extractDecisionsFromProfile } from '@/lib/estimator/to-chips-converter';
import { useRouter } from 'next/navigation';

// Inside component
const router = useRouter();
const { createProject, updateProject } = useUnifiedProjectStore();

const handleBuildFullPlan = () => {
  // Create new unified project
  const projectId = createProject('estimator');

  // Convert estimator data to chips
  const chips = convertEstimateToChips({
    profile,
    modules: profile.modules,
    l3Items: selectedL3Items,
    integrations,
    inAppExtensions: inAppExt,
    btpExtensions: btpExt,
    countries,
    entities,
    languages,
    peakSessions,
  });

  // Extract decisions from profile
  const decisions = extractDecisionsFromProfile(profile);

  // Save to unified store
  updateProject(projectId, {
    estimate: {
      totalMD: estimate.totalEffort,
      bce: estimate.bce,
      multipliers: {
        sb: estimate.sbMultiplier,
        pc: estimate.pcMultiplier,
        osg: estimate.osgMultiplier,
      },
      fw: estimate.fw,
      confidence: estimate.confidence,
      inputs: { profile, l3Items: selectedL3Items, /* ... */ },
    },
    presales: {
      chips,
      decisions,
      completeness: { score: 0, gaps: [] }, // Will be calculated
    },
  });

  // Navigate to project with source flag
  router.push(`/project?mode=plan&source=estimator&projectId=${projectId}`);
};

// Add button in UI (after Deep Analysis button)
<Button
  variant="primary"
  size="lg"
  onClick={handleBuildFullPlan}
  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
  leftIcon={<ArrowRight className="w-5 h-5" />}
>
  Build Full Project Plan →
</Button>
```

**File: `src/app/project/page.tsx` (MODIFY)**

```typescript
// Add search params handling
import { useSearchParams } from 'next/navigation';

export default function ProjectPage() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const projectId = searchParams.get('projectId');

  // Show banner if coming from estimator
  const showEstimatorBanner = source === 'estimator';

  return (
    <>
      {showEstimatorBanner && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <p className="text-sm text-blue-900">
            ✨ Timeline generated from Quick Estimate •{' '}
            <button
              onClick={() => setMode('decide')}
              className="underline hover:text-blue-700"
            >
              Edit decisions
            </button>{' '}
            to refine
          </p>
        </div>
      )}
      <ProjectShell />
    </>
  );
}
```

**Edge cases handled:**
- User closes browser mid-transfer → Data saved in unified store, recoverable
- User goes back to estimator after bridge → Show "Continue project" option
- Estimator inputs conflict with RFP chips → Estimator wins (explicit user input)
- User edits decisions in Decide mode → Timeline regenerated with new params

---

## 📊 BENCHMARKS & "RECOMMENDED FOR YOU"

### Data Sources

```typescript
interface BenchmarkData {
  // Historical project data (anonymized)
  projects: {
    modules: string[];
    countries: number;
    entities: number;
    actualDuration: number;
    actualCost: number;
    successRating: number; // 1-10
  }[];

  // Industry averages
  industry: {
    [key: string]: {
      avgDuration: number;
      avgCostPerModule: number;
      commonModuleCombos: string[][];
    };
  };

  // Decision patterns
  decisionPatterns: {
    [moduleCombo: string]: {
      ssoMode: Record<string, number>; // percentage distribution
      deployment: Record<string, number>;
      bankingPath: Record<string, number>;
    };
  };
}
```

### Where to Surface

**1. Estimator Results (Benchmark Comparison)**

```typescript
// After showing estimate
<div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
  <div className="flex items-center gap-2 mb-3">
    <TrendingUp className="w-4 h-4 text-green-600" />
    <span className="text-sm font-medium text-gray-900">Industry Comparison</span>
  </div>

  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-gray-600">Your estimate:</span>
      <span className="font-semibold text-gray-900">{estimate.totalEffort} MD</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">Industry average:</span>
      <span className="text-gray-600">{benchmark.avgEffort} MD</span>
    </div>
    <div className="flex items-center gap-2 pt-2 border-t">
      <span className={cn(
        "font-semibold",
        percentDiff > 0 ? "text-red-600" : "text-green-600"
      )}>
        {percentDiff > 0 ? '+' : ''}{percentDiff}%
      </span>
      <span className="text-xs text-gray-500">
        {percentDiff > 0 ? 'above' : 'below'} industry average
      </span>
    </div>
  </div>

  <p className="text-xs text-gray-500 mt-3">
    Based on {benchmark.sampleSize} similar projects in {profile.industry || 'your industry'}
  </p>
</div>
```

**2. DecideMode (Recommended Decisions)**

```typescript
// For each decision option
{isRecommended && (
  <div className="absolute top-2 right-2">
    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
      <Star className="w-3 h-3" />
      Recommended
    </span>
  </div>
)}

// Below decision card
{isRecommended && (
  <p className="text-xs text-blue-600 mt-2">
    78% of similar projects chose this option
  </p>
)}
```

**3. PlanMode (Timeline Validation)**

```typescript
// After timeline generation
<div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
  <div className="flex items-center gap-2">
    <CheckCircle className="w-4 h-4 text-green-600" />
    <span className="text-sm font-medium text-green-900">
      Timeline looks realistic
    </span>
  </div>
  <p className="text-xs text-green-700 mt-1">
    Duration is {percentDiff}% {percentDiff > 0 ? 'longer' : 'shorter'} than similar projects.
    {percentDiff > 20 && ' Consider reviewing resource allocation.'}
  </p>
</div>
```

**What changes in code:**
- `src/data/benchmark-data.ts` → NEW (static benchmarks, later API)
- `src/lib/benchmark-calculator.ts` → NEW (comparison logic)
- `src/app/estimator/page.tsx` → Add benchmark display
- `src/components/project-v2/modes/DecideMode.tsx` → Add recommendation badges
- `src/components/project-v2/modes/PlanMode.tsx` → Add timeline validation

---

## 🎨 DESIGN CONSISTENCY ENFORCEMENT

### Token Updates (from audit Section 3.1)

**Problem:** `design-system.ts` uses class names like `bg-blue-600` instead of HEX values.

**Solution:**

```typescript
// src/lib/design-tokens.ts (NEW - replace design-system.ts color section)

export const colorTokens = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Main brand color
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// Dark mode variants
export const colorTokensDark = {
  primary: {
    50: '#1e3a8a',
    // ... inverted scale
  },
  // ... other colors inverted
} as const;
```

**Tailwind config update:**

```javascript
// tailwind.config.js
const { colorTokens } = require('./src/lib/design-tokens');

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: colorTokens.primary,
        accent: colorTokens.accent,
        success: colorTokens.success,
        warning: colorTokens.warning,
        error: colorTokens.error,
        gray: colorTokens.gray,
      },
    },
  },
};
```

**What changes in code:**
- `src/lib/design-tokens.ts` → NEW
- `tailwind.config.js` → Import and use tokens
- All components → No change (classes still work)

---

## 📈 SUCCESS METRICS (Refined from Audit)

### Leading Indicators (Emotion & Friction)

| Metric | Target | Measurement Point | Why It Matters |
|--------|--------|-------------------|----------------|
| **Time to first value** | < 30s | Estimator results shown | Tests instant gratification |
| **Bridge adoption rate** | > 70% | Estimator → Project clicks | Tests tier integration |
| **Completeness at handoff** | > 80% | Chips count when entering Plan | Tests data quality |
| **Edit rate post-generation** | 20-40% | Phase edits after auto-gen | Tests accuracy (too low = not trusting, too high = not accurate) |
| **Export rate** | > 60% | PDF/PPTX downloads per session | Tests completion intent |
| **Return rate** | > 40% | Same user, 7-day window | Tests habit formation |

### Lagging Indicators (Business Outcomes)

| Metric | Target | Measurement Point | Why It Matters |
|--------|--------|-------------------|----------------|
| **Time to proposal** | < 10 min | Project start → PDF export | Core value prop |
| **Win rate** | Baseline + 20% | Proposals → closed deals | Revenue impact |
| **NPS** | > 50 | Quarterly survey | Word-of-mouth predictor |
| **Weekly active users** | > 60% retention | Weekly login rate | Stickiness |
| **Admin task completion time** | -30% vs baseline | Task start → done | Admin satisfaction |

### Experiment Framework (see Measurement_and_Experiments.md)

Each metric has:
- Telemetry hook (where to log)
- Dashboard visualization (how to read)
- A/B test variant (how to improve)

---

## 🔗 CROSS-REFERENCES

This document connects to:
- **First_Impression_Onboarding.md** - Pre-login experience for Tier 1 entry
- **Admin_Journey_V2.md** - Parallel journey optimization
- **Measurement_and_Experiments.md** - Metrics implementation
- **Mermaid_System_Maps.md** - Visual representation of this architecture
- **Design_Tokens_ChangeList.md** - Token updates detailed
- **PresentMode_Upgrade_Spec.md** - Tier 3 completion
- **L3Selector_Enhancements.md** - Tier 1 UX improvement
- **Roadmap_and_DoD.md** - Implementation schedule

---

## ✅ ACCEPTANCE CRITERIA

This redesign is complete when:

- [ ] All 3 tiers accessible from single landing page
- [ ] Estimator → Project bridge functional with data continuity
- [ ] OptimizeMode merged into PlanMode (no broken links)
- [ ] Unified project store operational (backward compatible)
- [ ] Benchmarks visible in Estimator and DecideMode
- [ ] Timeline validation shows in PlanMode
- [ ] Design tokens migrated to HEX values
- [ ] All cross-referenced docs created
- [ ] Telemetry hooks added (see Measurement doc)
- [ ] Mobile navigation updated (4 modes, not 5)

**Definition of "Apple-grade":**
- Zero friction between user intent and outcome
- Every interaction has clear purpose
- Visual hierarchy guides attention naturally
- Empty/loading/error states delight, not frustrate
- Data never lost, always recoverable
- Metrics prove it works, not opinions

---

**End of Holistic Redesign V2**
