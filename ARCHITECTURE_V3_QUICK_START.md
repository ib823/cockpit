# Architecture V3 Quick Start Guide

## What is Architecture V3?

A **TOGAF-compliant enterprise architecture tool** that helps organizations document and visualize transformation from current state (AS-IS) to future state (TO-BE) through three distinct architectural views.

---

## Three Views at a Glance

### 1. Business Context (Tab 1)
**Purpose:** WHY transform? What do we need?

**Input:** 
- Business entities (Global HQ, Regions, Divisions)
- Key stakeholders (CFO, CIO, VPs, Architects)
- Required capabilities (Finance, HR, Supply Chain, etc.)
- Pain points (current challenges)

**Output:** Context diagram showing scope and motivation

**TOGAF Phase:** A - Architecture Vision

---

### 2. Current Landscape (Tab 2)
**Purpose:** WHAT exists TODAY? Document AS-IS

**Input:**
- Current systems (SAP, Oracle, Salesforce, Custom builds)
- System status (Active, Retiring, or Keep for future)
- External dependencies (Banks, Government, Partners)
- Current integrations

**Output:** AS-IS system landscape diagram

**TOGAF Phase:** B/C/D - Current Business & Technology Architecture

---

### 3. Proposed Solution (Tab 3) - "TO-BE"
**Purpose:** WHAT will we build and WHEN? Design future state

**Input:**
- Implementation phases (Q1 2025, Q3 2025, 2026+)
- Future systems (NEW systems to deploy)
- Reused systems (from AS-IS marked as KEEP)
- Integration points (how systems connect)
- External systems retention (which to keep)

**Output:** TO-BE architecture + migration roadmap

**TOGAF Phase:** E/F - Opportunities & Solutions, Migration Planning

---

## Key Concept: "TO-BE Process"

**TO-BE** means the **future state** - what your architecture will look like after transformation.

```
AS-IS (Current)          TO-BE (Future)
─────────────            ──────────────
SAP ECC 6.0              SAP S/4HANA Cloud (NEW)
 └─ RETIRING             Salesforce (NEW)
                         Oracle DB (REUSED from AS-IS)
Legacy CRM               External bank (RETAINED)
 └─ RETIRING

Result: Manual processes  Result: Automated, cloud-native
        10-day close            2-day close
```

---

## The Magic: Three-Phase Migration Strategy

Architecture V3 shows **when** systems are deployed:

```
Phase 1: Foundation (Q1-Q2 2025) - IN SCOPE
├─ Deploy Salesforce CRM
├─ Deploy Workday HCM
└─ Keep Oracle Database

Phase 2: Core ERP (Q3-Q4 2025) - IN SCOPE
├─ Deploy SAP S/4HANA Finance
├─ Deploy SAP S/4HANA Supply Chain
└─ Retire: SAP ECC, Legacy CRM

Phase 3: Analytics (2026+) - FUTURE
├─ Deploy Snowflake Data Cloud
├─ Deploy Tableau
└─ Keep: External banking relationships
```

**Not a target state, but a realistic roadmap!**

---

## How to Use Each Tab

### Tab 1: Business Context (Start Here)
1. Click "Load TOGAF Entity Templates" → Choose organization type
2. Click "Load TOGAF Stakeholder Templates" → Choose stakeholder groups
3. Click "Load TOGAF Templates" → Add business capabilities
4. Type your pain points in the text area
5. Click "Generate Diagram"

**Time:** 5-10 minutes

---

### Tab 2: Current Landscape (Document Reality)
1. Click "Load Common System Templates" → Choose system category
2. Edit each system: Name, Vendor, Version, Modules
3. **Important:** Set status for each system:
   - RETIRING = Will be replaced
   - KEEP = Will reuse in TO-BE
   - ACTIVE = Currently running (can change later)
4. Click "Load External System Templates" for third-party systems
5. Click "Generate AS-IS Diagram"

**Key insight:** Systems marked "KEEP" become candidates for reuse in TO-BE

**Time:** 10-15 minutes

---

### Tab 3: Proposed Solution (Design Future)
1. Click "Load Standard Phases" → Get 4-phase roadmap template
2. Edit each phase: Name, Timeline, Scope (In-Scope or Future)
3. **For each phase:**
   - Click "+ Add New System" → Select template category → Auto-add systems
   - OR Click "+ Reuse from AS-IS" → Select system marked KEEP
4. Build integration architecture:
   - Check which external systems to keep (toggle buttons)
   - Click first system → Click second system → Creates integration
5. Click "Generate TO-BE Diagram + Roadmap"

**Key insight:** This shows the migration strategy, not just the target state

**Time:** 15-20 minutes

---

## Template Categories (What's Available)

### Business Context
- **Entities:** Global Enterprise, Manufacturing, Retail, Financial Services
- **Stakeholders:** 30+ pre-defined roles (CEO, CFO, Architects, etc.)
- **Capabilities:** 50+ business capabilities across 8 domains

### Current Landscape (AS-IS)
- **Systems:** 16 pre-defined (SAP, Oracle, Salesforce, Workday, Custom, Excel, etc.)
- **External:** 11 pre-defined (Banks, Government, Partners, E-Commerce)

### Proposed Solution (TO-BE)
- **Phases:** Standard 4-phase roadmap (Foundation → Core → Extended → Future)
- **Systems:** 20 modern/cloud options (S/4HANA, Oracle Cloud, Dynamics 365, Workday, Salesforce, etc.)

---

## Diagram Generation

### How to Generate
1. Tab 1, 2, or 3: Click "Generate Diagram" button
2. StyleSelector modal opens
3. Choose:
   - **Visual Style:** Clean (light), Bold (dark blue), or Gradient (purple)
   - **Actor Display:** Cards (detailed) or Tags (compact)
   - **Layout Mode:** Swim-lanes (by entity) or Grid (grouped)
   - **Options:** Show legend, Show icons
4. Click "Generate Diagram"
5. View styled diagram

### Export
- **Status:** "Export to PDF/PowerPoint" button not yet implemented
- **Workaround:** Use browser print to PDF

---

## Color Coding Cheat Sheet

### AS-IS Systems (Current Landscape)
- Blue badge = ACTIVE (running now)
- Green badge = KEEP (will reuse in TO-BE)
- Red badge = RETIRING (will replace)

### TO-BE Systems (Proposed Solution)
- Green border = NEW system
- Blue border = REUSED from AS-IS
- Yellow border = External system

### Phases (TO-BE Timeline)
- Green with checkmark = IN SCOPE (2025-2026)
- Orange with clock = FUTURE (2026+)

---

## Non-Obvious Features

### 1. Integration Drawing (Tricky!)
To create integrations in TO-BE tab:
1. Click first system (it highlights)
2. Click second system (integration created)
3. Appears in list below
4. No visual arrows drawn (limitation)

### 2. Reuse Systems (Clunky UX)
- Click "Reuse from AS-IS" button
- Browser `prompt()` dialog appears (old-school!)
- Type number of system from list
- System added to current phase as REUSED

### 3. Phase Templates
- "Load Standard Phases" shows info box
- Another button "Load 4 Standard Phases" appears
- Two-step process (could be one-click)

---

## Common Workflows

### Workflow 1: Simple Cloud Migration
**Goal:** Replace legacy ERP with cloud ERP

**Steps:**
1. **Business Context:** "Need modern finance capabilities, faster close"
2. **Current Landscape:** SAP ECC (RETIRING), Oracle (KEEP)
3. **Proposed Solution:**
   - Phase 1: SAP S/4HANA (NEW)
   - Phase 2: Analytics Cloud (NEW)
   - Keep: Oracle Database

---

### Workflow 2: Digital Transformation
**Goal:** Full transformation (legacy to cloud-native)

**Steps:**
1. **Business Context:** Multiple entities, 5+ capability domains, major pain points
2. **Current Landscape:** Legacy ERP, Point solutions, External banks
3. **Proposed Solution:**
   - Phase 1: Quick wins (Salesforce, Workday)
   - Phase 2: Core ERP (S/4HANA)
   - Phase 3: Advanced analytics
   - All external systems retained

---

## Troubleshooting

### "Generate Diagram" button not showing
- **Cause:** No data entered in current tab
- **Fix:** Add at least one entity, actor, system, or phase

### Can't see integrations I created
- **Cause:** No visual arrows (limitations of current version)
- **Fix:** Check "Integrations" list below the diagram

### Can't edit integrations after creating
- **Cause:** Not implemented
- **Fix:** Delete and recreate

### "Reuse from AS-IS" shows prompt dialog
- **Cause:** UI limitation
- **Fix:** Enter the number from the list (e.g., "1" for first system)

---

## Best Practices

1. **Start with Business Context**
   - Get alignment on WHY before diving into technical details
   - Use templates to save time

2. **Be Specific in Current Landscape**
   - Mark systems accurately (RETIRING vs. KEEP)
   - Document external dependencies carefully
   - This drives TO-BE planning

3. **Phase Realistically in TO-BE**
   - Don't put everything in Phase 1
   - Consider dependencies and disruption
   - Mark items "FUTURE" honestly (not all in Phase 1)

4. **Use Integration Architecture**
   - Show how NEW and REUSED systems connect
   - Include external systems strategically

5. **Choose Visual Style Strategically**
   - **Clean** = Executive presentations
   - **Bold** = Technical audiences
   - **Gradient** = Client proposals

---

## TOGAF Alignment

| Tab | TOGAF Phase | Focus |
|-----|-------------|-------|
| Business Context | A | Architecture Vision |
| Current Landscape | B, C, D | Current State |
| Proposed Solution | E, F | Future State + Migration |

This is proper enterprise architecture methodology!

---

## File Locations

- **Main page:** `/src/app/architecture/v3/page.tsx`
- **Type definitions:** `/src/app/architecture/v3/types.ts`
- **Tab components:** `/src/app/architecture/v3/components/`
- **Full analysis:** See `ARCHITECTURE_V3_COMPLETE_ANALYSIS.md`
- **Visual diagrams:** See `ARCHITECTURE_V3_VISUAL_SUMMARY.md`

---

## Getting Help

**For questions about:**
- **User flow:** See ARCHITECTURE_V3_VISUAL_SUMMARY.md
- **Component details:** See ARCHITECTURE_V3_COMPLETE_ANALYSIS.md
- **TypeScript types:** See `/src/app/architecture/v3/types.ts`
- **Specific component:** Check `/src/app/architecture/v3/components/` files

---

## Key Takeaway

Architecture V3 makes **enterprise architecture accessible to mortals** through:
1. TOGAF templates (no starting from scratch)
2. Clear three-view methodology (Business → AS-IS → TO-BE)
3. Visual color-coding (status badges, phase indicators)
4. Phased roadmap (realistic migration planning)

It's professional EA without the 200-page framework documentation!

