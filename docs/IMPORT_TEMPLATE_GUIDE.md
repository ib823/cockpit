# Gantt Tool - Project Import Template Guide

## Overview

This guide explains how to prepare your existing project planning data for import into the Gantt Tool using an Excel template.

## Excel Template Structure

The import template uses **5 sheets** to organize different aspects of your project:

1. **Project Info** - Basic project metadata
2. **Phases** - High-level project phases
3. **Tasks** - Detailed tasks within phases
4. **Resources** - Resource/role definitions and org structure
5. **Milestones** - Project milestones and key dates

Optional sheet:
6. **Holidays** - Company/regional holidays

---

## Sheet 1: Project Info

**Single row with project metadata**

| Column | Required | Format | Example | Notes |
|--------|----------|--------|---------|-------|
| Project Name | Yes | Text | "SAP S/4HANA Transformation" | Your project name |
| Start Date | Yes | Date (YYYY-MM-DD) | 2025-01-15 | Project start date |
| Description | No | Text | "Global SAP transformation project" | Brief description |

**Example:**
```
Project Name                    | Start Date  | Description
SAP S/4HANA Transformation     | 2025-01-15  | Global SAP transformation across 5 regions
```

---

## Sheet 2: Phases

**One row per phase**

| Column | Required | Format | Example | Notes |
|--------|----------|--------|---------|-------|
| Phase Name | Yes | Text | "Prepare" | Unique phase name |
| Start Date | Yes | Date (YYYY-MM-DD) | 2025-01-15 | Phase start |
| End Date | Yes | Date (YYYY-MM-DD) | 2025-02-28 | Phase end |
| Description | No | Text | "Project setup and planning" | Phase description |
| Color | No | Hex color | #3B82F6 | Color for visualization (defaults to preset) |

**Available Colors:**
- Blue: `#3B82F6`
- Green: `#10B981`
- Orange: `#F59E0B`
- Purple: `#8B5CF6`
- Red: `#EF4444`
- Pink: `#EC4899`

**Example:**
```
Phase Name | Start Date  | End Date    | Description                      | Color
Prepare    | 2025-01-15  | 2025-02-28  | Project setup and planning      | #3B82F6
Explore    | 2025-03-01  | 2025-04-30  | Requirements and design         | #10B981
Realize    | 2025-05-01  | 2025-09-30  | Development and configuration   | #F59E0B
Deploy     | 2025-10-01  | 2025-11-30  | Testing and go-live             | #8B5CF6
```

---

## Sheet 3: Tasks

**One row per task**

| Column | Required | Format | Example | Notes |
|--------|----------|--------|---------|-------|
| Task Name | Yes | Text | "Define project charter" | Task name |
| Phase Name | Yes | Text | "Prepare" | Must match a phase name from Sheet 2 |
| Start Date | Yes | Date (YYYY-MM-DD) | 2025-01-15 | Task start |
| End Date | Yes | Date (YYYY-MM-DD) | 2025-01-30 | Task end |
| Description | No | Text | "Create and approve project charter" | Task details |
| Progress | No | Number (0-100) | 25 | Completion percentage |
| Assignee | No | Text | "John Smith" | Assigned person (legacy field) |

**Example:**
```
Task Name              | Phase Name | Start Date  | End Date    | Description                           | Progress | Assignee
Define project charter | Prepare    | 2025-01-15  | 2025-01-30  | Create and approve project charter   | 0        |
Setup environments     | Prepare    | 2025-02-01  | 2025-02-15  | Configure DEV/QA/PRD systems         | 0        |
Gather requirements    | Explore    | 2025-03-01  | 2025-03-31  | Document functional requirements     | 0        |
Design solution        | Explore    | 2025-04-01  | 2025-04-30  | Create technical design docs         | 0        |
```

---

## Sheet 4: Resources

**One row per resource/role**

| Column | Required | Format | Example | Notes |
|--------|----------|--------|---------|-------|
| Resource Name | Yes | Text | "Finance Consultant" | Role name (not person name) |
| Category | Yes | Text | functional | See categories below |
| Designation | Yes | Text | consultant | See designations below |
| Description | No | Text | "Consultant with expertise in finance" | Role description |
| Manager Resource Name | No | Text | "Finance Manager" | Name of manager resource |
| Email | No | Email | finance-team@example.com | Contact email |
| Department | No | Text | "Finance & Accounting" | Department name |
| Location | No | Text | "New York" | Location |
| Project Role | No | Text | "Financial Workstream Lead" | Specific project role |

**Valid Categories:**
- `functional` - Functional consultants (Finance, HR, etc.)
- `technical` - Technical consultants (ABAP, interfaces)
- `basis` - Basis/Infrastructure
- `security` - Security & Authorization
- `pm` - Project Management
- `change` - Change Management

**Valid Designations:**
- `principal` - Principal
- `senior_manager` - Senior Manager
- `manager` - Manager
- `senior_consultant` - Senior Consultant
- `consultant` - Consultant
- `analyst` - Analyst
- `subcontractor` - Subcontractor

**Example:**
```
Resource Name        | Category   | Designation      | Description                           | Manager Resource Name | Email                  | Department
Finance Consultant   | functional | consultant       | Consultant with finance expertise     | Finance Manager       | finance@example.com    | Finance
Finance Manager      | functional | manager          | Finance workstream manager            | Project Manager       | finance-mgr@example.com| Finance
Project Manager      | pm         | manager          | Overall project manager               |                       | pm@example.com         | PMO
Technical Architect  | technical  | senior_consultant| Lead technical architect              | Technical Manager     | tech@example.com       | Technical
```

---

## Sheet 5: Milestones

**One row per milestone**

| Column | Required | Format | Example | Notes |
|--------|----------|--------|---------|-------|
| Milestone Name | Yes | Text | "Project Kickoff" | Milestone name |
| Date | Yes | Date (YYYY-MM-DD) | 2025-01-15 | Milestone date |
| Description | No | Text | "Official project start" | Description |
| Icon | No | Emoji | 🚀 | Visual icon (defaults to 🏁) |
| Color | No | Hex color | #10B981 | Color (defaults to green) |

**Example:**
```
Milestone Name     | Date        | Description              | Icon | Color
Project Kickoff    | 2025-01-15  | Official project start   | 🚀   | #10B981
Design Complete    | 2025-04-30  | Design phase completed   | 📋   | #3B82F6
Go-Live            | 2025-11-30  | Production cutover       | ✅   | #10B981
```

---

## Sheet 6: Holidays (Optional)

**One row per holiday**

| Column | Required | Format | Example | Notes |
|--------|----------|--------|---------|-------|
| Holiday Name | Yes | Text | "Christmas Day" | Holiday name |
| Date | Yes | Date (YYYY-MM-DD) | 2025-12-25 | Holiday date |
| Region | No | Text | "US" | Region/country |
| Type | No | Text | public | public, company, or custom |

**Example:**
```
Holiday Name    | Date        | Region | Type
Christmas Day   | 2025-12-25  | US     | public
New Year's Day  | 2025-01-01  | US     | public
Company Day     | 2025-07-04  | Global | company
```

---

## Important Notes

### Date Format
- **MUST use YYYY-MM-DD format** (e.g., 2025-01-15)
- Excel may try to auto-format dates - ensure they remain in YYYY-MM-DD format

### Phase-Task Relationship
- Task "Phase Name" column MUST exactly match a phase name from the Phases sheet
- Case-sensitive

### Resource Hierarchy
- "Manager Resource Name" should reference another resource's "Resource Name"
- Leave blank for top-level resources (no manager)
- System will validate to prevent circular reporting

### Colors
- Use 6-digit hex colors with # prefix: `#3B82F6`
- If left blank, system will assign default colors

### Progress
- Tasks: 0-100 (percentage complete)
- New tasks default to 0

---

## Next Steps

1. Download the template: `project-import-template.xlsx`
2. Fill in your project data following this guide
3. Save the file
4. In the Gantt Tool, click **"Import"** → **"Import from Excel"**
5. Select your filled template
6. Review the import preview
7. Click **"Confirm Import"**

---

## Tips for Best Results

✅ **Do:**
- Use consistent naming (exact matches for Phase Names)
- Keep resource names unique
- Use YYYY-MM-DD date format
- Fill required columns first, then optional ones
- Review data before importing

❌ **Don't:**
- Use different date formats (MM/DD/YYYY, DD-MM-YYYY, etc.)
- Have duplicate phase names or resource names
- Create circular manager relationships
- Leave required fields blank
- Use special characters in names (stick to alphanumeric)

---

## Example Project

See `example-project-import.xlsx` for a complete working example with:
- 4 phases (Prepare, Explore, Realize, Deploy)
- 20+ tasks across phases
- 15 resources with org hierarchy
- 5 milestones
- Regional holidays
