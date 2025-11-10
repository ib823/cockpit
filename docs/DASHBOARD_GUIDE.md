# Three-Layer Cake Dashboard - Implementation Guide

## Overview

The Three-Layer Cake Dashboard is a comprehensive proposal analysis tool for SAP implementation projects. It provides three interconnected layers of information:

1. **Operational View**: Gantt chart & Resource allocation heatmap
2. **Financial View**: Cost, Revenue, Margin analysis with waterfall charts
3. **Strategic View**: Scenario comparison & What-if analysis

## Features

### ✅ What's Implemented

- **Rate Card System**: Manage daily rates by designation (MYR)
- **Operational Metrics**: Duration, resources, progress tracking
- **Resource Heatmap**: Weekly capacity planning with color-coded allocation
- **Financial KPIs**: Revenue, Cost, Margin with editable pricing
- **Margin Waterfall**: Visual breakdown from revenue to margin
- **Cost by Phase**: Bar chart showing resource cost distribution
- **Scenario Comparison**: Side-by-side analysis with delta calculations
- **Risk Gauges**: Resource contention, complexity, budget risk
- **Responsive Design**: Works on desktop and tablet

## Quick Start

### 1. View the Dashboard Demo

```bash
pnpm dev
# Visit: http://localhost:3000/dashboard-demo
```

**Note**: You need a Gantt project loaded first. Create one at `/gantt-tool`.

### 2. Integrate into Your Page

```tsx
import { ThreeLayerDashboard } from "@/components/dashboard";
import { GanttProject } from "@/types/gantt-tool";

export default function MyProposalPage() {
  const project: GanttProject = {
    // Your project data
  };

  return (
    <ThreeLayerDashboard
      project={project}
      onRefresh={() => console.log("Refresh")}
      onExport={() => console.log("Export")}
    />
  );
}
```

## Rate Card System

### Default Rates (MYR)

The system includes default daily rates for Malaysian market:

| Designation       | Daily Rate (MYR) |
| ----------------- | ---------------- |
| Principal         | 8,000            |
| Director          | 7,000            |
| Senior Manager    | 5,500            |
| Manager           | 4,000            |
| Senior Consultant | 3,000            |
| Consultant        | 2,200            |
| Analyst           | 1,500            |
| SubContractor     | 1,800            |

### Customize Rates

```typescript
import { DEFAULT_RATE_CARD, getDailyRate } from "@/lib/rate-card";

// Get rate for a designation
const rate = getDailyRate("senior_consultant"); // 3000

// Calculate assignment cost
import { calculateAssignmentCost } from "@/lib/rate-card";

const cost = calculateAssignmentCost(
  "consultant", // designation
  20, // duration in days
  100 // allocation percentage
);
// Returns: 44,000 MYR
```

### Rate Card Manager UI

Users can view and edit rates through the Rate Card Manager modal:

```tsx
import { RateCardManager } from "@/components/dashboard";

<RateCardManager
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSave={(newRates) => {
    console.log("Updated rates:", newRates);
  }}
/>;
```

## Component Details

### ThreeLayerDashboard

Main container component that orchestrates all views.

**Props:**

```typescript
interface ThreeLayerDashboardProps {
  project: GanttProject; // Required: Project data
  onRefresh?: () => void; // Optional: Refresh callback
  onExport?: () => void; // Optional: Export callback
}
```

### OperationalView

Shows project timeline, resource metrics, and allocation heatmap.

**Features:**

- Project duration and dates
- Total resources and tasks
- Progress tracking
- Resource conflict detection
- Weekly allocation heatmap with color coding:
  - 🟢 Green (0-5 days): Optimal
  - 🟡 Yellow (6 days): Full
  - 🔴 Red (7+ days): Over-allocated
  - ⚪ Grey (0 days): Bench

### FinancialView

Financial analysis with KPIs and visualizations.

**Features:**

- Editable proposed price
- Total cost calculation from resource assignments
- Gross margin calculation and color coding:
  - 🟢 Green (≥20%): Excellent
  - 🔵 Blue (15-20%): Good
  - 🟡 Orange (10-15%): Warning
  - 🔴 Red (<10%): Critical
- Margin waterfall chart
- Cost breakdown by phase
- Financial insights and recommendations

**Margin Calculation:**

```typescript
// Default suggested revenue (30% margin)
suggestedRevenue = totalCost / 0.7;

// Margin %
marginPercent = ((revenue - cost) / revenue) * 100;
```

### StrategicView

Scenario comparison and what-if analysis.

**Features:**

- Create optimized scenarios
- Side-by-side comparison
- Delta analysis (margin, cost, duration, effort)
- Risk & feasibility gauges
- Strategic recommendations

**Pre-built Scenarios:**

- **Cost-Optimized**: -15% cost, +1 month duration
- **Premium Fast-Track**: +25% cost, -1 month, +40% price

### ResourceHeatmap

Weekly resource allocation visualization.

**Algorithm:**

```
For each resource:
  For each week:
    Check phase assignments overlapping this week
    Check task assignments overlapping this week
    Sum: (overlap_days * allocation%) for all assignments

Color cell based on total:
  0 days: Grey
  0-5 days: Green
  6 days: Yellow
  7+ days: Red
```

## Data Requirements

### Minimum Project Structure

```typescript
const project: GanttProject = {
  id: "project-1",
  name: "SAP S/4HANA Implementation",
  startDate: "2024-01-01",
  phases: [
    {
      id: "phase-1",
      name: "Prepare",
      startDate: "2024-01-01",
      endDate: "2024-02-29",
      tasks: [
        {
          id: "task-1",
          name: "Project Planning",
          startDate: "2024-01-01",
          endDate: "2024-01-31",
          progress: 0,
          resourceAssignments: [
            {
              id: "assign-1",
              resourceId: "resource-1",
              assignmentNotes: "Lead project setup",
              allocationPercentage: 100,
              assignedAt: "2024-01-01",
            },
          ],
        },
      ],
      phaseResourceAssignments: [],
    },
  ],
  resources: [
    {
      id: "resource-1",
      name: "Project Manager",
      category: "pm",
      designation: "manager",
      description: "Leads project delivery",
      createdAt: "2024-01-01",
    },
  ],
  milestones: [],
  holidays: [],
  viewSettings: {
    zoomLevel: "week",
    showWeekends: false,
    showHolidays: true,
    showMilestones: true,
    showTaskDependencies: true,
    showCriticalPath: false,
  },
};
```

## Cost Calculation Logic

### How Costs are Calculated

```typescript
// For each phase
phaseDuration = endDate - startDate + 1 (days)

// Phase-level assignments
for assignment in phase.phaseResourceAssignments:
  resource = find_resource(assignment.resourceId)
  dailyRate = getDailyRate(resource.designation)
  days = (phaseDuration * assignment.allocationPercentage / 100)
  cost = days * dailyRate

// Task-level assignments
for task in phase.tasks:
  taskDuration = task.endDate - task.startDate + 1
  for assignment in task.resourceAssignments:
    resource = find_resource(assignment.resourceId)
    dailyRate = getDailyRate(resource.designation)
    days = (taskDuration * assignment.allocationPercentage / 100)
    cost = days * dailyRate

// Total cost = sum of all assignments
```

### Example Calculation

```
Resource: Manager (4,000 MYR/day)
Task: 10 days duration
Allocation: 50%

Allocated Days = 10 * 50% = 5 days
Cost = 5 * 4,000 = 20,000 MYR
```

## Customization

### Custom Rates

Create your own rate card:

```typescript
// src/lib/custom-rates.ts
import { ResourceDesignation } from "@/types/gantt-tool";

export const CUSTOM_RATE_CARD: Record<ResourceDesignation, number> = {
  principal: 10000,
  director: 9000,
  senior_manager: 7000,
  manager: 5000,
  senior_consultant: 4000,
  consultant: 3000,
  analyst: 2000,
  subcontractor: 2500,
};
```

### Custom Colors

Modify margin color thresholds:

```typescript
// src/lib/rate-card.ts
export function getMarginColor(marginPercent: number): string {
  if (marginPercent >= 35) return "#10B981"; // Excellent
  if (marginPercent >= 25) return "#3B82F6"; // Good
  if (marginPercent >= 15) return "#F59E0B"; // Warning
  return "#EF4444"; // Critical
}
```

## Export Functionality

The dashboard supports export (hooks provided):

```tsx
const handleExport = async () => {
  // Export to PDF
  const element = document.getElementById("dashboard-content");
  await html2canvas(element).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    // Generate PDF with jspdf
  });
};

<ThreeLayerDashboard project={project} onExport={handleExport} />;
```

## Best Practices

### 1. Data Validation

Always validate project data before passing to dashboard:

```typescript
const validateProject = (project: GanttProject): boolean => {
  if (!project.phases || project.phases.length === 0) {
    console.error("Project must have at least one phase");
    return false;
  }

  if (!project.resources || project.resources.length === 0) {
    console.warn("No resources assigned");
  }

  return true;
};
```

### 2. Performance

For large projects (>50 phases):

- Use React.memo for sub-components
- Implement virtualization for heatmap rows
- Debounce user inputs (e.g., revenue editor)

### 3. Rate Management

- Store custom rates in database (projects.budget field)
- Allow org-level default rates (RateCard model)
- Version control rate cards for historical accuracy

## Troubleshooting

### Issue: "No resources assigned"

**Cause**: Project has no resources or no resource assignments

**Solution**:

```typescript
// Add resources to project
project.resources = [
  { id: '1', name: 'PM', designation: 'manager', category: 'pm', ... }
];

// Add assignments to tasks
phase.tasks[0].resourceAssignments = [
  { resourceId: '1', allocationPercentage: 100, ... }
];
```

### Issue: "Heatmap shows all grey cells"

**Cause**: No date overlap between assignments and weeks

**Solution**: Verify date formats are ISO 8601 strings:

```typescript
startDate: "2024-01-01"; // ✅ Correct
startDate: new Date(); // ❌ Wrong - must be string
```

### Issue: "Margin calculation seems wrong"

**Cause**: Resources missing designation or invalid designation

**Solution**:

```typescript
// Ensure all resources have valid designation
resource.designation = "consultant"; // Must be ResourceDesignation enum value
```

## Next Steps

1. **Integrate with existing project pages**
   - Add dashboard tab to `/project` page
   - Link from proposal generation modal

2. **Add persistence**
   - Save scenarios to database (Scenario model)
   - Store custom rate cards per organization

3. **Enhanced export**
   - PDF with charts and tables
   - PowerPoint slide deck
   - Excel workbook with formulas

4. **Advanced features**
   - Monte Carlo simulation for risk
   - Historical rate trends
   - Benchmark comparison against past projects

## API Reference

### Rate Card Functions

```typescript
// Get daily rate for designation
getDailyRate(designation: ResourceDesignation): number

// Get hourly rate (daily / 8)
getHourlyRate(designation: ResourceDesignation): number

// Calculate assignment cost
calculateAssignmentCost(
  designation: ResourceDesignation,
  durationDays: number,
  allocationPercentage: number
): number

// Calculate total project cost
calculateProjectCost(allocations: ResourceAllocation[]): number

// Format currency
formatMYR(amount: number): string // "RM 50,000"
formatMYRShort(amount: number): string // "RM 50K"

// Calculate margin
calculateMargin(revenue: number, cost: number): number

// Get margin color
getMarginColor(marginPercent: number): string // Hex color
```

## Support

For questions or issues:

1. Check console for error messages
2. Verify project data structure matches `GanttProject` type
3. Review this guide's troubleshooting section
4. Check component props and types

---

**Built with**: React 19, TypeScript, Ant Design, Recharts, date-fns

**License**: Proprietary - Internal SAP implementation tool
