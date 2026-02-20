# Monolithic File Decomposition Plan (E-01)

Status: Active
Last Updated: 2026-02-20

## Target Files (>1000 lines, sorted by size)

| File | Lines | Domain | Risk |
|---|---|---|---|
| `src/components/gantt-tool/OrgChartPro.tsx` | 6,324 | Org chart visualization | High |
| `src/components/gantt-tool/GanttCanvasV3.tsx` | 4,006 | Gantt timeline rendering | High |
| `src/components/gantt-tool/ResourceAllocationModal.tsx` | 2,912 | Resource allocation UI | Medium |
| `src/stores/gantt-tool-store-v2.ts` | 2,681 | Gantt state management | Critical |
| `src/components/gantt-tool/ImportModalV2.tsx` | 1,673 | Data import wizard | Medium |
| `src/components/gantt-tool/GanttSidePanel.tsx` | 1,584 | Side panel tabs | Medium |
| `src/components/gantt-tool/ResourceManagementModal.tsx` | 1,475 | Resource CRUD modal | Medium |
| `src/components/gantt-tool/GanttToolbar.tsx` | 1,177 | Toolbar actions | Low |
| `src/app/gantt-tool/page.tsx` | 1,226 | Page orchestration | Medium |

**Total: 23,058 lines across 9 files**

---

## Extraction Strategy

### Priority 1: OrgChartPro.tsx (6,324 → ~6 files)

Extractable sub-components with clear boundaries:

| Extract | Lines | Target File | Dependencies |
|---|---|---|---|
| `ConnectionAnchors` | ~80 | `OrgChartConnections.tsx` | TOKENS, NodePosition |
| `OrgNode` | ~370 | `OrgChartNode.tsx` | TOKENS, store selectors, DragState |
| `GroupNode` | ~440 | `OrgChartGroupNode.tsx` | TOKENS, SubCompanyInfo |
| `Minimap` | ~80 | `OrgChartMinimap.tsx` | LayoutBounds |
| `BulkEditModal` | ~840 | `OrgChartBulkEditModal.tsx` | Store actions, form types |
| `GroupEditModal` | ~680 | `OrgChartGroupEditModal.tsx` | Store actions, form types |
| Layout utils | ~120 | `org-chart-layout.ts` | Pure functions, no deps |
| `useKeyboardNavigation` | ~95 | `useOrgChartKeyboard.ts` | Node data types |
| `useDeviceType` | ~20 | Merge into shared hook | None |

**Risk**: Medium. Sub-components are well-bounded. Main risk is prop drilling and shared TOKENS constant.

**Approach**: Extract bottom-up — pure utilities first, then leaf components, then modals.

### Priority 2: gantt-tool-store-v2.ts (2,681 → slice files)

Natural domain slices (identified by section comments):

| Slice | Estimated Lines | Dependencies |
|---|---|---|
| Core data + sync | ~400 | Base types, API client |
| History (undo/redo) | ~150 | Core data snapshot |
| Phase management | ~200 | Core data, delta tracking |
| Task management | ~300 | Core data, phases, delta |
| Resource management | ~200 | Core data, delta |
| RACI matrix | ~100 | Tasks, resources |
| Budget management | ~100 | Phases, resources |
| View settings | ~150 | UI state only |
| Architecture methods | ~100 | Core data, API |
| Getters/validation | ~200 | All data |

**Risk**: Critical. Slices share mutable state. Zustand doesn't natively support slicing. Must use `StateCreator` pattern with careful type alignment.

**Approach**: Extract pure getters/validators first (zero side effects). Then extract UI state slice. Defer data mutation slices until integration test coverage improves.

### Priority 3: GanttCanvasV3.tsx (4,006 → ~4 files)

| Extract | Estimated Lines | Target File |
|---|---|---|
| Constants + types | ~100 | `gantt-canvas-constants.ts` |
| Status colors + utils | ~50 | `gantt-status-utils.ts` |
| Sub-component renders | ~500 | Individual row components |
| Drag-drop logic | ~300 | `useGanttDragDrop.ts` hook |

**Risk**: High. Canvas is a single render tree with complex ref management and scroll synchronization. Sub-components share refs and measurement state.

**Approach**: Extract constants/types first. Defer component splitting until scroll/ref architecture is documented.

### Priority 4: ResourceAllocationModal.tsx (2,912 → ~3 files)

| Extract | Estimated Lines | Target File |
|---|---|---|
| Form validation | ~200 | `allocation-validation.ts` |
| Chart rendering | ~400 | `AllocationChart.tsx` |
| Summary calculations | ~200 | `allocation-calculations.ts` |

**Risk**: Medium. Form state and chart data are coupled but calculable separately.

---

## Execution Rules

1. **One extraction per commit.** Each extraction must pass all 4 quality gates.
2. **No behavior changes.** Extractions are pure refactoring — same props, same render output.
3. **Re-export from original.** After extraction, the original file re-exports the extracted module for backward compatibility during migration.
4. **Test coverage first.** Do not extract a module that lacks test coverage unless the extraction is trivially safe (constants, types, pure functions).
5. **Measure bundle impact.** Compare `pnpm build` output before and after to verify no bundle size regression.

---

## Safe First Extractions (This Session)

1. Extract `OrgChartPro` layout utility functions → `src/lib/gantt-tool/org-chart-layout.ts`
2. Extract `GanttCanvasV3` constants/types → `src/lib/gantt-tool/gantt-canvas-constants.ts`
3. Extract store getters/validators → `src/stores/gantt-tool-selectors.ts`
