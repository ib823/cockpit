# Keystone - UX & Architecture Specification

## Comprehensive Estimation and Project Planning Platform

**Document Version:** 1.0  
**Date:** October 12, 2025  
**Status:** Design Proposal for Review  
**Target:** Independent Technical Review

---

## Executive Summary

Keystone is a web-based application for SAP S/4HANA Cloud implementation planning. It provides:

1. **Formula-driven estimation** based on 293 L3 scope items with transparent mathematical calculations
2. **Interactive project timeline** with resource allocation and Gantt visualization
3. **Scenario comparison** for evaluating different implementation approaches
4. **Professional proposal generation** (PowerPoint, CSV, PDF)

This document presents a complete UX redesign with technical architecture for stakeholder review.

---

## 1. Business Context

### Current Problem

The existing application has:

- **Broken navigation** between estimate and project planning
- **Inconsistent UI** mixing custom components with Ant Design
- **No data synchronization** between estimator and timeline
- **Poor user flow** with unclear capture/decide pages that duplicate estimator functionality

### Target Users

- **SAP Pre-sales Consultants**: Creating quick estimates during sales cycles
- **Project Managers**: Detailed planning with resource allocation
- **Account Executives**: Generating client-ready proposals

### Key Business Requirements

1. **Transparency**: Users must see and justify all mathematical formulas
2. **Flexibility**: Support iterative refinement from rough estimate to detailed plan
3. **Professionalism**: Export publication-ready materials
4. **Accuracy**: Base calculations on proven SAP Activate methodologies

---

## 2. User Journey Overview

```
┌──────────┐
│  LOGIN   │ User authenticates
└────┬─────┘
     │
┌────▼──────────────────────────────────────────────────┐
│  ESTIMATOR (Ballpark Figure)                          │
│  • Select L3 scope items from 293-item catalog        │
│  • Adjust complexity coefficients (Sb, Pc, Os)        │
│  • See live calculation: Total MD, Duration, Phases   │
│  • Save as named scenario                             │
│  Purpose: Get client buy-in with rough numbers        │
└────┬──────────────────────────────────────────────────┘
     │ User confirms estimate baseline
     │
┌────▼──────────────────────────────────────────────────┐
│  PROJECT TIMELINE (Detailed Planning)                 │
│  • Gantt chart showing SAP Activate phases            │
│  • Assign resources with roles and rates              │
│  • Set start/end dates                                │
│  • Optimize schedule and cost                         │
│  • Syncs with Estimator (bidirectional)               │
│  Purpose: Fine-tune with client input                 │
└────┬──────────────────────────────────────────────────┘
     │ User explores alternatives
     │
┌────▼──────────────────────────────────────────────────┐
│  SCENARIOS COMPARISON                                 │
│  • Side-by-side view of multiple approaches           │
│  • Visual diff: 5 FTE vs 7 FTE, 3 months vs 4 months  │
│  • Cost-time tradeoff analysis                        │
│  Purpose: Decision support                            │
└────┬──────────────────────────────────────────────────┘
     │ User finalizes approach
     │
┌────▼──────────────────────────────────────────────────┐
│  PROPOSAL GENERATION                                  │
│  • PowerPoint: Executive summary with charts          │
│  • CSV: Detailed breakdown for analysis               │
│  • PDF: Audit trail with complete formulas            │
│  Purpose: Client-ready deliverables                   │
└───────────────────────────────────────────────────────┘
```

---

## 3. Detailed Screen Specifications

### 3.1 Estimator Screen (Main Workspace)

**Purpose:** Primary calculation engine where users configure scope and see real-time estimates.

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: [Keystone Logo] [Estimator] [Timeline] [Compare] │
├──────────────────┬──────────────────────────────────────────┤
│ LEFT PANEL       │ RIGHT PANEL                              │
│ (Controls)       │ (Live Results)                           │
│                  │                                          │
│ Input Sections:  │ Output Sections:                         │
│ 1. Base Profile  │ 1. Total Summary Card                    │
│ 2. Scope Breadth │ 2. Phase Breakdown                       │
│ 3. Process Cmplx │ 3. Formula Transparency                  │
│ 4. Org Scale     │ 4. Action Buttons                        │
│ 5. Capacity      │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

**Left Panel Components:**

1. **Base Profile Selector**
   - Dropdown with presets (e.g., "Malaysia Mid-Market", "Singapore Enterprise")
   - Each preset has default values: Base_FT (378 MD), modules, utilization
   - Shows tooltip: "Starting point based on typical configurations"

2. **Scope Breadth (Sb) Section**

   ```
   📊 Scope Breadth (Sb)
   ┌──────────────────────────────────┐
   │ L3 Items: 12 selected ☑          │
   │ [Select from Catalog...]         │
   │                                  │
   │ Integrations: [2] ◀▶             │
   │                                  │
   │ Current Sb: 0.15  [━━━○────]    │
   │ Impact: +57 MD                   │
   └──────────────────────────────────┘
   ```

   - "Select from Catalog" opens modal with 293 L3 items
   - Integration slider (0-10 typical)
   - Shows real-time coefficient and MD impact

3. **Process Complexity (Pc) Section**

   ```
   ⚙️ Process Complexity (Pc)
   ┌──────────────────────────────────┐
   │ Custom Forms: [4] baseline       │
   │ Extra Forms: [0] ◀▶              │
   │                                  │
   │ Fit-to-Standard: [100%] ◀▶      │
   │                                  │
   │ Current Pc: 0.00  [━━━━━━━━]    │
   │ Impact: +0 MD                    │
   └──────────────────────────────────┘
   ```

   - Forms beyond baseline add complexity
   - <80% fit-to-standard triggers Pc increase

4. **Organizational Scale (Os) Section**

   ```
   🌍 Org Scale & Geography (Os)
   ┌──────────────────────────────────┐
   │ Legal Entities: [1] ◀▶           │
   │ Countries: [1] ◀▶                │
   │ Languages: [1] ◀▶                │
   │                                  │
   │ Current Os: 0.00  [━━━━━━━━]    │
   │ Impact: +0 MD                    │
   └──────────────────────────────────┘
   ```

   - Each additional entity/country/language adds coefficient

5. **Capacity Section**

   ```
   👥 Team Capacity
   ┌──────────────────────────────────┐
   │ FTE: [5.6] ◀▶                    │
   │ Utilization: [80%] ◀▶            │
   │ Overlap Factor: [75%] ◀▶         │
   │                                  │
   │ Capacity: 98.6 MD/month          │
   └──────────────────────────────────┘
   ```

   - FTE: Full-time equivalents allocated
   - Utilization: Productive percentage (70-90% typical)
   - Overlap: Concurrent phase execution (65-85% typical)

**Right Panel Components:**

1. **Total Summary Card**

   ```
   🎯 Estimate Summary
   ┌──────────────────────────────────┐
   │ Total Effort: 467 MD             │
   │ Duration: 3.6 months             │
   │ PMO Effort: 57 MD                │
   │                                  │
   │ Team Cost: $40,664               │
   │ (based on rate card)             │
   └──────────────────────────────────┘
   ```

2. **Phase Breakdown**

   ```
   📈 SAP Activate Phases
   ┌──────────────────────────────────┐
   │ Phase      Effort    Duration    │
   │ Prepare    47 MD     0.4 months  │
   │ Explore    117 MD    0.9 months  │
   │ Realize    210 MD    1.6 months  │
   │ Deploy     70 MD     0.5 months  │
   │ Run        23 MD     0.2 months  │
   └──────────────────────────────────┘
   ```

3. **Formula Transparency Panel** (expandable)

   ```
   🔢 Show Math
   ┌──────────────────────────────────────────┐
   │ E_FT = 378 × (1 + 0.15) × (1 + 0.00)    │
   │          × (1 + 0.00)                    │
   │      = 434.7 MD                          │
   │                                          │
   │ D_raw = (434.7 + 24 + 8) / 98.6         │
   │       = 4.73 months                      │
   │                                          │
   │ D = 4.73 × 0.75 = 3.55 months           │
   │                                          │
   │ E_PMO = 3.55 × 16.25 = 57.7 MD          │
   │                                          │
   │ [View Full Formula Details...]           │
   └──────────────────────────────────────────┘
   ```

4. **Action Buttons**
   ```
   [Save Scenario] [Generate Timeline →]
   ```

**Interaction Behaviors:**

- **Live Recalculation**: All changes trigger instant (<100ms) recalculation
- **Validation**: Red border + tooltip if values are out of reasonable range
- **Tooltips**: "ℹ️" icon next to every input explaining its purpose
- **Keyboard Navigation**: Tab order follows logical flow
- **Responsive**: Stacks to single column on mobile (<768px)

---

### 3.2 L3 Catalog Selector (Modal)

**Trigger:** User clicks "Select from Catalog..." in Scope Breadth section

**Modal Layout:**

```
┌──────────────────────────────────────────────────────┐
│ Select L3 Scope Items                      [×]       │
├──────────────────────────────────────────────────────┤
│ [🔍 Search items...]  [Filter: All ▼]  Selected: 12 │
├──────────────────────────────────────────────────────┤
│ Finance (52 items)                             [▼]   │
│ ☑ J58 - Accounting and Financial Close    [C] 0.010 │
│ ☑ J59 - Accounts Receivable               [B] 0.008 │
│ ☑ J60 - Accounts Payable                  [B] 0.008 │
│ ☐ J62 - Asset Accounting                  [B] 0.008 │
│ ☐ 5HG - Asset Acct - Add'l Deprec Area    [B] 0.008 │
│ ...                                                  │
│                                                      │
│ Sourcing & Procurement (37 items)            [▼]    │
│ ☑ J45 - Procurement of Direct Materials   [B] 0.008 │
│ ☐ 2XT - Procurement of Indirect Materials [B] 0.008 │
│ ...                                                  │
├──────────────────────────────────────────────────────┤
│ Impact Preview:                                      │
│ Scope Breadth +0.18  |  Effort +68 MD  |  +0.3 mo   │
│                                                      │
│                            [Cancel] [Apply Selection]│
└──────────────────────────────────────────────────────┘
```

**Features:**

1. **Tier Color Coding:**
   - [A] Green: Simple/Vanilla (0.006 coefficient)
   - [B] Blue: Operational/Cross-Module (0.008)
   - [C] Orange: Complex/End-to-End (0.010)
   - [D] Red: Extension Required (requires custom pricing)

2. **Search:**
   - Real-time filter on code, name, module
   - Highlights matched text

3. **Filters:**
   - By LoB (Line of Business)
   - By Tier (A/B/C/D)
   - By Module (FI, MM, SD, etc.)

4. **Smart Recommendations:**
   - "Commonly selected together" hints
   - "⚠️ This item requires J58 (Accounting)" dependencies

5. **Bulk Actions:**
   - "Select all in category"
   - "Select SAP recommended baseline"

6. **Validation:**
   - Warns if Tier D items selected (need custom quote)
   - Shows required integrations

**Database Reference:**

- Uses tables from attached document 3: `l3_scope_item`, `complexity_metrics`, `tier_definition`

---

### 3.3 Project Timeline Screen

**Purpose:** Convert estimate into detailed schedule with resource allocation.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ [Estimator] [Timeline] [Compare] [Export]      [👤]│
├─────────────────────────────────────────────────────┤
│ 📅 Project Schedule                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Start Date: [2025-01-15 ▼]                     │ │
│ │ End Date: 2025-05-01 (calculated)              │ │
│ │ Working Days/Month: [22]                       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 📊 Gantt Chart                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │             Jan    Feb    Mar    Apr    May     │ │
│ │ Prepare    ████░░░░░░░░░░░░░░  0.4 mo  (47 MD) │ │
│ │ Explore    ░░░░██████░░░░░░░░  0.9 mo (117 MD) │ │
│ │ Realize    ░░░░░░████████████  1.6 mo (210 MD) │ │
│ │ Deploy     ░░░░░░░░░░░░████░░  0.5 mo  (70 MD) │ │
│ │ Run        ░░░░░░░░░░░░░░░██░  0.2 mo  (23 MD) │ │
│ │                                                 │ │
│ │ [Toggle: Show Overlap] [Zoom: ▼]               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 👥 Resource Allocation                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Role         FTE   Rate/Day   Phase    Total    │ │
│ │ PM           1.0   $180       All      $7,920   │ │
│ │ Functional   2.5   $150       E,R,D    $16,500  │ │
│ │ Technical    1.6   $160       R,D      $11,264  │ │
│ │ Basis        0.5   $140       E,R,D    $1,680   │ │
│ │ Change Mgmt  0.5   $120       D,R      $1,320   │ │
│ │ ────────────────────────────────────────────────│ │
│ │ Total        6.1 FTE avg              $38,684   │ │
│ │                                                 │ │
│ │ [Edit Resources] [Optimize Schedule]            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ⚡ Optimization Suggestions                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ • Add 1 FTE to compress to 3.2 months (+$5K)   │ │
│ │ • Reduce overlap to 70% to lower risk          │ │
│ │ • Consider splitting Realize into 2 sprints    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [← Back to Estimator] [Lock Timeline] [Save]       │
└─────────────────────────────────────────────────────┘
```

**Key Features:**

1. **Gantt Chart:**
   - Interactive drag-to-adjust phases
   - Hover shows details (start/end dates, resources, dependencies)
   - Color-coded by phase (SAP Activate standard colors)
   - Shows overlap visually with transparency

2. **Resource Allocation Table:**
   - Editable FTE and rates
   - Auto-calculates cost based on phase duration
   - Role-to-phase mapping
   - Validates total FTE against capacity

3. **Date Calculations:**
   - Excludes weekends by default
   - Option to upload holiday calendar
   - Adjusts for different working days/month by country

4. **Sync with Estimator:**
   - Changes to FTE here update Estimator capacity
   - Changes to Estimator recalculate timeline
   - "Lock Timeline" disables auto-sync for manual control

5. **Optimization Engine:**
   - Suggests resource adjustments to meet target dates
   - Identifies bottlenecks (e.g., "Realize phase over-allocated")
   - Cost-time tradeoff scenarios

---

### 3.4 Scenarios Comparison Screen

**Purpose:** Compare multiple estimation/timeline configurations side-by-side.

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ Scenario Comparison                            [Add +]     │
├────────────────────────────────────────────────────────────┤
│ Baseline (Current) │ Fast Track        │ Cost Optimized   │
│ ┌────────────────┐ │ ┌────────────────┐ │ ┌──────────────┐ │
│ │ 467 MD         │ │ │ 420 MD ↓10%   │ │ │ 510 MD ↑9%  │ │
│ │ 3.6 months     │ │ │ 3.0 months ↓  │ │ │ 4.2 months ↑│ │
│ │ 5.6 FTE avg    │ │ │ 7.5 FTE ↑     │ │ │ 4.8 FTE ↓   │ │
│ │ $40,664        │ │ │ $47,250 ↑16% │ │ │ $38,200 ↓6%│ │
│ │                │ │ │                │ │ │              │ │
│ │ [Edit]         │ │ │ [Edit]         │ │ │ [Edit]       │ │
│ │ [Delete]       │ │ │ [Delete]       │ │ │ [Delete]     │ │
│ │ Selected ✓     │ │ │ [Select]       │ │ │ [Select]     │ │
│ └────────────────┘ │ └────────────────┘ │ └──────────────┘ │
├────────────────────┴────────────────────┴──────────────────┤
│ Phase Duration Comparison                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Phase     Baseline    Fast Track    Cost Optimized    │ │
│ │ Prepare   0.4 mo      0.3 mo ↓      0.5 mo ↑          │ │
│ │ Explore   0.9 mo      0.7 mo ↓      1.0 mo ≈          │ │
│ │ Realize   1.6 mo      1.4 mo ↓      1.8 mo ↑          │ │
│ │ Deploy    0.5 mo      0.4 mo ↓      0.6 mo ↑          │ │
│ │ Run       0.2 mo      0.2 mo ≈      0.3 mo ↑          │ │
│ │                                                        │ │
│ │ [Gantt View] [Table View] [Download Comparison CSV]   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Visual Timeline Overlay                                    │
│ ┌────────────────────────────────────────────────────────┐ │
│ │         Jan   Feb   Mar   Apr   May   Jun              │ │
│ │ Base    ████████████████░░░░░░                         │ │
│ │ Fast    ██████████████░░░░░░░░░░                       │ │
│ │ Cost    ████████████████████░░░░                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Decision Matrix                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Criteria        Baseline  Fast Track  Cost Optimized  │ │
│ │ Time-to-Value   ★★★☆☆    ★★★★★       ★★☆☆☆          │ │
│ │ Budget          ★★★☆☆    ★★☆☆☆       ★★★★☆          │ │
│ │ Risk            ★★★☆☆    ★★☆☆☆       ★★★★☆          │ │
│ │ Team Size       ★★★☆☆    ★★★★☆       ★★★☆☆          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [Export Comparison] [Generate Proposal for Selected]      │
└────────────────────────────────────────────────────────────┘
```

**Features:**

1. **Scenario Cards:**
   - Create unlimited scenarios
   - Clone from existing
   - Label with custom names
   - Star "preferred" option

2. **Comparison Views:**
   - **Summary**: Key metrics with % differences
   - **Phase**: Detailed phase-by-phase breakdown
   - **Visual**: Overlaid Gantt bars
   - **Matrix**: Decision criteria scoring

3. **Difference Highlighting:**
   - Green ↓: Improvement
   - Red ↑: Increase (context-dependent if good/bad)
   - Gray ≈: Negligible difference (<5%)

4. **Export:**
   - CSV with all scenario data
   - PowerPoint slide comparing top 3
   - Embed in final proposal

---

### 3.5 Proposal Export Screen

**Purpose:** Generate client-ready deliverables from finalized estimate/timeline.

**Layout:**

```
┌──────────────────────────────────────────────────┐
│ Generate Proposal                                │
├──────────────────────────────────────────────────┤
│ Scenario: [Baseline ▼]                          │
│                                                  │
│ 📄 Output Formats                               │
│ ┌──────────────────────────────────────────────┐ │
│ │ ☑ PowerPoint (.pptx)                        │ │
│ │   ├─ Executive Summary                      │ │
│ │   ├─ Effort & Duration Chart                │ │
│ │   ├─ Phase Breakdown                        │ │
│ │   ├─ Resource Plan                          │ │
│ │   └─ Assumptions & Formula Transparency     │ │
│ │                                              │ │
│ │ ☑ CSV Spreadsheet (.csv)                    │ │
│ │   ├─ Detailed Line Items                    │ │
│ │   ├─ Rate Card                              │ │
│ │   ├─ Phase Allocation                       │ │
│ │   └─ L3 Scope List                          │ │
│ │                                              │ │
│ │ ☑ PDF Audit Report (.pdf)                   │ │
│ │   ├─ Complete Formula Documentation         │ │
│ │   ├─ Input Parameters                       │ │
│ │   ├─ Calculation Steps                      │ │
│ │   └─ Compliance Notes                       │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ 🎨 Branding Options                             │
│ ┌──────────────────────────────────────────────┐ │
│ │ Company Logo: [Upload or Use Default]       │ │
│ │ Color Theme: [SAP Blue ▼]                   │ │
│ │ Footer Text: [Custom footer...]             │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ 📋 Include Optional Sections                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ ☑ Risk Analysis (PERT overlay)              │ │
│ │ ☑ Scenario Comparison (if multiple)         │ │
│ │ ☑ L3 Catalog with Tiers                     │ │
│ │ ☐ Team Biographies                          │ │
│ │ ☐ Case Studies / References                 │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [Preview] [Generate All] [Schedule Email]       │
└──────────────────────────────────────────────────┘
```

**Output Specifications:**

1. **PowerPoint (.pptx)**
   - **Slide 1: Title**
     - Project name, client logo, date
   - **Slide 2: Executive Summary**
     - Total effort, duration, cost
     - High-level Gantt visual
   - **Slide 3: Scope Overview**
     - Selected L3 items by LoB
     - Complexity tier distribution (pie chart)
   - **Slide 4: Phase Breakdown**
     - Table with effort/duration per phase
     - Bar chart showing phase distribution
   - **Slide 5: Resource Plan**
     - Team structure with roles and FTE
     - Monthly allocation chart
   - **Slide 6: Formula Transparency**
     - Key formula with substituted values
     - Coefficient explanations
   - **Slide 7: Timeline**
     - Full Gantt chart
     - Key milestones
   - **Slide 8: Assumptions**
     - Utilization rate, overlap factor
     - Working days, excluded holidays
     - Risk factors

2. **CSV Spreadsheet (.csv)**
   - **Tab 1: Summary**
     - All headline numbers
   - **Tab 2: L3 Scope**
     - Item code, name, tier, coefficient
   - **Tab 3: Phase Details**
     - Phase, effort (MD), duration (months), cost
   - **Tab 4: Resources**
     - Role, FTE, rate, phases assigned, total cost
   - **Tab 5: Daily Breakdown**
     - Calendar view with daily allocation
   - **Tab 6: Formulas**
     - All calculation formulas in text format

3. **PDF Audit Report (.pdf)**
   - Letterhead with company branding
   - Table of contents with page numbers
   - Detailed methodology section
   - Formula derivation with step-by-step
   - Glossary of terms
   - Appendix with L3 catalog reference

**Generation Process:**

- Server-side rendering (not client-side)
- Uses templates stored in `/templates/`
- Populates with data from scenario
- All files zipped if multiple formats selected

---

## 4. Technical Architecture

### 4.1 Technology Stack

**Frontend:**

- **Framework**: Next.js 15 (App Router)
- **UI Library**: Ant Design 5.27.4
- **State Management**: Zustand 5.0.8
- **Charts**: Recharts (for Gantt, phase charts)
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns

**Backend:**

- **Runtime**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Generation**:
  - PowerPoint: PptxGenJS
  - CSV: Papa Parse
  - PDF: jsPDF with jsPDF-AutoTable

**Infrastructure:**

- **Hosting**: Vercel (recommended)
- **Database**: Vercel Postgres or Supabase
- **File Storage**: Vercel Blob or AWS S3
- **Analytics**: PostHog (privacy-focused)

---

### 4.2 Data Model

**Core Entities:**

```typescript
// 1. User
User {
  id: string
  email: string
  role: 'ADMIN' | 'USER'
  name?: string
}

// 2. Scenario (saved estimate)
Scenario {
  id: string
  userId: string
  name: string

  // Estimator inputs
  profileIndex: number
  selectedL3Ids: string[]
  integrations: number
  customForms: number
  fitToStandard: number
  legalEntities: number
  countries: number
  languages: number
  fte: number
  utilization: number
  overlapFactor: number

  // Calculated outputs (denormalized for speed)
  totalMD: number
  durationMonths: number
  pmoMD: number
  phases: PhaseBreakdown[]

  // Timeline data
  startDate?: Date
  resources?: ResourceAllocation[]

  createdAt: Date
  updatedAt: Date
}

// 3. PhaseBreakdown (embedded in Scenario)
PhaseBreakdown {
  phaseName: 'Prepare' | 'Explore' | 'Realize' | 'Deploy' | 'Run'
  effortMD: number
  durationMonths: number
  startDate?: Date
  endDate?: Date
}

// 4. ResourceAllocation (embedded in Scenario)
ResourceAllocation {
  role: string
  fte: number
  ratePerDay: number
  phases: string[]  // e.g., ['Explore', 'Realize']
  totalCost: number
}

// 5. L3ScopeItem (reference catalog from doc 3)
L3ScopeItem {
  id: string
  code: string
  name: string
  lobName: string
  module: string
  tier: 'A' | 'B' | 'C' | 'D'
  coefficient: number
  crossModuleTouches?: string
  localizationFlag: boolean
  extensionRisk: 'Low' | 'Med' | 'High'
}
```

**Database Schema (Prisma):**

```prisma
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  role      Role       @default(USER)
  name      String?
  scenarios Scenario[]
  createdAt DateTime   @default(now())
}

model Scenario {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  name            String

  // Inputs (JSON for flexibility)
  inputs          Json

  // Outputs (denormalized)
  totalMD         Float
  durationMonths  Float
  pmoMD           Float
  phases          Json

  // Timeline
  startDate       DateTime?
  resources       Json?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
}

model L3ScopeItem {
  id                   String  @id @default(cuid())
  code                 String  @unique
  name                 String
  lobName              String
  module               String?
  tier                 String  // A, B, C, D
  coefficient          Float?
  crossModuleTouches   String?
  localizationFlag     Boolean @default(false)
  extensionRisk        String  // Low, Med, High
  processNavigatorUrl  String
  releaseTag           String
}
```

---

### 4.3 State Management (Zustand)

**Store Structure:**

```typescript
// stores/estimator-store.ts
interface EstimatorState {
  // Inputs
  profileIndex: number;
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

  // Computed outputs (calculated on state change)
  results: {
    totalMD: number;
    durationMonths: number;
    pmoMD: number;
    phases: PhaseBreakdown[];
    capacityPerMonth: number;
  };

  // Actions
  setProfile: (index: number) => void;
  setL3Items: (items: L3ScopeItem[]) => void;
  setIntegrations: (count: number) => void;
  setFTE: (fte: number) => void;
  // ... other setters

  calculate: () => void; // Triggers formula engine
}

// stores/timeline-store.ts
interface TimelineState {
  startDate: Date | null;
  endDate: Date | null;
  resources: ResourceAllocation[];
  ganttData: GanttPhase[];
  isLocked: boolean; // Prevents auto-sync from estimator

  setStartDate: (date: Date) => void;
  setResources: (resources: ResourceAllocation[]) => void;
  optimizeSchedule: () => void;
  toggleLock: () => void;
}

// stores/scenarios-store.ts
interface ScenariosState {
  scenarios: Scenario[];
  activeScenarioId: string | null;

  loadScenarios: () => Promise<void>;
  createScenario: (name: string) => Promise<void>;
  updateScenario: (id: string, data: Partial<Scenario>) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  setActive: (id: string) => void;
}
```

**Formula Engine Integration:**

```typescript
// lib/estimator/formula-engine.ts
export const formulaEngine = {
  calculateTotal(inputs: EstimatorInputs): EstimatorResults {
    // Step 1: Calculate coefficients
    const Sb = calculateScopeBreadth(inputs.l3Items, inputs.integrations);
    const Pc = calculateProcessComplexity(inputs.customForms, inputs.fitToStandard);
    const Os = calculateOrgScale(inputs.legalEntities, inputs.countries, inputs.languages);

    // Step 2: Calculate effort
    const E_FT = inputs.profile.baseFT * (1 + Sb) * (1 + Pc) * (1 + Os);
    const E_fixed = inputs.profile.basis + inputs.profile.securityAuth;

    // Step 3: Calculate duration (iterative for PMO)
    const capacity = inputs.fte * 22 * inputs.utilization;
    let D = ((E_FT + E_fixed) / capacity) * inputs.overlapFactor;
    let E_PMO = D * 16.25; // PMO rate

    // Iterate to convergence
    for (let i = 0; i < 3; i++) {
      D = ((E_FT + E_fixed + E_PMO) / capacity) * inputs.overlapFactor;
      E_PMO = D * 16.25;
    }

    const E_total = E_FT + E_fixed + E_PMO;

    // Step 4: Distribute across phases
    const phases = distributePhases(E_total, D);

    return {
      totalMD: E_total,
      durationMonths: D,
      pmoMD: E_PMO,
      phases,
      capacityPerMonth: capacity,
      coefficients: { Sb, Pc, Os },
    };
  },
};
```

---

### 4.4 API Routes

**Endpoints:**

```typescript
// GET /api/scenarios
// Returns all scenarios for authenticated user
export async function GET(req: Request) {
  const session = await getServerSession();
  const scenarios = await prisma.scenario.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return Response.json(scenarios);
}

// POST /api/scenarios
// Create new scenario
export async function POST(req: Request) {
  const session = await getServerSession();
  const body = await req.json();

  const scenario = await prisma.scenario.create({
    data: {
      userId: session.user.id,
      name: body.name,
      inputs: body.inputs,
      totalMD: body.totalMD,
      durationMonths: body.durationMonths,
      pmoMD: body.pmoMD,
      phases: body.phases,
    },
  });

  return Response.json(scenario);
}

// PUT /api/scenarios/:id
// Update existing scenario
export async function PUT(req: Request) {
  const { id } = req.params;
  const body = await req.json();

  const scenario = await prisma.scenario.update({
    where: { id },
    data: body,
  });

  return Response.json(scenario);
}

// DELETE /api/scenarios/:id
// Delete scenario
export async function DELETE(req: Request) {
  const { id } = req.params;
  await prisma.scenario.delete({ where: { id } });
  return Response.json({ success: true });
}

// POST /api/export/powerpoint
// Generate PowerPoint from scenario
export async function POST(req: Request) {
  const { scenarioId } = await req.json();
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });

  const pptx = await generatePowerPoint(scenario);
  const buffer = await pptx.write("nodebuffer");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="SAP_Estimate_${scenario.name}.pptx"`,
    },
  });
}

// Similar for CSV and PDF exports
```

---

### 4.5 Component Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout with providers
│   ├── page.tsx                    # Landing page
│   ├── login/
│   │   └── page.tsx
│   ├── estimator/
│   │   └── page.tsx                # Main estimator screen
│   ├── timeline/
│   │   └── page.tsx                # Timeline/Gantt screen
│   ├── compare/
│   │   └── page.tsx                # Scenarios comparison
│   └── api/
│       ├── scenarios/
│       │   └── route.ts
│       └── export/
│           ├── powerpoint/route.ts
│           ├── csv/route.ts
│           └── pdf/route.ts
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx           # Top navigation
│   │   └── Footer.tsx
│   ├── estimator/
│   │   ├── InputPanel.tsx          # Left panel controls
│   │   ├── ResultsPanel.tsx        # Right panel outputs
│   │   ├── L3CatalogModal.tsx      # L3 item selector
│   │   ├── FormulaTransparency.tsx # "Show Math" component
│   │   ├── ProfileSelector.tsx
│   │   ├── ScopeBreadth.tsx
│   │   ├── ProcessComplexity.tsx
│   │   ├── OrgScale.tsx
│   │   └── Capacity.tsx
│   ├── timeline/
│   │   ├── GanttChart.tsx          # Phase visualization
│   │   ├── ResourceTable.tsx       # Resource allocation
│   │   ├── DatePicker.tsx
│   │   └── OptimizationPanel.tsx
│   ├── scenarios/
│   │   ├── ScenarioCard.tsx
│   │   ├── ComparisonTable.tsx
│   │   └── DecisionMatrix.tsx
│   └── export/
│       └── ExportModal.tsx
│
├── stores/
│   ├── estimator-store.ts          # Zustand store
│   ├── timeline-store.ts
│   └── scenarios-store.ts
│
├── lib/
│   ├── estimator/
│   │   ├── formula-engine.ts       # Core calculations
│   │   ├── l3-catalog.ts           # 293 items dataset
│   │   └── profile-presets.ts      # Default configurations
│   ├── export/
│   │   ├── powerpoint-generator.ts
│   │   ├── csv-generator.ts
│   │   └── pdf-generator.ts
│   └── utils/
│       ├── date-helpers.ts
│       └── validation.ts
│
└── types/
    ├── estimator.ts
    ├── timeline.ts
    └── scenario.ts
```

---

## 5. Formula Specification (from Document 2)

### Core Formula

```
Total Duration (D) = [E_FT + E_fixed + E_PMO] / Capacity × Overlap

Where:
E_FT    = Base_FT × (1 + Sb) × (1 + Pc) × (1 + Os)
E_fixed = Basis + Security & Auth
E_PMO   = D × PMO_monthly_rate
Capacity = FTE × 22 × Utilization
```

### Coefficients

1. **Scope Breadth (Sb)**

   ```
   Sb = Σ(selected L3 items' coefficients) + (integrations × 0.02)

   Example:
   - J58 (Accounting, Tier C): 0.010
   - J59 (AR, Tier B): 0.008
   - 2 integrations: 2 × 0.02 = 0.04
   Sb = 0.010 + 0.008 + 0.04 = 0.058
   ```

2. **Process Complexity (Pc)**

   ```
   Pc = (custom_forms - baseline_forms) × 0.01 +
        (1 - fit_to_standard%) × 0.25

   Example:
   - 4 forms (baseline), 2 extra forms: 2 × 0.01 = 0.02
   - 90% fit-to-standard: (1 - 0.9) × 0.25 = 0.025
   Pc = 0.02 + 0.025 = 0.045
   ```

3. **Organizational Scale (Os)**

   ```
   Os = (entities - 1) × 0.03 +
        (countries - 1) × 0.05 +
        (languages - 1) × 0.02

   Example:
   - 3 entities: 2 × 0.03 = 0.06
   - 2 countries: 1 × 0.05 = 0.05
   - 2 languages: 1 × 0.02 = 0.02
   Os = 0.06 + 0.05 + 0.02 = 0.13
   ```

### Phase Distribution

```
SAP Activate Standard Weights:
Prepare:  10%
Explore:  25%
Realize:  45%
Deploy:   15%
Run:       5%

Each phase effort = Total_MD × weight
Each phase duration = Total_Duration × weight
```

### Worked Example

**Given:**

- Base_FT = 378 MD
- Sb = 0.15 (selected L3 items + integrations)
- Pc = 0.00 (100% fit-to-standard, no extra forms)
- Os = 0.00 (1 entity, 1 country, 1 language)
- FTE = 5.6
- Utilization = 0.80
- Overlap = 0.75
- PMO_rate = 16.25 MD/month

**Step 1: Calculate E_FT**

```
E_FT = 378 × (1 + 0.15) × (1 + 0.00) × (1 + 0.00)
     = 378 × 1.15
     = 434.7 MD
```

**Step 2: Calculate Capacity**

```
Capacity = 5.6 × 22 × 0.80
         = 98.56 MD/month
```

**Step 3: Provisional Duration (no PMO)**

```
D_0 = (434.7 + 24 + 8) / 98.56 × 0.75
    = 466.7 / 98.56 × 0.75
    = 3.55 months
```

**Step 4: Add PMO and iterate**

```
E_PMO = 3.55 × 16.25 = 57.7 MD

D_1 = (434.7 + 24 + 8 + 57.7) / 98.56 × 0.75
    = 525.1 / 98.56 × 0.75
    = 4.00 months

Iterate once more:
E_PMO = 4.00 × 16.25 = 65.0 MD
D_2 = (434.7 + 24 + 8 + 65.0) / 98.56 × 0.75
    = 531.7 / 98.56 × 0.75
    = 4.05 months

Converged (change < 0.05)
```

**Final Results:**

- **Total Effort**: 531.7 MD
- **Duration**: 4.05 months (~4 months)
- **PMO**: 65 MD

**Phase Breakdown:**

```
Prepare:  53.2 MD,  0.41 months
Explore: 133.0 MD,  1.01 months
Realize: 239.3 MD,  1.82 months
Deploy:   79.8 MD,  0.61 months
Run:      26.6 MD,  0.20 months
```

---

## 6. L3 Catalog Integration (from Document 3)

### Database Loading

The application must load all 293 L3 scope items from the provided SQL scripts into the database. Key tables:

1. **lob** (12 Lines of Business)
2. **l3_scope_item** (293 items)
3. **complexity_metrics** (coefficients and tiers)
4. **integration_details** (test scripts availability)
5. **cross_module_integration** (dependencies)

### Usage in Application

**L3 Catalog Modal:**

- Query: `SELECT * FROM l3_scope_item JOIN complexity_metrics ON l3_id`
- Filter by: LoB, module, tier, localization_flag
- Search: code, name (full-text search)

**Coefficient Calculation:**

```typescript
function calculateScopeBreadth(selectedItems: L3ScopeItem[], integrations: number): number {
  const itemCoefficients = selectedItems
    .filter((item) => item.tier !== "D") // Tier D excluded from auto-calc
    .reduce((sum, item) => sum + item.coefficient, 0);

  const integrationFactor = integrations * 0.02;

  return itemCoefficients + integrationFactor;
}
```

**Tier D Handling:**

- If user selects Tier D item, show warning: "⚠️ Extension Required - Custom pricing needed"
- Disable "Generate Timeline" until tier D items removed or custom quote provided

---

## 7. Data Synchronization

### Estimator ↔ Timeline Sync

**Sync Triggers:**

1. **From Estimator to Timeline:**
   - When user clicks "Generate Timeline"
   - When FTE or utilization changes (if timeline unlocked)
   - When total MD or duration recalculates

2. **From Timeline to Estimator:**
   - When user adjusts FTE in resource table
   - When user changes start date (affects working days calculation)

**Sync Implementation:**

```typescript
// In estimator-store.ts
const useEstimatorStore = create<EstimatorState>((set, get) => ({
  // ... state

  setFTE: (fte: number) => {
    set({ fte });
    get().calculate();

    // Sync to timeline if unlocked
    const timelineStore = useTimelineStore.getState();
    if (!timelineStore.isLocked) {
      timelineStore.syncFromEstimator(get().results);
    }
  },

  calculate: () => {
    const results = formulaEngine.calculateTotal(get());
    set({ results });
  },
}));

// In timeline-store.ts
const useTimelineStore = create<TimelineState>((set, get) => ({
  // ... state

  syncFromEstimator: (estimatorResults: EstimatorResults) => {
    if (get().isLocked) return; // Don't sync if locked

    set({
      ganttData: generateGanttFromPhases(estimatorResults.phases, get().startDate),
      endDate: calculateEndDate(get().startDate, estimatorResults.durationMonths),
    });
  },

  setResources: (resources: ResourceAllocation[]) => {
    set({ resources });

    // Sync total FTE back to estimator
    const totalFTE = resources.reduce((sum, r) => sum + r.fte, 0);
    const estimatorStore = useEstimatorStore.getState();
    estimatorStore.setFTE(totalFTE);
  },
}));
```

**Lock Mechanism:**

- "Lock Timeline" button in timeline screen
- When locked, timeline ignores estimator changes
- Allows manual fine-tuning without auto-recalculation
- Lock state persisted in scenario

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Deliverables:**

- Next.js app scaffold with Ant Design
- Authentication (NextAuth)
- Database schema (Prisma)
- L3 catalog loaded
- Basic routing structure

**Acceptance Criteria:**

- User can log in
- Navigation between screens works
- Database queries return L3 items

---

### Phase 2: Estimator (Week 3-4)

**Deliverables:**

- Estimator UI with all input controls
- L3 catalog modal with search/filter
- Formula engine implementation
- Live calculation
- Formula transparency panel

**Acceptance Criteria:**

- User can select L3 items
- Adjusting sliders updates results instantly
- "Show Math" displays correct formulas
- Results match manual calculation

---

### Phase 3: Timeline (Week 5-6)

**Deliverables:**

- Gantt chart component
- Resource allocation table
- Date picker with working days
- Sync with estimator
- Lock/unlock mechanism

**Acceptance Criteria:**

- Gantt renders phases correctly
- Resource changes update estimator FTE
- Lock prevents auto-sync
- Dates exclude weekends

---

### Phase 4: Scenarios & Export (Week 7-8)

**Deliverables:**

- Scenario CRUD (create, read, update, delete)
- Comparison screen with 3 scenarios
- PowerPoint generator
- CSV generator
- PDF generator

**Acceptance Criteria:**

- User can save/load scenarios
- Comparison shows differences
- Exports contain all required sections
- Files download successfully

---

### Phase 5: Polish & Deploy (Week 9-10)

**Deliverables:**

- Mobile responsive design
- Performance optimization
- Error handling
- User testing feedback implemented
- Production deployment

**Acceptance Criteria:**

- Works on mobile (<768px)
- Page load < 2 seconds
- No console errors
- Deployed to Vercel

---

## 9. Open Questions for Review

### Technical Decisions

1. **Database Choice:**
   - PostgreSQL (recommended, supports full-text search)
   - MySQL (alternative, simpler setup)
   - Preference?

2. **File Storage:**
   - Vercel Blob (simple, integrated)
   - AWS S3 (scalable, cheaper at scale)
   - Generate on-demand vs. pre-generate and cache?

3. **Authentication:**
   - Email/password (simple)
   - Google OAuth (convenient)
   - Passkeys (modern, secure)
   - Support all three?

### UX Questions

4. **L3 Catalog:**
   - All 293 items visible by default?
   - Or start with "SAP recommended baseline" selected?

5. **Formula Transparency:**
   - Always visible or collapsible by default?
   - Novice users may find it overwhelming

6. **Scenario Limit:**
   - How many scenarios can user create? (suggest: 10 max)

7. **Capture/Decide Pages:**
   - Confirmed: Remove from flow? (per your feedback)
   - Or repurpose as "Client Input Form" for gathering requirements?

### Business Logic

8. **Tier D Handling:**
   - Block timeline generation?
   - Or allow with "Custom pricing required" watermark?

9. **Working Days Calendar:**
   - Support country-specific holidays?
   - How to input (upload CSV, manual entry, API)?

10. **Rate Card:**
    - Fixed rates per role?
    - User-editable?
    - Store in database or config file?

---

## 10. Success Metrics

**User Adoption:**

- 80% of consultants use it for every estimate
- Average time to create estimate: <15 minutes
- 90% of estimates progress to timeline

**Quality:**

- Estimate accuracy within ±10% of actuals
- Zero calculation errors (automated test coverage >95%)
- Client satisfaction rating >4.5/5

**Technical:**

- Page load time <2 seconds (P95)
- Zero data loss incidents
- 99.9% uptime

---

## 11. Risk Assessment

| Risk                                   | Impact | Likelihood | Mitigation                                  |
| -------------------------------------- | ------ | ---------- | ------------------------------------------- |
| Formula complexity causes bugs         | High   | Medium     | Comprehensive unit tests, manual validation |
| L3 catalog too large for modal         | Medium | Low        | Pagination, virtual scrolling               |
| Sync between estimator/timeline breaks | High   | Medium     | Lock mechanism, clear sync indicators       |
| Export generation slow                 | Medium | Medium     | Background jobs, caching                    |
| Mobile UX poor                         | Medium | High       | Mobile-first design, early testing          |
| Database performance issues            | High   | Low        | Indexes, query optimization                 |

---

## 12. Assumptions & Constraints

**Assumptions:**

1. Users are familiar with SAP Activate methodology
2. Base effort (378 MD) is accurate for standard FI+MM Public Cloud
3. L3 coefficients in document 3 are validated
4. Users have modern browsers (Chrome 90+, Safari 14+)

**Constraints:**

1. Must work offline for demo purposes (optional)
2. No budget for third-party AI services
3. Data must remain on Vercel/EU servers (GDPR)
4. Support only English language initially

---

## 13. Appendices

### Appendix A: Glossary

- **MD**: Man-day / Person-day, 8 hours of work
- **FTE**: Full-time equivalent, 1.0 = full-time resource
- **L3**: Level 3 scope item in SAP Process Navigator
- **Sb, Pc, Os**: Scope Breadth, Process Complexity, Organizational Scale coefficients
- **SAP Activate**: SAP's standard implementation methodology with 5 phases
- **Tier A/B/C/D**: Complexity classification of L3 items

### Appendix B: Reference Documents

1. **Document 2**: Complete mathematical formulas and estimation methodology
2. **Document 3**: Database schema and 293 L3 items with coefficients

### Appendix C: Sample Data

**Profile Presets:**

```json
[
  {
    "name": "Malaysia Mid-Market",
    "baseFT": 378,
    "modules": ["FI", "MM"],
    "defaultFTE": 5.6,
    "defaultUtilization": 0.8,
    "country": "MY"
  },
  {
    "name": "Singapore Enterprise",
    "baseFT": 550,
    "modules": ["FI", "MM", "SD"],
    "defaultFTE": 8.0,
    "defaultUtilization": 0.75,
    "country": "SG"
  }
]
```

---

## Document Control

**Approval Required From:**

- [ ] Product Owner
- [ ] Technical Lead
- [ ] UX Designer
- [ ] Stakeholders

**Change Log:**

- 2025-10-12: Initial draft for review
- [Date]: Feedback incorporated
- [Date]: Final approval

---

**END OF SPECIFICATION DOCUMENT**
