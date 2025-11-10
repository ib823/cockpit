# Hardcoded Data Issues - Complete Fix Plan

## Issues Identified

### 1. MiniReferenceBar showing demo wrappers

- **Location**: `src/components/timeline/MiniReferenceBar.tsx`
- **Problem**: Shows "Project Management", "Change Management", "Data Migration" wrappers even when no real project data exists
- **Root Cause**: Uses DEFAULT_WRAPPERS from types/wrappers.ts which are always present

### 2. Reference Architecture Modal showing demo data

- **Location**: `src/components/timeline/ComprehensiveReferenceArchitecture.tsx`
- **Problem**: Shows demo business context (Example Corp, 1250 users, etc.) instead of actual project data
- **Root Cause**: Uses DEFAULT_BUSINESS_CONTEXT from project-context-store

### 3. "222 months" calculation

- **Location**: `src/components/timeline/JobsGanttChart.tsx:169`
- **Problem**: Calculates months as `Math.ceil((end - start) / 20)` which can show huge numbers with bad data
- **Root Cause**: Formula divides total days by 20 (assuming 20 work days per month)

### 4. Phase tasks don't reflect input

- **Problem**: Phases generated from chips don't have detailed tasks from the actual RFP requirements
- **Root Cause**: Phase generation creates phases but doesn't populate tasks array with chip-specific work items

## Solutions

### Solution 1: Hide components when no real data (Quick Fix)

Only show MiniReferenceBar and Reference Modal when:

- phases.length > 0 AND
- chips.length > 3 AND
- NOT using default business context

### Solution 2: Sync with actual input (Proper Fix)

- Auto-populate business context from chips (country, industry, etc.)
- Generate tasks from chips for each phase
- Calculate wrappers only from generated phases, not defaults

### Solution 3: Fix month calculation

Change from `Math.ceil((end - start) / 20) months` to proper duration display

## Implementation Priority

1. **URGENT**: Hide MiniReferenceBar when phases.length === 0
2. **URGENT**: Hide "Reference Diagram" button when no real data
3. **HIGH**: Fix month calculation to show proper duration
4. **MEDIUM**: Auto-populate business context from chips
5. **LOW**: Generate phase tasks from chip requirements
