# Measurement & Experiments: Telemetry-Driven Improvement

**Source:** UX_UI_AUDIT_COMPLETE.md (Section 8 - Success metrics)
**Cross-ref:** Holistic_Redesign_V2.md, Admin_Journey_V2.md
**Date:** 2025-10-06

---

## 🎯 MEASUREMENT PHILOSOPHY

**Principle:** "If you can't measure it, you can't improve it."

**Anti-patterns to avoid:**

- ❌ Vanity metrics (page views, total users)
- ❌ Delayed metrics (only quarterly reviews)
- ❌ Metrics without action (track but never improve)

**What we do instead:**

- ✅ Leading indicators (predict outcomes)
- ✅ Real-time dashboards (daily visibility)
- ✅ Experiment-driven (A/B test everything)

---

## 📊 METRICS TABLE: Leading Indicators

### Tier 1: Emotional Engagement

| Metric                          | Target | Why It Matters              | How to Measure                       | Code Hook                                         |
| ------------------------------- | ------ | --------------------------- | ------------------------------------ | ------------------------------------------------- |
| **Time to first value**         | < 30s  | Tests instant gratification | `page_load` → `estimate_shown`       | `analytics.track('estimate_shown', { duration })` |
| **Gratitude moment completion** | > 80%  | Tests emotional resonance   | Users who see animation → completion | `track('gratitude_animation_complete')`           |
| **Quick estimate → signup**     | > 25%  | Tests pre-login value       | Estimator result → account created   | `track('signup', { source: 'estimator' })`        |
| **Delight interaction rate**    | > 15%  | Tests "wow" moments         | Clicks on sparkles/animations        | `track('animation_interact', { type })`           |

### Tier 2: Friction Points

| Metric                       | Target | Why It Matters            | How to Measure                            | Code Hook                                      |
| ---------------------------- | ------ | ------------------------- | ----------------------------------------- | ---------------------------------------------- |
| **Bridge adoption rate**     | > 70%  | Tests tier integration    | Estimator sessions → Project mode entered | `track('tier_transition', { from: 1, to: 2 })` |
| **Completeness at handoff**  | > 80%  | Tests data quality        | Chip count when entering Plan mode        | `track('plan_entered', { completeness })`      |
| **Regenerate preview views** | > 90%  | Tests risk management     | Regenerate clicked → preview modal shown  | `track('regenerate_preview_shown')`            |
| **Phase edit rate**          | 20-40% | Tests generation accuracy | Users who edit phases post-gen            | `track('phase_edited', { phaseId })`           |
| **Error recovery rate**      | > 85%  | Tests resilience          | Errors → successful retry                 | `track('error_recovered', { errorType })`      |

### Tier 3: Completion Intent

| Metric                       | Target | Why It Matters          | How to Measure                | Code Hook                              |
| ---------------------------- | ------ | ----------------------- | ----------------------------- | -------------------------------------- |
| **Export rate**              | > 60%  | Tests value completion  | Sessions → PDF/PPTX download  | `track('export_complete', { format })` |
| **Slide customization rate** | > 40%  | Tests presentation care | Default slides → edited       | `track('slide_edited', { slideId })`   |
| **Presenter notes usage**    | > 30%  | Tests presentation prep | Notes viewed/edited           | `track('notes_used')`                  |
| **Re-export rate**           | 10-20% | Tests iteration quality | Multiple exports same project | `track('re_export', { projectId })`    |

### Tier 4: Habit Formation

| Metric                  | Target | Why It Matters         | How to Measure                   | Code Hook                                       |
| ----------------------- | ------ | ---------------------- | -------------------------------- | ----------------------------------------------- |
| **Return rate (7-day)** | > 40%  | Tests stickiness       | User login → login within 7 days | `track('session_start', { daysSinceLast })`     |
| **Projects per user**   | > 3    | Tests ongoing value    | Avg projects created             | `track('project_created', { userId })`          |
| **Team invite rate**    | > 20%  | Tests word-of-mouth    | Users who invite colleagues      | `track('invite_sent', { recipientEmail })`      |
| **Template reuse rate** | > 50%  | Tests efficiency gains | "Reuse project" clicked          | `track('template_reused', { sourceProjectId })` |

---

## 📈 BUSINESS OUTCOME METRICS (Lagging)

| Metric                  | Baseline        | Target       | Measurement Period             | Why It Matters             |
| ----------------------- | --------------- | ------------ | ------------------------------ | -------------------------- |
| **Time to proposal**    | ?               | < 10 min     | Project start → Export         | Core value prop validation |
| **Win rate**            | 72%             | 92% (+20pp)  | Proposals → closed deals (CRM) | Revenue impact             |
| **Proposal quality**    | ?               | 87/100       | Quality score algorithm        | Client satisfaction proxy  |
| **Cost per proposal**   | $200            | $60 (-70%)   | Labor hours × hourly rate      | ROI proof                  |
| **NPS**                 | ?               | > 50         | Quarterly survey               | Word-of-mouth predictor    |
| **Weekly active users** | ?               | > 60%        | Weekly login rate              | Tool adoption              |
| **Admin task time**     | 10 min/approval | 3 min (-70%) | Approval start → done          | Admin satisfaction         |

---

## 🔬 TELEMETRY IMPLEMENTATION

### Analytics Setup

**Tool:** PostHog (open-source, privacy-friendly) or Amplitude

**Why not Google Analytics:**

- GA4 is complex for product analytics
- PostHog has better event modeling
- Self-hostable (data privacy control)

**Installation:**

```bash
npm install posthog-js
```

```typescript
// src/lib/analytics.ts

import posthog from "posthog-js";

// Initialize (only in browser)
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "https://app.posthog.com",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.opt_out_capturing();
    },
  });
}

// Type-safe event tracking
type AnalyticsEvent =
  | { name: "estimate_shown"; props: { duration: number; totalMD: number } }
  | { name: "tier_transition"; props: { from: 1 | 2 | 3; to: 1 | 2 | 3 } }
  | { name: "phase_edited"; props: { phaseId: string; field: string } }
  | { name: "export_complete"; props: { format: "pdf" | "pptx"; slideCount: number } };
// ... more events

export function track<E extends AnalyticsEvent>(name: E["name"], props: E["props"]) {
  posthog.capture(name, props);
}

// User identification
export function identifyUser(
  userId: string,
  traits: {
    email: string;
    name: string;
    company?: string;
  }
) {
  posthog.identify(userId, traits);
}

// Page views
export function trackPageView(path: string) {
  posthog.capture("$pageview", { path });
}
```

### Code Hooks (Where to Add)

**1. Estimator Results**

```typescript
// src/app/estimator/page.tsx

useEffect(() => {
  if (estimate.totalEffort > 0) {
    track("estimate_shown", {
      duration: Date.now() - startTime,
      totalMD: estimate.totalEffort,
    });
  }
}, [estimate]);
```

**2. Tier Transitions**

```typescript
// src/app/estimator/page.tsx (bridge button)

const handleBuildFullPlan = () => {
  track("tier_transition", {
    from: 1,
    to: 2,
  });

  // ... existing code
};
```

**3. Phase Editing**

```typescript
// src/components/project-v2/modes/PlanMode.tsx

const handlePhaseEdit = (phaseId: string, updates: Partial<Phase>) => {
  track("phase_edited", {
    phaseId,
    field: Object.keys(updates)[0], // Which field changed
  });

  updatePhase(phaseId, updates);
};
```

**4. Export Actions**

```typescript
// src/components/project-v2/modes/PresentMode.tsx

const handleExport = async (format: "pdf" | "pptx") => {
  const startTime = Date.now();

  try {
    await exportToFormat(format);

    track("export_complete", {
      format,
      slideCount: slides.length,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    track("export_failed", {
      format,
      error: error.message,
    });
  }
};
```

**5. Error Tracking**

```typescript
// src/lib/error-handler.ts

export function handleError(error: Error, context: string) {
  // Log to console in dev
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context}]`, error);
  }

  // Track to analytics
  track("error_occurred", {
    context,
    message: error.message,
    stack: error.stack,
  });

  // Show user-friendly message
  toast.error("Something went wrong. Please try again.");
}
```

---

## 🧪 A/B TESTING FRAMEWORK

### Test 1: Onboarding Headline

**Hypothesis:** Pain-point-focused headline increases signup rate by 15%

**Variants:**

- **Control (A):** "From RFP to Proposal in 10 Minutes"
- **Treatment (B):** "Stop Spending Weekends on Spreadsheets"

**Implementation:**

```typescript
// src/app/(landing)/page.tsx

import { useABTest } from '@/lib/ab-testing';

export default function LandingPage() {
  const variant = useABTest('landing_headline', {
    control: 'rfp_to_proposal',
    treatment: 'stop_weekends',
  });

  const headline = variant === 'control'
    ? "From RFP to Proposal in 10 Minutes"
    : "Stop Spending Weekends on Spreadsheets";

  return (
    <h1>{headline}</h1>
  );
}
```

**Measurement:**

- **Primary:** Signup rate (sessions → account created)
- **Secondary:** Time on page, scroll depth
- **Sample size:** 1,000 visitors per variant (95% confidence)
- **Duration:** 2 weeks or until statistical significance

**Success criteria:** Treatment increases signup by ≥10% (p < 0.05)

---

### Test 2: Estimator → Project Bridge

**Hypothesis:** Prominent "Build Full Plan" button increases bridge adoption by 20%

**Variants:**

- **Control (A):** Button below formula breakdown (current position)
- **Treatment (B):** Floating action button (sticky, always visible)

**Implementation:**

```typescript
// src/app/estimator/page.tsx

const variant = useABTest('estimator_bridge', {
  control: 'below_formula',
  treatment: 'floating_button',
});

// Control variant (current)
<div className="mt-6">
  <Button onClick={handleBuildFullPlan}>Build Full Plan →</Button>
</div>

// Treatment variant (floating)
{variant === 'treatment' && (
  <div className="fixed bottom-8 right-8 z-50">
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleBuildFullPlan}
      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl text-lg font-semibold"
    >
      Build Full Plan →
    </motion.button>
  </div>
)}
```

**Measurement:**

- **Primary:** Bridge adoption rate (estimator → project mode)
- **Secondary:** Time to click, scroll position at click
- **Sample size:** 500 estimator completions per variant
- **Duration:** 1 week

**Success criteria:** Treatment increases adoption by ≥15% (p < 0.05)

---

### Test 3: Export Prominence

**Hypothesis:** Adding export button to PlanMode toolbar increases export rate by 25%

**Variants:**

- **Control (A):** Export only in PresentMode (current flow)
- **Treatment (B):** Export button in PlanMode toolbar + PresentMode

**Implementation:**

```typescript
// src/components/project-v2/modes/PlanMode.tsx

const variant = useABTest('export_prominence', {
  control: 'present_only',
  treatment: 'plan_and_present',
});

{variant === 'treatment' && (
  <Button
    variant="primary"
    onClick={() => exportPDF()}
    leftIcon={<Download />}
  >
    Export PDF
  </Button>
)}
```

**Measurement:**

- **Primary:** Export rate (sessions → PDF downloaded)
- **Secondary:** Time from project start to export
- **Sample size:** 400 projects per variant
- **Duration:** 2 weeks

**Success criteria:** Treatment increases export by ≥20% (p < 0.05)

---

## 📱 REAL-TIME DASHBOARDS

### User Dashboard (for team leads)

**URL:** `/analytics` (requires login)

**Sections:**

1. **My Team Performance**
   - Users: 12 active (of 15 licensed)
   - Proposals this week: 23 (+15% vs last week)
   - Avg win rate: 88%
   - Top performer: Sarah Chen (8 proposals, 100% win rate)

2. **Quality Trends**
   - Chart: Quality score over time
   - Chart: Time to proposal (decreasing = good)
   - Alert: 2 proposals below 70 score (need review)

3. **Usage Patterns**
   - Peak days: Monday, Thursday
   - Peak hours: 9-11am, 2-4pm
   - Most used features: Estimator (89%), Plan editing (67%)

**Implementation:**

```typescript
// src/app/analytics/page.tsx

import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  const { data, loading } = useTeamAnalytics();

  if (loading) return <LoadingSpinner />;

  return <AnalyticsDashboard data={data} />;
}
```

### Admin Dashboard (for platform ops)

**URL:** `/admin/analytics`

**Sections:**

1. **System Health**
   - Uptime: 99.98% (30-day)
   - Avg response time: 1.2s
   - Error rate: 0.1%
   - Active users now: 42

2. **Growth Metrics**
   - Chart: New users per week
   - Chart: Activation rate (signup → first proposal)
   - Funnel: Landing → Estimate → Signup → First proposal

3. **Experiment Results**
   - Test: Landing headline (running, 67% confidence)
   - Test: Bridge button (complete, +18% uplift ✓)
   - Test: Export prominence (pending start)

**Implementation:**

```typescript
// src/app/admin/analytics/page.tsx

import { AdminAnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

export default function AdminAnalyticsPage() {
  const { data } = useAdminAnalytics();

  return <AdminAnalyticsDashboard data={data} />;
}
```

---

## 🎯 METRIC GOALS & ALERTS

### Automated Alerts

**Setup:** Send Slack/email when metrics cross thresholds

```typescript
// src/lib/metric-alerts.ts

interface MetricAlert {
  metric: string;
  threshold: number;
  condition: "above" | "below";
  severity: "warning" | "critical";
  recipients: string[];
}

const alerts: MetricAlert[] = [
  {
    metric: "error_rate",
    threshold: 1.0,
    condition: "above",
    severity: "critical",
    recipients: ["eng-team@company.com"],
  },
  {
    metric: "export_rate",
    threshold: 50,
    condition: "below",
    severity: "warning",
    recipients: ["product-team@company.com"],
  },
  {
    metric: "win_rate",
    threshold: 80,
    condition: "below",
    severity: "warning",
    recipients: ["sales-team@company.com"],
  },
];

// Check metrics every hour
setInterval(
  () => {
    alerts.forEach((alert) => {
      const currentValue = getMetricValue(alert.metric);

      const triggered =
        (alert.condition === "above" && currentValue > alert.threshold) ||
        (alert.condition === "below" && currentValue < alert.threshold);

      if (triggered) {
        sendAlert(alert, currentValue);
      }
    });
  },
  60 * 60 * 1000
); // 1 hour
```

---

## 🔬 STATISTICAL RIGOR

### Sample Size Calculator

**Formula:**

```
n = (Z^2 * p * (1-p)) / E^2

Where:
- Z = 1.96 (for 95% confidence)
- p = baseline conversion rate
- E = desired margin of error (0.05 = 5%)
```

**Example:**

```typescript
function calculateSampleSize(
  baselineRate: number,
  marginOfError: number = 0.05,
  confidence: number = 0.95
): number {
  const z = confidence === 0.95 ? 1.96 : 2.58; // 95% or 99%
  const p = baselineRate;

  return Math.ceil((z ** 2 * p * (1 - p)) / marginOfError ** 2);
}

// Usage
const sampleSize = calculateSampleSize(0.25); // 25% baseline signup rate
// Result: ~289 visitors per variant
```

### Significance Testing

**Tool:** Built-in A/B test calculator

```typescript
function calculateSignificance(
  controlConversions: number,
  controlTotal: number,
  treatmentConversions: number,
  treatmentTotal: number
): { pValue: number; significant: boolean; uplift: number } {
  // Use two-proportion z-test
  const p1 = controlConversions / controlTotal;
  const p2 = treatmentConversions / treatmentTotal;

  const pPool = (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal);

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlTotal + 1 / treatmentTotal));
  const z = (p2 - p1) / se;

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    pValue,
    significant: pValue < 0.05,
    uplift: ((p2 - p1) / p1) * 100,
  };
}
```

---

## ✅ ACCEPTANCE CRITERIA

Measurement framework is complete when:

- [ ] PostHog (or Amplitude) installed and tracking events
- [ ] All 20 leading indicators instrumented with code hooks
- [ ] Real-time dashboards accessible (user + admin)
- [ ] 3 A/B tests configured and running
- [ ] Automated alerts set up (Slack/email)
- [ ] Sample size calculator integrated
- [ ] Significance testing automated
- [ ] Privacy-compliant (GDPR cookie consent)
- [ ] Performance impact < 100ms page load
- [ ] Events validated (no duplicate tracking)

---

## 🛠️ WHAT CHANGES IN CODE

### New Files

```
src/lib/
  analytics.ts              # PostHog wrapper
  ab-testing.ts             # Variant logic
  metric-alerts.ts          # Threshold monitoring
  statistical-tests.ts      # Significance calculations

src/app/analytics/
  page.tsx                  # User dashboard
  components/
    TeamPerformance.tsx
    QualityTrends.tsx
    UsagePatterns.tsx

src/app/admin/analytics/
  page.tsx                  # Admin dashboard
  components/
    SystemHealth.tsx
    GrowthMetrics.tsx
    ExperimentResults.tsx

src/hooks/
  useABTest.ts              # A/B test hook
  useAnalytics.ts           # Analytics helper
```

### Modified Files

```
All mode components:
  # Add track() calls at key interactions

src/app/layout.tsx:
  # Initialize PostHog

.env.local:
  NEXT_PUBLIC_POSTHOG_KEY=phc_...
  NEXT_PUBLIC_AB_TEST_ENABLED=true
```

---

**End of Measurement & Experiments**

**Cross-references:**

- Holistic_Redesign_V2.md (Success metrics defined)
- Admin_Journey_V2.md (Admin-specific metrics)
- First_Impression_Onboarding.md (Pre-login A/B tests)
