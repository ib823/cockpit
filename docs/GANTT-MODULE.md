# Gantt-Tool + Financials — Module Reference

> Snapshot: 2026-06-06. The app's primary product surface: SAP project timeline +
> resourcing + costing. One route (`/gantt-tool`), backed by `gantt-tool-store-v2`
> (`GanttProject`); all APIs under `/api/gantt-tool/**`.
> **~110 source files** after the dead-code cleanup (see §7).

## 1. Render tree

```
/gantt-tool (page.tsx)
├── GlobalNav · Tier2Header
│   └── ProjectTabNavigation (timeline | context | financials)
│       └── ViewModeSelector (zoom segmented control)
├── [timeline] GanttCanvasV3            ← the single primary canvas
│   ├── GanttMinimap · DependencyArrows · MilestoneMarker ×n · HeatmapPhaseBar · CollapsedPhasePreview
│   ├── PhaseRow ×n → TaskRow ×n → ResourceIndicator
│   ├── ResourceCapacityPanel → VirtualizedResourceCapacity → ResourceRowMemoized
│   ├── ResourceDrawer · MobileGanttView (responsive)
│   └── inline modals (Edit/Delete Phase·Task, Milestone, Allocation, ResourceEdit, TaskResource)
├── [context]    ProjectContextTab
├── [financials] FinancialsTab → CostDashboard + CostingConfigModal
└── route-level lazy modals: NewProject · Import(V1/V2/Excel) · Add Phase/Task · Export ·
    OrgChartPro · ResourceDashboard · ProposalGeneration · Share · TemplateLibrary ·
    LogoLibrary · MissionControl · CriticalPath · BaselineComparison · ProjectInsights ·
    SyncErrorRecovery · ConflictResolution · DuplicateCleanup
```

*(The legacy `GanttToolShell → GanttCanvas` rendering path was removed — see §7.)*

## 2. Component inventory (grouped)

**1 · Entry & shell (4)** — `page.tsx` (route, mounts CanvasV3 + tabs) · `invite/[token]/page.tsx` (share-token accept) · `ViewModeSelector` (zoom Auto/W/M/Q/Y) · `ProjectTabNavigation` (Timeline/Context/Financials)

**2 · Canvas & timeline (9)** — `GanttCanvasV3` (the canvas) · `GanttMinimap` · `DependencyArrows` (FS/SS/FF/SF) · `MilestoneMarker` · `HeatmapPhaseBar` · `components/PhaseRow` · `components/TaskRow` · `StatusLegend` · `CollapsedPhasePreview`

**3 · Phases & tasks (7)** — `AddPhaseModal` · `EditPhaseModal` · `AddTaskModal` · `EditTaskModal` · `MilestoneModal` · `PhaseDeletionImpactModal` · `TaskDeletionImpactModal`

**4 · Resources & capacity (14)** — `QuickResourcePanel` · `ResourceDrawer` · `ResourceCapacityPanel` · `VirtualizedResourceCapacity` · `ResourceRowMemoized` · `ResourceIndicator` · `ResourceManagementModal` · `ResourceAllocationModal` · `PhaseTaskResourceAllocationModal` · `TaskResourceModal` · `ResourceCreationModal` · `ResourceEditModal` · `ResourceDashboardModal` · `PhaseResourcePanel`

**5 · Org chart inside gantt (5)** — `OrgChartPro` (active main) · `OrgChartHarmonyV2` (store-integrated builder) · `OrgChartBuilder` (used by `/architecture/v3`) · `OrgChartView` (read-only) · `RACIMatrix`

**6 · Financials & costing (9)** — *Components:* `FinancialsTab` (3-tier GSR/NSR/margin) · `CostDashboard` (budget utilization) · `CostingConfigModal` (RR%/internal%/OPE/markup) · `ProposalGenerationModal` (proposal + PDF/PPTX) · `ProjectMetrics`. *Lib:* `team-capacity/costing.ts` (7-layer engine) · `team-capacity/types.ts` · `team-capacity/week-numbering.ts` · `team-capacity/proposal-data-calculator.ts`

**7 · Project management (16)** — `ProjectSelector` · `UnifiedProjectSelector` · `ProjectTitle` · `NewProjectModal` · `ProjectContextTab` (rich-text, DOMPurify) · `ContextPanel` · `ShareProjectModal` · `TemplateLibraryModal` · `ImportModal` (v1) · `ImportModalV2` · `ExcelTemplateImport` · `ExportConfigModal` · `LogoLibraryModal` · `KeyboardShortcutsHelp` · `EmptyStates` · `MissionControlModal`

**8 · Analytics & insights (7)** — *Components:* `CriticalPathPanel` · `BaselineComparisonPanel` · `ProjectInsightsDashboard`. *Lib (`project-analytics/`):* `analytics.ts` (EVM/burndown) · `critical-path.ts` · `baseline.ts` · `ai-suggestions.ts`

**9 · Mobile & responsive (1)** — `MobileGanttView` (used by `GanttCanvasV3`)

**10 · Sync, recovery & errors (8)** — *Components:* `SyncErrorRecoveryModal` · `ConflictResolutionModal` · `DuplicateCleanupModal`. *Lib:* `background-sync.ts` · `local-storage.ts` (IndexedDB) · `indexeddb-recovery.ts` · `delta-calculator.ts` · `delta-batcher.ts`

**11 · Utilities / lib (~29)** — *Dates:* `date-utils` · `working-days` · `holiday-integration`. *Parsing/import:* `import-parser` · `schedule-parser` · `resource-parser` · `excel-template-parser` · `company-excel-parser` · `conflict-detector`. *Templates:* `import-template-generator` · `copy-paste-template-generator` · `template-generator-v2` · `project-templates` · `org-chart-templates`. *Resources:* `resource-utils` · `resource-validator` · `resource-import-validator` · `resource-diagnostics` · `resource-allocator` · `resource-capacity-calculator` · `default-resources` · `raci-helpers` · `org-chart-auto-organize`. *Other:* `cost-calculator` · `column-optimizer` · `task-hierarchy` · `project-metrics` · `access-control` (server RBAC) · `migrate-to-database`. *Hook:* `useKeyboardNavigation`. *`team-capacity/intelligence/` (5):* `gap-detector` · `fill-gaps-algorithm` · `cost-optimizer` · `resource-suggester` · `scope-analyzer`

**12 · Stores (1)** — `gantt-tool-store-v2` (active: project CRUD, undo/redo, sync, resources/RACI/milestones)

## 3. Backend surface

**API (`/api/gantt-tool/**`):** `projects` (list/create) · `projects/[id]` (get/patch/delete) · `projects/[id]/delta` (incremental save) · `projects/[id]/context` · `projects/[id]/costing-config` · `resources` · `team-capacity/allocations` · `team-capacity/costing` (GET/POST, RBAC) · `team-capacity/conflicts` · share/invite. *All persistence stays in this namespace.*

**DB models:** `GanttProject` (embeds phases/tasks/milestones, resources, holidays, budget, **architecture data**, `orgChartPro`) · `GanttResource` · **Costing:** `ProjectCosting`, `ProjectCostingConfig`, `OutOfPocketExpense`, `SubcontractorRate`, `ResourceRateLookup` · enums `CostVisibilityLevel`, `CollaboratorRole` · collaborator/invite + `AuditEvent` (costing-access audit).

## 4. The Financials slice

A clean vertical slice: `FinancialsTab`/`CostDashboard`/`CostingConfigModal`/`ProposalGenerationModal`/`ProjectMetrics` → `team-capacity/costing.ts` (7-layer GSR→RR→NSR→internal→margin) → 5 dedicated DB tables, server-gated by `access-control.ts` + the `useFinancialAccess` hook. Three-tier visibility by user role: ADMIN→FINANCE_ONLY, MANAGER→PRESALES_AND_FINANCE, USER→PUBLIC (tab hidden). Its only input is the project's resource allocations.

## 5. Coupling (gantt module ↔ rest)

- **Outbound (what the module needs):** design system (`@/components/ui`, `@/lib/design-system`) · `project-analytics` (its own) · Prisma via its own API · `@/types/gantt-tool` — which imports architecture types from `@/app/architecture/v3/types`.
- **Inbound (what depends on the module):** `/architecture/v3` (writes arch fields into `GanttProject`) · `/organization-chart` + `components/organization/*` (read the gantt store) · dashboard (`GanttProject` **type** via props) · `Tier2Header` nav (mounts `UnifiedProjectSelector`, `ProjectMetrics`).
- **Shared spine (change with care):** `types/gantt-tool.ts` · `stores/gantt-tool-store-v2.ts` · `/api/gantt-tool/projects`.

## 6. Safe-to-touch vs careful

- **Safe:** the visual components — canvas, panels, modals (UI/dark-mode work; `FinancialsTab` notably uses hardcoded hex and needs theming).
- **Careful:** `gantt-tool-store-v2`, `types/gantt-tool`, `/api/gantt-tool/projects` — these ripple to arch-v3, org-chart, dashboard, and nav.

## 7. Cleanup history

Dead-code quarantine executed 2026-06-06 (verified typecheck + build per cluster, full suite green). **15 files removed:**

- **Deprecated costing/capacity libs** (0 importers): `lib/gantt-tool/team-capacity/{costing-engine,capacity-conflict-detector,weekly-allocation-generator}.ts` — emptied that folder. `(166642a)`
- **Orphan stub:** `ResourcePlanningModal.tsx` (0 importers). `(166642a)`
- **Unused plumbing:** `lib/code-splitting.tsx`, `hooks/useStorageSync.ts`, `stores/timeline-store.ts`. `(fa2b39b)`
- **Legacy shell rendering stack:** `GanttToolShell`, `GanttToolbar`, `GanttSidePanel`, `ResponsiveGanttWrapper`, `GanttCanvas`, `GanttMobileListView` + 2 obsolete tests — collapsed the duplicate rendering path to `GanttCanvasV3` only. `(2c2da14)`
- **Test fallout:** trimmed `tests/production/production-readiness.test.ts` (dropped the suites for the removed `timeline-store`; kept the still-valid input-sanitization tests). `(492ee65)`

Confirmed-LIVE lookalikes were **kept**: `OrgChartBuilder` (used by arch-v3), `ImportModal` v1 (gantt page), `TaskResourceModal` (CanvasV3), `MobileGanttView` (CanvasV3, ≠ the removed `GanttMobileListView`).

## 8. Known debt (gantt-scoped)

- **Dual cost paths:** `team-capacity/costing.ts` (commercial GSR/NSR/margin, server, rate-card lookup) vs `gantt-tool/cost-calculator.ts` (PM budget tracking, client, flat `chargeRatePerHour`). Different purposes — reconcile or clearly delineate; not a straight dedup.
- **Theming:** `FinancialsTab` (and some panels) use hardcoded hex — not dark-mode aware.
- **MYR-centric costing** (regions ABMY/ABSG/ABVN/ABTH); multi-currency only via forex→MYR.
