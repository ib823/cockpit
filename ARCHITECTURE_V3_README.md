# Architecture V3 - Comprehensive Documentation Index

This folder contains complete documentation for the Architecture V3 route (`/src/app/architecture/v3`), a TOGAF-aligned enterprise architecture diagramming tool.

## Documentation Files

### 1. ARCHITECTURE_V3_QUICK_START.md (340 lines)
**Start here if you want to:** Use the tool, understand the concept, or get up to speed quickly

**Contains:**
- What Architecture V3 is (1 minute read)
- Three views explained (Business Context, AS-IS, TO-BE)
- Key concept: "TO-BE Process" (what it means)
- Step-by-step guide for each tab
- Template categories available
- Color coding cheat sheet
- Common workflows
- Troubleshooting guide
- Best practices

**Best for:** Users, product managers, architects getting oriented

---

### 2. ARCHITECTURE_V3_VISUAL_SUMMARY.md (514 lines)
**Start here if you want to:** See diagrams, flows, and visual architecture

**Contains:**
- User journey map (ASCII flowchart)
- Data flow architecture (component tree)
- Tab content structure (wireframe examples)
- Component hierarchy (nested components)
- Data type relationships (UML-style diagrams)
- Template categories reference
- Color code legend
- Navigation states
- Three views comparison table

**Best for:** Developers, architects, visual learners

---

### 3. ARCHITECTURE_V3_COMPLETE_ANALYSIS.md (1131 lines)
**Start here if you want to:** Deep dive into everything

**Contains:**
- Executive summary
- Complete user journey (7 major steps)
- Detailed component architecture
- All TypeScript type definitions
- UI/UX observations (strengths & confusions)
- Navigation & state management
- Design system integration
- Potential improvements (prioritized)
- Code quality observations
- Non-obvious UX elements

**Best for:** Developers implementing features, code reviewers, architects planning improvements

---

## Quick Navigation

### I want to... [Find the right document]

**Use the tool**
→ Start with `ARCHITECTURE_V3_QUICK_START.md`

**Understand the user flow**
→ Start with `ARCHITECTURE_V3_VISUAL_SUMMARY.md` (journey map section)

**Understand what "TO-BE" means**
→ Read `ARCHITECTURE_V3_QUICK_START.md` (Key Concept section)

**Understand component structure**
→ Read `ARCHITECTURE_V3_VISUAL_SUMMARY.md` (component hierarchy)
→ Read `ARCHITECTURE_V3_COMPLETE_ANALYSIS.md` (component architecture section)

**Find TypeScript types**
→ `ARCHITECTURE_V3_COMPLETE_ANALYSIS.md` (complete type system section)
→ Or see actual file: `/src/app/architecture/v3/types.ts`

**Understand data flow**
→ `ARCHITECTURE_V3_VISUAL_SUMMARY.md` (data flow architecture)
→ `ARCHITECTURE_V3_COMPLETE_ANALYSIS.md` (navigation & state management)

**Find UI/UX issues**
→ `ARCHITECTURE_V3_COMPLETE_ANALYSIS.md` (UI/UX observations section)

**Understand what to improve**
→ `ARCHITECTURE_V3_COMPLETE_ANALYSIS.md` (potential improvements section)

**Learn best practices**
→ `ARCHITECTURE_V3_QUICK_START.md` (best practices section)

---

## Key Concepts

### What is Architecture V3?
A TOGAF-aligned enterprise architecture tool that guides users through documenting a complete enterprise transformation using three distinct views:

1. **Business Context** - WHY transform? (scope, stakeholders, capabilities, pain points)
2. **Current Landscape (AS-IS)** - WHAT exists today? (systems, status, dependencies)
3. **Proposed Solution (TO-BE)** - WHAT will we build and WHEN? (phases, new systems, reused systems, roadmap)

### What does "TO-BE" mean?
The **future state** - what your system architecture will look like after transformation, organized by implementation phases.

```
AS-IS (Today)        →    TO-BE (Future, by phase)
─────────────             ──────────────────────
SAP ECC 6.0               Phase 1: SAP S/4HANA (NEW)
Legacy CRM                Phase 1: Salesforce (NEW)
Excel Planning            Phase 2: Analytics Cloud (NEW)
Oracle Database           Phase 2: Oracle Database (REUSED)
External: Bank            External: Bank (RETAINED)
```

### Why TOGAF?
TOGAF (The Open Group Architecture Framework) is the industry standard for enterprise architecture. Implementing TOGAF phases ensures:
- Professional-grade architecture
- Auditable transformation plans
- Stakeholder alignment
- Reduced risk

---

## File Structure

```
/src/app/architecture/v3/
├── page.tsx                                    # Main page component (463 lines)
├── types.ts                                    # Type definitions (147 lines)
├── layout.tsx                                  # Auth layout
├── styles.module.css                          # Page-level styles
│
└── components/
    ├── BusinessContextTab.tsx                 # Tab 1 component (1273 lines!)
    ├── business-context-tab.module.css
    ├── CurrentLandscapeTab.tsx                # Tab 2 component (556 lines)
    ├── current-landscape-tab.module.css
    ├── ProposedSolutionTab.tsx                # Tab 3 component (1093 lines!)
    ├── proposed-solution-tab.module.css
    ├── DiagramGenerator.tsx                   # Diagram renderer
    ├── StyleSelector.tsx                      # Style picker modal
    └── business-context-tab.module.css        # (and other CSS modules)
```

---

## Data Structure Overview

### ArchitectureProject
```typescript
{
  id: string;
  name: string;
  version: string;
  lastSaved: string;
  
  // Tab 1: Business Context (Phase A)
  businessContext: {
    entities: BusinessEntity[];
    actors: Actor[];
    capabilities: Capability[];
    painPoints: string;
  };
  
  // Tab 2: Current Landscape (Phase B/C/D)
  currentLandscape: {
    systems: CurrentSystem[];        // Status: active/retiring/keep
    integrations: Integration[];
    externalSystems: ExternalSystem[];
  };
  
  // Tab 3: Proposed Solution (Phase E/F)
  proposedSolution: {
    phases: Phase[];                 // Timeline + scope
    systems: ProposedSystem[];        // isNew: boolean, reusedFromId
    integrations: ProposedIntegration[];
    retainedExternalSystems: string[];
  };
  
  // Diagram styling
  diagramSettings: DiagramSettings;
}
```

---

## Key Features

### Templates (Major Time Savers!)
- **30+ stakeholder roles** (C-Suite, EA Team, Business Leads, IT Teams, External)
- **50+ business capabilities** (Finance, HR, Supply Chain, etc.)
- **16 pre-defined systems** (Legacy ERP, Cloud, Databases)
- **11 external systems** (Banks, Government, Partners)
- **20 future systems** (S/4HANA, Oracle Cloud, Salesforce, etc.)
- **4-phase migration roadmap** (standard template)

### Visual Encoding
- **AS-IS status badges:** Blue (Active), Green (Keep), Red (Retiring)
- **TO-BE systems:** Green (New), Blue (Reused), Yellow (External)
- **Phase scope:** Green (In-Scope), Orange (Future)
- **Capability categories:** 8 different colors

### Output Formats
- **Business Context Diagram:** Scope visualization
- **AS-IS Landscape:** Current system map
- **TO-BE Architecture + Roadmap:** Future state with phased deployment
- **3 visual styles:** Clean (light), Bold (dark), Gradient (premium)

---

## Non-Obvious/Confusing Elements

⚠️ **Integration Drawing:** Click first system → Click second → Integration created
- No visual arrows (limitation)
- Only visible in text list below
- Implicit mode activation (not obvious)

⚠️ **Reuse Systems:** Uses `prompt()` dialog (very 1990s UX)
- User must enter number from list manually
- Should be a proper dropdown/modal

⚠️ **Phase Templates:** Two-step process
- "Load Standard Phases" button → Shows info box
- Another "Load 4 Standard Phases" button appears
- Could be one-click

⚠️ **Process Mapping Tab:** Completely empty placeholder
- Takes up space in tab bar
- No functionality
- Should be hidden or labeled "Coming Soon"

⚠️ **Capability Colors:** Not documented in UI
- Colors assigned but no visual legend
- Hover tooltip only shows category name

---

## Improvements Needed

### High Priority (UX Issues)
1. **Fix reuse system selector** - Replace `prompt()` with modal
2. **Add visual integration arrows** - Show connections in diagram
3. **Add capability legend** - Document color-coding
4. **Process Mapping tab** - Either implement or hide

### Medium Priority (Polish)
1. **Loading states** - Skeleton loaders for templates
2. **Validation** - Warn about dangling references
3. **Undo/Redo** - Currently no way to undo deletions
4. **Export diagram** - PDF/PowerPoint export (currently not implemented)
5. **Visual integrations** - Show integration count, density

### Low Priority (Nice to have)
1. **Bulk import** - CSV upload
2. **Collaboration** - Comments, version history
3. **Advanced styling** - Custom colors, icons per system
4. **Comparison mode** - AS-IS vs. TO-BE side-by-side

---

## Related Files

**Authentication:**
- `/src/app/architecture/layout.tsx` - Auth check (requires login)

**State Management:**
- `/src/stores/gantt-tool-store-v2.ts` - Project store (Zustand)

**UI Components:**
- `/src/components/navigation/GlobalNav.tsx`
- `/src/components/navigation/Tier2Header.tsx`
- `/src/components/gantt-tool/NewProjectModal.tsx`

**Type Definitions:**
- `/src/app/architecture/v3/types.ts` - All TypeScript interfaces

---

## How to Extend

### Adding a New System Template Category
1. Open `/src/app/architecture/v3/components/ProposedSolutionTab.tsx`
2. Find `TOGAF_FUTURE_SYSTEMS_TEMPLATES` object
3. Add new category with array of systems
4. Pattern: `{ name: "...", vendor: "...", modules: [...], isNew: true }`

### Adding a New Capability Domain
1. Open `/src/app/architecture/v3/components/BusinessContextTab.tsx`
2. Find `TOGAF_CAPABILITY_TEMPLATES` object
3. Add new category name as key, array of capability strings as value
4. Add corresponding CSS color class for new category

### Changing Colors
1. Check `/src/app/architecture/v3/components/*.tsx` files
2. Colors are mostly inline styles with hardcoded hex values
3. Could refactor to CSS variables or theme system

---

## Performance Notes

- **All data kept in React state** (page.tsx)
- **No persistence in current session** (would need API)
- **Renders all tabs even though only one visible** (could optimize with lazy loading)
- **Large BusinessContextTab component** (1273 lines, could be split)

---

## Testing Checklist

When implementing features:
- [ ] Test with empty project (initialization)
- [ ] Test template loading (don't duplicate IDs)
- [ ] Test system status changes (affects TO-BE options)
- [ ] Test integration drawing (click order matters)
- [ ] Test diagram generation (all data types)
- [ ] Test style selector (all 3 visual styles)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (keyboard navigation, color contrast)

---

## Glossary

| Term | Meaning |
|------|---------|
| **AS-IS** | Current state (what exists today) |
| **TO-BE** | Future state (what we'll build) |
| **Phase** | Implementation timeline segment |
| **Scope** | In-Scope (2025-2026) or Future (2026+) |
| **NEW** | System being deployed for first time |
| **REUSED** | System from AS-IS being kept in TO-BE |
| **RETIRING** | System being replaced |
| **KEEP** | System marked for reuse in future |
| **External** | Third-party system (bank, government, partner) |
| **Integration** | Connection between systems |

---

## Quick Links

- **Live tool:** `/architecture/v3`
- **Source code:** `/src/app/architecture/v3/`
- **Type definitions:** `/src/app/architecture/v3/types.ts`
- **Components:** `/src/app/architecture/v3/components/`
- **TOGAF spec:** https://www.opengroup.org/togaf
- **Main project:** Use "Quick Start" or "Complete Analysis" docs

---

## Document Summary

| Document | Lines | Purpose | Audience |
|----------|-------|---------|----------|
| Quick Start | 340 | How to use the tool | Users, PMs |
| Visual Summary | 514 | Diagrams and flows | Developers, architects |
| Complete Analysis | 1131 | Deep dive, all details | Developers, code reviewers |
| This README | — | Navigation & overview | Everyone |

---

**Last Updated:** November 12, 2025

**Status:** Complete Analysis
- User flows: Documented
- Components: Documented  
- Data model: Documented
- UX observations: Documented
- Improvement ideas: Prioritized

