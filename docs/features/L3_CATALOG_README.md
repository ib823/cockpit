# L3 Scope Items Catalog

## Overview

This catalog contains **158 unique L3 scope items** extracted from the SAP S/4HANA Cloud Public Edition L3 Scope Tiers document (Release 2508). Each item represents a specific business process or scope element with associated complexity tiers and effort coefficients.

## File Location

**Generated Catalog**: `/workspaces/cockpit/src/data/l3-catalog.ts`

## Statistics

### By Tier

- **Tier A**: 33 items (20%) - Simple/vanilla processes
  - Coefficient: 0.006
  - Examples: Bank Account Management, Basic Cash Operations, Customer Quotation

- **Tier B**: 66 items (41%) - Operational flows with cross-module postings
  - Coefficient: 0.008
  - Examples: Accounts Receivable, Sales Order Management, Procurement

- **Tier C**: 50 items (31%) - Complex end-to-end or localized
  - Coefficient: 0.010
  - Examples: Financial Close, Production Planning, Consolidation

- **Tier D**: 9 items (5%) - Requires extensions
  - Coefficient: 0.0 (requires custom development)
  - Examples: Central Finance, Predictive Analytics, Advanced Planning

### By Module (Line of Business)

| Module                                   | Items | Top Tier Count |
| ---------------------------------------- | ----- | -------------- |
| Finance                                  | 29    | 10× Tier C     |
| Sales                                    | 21    | 12× Tier B     |
| Manufacturing                            | 19    | 6× Tier C      |
| Sourcing & Procurement                   | 18    | 10× Tier B     |
| Supply Chain                             | 15    | 7× Tier B      |
| Project Management/Professional Services | 14    | 7× Tier C      |
| Cross-Topics/Analytics/Group Reporting   | 9     | 5× Tier A      |
| Asset Management                         | 8     | 4× Tier B      |
| Service                                  | 8     | 4× Tier B      |
| Quality Management                       | 6     | 3× Tier B      |
| R&D/Engineering                          | 6     | 4× Tier C      |
| GRC/Compliance                           | 5     | 3× Tier B      |

## Data Structure

### TypeScript Interface

```typescript
export interface L3ScopeItem {
  id: string; // Unique ID (e.g., "fin-j58", "sales-j63")
  code: string; // L3 code (e.g., "J58", "5JT", "2TX")
  name: string; // Process name
  module: string; // Line of Business
  tier: "A" | "B" | "C" | "D";
  coefficient: number; // Complexity coefficient
  description: string; // Brief description
}
```

### Example Item

```typescript
{
  id: 'fin-j58',
  code: 'J58',
  name: 'Accounting and Financial Close',
  module: 'Finance',
  tier: 'C',
  coefficient: 0.010,
  description: 'End-to-end orchestration across multiple financial variants and period-end activities'
}
```

## Usage

### Import

```typescript
import {
  L3_SCOPE_ITEMS, // Array of all items
  L3ScopeItem, // TypeScript interface
  getL3ItemByCode, // Find by code
  getL3ItemsByModule, // Filter by module
  getL3ItemsByTier, // Filter by tier
  L3_MODULES, // List of all modules
} from "@/data/l3-catalog";
```

### Helper Functions

#### 1. Find Item by Code

```typescript
const item = getL3ItemByCode("J58");
// Returns: L3ScopeItem | undefined
```

#### 2. Get Items by Module

```typescript
const financeItems = getL3ItemsByModule("Finance");
// Returns: L3ScopeItem[] (29 items for Finance)
```

#### 3. Get Items by Tier

```typescript
const simpleItems = getL3ItemsByTier("A");
// Returns: L3ScopeItem[] (33 items)
```

#### 4. List All Modules

```typescript
console.log(L3_MODULES);
// Returns: ['Asset Management', 'Finance', 'Sales', ...]
```

## Common Use Cases

### 1. Calculate Project Complexity

```typescript
function calculateComplexity(scopeCodes: string[]): number {
  return scopeCodes
    .map((code) => getL3ItemByCode(code))
    .filter((item): item is L3ScopeItem => item !== undefined)
    .reduce((sum, item) => sum + item.coefficient, 0);
}

const projectScope = ["J58", "J59", "J60", "J63"];
const complexity = calculateComplexity(projectScope);
// Returns: 0.034 (0.010 + 0.008 + 0.008 + 0.008)
```

### 2. Estimate Effort

```typescript
const BASE_HOURS_PER_POINT = 100;

function estimateEffort(scopeCodes: string[]): number {
  const coefficient = calculateComplexity(scopeCodes);
  return coefficient * BASE_HOURS_PER_POINT;
}

const hours = estimateEffort(["J58", "J59", "J60"]);
// Returns: 26 hours (0.026 × 100)
```

### 3. Validate Scope Codes

```typescript
function validateCodes(codes: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  codes.forEach((code) => {
    if (getL3ItemByCode(code)) {
      valid.push(code);
    } else {
      invalid.push(code);
    }
  });

  return { valid, invalid };
}

const result = validateCodes(["J58", "INVALID", "J59"]);
// Returns: { valid: ['J58', 'J59'], invalid: ['INVALID'] }
```

### 4. Check for Extension Requirements

```typescript
function requiresExtensions(scopeCodes: string[]): boolean {
  return scopeCodes.map((code) => getL3ItemByCode(code)).some((item) => item?.tier === "D");
}

const needsExtensions = requiresExtensions(["J58", "5W4"]);
// Returns: true (because 5W4 is Tier D - Central Finance)
```

### 5. Generate Scope Summary

```typescript
function summarizeScope(scopeCodes: string[]) {
  const items = scopeCodes
    .map((code) => getL3ItemByCode(code))
    .filter((item): item is L3ScopeItem => item !== undefined);

  const byTier = items.reduce(
    (acc, item) => {
      acc[item.tier] = (acc[item.tier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const byModule = items.reduce(
    (acc, item) => {
      acc[item.module] = (acc[item.module] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalItems: items.length,
    totalCoefficient: items.reduce((sum, item) => sum + item.coefficient, 0),
    byTier,
    byModule,
    requiresExtensions: items.some((item) => item.tier === "D"),
  };
}
```

## Notable L3 Codes by Category

### Finance (29 items)

- **J58** - Accounting and Financial Close [C]
- **J59** - Accounts Receivable [B]
- **J60** - Accounts Payable [B]
- **J62** - Asset Accounting [B]
- **5W4** - Central Finance [D] ⚠️ Requires extensions

### Sales (21 items)

- **J63** - Sales Order Management [B]
- **J64** - Outbound Delivery [B]
- **J65** - Customer Invoice [B]
- **2TX** - Third-Party Order Processing [C]

### Manufacturing (19 items)

- **5JT** - Process Order Management [B]
- **1PX** - Discrete Manufacturing [B]
- **3GC** - Production Scheduling [C]
- **J79** - Production Planning and Control [C]

### Procurement (18 items)

- **J45** - Procurement of Direct Materials [B]
- **2XT** - Procurement of Indirect Materials [B]
- **22X** - Procurement of Services [B]
- **2LH** - Supplier Invoice Processing [B]

### Supply Chain (15 items)

- **BKJ** - Basic Inventory Management [A]
- **3F0** - Basic Warehouse Management [B]
- **5LF** - Extended Warehouse Management [C]
- **6G0** - Advanced Planning and Optimization [D] ⚠️ Requires extensions

## Integration with Keystone App

This catalog can be integrated into the Keystone app:

1. **Chip Extraction**: Parse RFPs and extract L3 codes mentioned
2. **Validation**: Validate extracted codes against this catalog
3. **Complexity Scoring**: Calculate project complexity based on selected L3 items
4. **Effort Estimation**: Use coefficients for effort estimation
5. **Requirement Analysis**: Group by module and tier for gap analysis

## Data Quality Notes

- **Deduplication**: Original CSV had 675 rows with duplicates; catalog contains 158 unique items
- **Code Pattern**: All codes are 2-4 character alphanumeric (e.g., J58, 5JT, 2TX, BFA)
- **Tier Distribution**: Roughly follows the 40/35/20/5 distribution mentioned in source
- **Coefficient Mapping**:
  - Tier A → 0.006
  - Tier B → 0.008
  - Tier C → 0.010
  - Tier D → 0.0 (requires custom extensions)

## Source Document

- **File**: `/workspaces/cockpit/L3 Scope Tiers`
- **Release**: SAP S/4HANA Cloud Public Edition 2508
- **Date Parsed**: October 6, 2025
- **Parser**: Python script with CSV extraction and TypeScript generation

## Future Enhancements

Potential additions to this catalog:

1. **Cross-Module Dependencies**: Track which L3 items interact (e.g., FI↔CO, SD↔FI)
2. **Localization Flags**: Identify items requiring country-specific configuration
3. **Integration Packages**: Link to available integration scenarios
4. **Test Scripts**: Reference to SAP test script availability
5. **URL References**: Direct links to Process Navigator documentation
6. **Historical Data**: Track changes across releases (2508, 2511, etc.)
7. **Effort Ranges**: Min/max effort ranges instead of just coefficients

## License & Attribution

This catalog is derived from SAP public documentation for SAP S/4HANA Cloud Public Edition. The data structure and helper functions are custom implementations for the Keystone project.
