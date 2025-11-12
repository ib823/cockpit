# Architecture V3 Visual Summary

## User Journey Map

```
START: /architecture/v3
  │
  ├─→ AUTH CHECK
  │     └─→ Redirect to /login if needed
  │
  ├─→ PROJECT INITIALIZATION
  │     ├─→ Fetch projects from DB
  │     ├─→ Auto-load most recent OR create default
  │     └─→ Show GlobalNav + Tier2Header
  │
  └─→ MAIN INTERFACE (4 TABS)
        │
        ├─ TAB 1: BUSINESS CONTEXT (Phase A)
        │   ├─ Add entities (WHO)
        │   ├─ Add actors/stakeholders (WHOM)
        │   ├─ Add capabilities (WHAT)
        │   ├─ Document pain points (WHY)
        │   └─ Button: "Generate Diagram"
        │
        ├─ TAB 2: CURRENT LANDSCAPE (Phase B/C/D)
        │   ├─ Add current systems (AS-IS)
        │   │   └─ Status: Active/Retiring/Keep
        │   ├─ Add external dependencies
        │   └─ Button: "Generate AS-IS Diagram"
        │
        ├─ TAB 3: PROPOSED SOLUTION (Phase E/F)
        │   ├─ Define implementation phases
        │   ├─ Add systems to phases (NEW)
        │   ├─ Reuse systems from AS-IS
        │   ├─ Build integration architecture
        │   └─ Button: "Generate TO-BE Diagram + Roadmap"
        │
        └─ TAB 4: PROCESS MAPPING (Coming Soon)
            └─ Empty placeholder
            
DIAGRAM GENERATION FLOW:
  User clicks "Generate Diagram"
    │
    ├─→ StyleSelector modal opens
    │     ├─ Choose visual style (Clean/Bold/Gradient)
    │     ├─ Choose actor display (Cards/Tags)
    │     ├─ Choose layout mode (Swim-lanes/Grid)
    │     ├─ Additional options (Legend/Icons)
    │     └─ Click "Generate Diagram"
    │
    └─→ DiagramGenerator page
          ├─ Display styled diagram
          ├─ Button: "← Back to Edit"
          ├─ Button: "Change Style"
          └─ Button: "Export to PDF / PowerPoint" [NOT IMPLEMENTED]
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│ page.tsx (Main Container)                               │
│                                                          │
│ States:                                                  │
│ • activeTab: Tab                                         │
│ • businessContext: BusinessContextData                   │
│ • currentLandscape: CurrentLandscapeData                 │
│ • proposedSolution: ProposedSolutionData                 │
│ • diagramSettings: DiagramSettings                       │
│ • isGenerated: boolean                                   │
│                                                          │
│ Store: useGanttToolStore()                               │
│ • currentProject, projects, fetchProjects, etc.          │
└─────────────────────────────────────────────────────────┘
         │
         ├─────────────────────┬─────────────────────────────┬─────────────────────┐
         │                     │                             │                     │
         ▼                     ▼                             ▼                     ▼
    BusinessContextTab   CurrentLandscapeTab         ProposedSolutionTab   StyleSelector
    (Tab 1)             (Tab 2)                       (Tab 3)               (Modal)
    │                   │                             │                     │
    ├─ entities         ├─ systems                    ├─ phases            ├─ visualStyle
    ├─ actors           ├─ integrations               ├─ systems           ├─ actorDisplay
    ├─ capabilities     ├─ externalSystems           ├─ integrations      ├─ layoutMode
    ├─ painPoints       │                             ├─ retainedExternal  └─ showLegend
    │                   │                             │
    └─ onChange()       └─ onChange()                 └─ onChange()
       │                   │                             │
       └─ setBusinessContext() ← Parent callback        │
                              └────────────────────── setProposedSolution()
```

---

## Tab Content Structure

### Tab 1: Business Context
```
┌─────────────────────────────────────────────────────────┐
│ BUSINESS CONTEXT TAB                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Card View] [List View]                                 │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: Business Entities                              │
│ ─────────────────────────────────────────────────────   │
│ [Load TOGAF Templates ▼]                                │
│                                                          │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐              │
│ │ Entity 1  │ │ Entity 2  │ │ Entity 3  │              │
│ │ [Edit]    │ │ [Edit]    │ │ [Delete]  │              │
│ └───────────┘ └───────────┘ └───────────┘              │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: Key Actors & Activities                        │
│ ─────────────────────────────────────────────────────   │
│ [Load TOGAF Stakeholder Templates ▼]                    │
│                                                          │
│ ┌───────────────────────┐ ┌───────────────────────┐    │
│ │ Actor 1: CFO          │ │ Actor 2: CEO          │    │
│ │ Role: Finance         │ │ Role: Executive       │    │
│ │ Dept: Finance         │ │ Dept: Office          │    │
│ │ [Edit]    │ [Delete]  │ │ [Edit]    │ [Delete]  │    │
│ └───────────────────────┘ └───────────────────────┘    │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: Required Capabilities                          │
│ ─────────────────────────────────────────────────────   │
│ [Load TOGAF Templates ▼]                                │
│                                                          │
│ [Financial Planning] [GL Mgmt] [AR/AP]                 │
│ [Recruitment] [Learning] [Payroll]                     │
│ [Demand Planning] [Procurement] [Inventory]            │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: Pain Points & Motivation                       │
│ ─────────────────────────────────────────────────────   │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ [Large textarea with current pain points...]    │    │
│ └─────────────────────────────────────────────────┘    │
│                                                          │
│                [Generate Diagram →]                     │
└─────────────────────────────────────────────────────────┘
```

### Tab 2: Current Landscape (AS-IS)
```
┌─────────────────────────────────────────────────────────┐
│ CURRENT LANDSCAPE TAB (AS-IS ARCHITECTURE)              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ℹ️ Info: Document your CURRENT STATE - what systems    │
│    exist TODAY. This will be compared against your     │
│    proposed solution.                                  │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: Current Applications & Systems                 │
│ ─────────────────────────────────────────────────────   │
│ [Load Common System Templates ▼]                        │
│                                                          │
│ ┌──────────────────────┐  ┌──────────────────────┐     │
│ │ SAP ECC 6.0         │  │ Oracle E-Business   │     │
│ │ Vendor: SAP         │  │ Vendor: Oracle      │     │
│ │ Version: ECC 6.0    │  │ Version: R12        │     │
│ │ Modules: FI,CO,...  │  │ Modules: Finance... │     │
│ │ [RETIRING ▼]        │  │ [RETIRING ▼]        │     │
│ └──────────────────────┘  └──────────────────────┘     │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: External System Dependencies                   │
│ ─────────────────────────────────────────────────────   │
│ [Load External System Templates ▼]                      │
│                                                          │
│ ┌──────────────────────┐  ┌──────────────────────┐     │
│ │ Bank Payment         │  │ Tax Authority        │     │
│ │ Gateway              │  │ Portal               │     │
│ │ [SWIFT/ISO 20022]    │  │ [Web Portal]         │     │
│ └──────────────────────┘  └──────────────────────┘     │
│                                                          │
│                [Generate AS-IS Diagram →]              │
└─────────────────────────────────────────────────────────┘
```

### Tab 3: Proposed Solution (TO-BE)
```
┌─────────────────────────────────────────────────────────┐
│ PROPOSED SOLUTION TAB (TO-BE ARCHITECTURE + ROADMAP)   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ℹ️ Info: Design your FUTURE STATE - what systems      │
│    you'll implement and when. Define phases, select   │
│    new systems, and reuse systems marked "KEEP" from  │
│    AS-IS.                                              │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: Implementation Phases                          │
│ ─────────────────────────────────────────────────────   │
│ [Load Standard Phases] [Add Custom Phase ▼]             │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 1 │ Phase 1: Foundation & Quick Wins        │ ✓ │   │
│ │ │ │ Timeline: Q1-Q2 2025    [Edit...]       │ IN SCOPE
│ │ │ │ Deploy foundational systems...         │   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 2 │ Phase 2: Core Transformation          │ ✓ │   │
│ │ │ │ Timeline: Q3-Q4 2025    [Edit...]       │ IN SCOPE
│ │ │ │ Major system replacements...           │   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: Future Systems by Phase                        │
│ ─────────────────────────────────────────────────────   │
│                                                          │
│ PHASE 1: Foundation & Quick Wins [IN SCOPE ─ Green]    │
│ [+ Add New System] [+ Reuse from AS-IS (3)]            │
│                                                          │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│ │ NEW      │  │ NEW      │  │ REUSED   │              │
│ │Salesforce│  │Workday   │  │Oracle DB │              │
│ │CRM       │  │HCM       │  │          │              │
│ └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│ SECTION: TO-BE Integration Architecture                 │
│ ─────────────────────────────────────────────────────   │
│                                                          │
│ ℹ️ How to build: Click system 1 → Click system 2      │
│    to create integration                              │
│                                                          │
│ External Systems Retention:                            │
│ [✓ Bank Payment] [✓ Tax Authority] [ Partner Portal] │
│                                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │   NEW Systems  │ REUSED from AS-IS │ EXTERNAL  │   │
│ ├─────────────────────────────────────────────────┤   │
│ │ - Salesforce   │ - Oracle DB        │ - Bank    │   │
│ │ - Workday      │ - Concur           │ - Tax     │   │
│ │ - S/4HANA      │                    │ - Partner │   │
│ └─────────────────────────────────────────────────┘   │
│                                                          │
│ Integrations:                                           │
│ • Salesforce → Oracle DB (REST API)                    │
│ • S/4HANA → Bank Payment (SWIFT)                       │
│                                                          │
│        [Generate TO-BE Diagram + Roadmap →]            │
└─────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
page.tsx (Main)
│
├─ GlobalNav (top navigation)
│
├─ Tier2Header (project selector)
│
├─ Tabs Container
│  ├─ TabButton("Business Context")
│  ├─ TabButton("Current Landscape")
│  ├─ TabButton("Proposed Solution")
│  └─ TabButton("Process Mapping")
│
├─ Main Content Area
│  │
│  ├─ IF activeTab == "business-context"
│  │  └─ BusinessContextTab
│  │     ├─ EntitiesSection
│  │     │  ├─ TemplateLoader
│  │     │  └─ EntityCard[] (or EntitiesListView)
│  │     ├─ ActorsSection
│  │     │  ├─ TemplateLoader
│  │     │  └─ ActorCard[] (or ActorsListView)
│  │     ├─ CapabilitiesSection
│  │     │  ├─ TemplateLoader
│  │     │  └─ CapabilityTag[]
│  │     └─ PainPointsTextarea
│  │
│  ├─ IF activeTab == "current-landscape"
│  │  └─ CurrentLandscapeTab
│  │     ├─ SystemsSection
│  │     │  ├─ TemplateLoader
│  │     │  └─ SystemCard[]
│  │     └─ ExternalSystemsSection
│  │        ├─ TemplateLoader
│  │        └─ ExternalSystemCard[]
│  │
│  ├─ IF activeTab == "proposed-solution"
│  │  └─ ProposedSolutionTab
│  │     ├─ PhasesSection
│  │     │  ├─ TemplateLoader
│  │     │  └─ PhaseCard[]
│  │     ├─ SystemsByPhaseSection
│  │     │  ├─ [For each phase]
│  │     │  │  ├─ "Add New System" button
│  │     │  │  ├─ TemplateModal
│  │     │  │  ├─ "Reuse from AS-IS" button
│  │     │  │  └─ SystemCard[]
│  │     └─ TOBEArchitectureDiagram
│  │        ├─ ExternalSystemsToggle
│  │        ├─ SystemNode[] (3 columns)
│  │        └─ IntegrationsList
│  │
│  ├─ IF activeTab == "process-mapping"
│  │  └─ Coming Soon Placeholder
│  │
│  └─ IF isGenerated == true
│     ├─ DiagramGenerator
│     │  ├─ Business Context Summary
│     │  ├─ Key Stakeholders
│     │  ├─ Required Capabilities
│     │  ├─ Pain Points
│     │  ├─ Legend
│     │  └─ Export Button
│     └─ [Edit] [Change Style] buttons
│
└─ Modals
   ├─ StyleSelector (when generating)
   └─ NewProjectModal (when creating)
```

---

## Data Type Relationships

```
ArchitectureProject
├── BusinessContextData
│   ├── BusinessEntity[]
│   │   ├── id
│   │   ├── name
│   │   ├── location
│   │   └── description
│   ├── Actor[]
│   │   ├── id
│   │   ├── name
│   │   ├── role
│   │   ├── department
│   │   ├── activities[]
│   │   └── entityId? → BusinessEntity
│   └── Capability[]
│       ├── id
│       ├── name
│       └── category
│
├── CurrentLandscapeData (AS-IS)
│   ├── CurrentSystem[]
│   │   ├── id
│   │   ├── name
│   │   ├── vendor
│   │   ├── version
│   │   ├── modules[]
│   │   ├── entityId? → BusinessEntity
│   │   └── status: "active" | "retiring" | "keep"
│   ├── Integration[]
│   │   ├── id
│   │   ├── name
│   │   ├── sourceSystemId → CurrentSystem
│   │   ├── targetSystemId → CurrentSystem
│   │   ├── method
│   │   ├── frequency
│   │   ├── dataType
│   │   └── direction: "one-way" | "two-way"
│   └── ExternalSystem[]
│       ├── id
│       ├── name
│       ├── type
│       ├── purpose
│       └── interface
│
├── ProposedSolutionData (TO-BE)
│   ├── Phase[]
│   │   ├── id
│   │   ├── name
│   │   ├── order
│   │   ├── scope: "in-scope" | "future"
│   │   ├── timeline
│   │   └── description
│   ├── ProposedSystem[]
│   │   ├── id
│   │   ├── name
│   │   ├── vendor
│   │   ├── modules[]
│   │   ├── phaseId → Phase
│   │   ├── isNew: boolean
│   │   └── reusedFromId? → CurrentSystem
│   ├── ProposedIntegration[]
│   │   ├── id
│   │   ├── name
│   │   ├── sourceSystemId → ProposedSystem | ExternalSystem
│   │   ├── targetSystemId → ProposedSystem | ExternalSystem
│   │   ├── method
│   │   └── phaseId → Phase
│   └── retainedExternalSystems: string[] → ExternalSystem[]
│
└── DiagramSettings
    ├── visualStyle: "clean" | "bold" | "gradient"
    ├── actorDisplay: "cards" | "tags"
    ├── layoutMode: "swim-lanes" | "grouped"
    ├── showLegend: boolean
    └── showIcons: boolean
```

---

## Template Categories Reference

### Business Context Templates
- Entities: Global Enterprise, Manufacturing, Retail, Financial Services
- Actors: C-Suite (6), EA Team (5), Business Leads (6), IT Teams (5), PMO (4), External (4)
- Capabilities: Finance (8), HCM (8), Supply Chain (8), Customer (8), Product (6), IT (8), Risk (6), Strategy (6)

### Current Landscape (AS-IS) Templates
- Systems: Legacy ERP (4), Point Solutions (4), Modern Cloud (4), Databases (4)
- External: Banking (3), Government (3), Supply Chain (3), E-Commerce (3)

### Proposed Solution (TO-BE) Templates
- Phases: Standard 4-phase roadmap (Foundation → Core → Extended → Future)
- Systems: SAP Modern (4), Oracle Modern (4), Microsoft Modern (4), Best-of-Breed (5), Digital (4)

---

## Key Color Codes

```
AS-IS Systems:
  ✓ ACTIVE  →  Blue badge
  ✗ RETIRING → Red badge
  ✓ KEEP    →  Green badge

TO-BE Systems:
  NEW systems    → Green borders/highlights
  REUSED systems → Blue borders/highlights
  
External Systems:
  All external   → Yellow/amber borders/highlights
  Selected      → Bold yellow highlight

Phases:
  IN SCOPE       → Green (with CheckCircle icon)
  FUTURE scope   → Orange (with Clock icon)

Capabilities (by category):
  Finance       → Blue
  HR            → Green
  Supply Chain  → Purple
  Customer      → Orange
  etc.
```

---

## Navigation States

```
INITIAL STATE
  ├─ isLoading = true
  ├─ currentProject = null/undefined
  └─ Show: HexLoader

LOADED STATE (No tabs clicked)
  ├─ activeTab = "business-context"
  ├─ isGenerated = false
  └─ Show: BusinessContextTab with input forms

GENERATED STATE (After user clicks Generate)
  ├─ activeTab = (any)
  ├─ isGenerated = true
  ├─ showStyleSelector = true
  └─ Show: StyleSelector modal

DIAGRAM VIEW STATE (After style selection)
  ├─ activeTab = (any)
  ├─ isGenerated = true
  ├─ showStyleSelector = false
  └─ Show: DiagramGenerator component
```

---

## Summary: Three Views Comparison

| Aspect | Business Context | Current Landscape | Proposed Solution |
|--------|-----------------|------------------|-------------------|
| **Phase** | A - Vision | B/C/D - Current | E/F - Future |
| **Scope** | Scope & Why | Reality Check | Strategy & Timeline |
| **Who enters** | Business sponsors | IT teams | Architects |
| **Color scheme** | Neutral + blue | Gray + status badges | Green/Blue/Yellow |
| **Key data** | Entities, Actors | Systems, Status | Phases, NEW vs REUSED |
| **Output** | Context diagram | AS-IS landscape | TO-BE roadmap |
| **Complexity** | Low | Medium | High (most complex) |

---

## Non-Obvious UX Elements to Watch

1. **Integration mode** - Click first system, then click second. No visual feedback!
2. **Reuse selector** - Uses `prompt()` dialog, very 1990s UX
3. **Phase loading** - Two buttons to load phases (unnecessary step)
4. **Capability colors** - Colors are assigned but not documented in UI
5. **Process Mapping tab** - Takes up space but has no functionality
6. **Generate button** - Only appears when data exists (implicit state)
7. **Template modals** - Various patterns, not consistent across tabs

These should be your focus for improvements!

