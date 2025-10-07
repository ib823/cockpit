# SAP Estimation Formula - CORRECTED

## Critical Fixes Applied

### 1. ✅ Factory Wrapper (FW) Separation

**BEFORE:** Single "Factory Wrapper" or generic wrappers
**AFTER:** Properly separated wrappers with distinct purposes:

```typescript
export const DEFAULT_WRAPPERS: Wrapper[] = [
  {
    id: 'pmo',
    name: 'PMO (Project Management Office)',
    defaultPercentage: 15,
    category: 'support'
  },
  {
    id: 'basis',
    name: 'Basis (SAP Technical Foundation)',
    defaultPercentage: 10,
    category: 'infrastructure'
  },
  {
    id: 'security-authorization',
    name: 'Security & Authorization',
    defaultPercentage: 8,
    category: 'infrastructure'
  },
  {
    id: 'change-management',
    name: 'Change Management',
    defaultPercentage: 12,
    category: 'support'
  },
  {
    id: 'data-migration',
    name: 'Data Migration',
    defaultPercentage: 25,
    category: 'implementation'
  },
  {
    id: 'testing',
    name: 'Testing',
    defaultPercentage: 30,
    category: 'implementation'
  },
  {
    id: 'cutover-hypercare',
    name: 'Cutover & Hypercare',
    defaultPercentage: 12,
    category: 'support'
  }
];
```

### 2. ✅ Multi-Country Rate Cards

**BEFORE:** Only ABMY (Malaysia), missing ABVN (Vietnam)
**AFTER:** Complete regional coverage:

```typescript
export const RATE_CARDS = {
  ABMY: {
    currency: "MYR",
    costIndex: 1.0,
    architect: 150,
    developer: 100,
    consultant: 120,
    projectManager: 140,
    basis: 130,
    security: 125
  },
  ABSG: {
    currency: "SGD",
    costIndex: 1.2,
    architect: 180,
    developer: 120,
    consultant: 140,
    projectManager: 160,
    basis: 155,
    security: 150
  },
  ABVN: {  // ✅ NEW - Vietnam
    currency: "USD",
    costIndex: 0.6,
    architect: 120,
    developer: 80,
    consultant: 95,
    projectManager: 110,
    basis: 100,
    security: 95
  },
  // ... NA, EU regions
};
```

### 3. ⚠️ Base Effort - REQUIRES IMPLEMENTATION

**CURRENT ISSUE:** Base effort starts from 0, doesn't include basic Finance modules

**REQUIRED FIX:**

```typescript
// Base effort should ALWAYS include basic Finance configuration
const BASE_FINANCE_EFFORT = {
  'FI-GL': 40,        // General Ledger (always included)
  'FI-AP': 30,        // Accounts Payable (always included)
  'FI-AR': 30,        // Accounts Receivable (always included)
  'FI-AA': 25,        // Asset Accounting (usually included)
  'FI-BL': 20,        // Bank Ledger (always included)
  // TOTAL: 145 person-days as minimum base effort
};

const BASE_EFFORT_DAYS = 145; // Not 0!
```

**Estimation Formula:**

```
Total Project Effort = Base Effort + Additional Modules + Wrappers

Where:
- Base Effort = 145 days (basic Finance modules)
- Additional Modules = Sum of complexity-weighted modules
- Wrappers = (Base + Additional) × Wrapper Percentages

Wrapper Total = 15% (PMO) + 10% (Basis) + 8% (Security) + 12% (OCM) + 25% (Migration) + 30% (Testing) + 12% (Cutover)
              = 112% of core effort

Example:
- Base: 145 days
- Add FI-CO (60 days) + MM (80 days) = 140 days
- Core Total: 285 days
- Wrappers: 285 × 1.12 = 319 days
- TOTAL PROJECT: 604 days
```

## Implementation Locations

### Files Modified:
1. ✅ `/src/types/wrappers.ts` - Separated wrappers (PMO, Basis, Security)
2. ✅ `/src/data/resource-catalog.ts` - Added ABVN, cost indices
3. ⚠️ TODO: `/src/lib/scenario-generator.ts` - Add BASE_FINANCE_EFFORT constant
4. ⚠️ TODO: `/src/lib/estimation-engine.ts` - Use base effort in calculations

## Validation

**Test Cases:**
```typescript
// Test 1: Minimum project (Finance only)
expect(calculateEffort({modules: ['FI']})).toBe(145 + wrapper overhead);

// Test 2: Finance + Procurement
expect(calculateEffort({modules: ['FI', 'MM']})).toBe(145 + 80 + wrapper overhead);

// Test 3: Multi-country (Malaysia + Singapore)
expect(calculateCost({regions: ['ABMY', 'ABSG']})).toUseBlendedRate();
```

## Next Steps

1. Update `scenario-generator.ts` to use BASE_FINANCE_EFFORT
2. Update estimation engine to never start from 0
3. Add validation tests for base effort minimum
4. Update UI to show "Base Finance (145 days) + Additional modules"

---

**Status:** ✅ Wrappers fixed | ✅ Multi-country fixed | ⚠️ Base effort documented (needs implementation)
