# Project Import - Quick Start Guide

## Overview

Import your existing project planning data into the Gantt Tool using our Excel template.

## Quick Steps

### 1. Download Template

In the Gantt Tool:
- Click on **project dropdown** → **"Import Project"**, OR
- If no project loaded, click **"Import Project"** button in the header

Then click **"Download Template"** to get: `gantt-import-template-YYYY-MM-DD.xlsx`

### 2. Open Template

The template has **6 sheets**:

| Sheet | Purpose | Required? |
|-------|---------|-----------|
| **Project Info** | Project name, start date, description | ✅ Yes |
| **Phases** | Project phases with dates | ✅ Yes |
| **Tasks** | Detailed tasks within phases | ✅ Yes |
| **Resources** | Team resources and org hierarchy | Recommended |
| **Milestones** | Key project milestones | Optional |
| **Holidays** | Company/regional holidays | Optional |

### 3. Fill Your Data

**IMPORTANT DATE FORMAT:** All dates MUST be `YYYY-MM-DD` format (e.g., `2025-01-15`)

#### Project Info Sheet (1 row)
```
Project Name: SAP S/4HANA Transformation
Start Date: 2025-01-15
Description: Global SAP transformation project
```

#### Phases Sheet (one row per phase)
```
Phase Name | Start Date  | End Date    | Description              | Color
Prepare    | 2025-01-15  | 2025-02-28  | Project setup           | #3B82F6
Explore    | 2025-03-01  | 2025-04-30  | Requirements & design   | #10B981
Realize    | 2025-05-01  | 2025-09-30  | Development             | #F59E0B
Deploy     | 2025-10-01  | 2025-11-30  | Testing & go-live       | #8B5CF6
```

#### Tasks Sheet (one row per task)
```
Task Name           | Phase Name | Start Date  | End Date    | Description
Project charter     | Prepare    | 2025-01-15  | 2025-01-30  | Create charter
Setup environments  | Prepare    | 2025-02-01  | 2025-02-15  | Configure systems
Gather requirements | Explore    | 2025-03-01  | 2025-03-31  | Document requirements
```

**⚠️ CRITICAL:** Task "Phase Name" must EXACTLY match a phase name from Phases sheet (case-sensitive)

#### Resources Sheet (one row per resource)
```
Resource Name     | Category   | Designation      | Manager Resource Name | Email
Project Manager   | pm         | manager          |                       | pm@example.com
Finance Lead      | functional | manager          | Project Manager       | finance@example.com
Finance Consultant| functional | consultant       | Finance Lead          | fc@example.com
```

**Valid Categories:** `functional`, `technical`, `basis`, `security`, `pm`, `change`

**Valid Designations:** `principal`, `senior_manager`, `manager`, `senior_consultant`, `consultant`, `analyst`, `subcontractor`

#### Milestones Sheet (one row per milestone)
```
Milestone Name  | Date        | Description         | Icon | Color
Project Kickoff | 2025-01-15  | Official start      | 🚀   | #10B981
Go-Live         | 2025-11-30  | Production cutover  | ✅   | #10B981
```

#### Holidays Sheet (one row per holiday)
```
Holiday Name    | Date        | Region | Type
Christmas Day   | 2025-12-25  | US     | public
New Year's Day  | 2025-01-01  | US     | public
```

### 4. Upload & Import

1. **Save your Excel file**
2. In Gantt Tool, click **"Import Project"**
3. **Upload your file** (drag & drop or click to select)
4. Click **"Parse and Validate"**
5. Review the **preview** (phases, tasks, resources counts)
6. Fix any **validation errors** if shown (file will tell you exact row/column)
7. Click **"Confirm Import"**

Done! Your project is now loaded.

---

## Common Mistakes

❌ **Wrong date format:** `01/15/2025` or `15-Jan-2025`
✅ **Correct format:** `2025-01-15`

❌ **Phase name mismatch:** Task says "Phase 1", but Phases sheet has "Prepare"
✅ **Correct:** Both must match exactly: "Prepare"

❌ **Invalid category:** `finance` (not valid)
✅ **Correct:** `functional`

❌ **Invalid designation:** `lead` (not valid)
✅ **Correct:** `manager` or `senior_consultant`

---

## Pro Tips

✅ **Start small:** Import 2-3 phases with a few tasks to test, then expand

✅ **Use examples:** The template has working examples - modify them rather than starting from scratch

✅ **Manager hierarchy:** Leave "Manager Resource Name" blank for top-level resources, reference other resource names for org structure

✅ **Colors:** Use hex colors like `#3B82F6` for custom colors, or leave blank for defaults

✅ **Validation:** The importer validates everything - if something's wrong, it will tell you exactly where to fix it

---

## Example Files

See the template itself for a complete working example with:
- 4 phases (Prepare → Explore → Realize → Deploy)
- 13 tasks across phases
- 10 resources with manager hierarchy
- 4 milestones
- 5 holidays

---

## Need Help?

See full documentation: `docs/IMPORT_TEMPLATE_GUIDE.md`
