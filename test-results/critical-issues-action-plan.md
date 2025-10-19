# Critical Issues - Action Plan
## Immediate Fixes Required for Production

**Priority:** 🔥 URGENT
**Target:** Fix before next deployment
**Estimated Total Time:** 6-8 hours
**Risk Level:** HIGH (potential data corruption)

---

## Issue #13: Race Condition in Concurrent Phase Deletion
### 🔥🔥🔥🔥🔥 CRITICAL - Data Corruption Risk

**Problem:**
When User A deletes a phase while User B is adding a task to that phase, the task gets created in a deleted phase, causing orphaned tasks in the database.

**Evidence:**
- Location: `src/stores/gantt-tool-store-v2.ts:742-781` (addTask function)
- Test Case: 2 users with 1-second action offset
- Reproduction Rate: 2/10 attempts (20%)

**Impact:**
- Orphaned tasks cause application crashes when rendering
- No foreign key validation at application level
- Database integrity compromised

**Root Cause:**
```typescript
// Current code - NO VALIDATION
addTask: (data) => {
  set((state) => {
    if (!state.currentProject) return;
    const phase = state.currentProject.phases.find((p) => p.id === data.phaseId);
    if (!phase) return; // ⚠️ Silent failure - task still attempted via API

    // ... rest of task creation
  });

  get().saveProject(); // ⚠️ Saves even if phase doesn't exist
}
```

**Fix:**
```typescript
addTask: (data) => {
  set((state) => {
    if (!state.currentProject) return;
    const phase = state.currentProject.phases.find((p) => p.id === data.phaseId);

    // ✅ ADD THIS CHECK
    if (!phase) {
      throw new Error(
        'Cannot add task: The selected phase no longer exists. ' +
        'Please refresh the page to see the latest project state.'
      );
    }

    // ... rest of task creation
  });

  get().saveProject();
}
```

**Additional Recommendation:**
Add database-level foreign key constraint:
```sql
ALTER TABLE tasks ADD CONSTRAINT fk_phase
  FOREIGN KEY (phase_id) REFERENCES phases(id)
  ON DELETE CASCADE;
```

**Testing Plan:**
1. Create test with 2 concurrent users
2. User A: Delete phase at T+0
3. User B: Add task to same phase at T+0.5s
4. Expected: User B gets clear error message
5. Verify: No orphaned tasks in database

**Time Estimate:** 2-3 hours (1 hour code + 2 hours testing)

---

## Issue #12: Silent Date Fallback Creates Data Corruption
### 🔥🔥🔥🔥 CRITICAL - Silent Data Corruption

**Problem:**
When users import Excel data with invalid dates (e.g., "32/13/2026"), the parser silently falls back to `new Date()` (current date) without warning. This creates corrupted project timelines.

**Evidence:**
- Location: `src/lib/gantt-tool/excel-template-parser.ts:134-176`
- Test Case: Import with date "40/99/2026"
- Result: Task gets today's date, no error shown

**Impact:**
- Users don't know their data is wrong
- Project timelines corrupted silently
- Difficult to debug after import
- Trust in import feature degraded

**Root Cause:**
```typescript
// Current code - SILENT FALLBACK
function parseExcelDate(dateStr: string): string {
  // Try various formats...
  try {
    const parsed = parse(dateStr, 'EEEE, d MMMM, yyyy', new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } catch {}

  // ⚠️ FALLBACK TO CURRENT DATE - NO ERROR!
  return format(new Date(), 'yyyy-MM-dd');
}
```

**Fix:**
```typescript
function parseExcelDate(dateStr: string): { date: string; error?: string } {
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { date: dateStr };
  }

  // Try various human-readable formats
  const formats = [
    'EEEE, d MMMM, yyyy',
    'EEEE, dd MMMM yyyy',
    'EEEE, d MMMM yyyy',
  ];

  for (const formatStr of formats) {
    try {
      const parsed = parse(dateStr, formatStr, new Date());
      if (!isNaN(parsed.getTime())) {
        return { date: format(parsed, 'yyyy-MM-dd') };
      }
    } catch {}
  }

  // ✅ RETURN ERROR INSTEAD OF FALLBACK
  return {
    date: '',
    error: `Invalid date format: "${dateStr}". Expected format: "Monday, 2 February, 2026" or "2026-02-02"`
  };
}
```

**Update Parser to Collect Errors:**
```typescript
export function parseExcelTemplate(tsvData: string): ParsedExcelData {
  const lines = tsvData.split('\n').map(line => line.split('\t'));
  const errors: string[] = [];

  // ... parsing logic ...

  for (let i = weeklyHeaderRow + 1; i < lines.length; i++) {
    const row = lines[i];
    const startDateResult = parseExcelDate(row[2]?.trim());
    const endDateResult = parseExcelDate(row[3]?.trim());

    // ✅ COLLECT ERRORS
    if (startDateResult.error) {
      errors.push(`Row ${i + 1}: ${startDateResult.error}`);
    }
    if (endDateResult.error) {
      errors.push(`Row ${i + 1}: ${endDateResult.error}`);
    }

    // Only add task if both dates are valid
    if (!startDateResult.error && !endDateResult.error) {
      tasks.push({
        phaseName,
        name: taskName,
        startDate: startDateResult.date,
        endDate: endDateResult.date,
      });
    }
  }

  // ✅ THROW ERROR IF ANY DATES INVALID
  if (errors.length > 0) {
    throw new Error(
      `Found ${errors.length} invalid date(s):\n\n` +
      errors.slice(0, 10).join('\n') +
      (errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : '')
    );
  }

  return { tasks, resources, projectStartDate, weeklyColumns };
}
```

**Testing Plan:**
1. Test with valid dates → should import successfully
2. Test with 1 invalid date → should show specific error
3. Test with multiple invalid dates → should list all errors (max 10)
4. Test with mixed valid/invalid → should reject entire import
5. Verify no silent fallbacks in any code path

**Time Estimate:** 1-2 hours (1 hour code + 1 hour testing)

---

## Issue #16: No File Size Limit on Excel Paste
### 🔥🔥🔥 CRITICAL - Browser Crash Risk

**Problem:**
Users can paste Excel data with 10,000+ rows, causing browser tab to freeze/crash. No file size validation or warning.

**Evidence:**
- Location: `src/components/gantt-tool/ExcelTemplateImport.tsx`
- Test Case: Paste 5000-row Excel sheet
- Result: Browser tab becomes unresponsive for 60+ seconds, often crashes

**Impact:**
- Poor user experience (appears broken)
- Potential data loss if browser crashes mid-import
- No guidance on limits
- Performance degradation even before crash

**Root Cause:**
```typescript
// Current code - NO VALIDATION
const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const tsvData = e.clipboardData.getData('text');
  setPastedData(tsvData); // ⚠️ No size check!

  try {
    const result = parseExcelTemplate(tsvData); // ⚠️ Can freeze UI
    setParsed(result);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to parse data');
    setParsed(null);
  }
};
```

**Fix:**
```typescript
// ✅ ADD SIZE VALIDATION
const MAX_ROWS = 500;
const MAX_PASTE_SIZE = 1024 * 1024; // 1MB

const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const tsvData = e.clipboardData.getData('text');

  // ✅ CHECK PASTE SIZE
  if (tsvData.length > MAX_PASTE_SIZE) {
    setError(
      `Pasted data is too large (${(tsvData.length / 1024).toFixed(0)}KB). ` +
      `Maximum allowed: ${(MAX_PASTE_SIZE / 1024).toFixed(0)}KB. ` +
      `Please reduce the number of rows and try again.`
    );
    return;
  }

  setPastedData(tsvData);

  try {
    const result = parseExcelTemplate(tsvData);

    // ✅ CHECK ROW COUNT
    const totalRows = result.tasks.length + result.resources.length;
    if (totalRows > MAX_ROWS) {
      setError(
        `Import contains ${totalRows} rows, which exceeds the limit of ${MAX_ROWS}. ` +
        `Please split your data into multiple imports or contact support for bulk import options.`
      );
      setParsed(null);
      return;
    }

    setParsed(result);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to parse data');
    setParsed(null);
  }
};
```

**Add Helper Text to UI:**
```typescript
// In the component JSX
<div className="mt-2 text-xs text-gray-500">
  Maximum: {MAX_ROWS} total rows (tasks + resources)
</div>
```

**Advanced Fix (Optional):**
For very large imports, use Web Worker:
```typescript
// worker.ts
self.onmessage = (e) => {
  const result = parseExcelTemplate(e.data);
  self.postMessage(result);
};

// component
const parseInWorker = async (tsvData: string) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/workers/excel-parser.js');
    worker.onmessage = (e) => resolve(e.data);
    worker.onerror = (err) => reject(err);
    worker.postMessage(tsvData);
  });
};
```

**Testing Plan:**
1. Test with 100 rows → should succeed
2. Test with 500 rows → should succeed (at limit)
3. Test with 501 rows → should show clear error
4. Test with 5000 rows → should reject before parsing
5. Verify error messages are user-friendly

**Time Estimate:** 1 hour (30 min code + 30 min testing)

---

## Implementation Plan

### Day 1: Issue #13 (Race Condition)
**Morning:**
- [ ] Add phase existence check to `addTask` function
- [ ] Add phase existence check to `updateTask` function
- [ ] Add similar checks for milestone/holiday additions
- [ ] Update error handling to show user-friendly messages

**Afternoon:**
- [ ] Write unit tests for concurrent operations
- [ ] Test with 2 users manually
- [ ] Test with 5 concurrent API calls
- [ ] Document fix in CHANGELOG.md

### Day 2: Issue #12 (Date Fallback)
**Morning:**
- [ ] Refactor `parseExcelDate` to return error objects
- [ ] Update `parseExcelTemplate` to collect and report errors
- [ ] Add date validation tests

**Afternoon:**
- [ ] Test all date formats (ISO, human-readable, edge cases)
- [ ] Test error messages for clarity
- [ ] Update import documentation with date format examples
- [ ] Update Excel template with date format hints

### Day 3: Issue #16 (File Size Limit)
**Morning:**
- [ ] Add size constants (MAX_ROWS, MAX_PASTE_SIZE)
- [ ] Implement validation in `handlePaste`
- [ ] Add helper text to UI showing limits

**Afternoon:**
- [ ] Test with varying data sizes
- [ ] Ensure error messages are actionable
- [ ] Update user documentation
- [ ] (Optional) Investigate Web Worker implementation

---

## Verification Checklist

Before marking as complete:

**Issue #13:**
- [ ] Phase deletion while task creation shows error
- [ ] Task creation after phase deletion fails gracefully
- [ ] No orphaned tasks in database after concurrent operations
- [ ] Error message guides user to refresh page
- [ ] Similar checks added for milestones and holidays

**Issue #12:**
- [ ] Invalid dates cause import to fail with clear error
- [ ] Error message shows which rows have invalid dates
- [ ] All date formats tested (ISO, human-readable, edge cases)
- [ ] No silent fallbacks remain in codebase
- [ ] Template updated with date format examples

**Issue #16:**
- [ ] 500+ row import shows clear error
- [ ] Error message explains limit and suggests solutions
- [ ] Paste size limit prevents browser freeze
- [ ] UI shows limits to users before import
- [ ] Performance acceptable with 500-row import (< 3s)

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate:** Revert to previous git commit
2. **Investigate:** Review error logs and user reports
3. **Fix:** Address regression in separate branch
4. **Test:** Full regression test suite
5. **Deploy:** Gradual rollout with monitoring

---

## Monitoring After Deployment

Add these metrics to track fix effectiveness:

```typescript
// Track import errors
analytics.track('excel_import_error', {
  error_type: 'date_validation' | 'size_limit' | 'parse_error',
  row_count: number,
  file_size: number,
});

// Track concurrent edit conflicts
analytics.track('concurrent_edit_conflict', {
  operation: 'add_task' | 'delete_phase' | 'update_phase',
  conflict_resolved: boolean,
});

// Track import performance
analytics.track('excel_import_performance', {
  row_count: number,
  parse_time_ms: number,
  total_time_ms: number,
});
```

---

## Success Criteria

**Definition of Done:**
- ✅ All 3 issues have passing tests
- ✅ No regressions in existing functionality
- ✅ Code reviewed by 2+ team members
- ✅ Documentation updated
- ✅ Deployed to staging environment
- ✅ QA tested on staging
- ✅ User acceptance testing passed
- ✅ Monitoring in place
- ✅ Rolled out to 10% of users (canary)
- ✅ Rolled out to 100% of users

---

**Owner:** Engineering Team
**Reviewers:** Tech Lead + Senior Engineer
**Target Completion:** End of Week
**Follow-up:** Weekly check-in on monitoring metrics
