# Quick Start: M5-M8 Features

**5-Minute Guide to Using RICEFW, Recompute Engine, and Security**

---

## 1. Apply Database Migration (REQUIRED)

```bash
# Backup first!
pg_dump cockpit_db > backup.sql

# Apply migration
npx prisma db push

# Verify
npx prisma studio
```

---

## 2. Test RICEFW Components

Visit: `http://localhost:3000/test-ricefw`

**Try This:**

1. Click "Load Sample Scenario"
2. Click "Add RICEFW Item"
3. Create a report: "Inventory Aging Report" (Medium, 2 items)
4. Watch real-time calculations update
5. Edit/delete items

---

## 3. Use RICEFW in Your Code

### Add to a Page

```tsx
import { RicefwPanel } from "@/components/estimation/RicefwPanel";
import { useState } from "react";

export default function MyPage() {
  const [items, setItems] = useState([]);

  return <RicefwPanel projectId="my-project" items={items} onChange={setItems} />;
}
```

### Get Recommendations

```typescript
import { getRicefwRecommendations } from "@/lib/ricefw/calculator";

const recs = getRicefwRecommendations({
  countries: 3,
  legalEntities: 5,
  modules: ["finance", "hr"],
  industry: "manufacturing",
});

console.log(recs);
// [
//   { type: 'report', name: 'Statutory Reports by Country', complexity: 'M', count: 3, ... },
//   { type: 'interface', name: 'GL to Bank Interface', complexity: 'L', count: 1, ... },
//   ...
// ]
```

---

## 4. Use Recompute Engine

### Basic Usage

```typescript
import { recompute } from "@/lib/engine/recompute";

const outputs = recompute({
  ricefwItems,
  formItems,
  integrationItems,
  phases,
  averageHourlyRate: 150,
});

console.log(outputs.totalCost); // $1,234,567
console.log(outputs.totalEffortPD); // 1,234.5
```

### React Hook

```typescript
import { useRecompute } from '@/hooks/useRecompute';

function Dashboard() {
  const computed = useRecompute({
    ricefwItems,
    phases,
    averageHourlyRate: 150,
  });

  return (
    <div>
      <h2>Total Cost: ${computed.totalCost.toLocaleString()}</h2>
      <h2>Total Effort: {computed.totalEffortPD} PD</h2>
    </div>
  );
}
```

---

## 5. Use Security Features

### Validate Input

```typescript
import { validateRicefwItem } from "@/lib/security";

const result = validateRicefwItem(userInput);
if (!result.valid) {
  console.error(result.errors);
  return;
}
const safeData = result.data;
```

### Sanitize Strings

```typescript
import { sanitizeString } from "@/lib/security";

const safeName = sanitizeString(userInput.name);
// Strips HTML, removes dangerous protocols, truncates to 10KB
```

### Rate Limiting

```typescript
import { checkRateLimit } from "@/lib/security";

const limit = checkRateLimit("user-123", 100, 60000);
if (!limit.allowed) {
  return { error: "Rate limit exceeded" };
}
// Proceed with operation
```

---

## 6. Quick Examples

### Example 1: Add RICEFW to Existing Project

```tsx
// In your project page
import { RicefwPanel } from "@/components/estimation/RicefwPanel";

function ProjectPage() {
  const [ricefwItems, setRicefwItems] = useState([]);

  return (
    <>
      {/* Existing UI */}
      <RicefwPanel projectId={projectId} items={ricefwItems} onChange={setRicefwItems} />
    </>
  );
}
```

### Example 2: Show Summary Dashboard

```tsx
import { RicefwSummary } from "@/components/estimation/RicefwSummary";

function Dashboard({ items }) {
  return <RicefwSummary items={items} averageHourlyRate={150} />;
}
```

### Example 3: Calculate Total Cost

```typescript
import { recompute } from "@/lib/engine/recompute";

const { totalCost, totalEffortPD } = recompute({
  ricefwItems: myRicefwItems,
  phases: myPhases,
  averageHourlyRate: 150,
});

console.log(`Project will cost $${totalCost} (${totalEffortPD} PD)`);
```

---

## 7. Database Queries

### Get All RICEFW Items

```typescript
const items = await prisma.ricefwItem.findMany({
  where: { projectId: "my-project" },
  orderBy: { createdAt: "desc" },
});
```

### Create RICEFW Item

```typescript
const item = await prisma.ricefwItem.create({
  data: {
    projectId: "my-project",
    type: "report",
    name: "Inventory Aging Report",
    complexity: "M",
    count: 2,
    effortPerItem: 5.0,
    totalEffort: 10.0,
    phase: "realize",
  },
});
```

### Get Project Total

```typescript
const total = await prisma.ricefwItem.aggregate({
  where: { projectId: "my-project" },
  _sum: { totalEffort: true },
});

console.log(`Total RICEFW effort: ${total._sum.totalEffort} PD`);
```

---

## 8. Common Recipes

### Recipe: Auto-populate from Presales

```typescript
import { getRicefwRecommendations } from "@/lib/ricefw/calculator";

// Get presales data
const chips = usePresalesStore((state) => state.chips);

// Extract scope
const scope = {
  countries: chips.filter((c) => c.type === "COUNTRY").length,
  legalEntities: Number(chips.find((c) => c.type === "LEGAL_ENTITIES")?.value || 1),
  modules: chips.filter((c) => c.type === "MODULES").map((c) => c.value.toLowerCase()),
  industry: chips.find((c) => c.type === "INDUSTRY")?.value || "",
};

// Get recommendations
const recs = getRicefwRecommendations(scope);

// Convert to RICEFW items
const items = recs.map((rec) =>
  createRicefwItem(
    projectId,
    rec.type,
    rec.name,
    rec.complexity,
    rec.count,
    "realize",
    rec.rationale
  )
);

setRicefwItems(items);
```

### Recipe: Calculate Phase Impact

```typescript
import { calculateRicefwPhaseImpact } from "@/lib/ricefw/calculator";

const impact = calculateRicefwPhaseImpact(ricefwItems);

console.log(`Explore: ${impact.explore} PD`);
console.log(`Realize: ${impact.realize} PD`);
console.log(`Deploy: ${impact.deploy} PD`);
```

### Recipe: Validate Before Save

```typescript
import { validateRicefwItem, sanitizeString } from "@/lib/security";

function handleSubmit(formData) {
  // Sanitize strings
  const sanitized = {
    ...formData,
    name: sanitizeString(formData.name),
    description: sanitizeString(formData.description),
  };

  // Validate
  const result = validateRicefwItem(sanitized);
  if (!result.valid) {
    showError(result.errors);
    return;
  }

  // Save
  saveRicefwItem(result.data);
}
```

---

## 9. Troubleshooting

### Issue: Can't find RicefwPanel

**Solution:** Check import path

```typescript
import { RicefwPanel } from "@/components/estimation/RicefwPanel";
```

### Issue: TypeScript errors

**Solution:** Regenerate Prisma client

```bash
npx prisma generate
npm run typecheck
```

### Issue: Calculations seem wrong

**Solution:** Check base effort constants

- See `/src/lib/ricefw/model.ts`
- Look for `BASE_EFFORT` object
- Verify complexity tier is correct

### Issue: Database not updated

**Solution:** Run migration

```bash
npx prisma db push
```

---

## 10. Reference

### RICEFW Types

- `report` - SAP reports (Simple: 3.5 PD, Medium: 5.0 PD, Large: 7.0 PD)
- `interface` - System interfaces (Simple: 8.0 PD, Medium: 12.0 PD, Large: 18.0 PD)
- `conversion` - Data migrations (Simple: 2.0 PD, Medium: 3.5 PD, Large: 5.0 PD)
- `enhancement` - Custom code (Simple: 5.0 PD, Medium: 8.0 PD, Large: 12.0 PD)
- `form` - Print forms (Simple: 2.5 PD, Medium: 4.0 PD, Large: 6.0 PD)
- `workflow` - Business workflows (Simple: 6.0 PD, Medium: 10.0 PD, Large: 15.0 PD)

### Complexity Tiers

- `S` - Simple (1.0x multiplier)
- `M` - Medium (1.5x multiplier)
- `L` - Large (2.5x multiplier)

### Phases

- `explore` - Requirements gathering, design
- `realize` - Development, configuration
- `deploy` - Testing, go-live, support

---

## 11. Next Steps

1. ✅ Applied database migration
2. ✅ Tested RICEFW UI at `/test-ricefw`
3. ⬜ Integrate into main project page
4. ⬜ Connect recompute engine to dashboard
5. ⬜ Set up security validation in API routes

---

## Need Help?

- **Full Guide:** See `M5_M8_COMPLETE.md`
- **Architecture:** See `M5_M8_IMPLEMENTATION_STRATEGY.md`
- **Status:** See `IMPLEMENTATION_STATUS.md`

**Questions?** Check the documentation or review test files in `src/__tests__/`

---

**Quick Start Version:** 1.0
**Last Updated:** 2025-10-06
