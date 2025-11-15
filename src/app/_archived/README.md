# Archived Routes

**Archive Date:** 2025-11-15
**Branch:** archive-old-routes-20251115

## Purpose
This directory contains archived application routes that are no longer actively developed or used in production. These routes have been preserved for historical reference and potential recovery.

## Active Route
- **Current Production:** `/gantt-tool` (previously `/gantt-tool/v3`)

## Archived Categories

### Old Gantt Tool Versions
Superseded by `/gantt-tool` (v3)
- `gantt-tool-import-kpj/` - Old KPJ import functionality
- `gantt-tool-lppsa/` - Old LPPSA-specific implementation
- `gantt-tool-projects/` - Old projects route
- `gantt/` - Legacy gantt route (pre-gantt-tool)

### Old Feature Routes
- `estimator/` - Old estimation tool
- `project/` - Old project management route

### Test & Demo Routes
Development and testing routes no longer needed:
- `dashboard-demo/`
- `dashboard-v2-demo/`
- `demo-comparison/`
- `date-picker-with-markers/`
- `favicon-demo/`
- `modal-design-system/`
- `offline/`
- `simple-test/`
- `test-loading/`
- `test-org-chart-dnd/`
- `test-page/`
- `test-ricefw/`
- `test-spinner/`
- `ui-demo/`

## Recovery
To recover any archived route:
```bash
# From the archive branch
git checkout archive-old-routes-20251115

# Copy the desired directory back
cp -r src/app/_archived/<route-name> src/app/
```

## Deletion Plan
These routes are planned for permanent deletion after:
- ✅ Verification that no production dependencies exist
- ✅ Team review and approval
- ✅ 30-day retention period (until 2025-12-15)
