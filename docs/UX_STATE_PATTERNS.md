# UX State Patterns (C-07)

Status: Active
Last Updated: 2026-02-20

## Overview

Every interactive surface must handle four states: **empty**, **loading**, **error**, and **success**. This document defines the canonical patterns and components for each.

---

## Component Hierarchy

| State | Canonical Component | Location |
|---|---|---|
| Empty | `EmptyState` | `src/components/shared/EmptyState.tsx` |
| Loading (placeholder) | `SkeletonLoaders` | `src/components/shared/SkeletonLoaders.tsx` |
| Loading (spinner) | `LoadingState` | `src/components/shared/LoadingState.tsx` |
| Error (boundary) | `ErrorBoundary` | `src/components/ErrorBoundary.tsx` |
| Error (inline) | Toast via `showError()` | `src/lib/toast.ts` |
| Success | Toast via `showSuccess()` | `src/lib/toast.ts` |

**Note:** `src/components/gantt-tool/EmptyStates.tsx` provides domain-specific empty state presets for the Gantt tool. These wrap the shared `EmptyState` pattern and are acceptable for that domain.

---

## Empty States

### When to Use
- Data list/grid has zero items
- Search returns no results
- User has not yet created any content
- A feature is not yet configured

### Canonical Component
Use `EmptyState` from `src/components/shared/EmptyState.tsx` with:

| Prop | Purpose |
|---|---|
| `type` | Selects icon and color scheme (`projects`, `phases`, `tasks`, `resources`, `search`, `error`, `data`, `generic`) |
| `title` | Primary message (imperative, e.g., "No projects yet") |
| `description` | Secondary guidance (action-oriented, e.g., "Create your first project to get started") |
| `action` | Optional CTA button |
| `size` | `sm` / `md` / `lg` |

### UX Writing Rules for Empty States
1. **Title**: Short, factual. State what's missing, not what went wrong. Example: "No resources assigned" not "Error: missing resources".
2. **Description**: One sentence. Tell the user what to do next. Example: "Add team members to begin planning capacity."
3. **Action label**: Verb + noun. Example: "Add Resource", "Create Project", "Import Data".
4. Do not use apologetic language ("Sorry, nothing here").
5. Do not use jargon or internal terminology in user-facing text.

### Color Scheme Mapping
| Type | Color | Icon |
|---|---|---|
| `projects` | Blue (#007AFF) | FolderOpen |
| `phases` | Purple (#AF52DE) | Calendar |
| `tasks` | Cyan (#5AC8FA) | CheckSquare |
| `resources` | Green (#34C759) | Users |
| `search` | Blue (#007AFF) | Search |
| `error` | Red (#FF3B30) | AlertCircle |
| `data` | Purple (#AF52DE) | Database |
| `generic` | Gray (#8E8E93) | Inbox |

---

## Loading States

### Decision: Skeleton vs Spinner

| Situation | Use |
|---|---|
| Page/section first load | Skeleton placeholder |
| Data refresh (content already visible) | Keep existing content, show subtle indicator |
| Async action in progress (save, delete) | Inline spinner or button loading state |
| Full-page transition | `LoadingState` type `page` |
| Modal content loading | `ModalContentSkeleton` |

### Available Skeletons
Use the pre-built skeletons from `SkeletonLoaders.tsx`:
- `ProjectCardSkeleton` — project list/grid
- `GanttChartSkeleton` — timeline views
- `OrgChartNodeSkeleton` — org chart
- `TableRowSkeleton` — data tables
- `DashboardCardSkeleton` — dashboard widgets
- `PageSkeleton` — full page structure
- `ListSkeleton` — generic list
- `CompactSkeleton` — inline loading (1-3 lines)

### Rules
1. Always show a skeleton on first load — never a blank screen.
2. Skeleton shapes should approximate the real content layout.
3. Use `aria-busy="true"` on the container while loading.
4. Minimum loading display: 200ms (avoid flash of loading state for fast responses).

---

## Error States

### Decision: Error Boundary vs Toast vs Inline

| Situation | Use |
|---|---|
| Unrecoverable render crash | `ErrorBoundary` (wraps component tree) |
| API request failure (user action) | `showError()` toast |
| Form validation failure | Inline field-level errors |
| Background sync failure | `SyncErrorRecoveryModal` (gantt-tool) |
| Page-level data fetch failure | `EmptyState` type `error` with retry action |

### Toast Error Pattern
```typescript
import { showError } from "@/lib/toast";
showError("Failed to save changes. Please try again.");
```

### UX Writing Rules for Errors
1. **Be specific**: "Could not save the project" not "Something went wrong".
2. **Suggest action**: "Check your connection and try again" not just "Error".
3. **Never expose technical details**: No status codes, stack traces, or internal identifiers in user-facing text.
4. **Use neutral tone**: "Could not load data" not "Failed to load data" (avoid blame).
5. **Provide recovery path**: Every error should have a "Try Again", "Go Back", or "Contact Support" action.

### Error Severity Classification
| Severity | User Impact | Pattern |
|---|---|---|
| Critical | Cannot continue | Error boundary or full-page error state |
| Major | Action failed | Toast + retry option |
| Minor | Partial failure | Inline warning, content still usable |
| Info | Background issue | Subtle indicator, no interruption |

---

## Success States

### Decision: Toast vs Inline

| Situation | Use |
|---|---|
| Save/update completed | `showSuccess()` toast (auto-dismiss 3s) |
| Async operation completed | `showPromise()` for loading → success |
| Multi-step process completed | Inline success message with next steps |
| Background sync completed | Subtle status indicator (e.g., cloud icon) |

### Toast Success Pattern
```typescript
import { showSuccess, showPromise } from "@/lib/toast";

// Simple success
showSuccess("Project saved successfully.");

// Promise-based (shows loading, then success/error)
showPromise(saveProject(), {
  loading: "Saving project...",
  success: "Project saved.",
  error: "Could not save project.",
});
```

### UX Writing Rules for Success
1. **Confirm the action**: "Project created" not "Success".
2. **Be concise**: One short sentence. No exclamation marks.
3. **Auto-dismiss**: Success toasts disappear after 3 seconds. Do not require manual dismissal.
4. **No redundant feedback**: If the UI already reflects the change (e.g., item appears in list), a toast is optional.

---

## Toast System

The canonical toast system is `src/lib/toast.ts` (wraps `react-hot-toast`).

| Function | Color | Duration | Use |
|---|---|---|---|
| `showSuccess()` | Green | 3000ms | Action completed |
| `showError()` | Red | 4000ms | Action failed |
| `showWarning()` | Orange | 4000ms | Action completed with caveats |
| `showInfo()` | Blue | 3000ms | Informational notice |
| `showLoading()` | Primary | Until dismissed | Async operation in progress |
| `showPromise()` | Auto | Auto | Loading → success/error |

### Rules
1. Only one toast per user action. Do not stack multiple toasts for a single operation.
2. Error toasts persist longer (4s) than success toasts (3s) to ensure the user sees them.
3. Loading toasts must be dismissed programmatically when the operation completes.
4. Toasts render at top-right. Do not change position per context.

---

## Known Debt

1. **Duplicate toast systems**: `src/lib/toast.ts` (react-hot-toast) and `src/ui/toast/ToastProvider.tsx` (custom context-based). New code should use `src/lib/toast.ts`. The custom provider should be migrated away from.
2. **Duplicate EmptyState components**: `src/components/shared/EmptyState.tsx` (canonical) and `src/components/common/EmptyState.tsx` (legacy). The `common` version should be migrated to `shared`.
3. **Custom spinners**: `HexLoader`, `CubeSpinner`, `Spinner`, `AnimatedSpinner` exist independently. New loading states should use `SkeletonLoaders` or `LoadingState`.
