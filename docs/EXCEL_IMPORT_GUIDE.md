# Excel Import Feature - User Guide

## Overview

The Gantt Tool now supports importing project data from Excel through two methods:
1. **Copy & Paste** - Copy data directly from Excel and paste into the tool (NEW)
2. **Upload File** - Upload a formatted .xlsx file (Existing)

## Copy & Paste Method (Recommended)

### How to Use

1. Open the Gantt Tool and click "Import from Excel"
2. Select the **"Copy & Paste"** tab
3. Open your Excel file with project data
4. Select all data including headers (Ctrl+A or select manually)
5. Copy the data (Ctrl+C or Cmd+C)
6. Click in the paste area and paste (Ctrl+V or Cmd+V)
7. Review the preview showing parsed tasks and resources
8. Click "Import Project"

### Excel Data Format

The parser expects data in this format:

```
Task Name       Start Date              End Date                W 01  W 02  W 03  ...
LPPSA Track B   Monday, 12 January 2026 Friday, 13 November 2026
  Discover      Monday, 12 January 2026 Friday, 22 May 2026
  Realize       Monday, 25 May 2026     Friday, 28 August 2026
  Deploy        Monday, 26 October 2026 Friday, 27 November 2026

Role            Name                    W 01  W 02  W 03  ...
Manager         Project Manager         5.0   5.0   5.0
Manager         ABAP Lead              3.5   4.0   5.0
Consultant      SAP FI Consultant      2.0   3.0   5.0
```

#### Data Structure Rules

1. **Tasks Section** (before "Role" row):
   - Column 1: Task name (indented with space = sub-task, not indented = phase)
   - Column 2: Start date
   - Column 3: End date
   - Columns 4+: Weekly columns (W 01, W 02, etc.)

2. **Resources Section** (after "Role" row):
   - Column 1: Resource name
   - Column 2: Role/designation
   - Columns 3+: Weekly effort in mandays (e.g., 5.0 = 5 days)

3. **Date Formats Supported**:
   - ISO format: `2026-01-12`
   - Long format: `Monday, 12 January 2026`
   - Week format: `12.00` (interpreted as week 12 from project start)

4. **Resource Categories** (auto-inferred from role):
   - "Manager" → management
   - "Consultant" → functional
   - "Developer" or "ABAP" → technical
   - "Architect" → functional
   - Other → other

### Sample Test Data

Copy and paste this sample data to test the import:

```
Task Name	Start Date	End Date	W 01	W 02	W 03	W 04	W 05	W 06
Phase 1: Planning	2026-01-05	2026-02-27
  Requirements	2026-01-05	2026-01-30
  Design	2026-02-02	2026-02-27
Phase 2: Development	2026-03-02	2026-05-29
  Backend	2026-03-02	2026-04-24
  Frontend	2026-04-27	2026-05-29

Role	Name	W 01	W 02	W 03	W 04	W 05	W 06
Manager	Project Manager	5.0	5.0	5.0	5.0	5.0	5.0
Manager	Tech Lead	3.0	4.0	5.0	5.0	5.0	5.0
Consultant	BA Consultant	5.0	5.0	3.0	2.0	2.0	1.0
Developer	Backend Developer	0.0	2.0	5.0	5.0	5.0	5.0
Developer	Frontend Developer	0.0	0.0	0.0	2.0	5.0	5.0
```

## Features

### Automatic Parsing
- **Task Hierarchy**: Phases and sub-tasks are identified by indentation
- **Date Conversion**: Multiple date formats are automatically converted to ISO format
- **Resource Allocation**: Weekly mandays are converted to task assignments
- **Smart Mapping**: Resources are automatically assigned to tasks based on overlapping time periods

### Preview Before Import
- See how many tasks, resources, and weeks will be imported
- Review task names and date ranges
- Review resource names, roles, and total effort
- Validate data before creating the project

### Error Handling
- Clear error messages if data format is incorrect
- Warnings for missing or invalid data
- Instructions for fixing common issues

## Implementation Details

### Files Created
1. `/src/lib/gantt-tool/excel-template-parser.ts` - Parser logic
2. `/src/components/gantt-tool/ExcelTemplateImport.tsx` - UI component
3. `/src/components/gantt-tool/ImportModal.tsx` - Updated with tabs

### API Integration
- Creates project via `POST /api/gantt-tool/projects`
- Updates project with phases/tasks/resources via `PATCH /api/gantt-tool/projects/[id]`
- Automatically loads imported project in the Gantt Tool

### Technology Stack
- TypeScript for type safety
- `date-fns` for date parsing and formatting
- `nanoid` for generating unique IDs
- TSV (tab-separated values) parsing from clipboard

## Troubleshooting

### Common Issues

**Error: "Could not find weekly column headers"**
- Make sure your Excel has weekly columns labeled "W 01", "W 02", etc.
- Ensure headers are in the first 10 rows

**Error: "Failed to parse data"**
- Check that you copied the entire table including headers
- Ensure there are no completely empty rows in the middle of your data
- Verify date formats are consistent

**Resources Not Assigned to Tasks**
- Resources are only assigned if they have effort during the task period
- Check that weekly effort columns align with task date ranges

**Dates Are Incorrect**
- Use ISO format (YYYY-MM-DD) for best results
- For "12.00" week format, the parser assumes project starts Jan 1, 2026

### Tips for Best Results

1. **Clean Data**: Remove empty rows and columns from your Excel before copying
2. **Consistent Dates**: Use ISO format (YYYY-MM-DD) for all dates
3. **Clear Hierarchy**: Use single space for indentation to indicate sub-tasks
4. **Complete Headers**: Include all weekly column headers (W 01, W 02, etc.)
5. **Valid Numbers**: Use decimal numbers for weekly effort (e.g., 5.0, 2.5)

## Next Steps

After importing:
1. Review the generated Gantt chart
2. Adjust dates by dragging bars if needed
3. Add milestones and holidays
4. Fine-tune resource allocations
5. Export to PNG, PDF, or Excel when ready

## Feedback

If you encounter issues or have suggestions for improving the import feature, please file an issue in the project repository.
