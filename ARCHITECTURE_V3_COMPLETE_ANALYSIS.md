# Architecture V3 Complete User Flow & Component Analysis

## Executive Summary

Architecture V3 is a **TOGAF-compliant enterprise architecture diagramming tool** that guides users through documenting a complete enterprise transformation. It implements the three critical views of enterprise architecture:

1. **Business Context** (Phase A: Architecture Vision) - WHY transform?
2. **Current Landscape AS-IS** (Phase B/C/D: Current State) - WHAT exists today?
3. **Proposed Solution TO-BE** (Phase E/F: Future State) - WHAT will we build and WHEN?

The tool focuses on making enterprise architecture accessible to non-architects through TOGAF templates and visual guidance.

---

## Complete User Journey: Step-by-Step

### Step 1: Entry & Project Selection (Initialization Phase)

**What happens:**
- User navigates to `/architecture/v3`
- Authentication check via NextAuth (redirects to `/login` if not authenticated)
- App initializes and loads existing projects from database

**Code flow:**
```typescript
// Page Load (page.tsx)
1. useGanttToolStore hook initializes with project data
2. If no project loaded:
   - Fetch all projects from DB
   - If projects exist: Auto-load most recent
   - If no projects: Create default project
3. Set initializing = false
4. Show main UI with GlobalNav + Tier2Header
```

**User sees:**
- Global navigation bar (top)
- Tier 2 header with project dropdown
- Four tabs: Business Context | Current Landscape | Proposed Solution | Process Mapping (coming soon)
- Initially on "Business Context" tab

---

### Step 2: Business Context Tab - Understanding Scope & Why

**Purpose:** Document organizational structure, key stakeholders, required capabilities, and pain points.

**TOGAF Alignment:** Phase A - Architecture Vision
- WHO: Entities (divisions, regions, subsidiaries)
- WHOM: Key actors (CFO, CIO, team leads)
- WHAT: Required capabilities (Finance, Supply Chain, HR, etc.)
- WHY: Pain points (bottlenecks, inefficiencies)

#### Sub-step 2a: Add Business Entities

**Features:**
- **View Mode Toggle:** Card view (3D cards) vs. List view (table)
- **Template Loader:** TOGAF entity templates
  - Global Enterprise (Multi-national)
  - Manufacturing Company
  - Retail Organization
  - Financial Services

**Each entity captures:**
```typescript
{
  id: string;
  name: string;
  location?: string;        // "USA/Canada", "Europe", etc.
  description?: string;     // Organization overview
}
```

**TOGAF Templates Example:**
- Global HQ → Executive oversight
- North America Region → Regional operations
- EMEA Region → European operations
- APAC Region → Asia Pacific operations

**UI Interaction:**
1. Click "Load TOGAF Entity Templates" button
2. Modal shows 4 organization types
3. Click template → Auto-populates entities into grid
4. Each entity in a card with delete button
5. Edit inline: name, location, description

**Design Note:** Cards show 3-column grid, auto-fills to fit container

---

#### Sub-step 2b: Add Key Actors & Activities

**Purpose:** Identify stakeholders and what they do

**TOGAF Templates (5 categories):**
1. **C-Suite & Executive Leadership**
   - CEO, CFO, COO, CIO, CTO, CDO
   - Each with role, department, activities

2. **Enterprise Architecture Team**
   - Chief Architect, Business Architect, Solution Architect, Data Architect, Security Architect
   - Focus on architecture governance and strategic planning

3. **Business Function Leads**
   - VP Finance, VP Operations, VP Sales, VP Marketing, VP HR, VP Supply Chain
   - Each with functional responsibilities

4. **IT & Digital Teams**
   - IT Director, Development Manager, Infrastructure Manager, Security Manager, Analytics Manager
   - Technical leadership roles

5. **External Stakeholders**
   - System Integrator Lead, Vendor Account Manager, Auditor, Regulator
   - Partner and external relations

**Actor data structure:**
```typescript
{
  id: string;
  name: string;              // "Chief Financial Officer"
  role: string;              // "Executive Leadership"
  department: string;        // "Finance"
  activities: string[];      // ["Financial strategy", "Risk management"]
  entityId?: string;         // Optional: which entity they belong to
}
```

**UI Interaction:**
1. Load TOGAF templates → 5 stakeholder groups appear
2. Click group → Actors auto-add to list
3. Each actor in a card with fields:
   - Name (required)
   - Role (required)
   - Department (required)
   - Activities (multi-line text, split by newlines)
4. Edit or delete individual actors
5. Grid layout: 4-column for cards (responsive)

**Design Detail:** Cards show first 3 activities in preview

---

#### Sub-step 2c: Add Required Capabilities

**Purpose:** Define what business capabilities the organization needs

**TOGAF Capability Domains (8 categories, 50+ capabilities):**
1. **Finance & Accounting** - Financial Planning, GL Management, AR/AP, Treasury
2. **Human Capital Management** - Recruitment, Learning, Payroll, Analytics
3. **Supply Chain Management** - Demand Planning, Procurement, Inventory, Logistics
4. **Customer Management** - CRM, Opportunity Mgmt, Quote Management
5. **Product & Service Management** - Product Development, PLM, Pricing
6. **IT Service Management** - Service Desk, Incident Mgmt, Change Mgmt
7. **Risk & Compliance** - Risk Management, Audit, Data Privacy
8. **Strategy & Governance** - Strategic Planning, Portfolio Mgmt, EA, Change Mgmt

**Capability data:**
```typescript
{
  id: string;
  name: string;              // "Financial Planning & Analysis"
  category?: string;         // "Finance & Accounting"
}
```

**UI Interaction:**
1. Click "Load TOGAF Templates"
2. Modal shows 8 capability domains
3. Click domain → All capabilities auto-add as tags
4. Capabilities display as colored tags (color by category)
5. Click tag to edit name inline
6. Delete capability via X button
7. Add custom capability manually

**Design Detail:**
- Tags are colored by category (Finance = blue, HR = green, etc.)
- Hovering over tag shows category tooltip
- Clicking tag enters edit mode with focused input

---

#### Sub-step 2d: Document Pain Points

**Purpose:** Articulate the WHY for transformation (motivation)

**UI:** Large textarea field
- Placeholder: "Describe current challenges, pain points, and motivation for change..."
- Free-form text
- Examples: "Manual consolidation takes 10 days", "Limited visibility into supply chain", etc.

**Trigger Generate Button:**
- "Generate Diagram" button appears only when data exists
- Button is primary color (blue)

---

### Step 3: Current Landscape Tab - Document AS-IS Architecture

**Purpose:** Document what systems exist TODAY

**TOGAF Alignment:** Phase B/C/D - Current Business Architecture & Technology Architecture

#### Sub-step 3a: Document Current Systems

**System data:**
```typescript
{
  id: string;
  name: string;              // "SAP ECC 6.0"
  vendor?: string;           // "SAP", "Oracle", "Custom", etc.
  version?: string;          // "ECC 6.0", "R12", "2012"
  modules: string[];         // ["FI", "CO", "MM", "SD"]
  entityId?: string;         // Optional: which entity uses this
  status: "active" | "retiring" | "keep"  // KEY: Signals intent
}
```

**TOGAF System Templates (4 categories, 16 systems):**

1. **Legacy ERP Systems**
   - SAP ECC 6.0 (FI, CO, MM, SD) - RETIRING
   - Oracle E-Business Suite (Financials, SCM, HR) - RETIRING
   - Dynamics AX 2012 - RETIRING
   - Infor LN - RETIRING

2. **Point Solutions**
   - Legacy CRM - RETIRING
   - Excel-based Planning - RETIRING
   - Legacy WMS - RETIRING
   - Standalone HR System (ADP) - KEEP

3. **Modern Cloud Systems**
   - Salesforce Lightning - KEEP
   - Workday HCM - KEEP
   - Concur Travel/Expense - KEEP
   - Coupa Procurement - KEEP

4. **Databases & Middleware**
   - Oracle Database 12c - KEEP
   - SQL Server 2019 - KEEP
   - MuleSoft ESB 4.x - KEEP
   - Legacy ETL Tool - RETIRING

**UI Interaction:**
1. Load system templates
2. Select category → Systems auto-add as cards
3. Each card shows:
   - Status badge (red=RETIRING, green=KEEP, blue=ACTIVE)
   - Name field (editable)
   - Vendor + Version in small fields
   - Modules as comma-separated list
   - Status dropdown selector
4. Delete card via Trash icon
5. Add blank system manually

**Key Feature:** Status selector (active/retiring/keep) - This is crucial for TO-BE planning!

---

#### Sub-step 3b: Document External System Dependencies

**Purpose:** Third-party and partner system integrations

**External system data:**
```typescript
{
  id: string;
  name: string;              // "Bank Payment Gateway"
  type: string;              // "Banking", "Government", "Partner"
  purpose: string;           // "Process payments and transfers"
  interface?: string;        // "SWIFT/ISO 20022", "REST API", "EDI"
}
```

**TOGAF Templates (4 categories, 11 systems):**

1. **Banking & Payment**
   - Bank Payment Gateway (SWIFT/ISO 20022)
   - Credit Card Processor (REST API)
   - Treasury System (SFTP)

2. **Government & Regulatory**
   - Tax Authority Portal (Web Portal)
   - Customs System (EDI)
   - Regulatory Reporting (SFTP)

3. **Supply Chain Partners**
   - Logistics Provider EDI (EDI X12)
   - Supplier Portal (Web Portal)
   - Distributor System (REST API)

4. **E-Commerce & Digital**
   - Payment Gateway (REST API)
   - E-Commerce Platform (API Integration)
   - Marketing Automation (REST API)

**UI Styling:** 
- Yellow/amber color scheme (different from internal systems)
- Cloud icon to indicate external nature
- Similar card layout to current systems

---

### Step 4: Proposed Solution Tab - Design TO-BE Architecture

**THIS IS THE MOST COMPLEX TAB** - Implements TOGAF Phases E/F (Opportunities & Solutions, Migration Planning)

**Purpose:** Design future state + plan phased implementation

#### Sub-step 4a: Define Implementation Phases

**Phase data:**
```typescript
{
  id: string;
  name: string;              // "Phase 1: Foundation & Quick Wins"
  order: number;             // 1, 2, 3...
  scope: "in-scope" | "future";  // IN SCOPE vs FUTURE
  timeline?: string;         // "Q1-Q2 2025"
  description?: string;      // Objectives and details
}
```

**TOGAF Phase Templates (4-phase standard roadmap):**

1. **Phase 1: Foundation & Quick Wins** (Q1-Q2 2025) - IN SCOPE
   - Deploy foundational systems
   - Minimal disruption
   - Quick ROI

2. **Phase 2: Core Transformation** (Q3-Q4 2025) - IN SCOPE
   - Major system replacements
   - Core business process transformation

3. **Phase 3: Extended Value** (Q1-Q2 2026) - IN SCOPE
   - Advanced capabilities
   - Analytics and optimization

4. **Phase 4: Future Scope** (2026+) - FUTURE
   - Innovation
   - AI/ML, advanced automation

**UI Interaction:**
1. Click "Load Standard Phases" → All 4 phases auto-populate
2. OR click "Add Custom Phase" → Add blank phase
3. Each phase in a card with:
   - Phase number icon (1, 2, 3, 4) with color (green=in-scope, orange=future)
   - Name field (editable)
   - Timeline field (editable)
   - Scope selector dropdown
   - Description textarea
4. Delete phase via Trash icon

**Visual Coding:**
- **IN SCOPE** phases: Green border, green badge with CheckCircle icon
- **FUTURE** phases: Orange border, orange badge with Clock icon

---

#### Sub-step 4b: Assign Systems to Phases

**Key insight:** This is where the TO-BE architecture takes shape!

**System data in TO-BE:**
```typescript
{
  id: string;
  name: string;
  vendor?: string;
  modules: string[];
  phaseId: string;           // Which phase this belongs to
  isNew: boolean;            // true = NEW system, false = REUSED from AS-IS
  reusedFromId?: string;     // If reused, which AS-IS system ID
}
```

**Two ways to add systems:**

1. **Add New System** button
   - Opens modal with future system templates
   - TOGAF Future Systems (5 categories, 20 systems):
     - **Modern ERP - SAP**: S/4HANA Cloud, Analytics Cloud, Ariba, SuccessFactors
     - **Modern ERP - Oracle**: Fusion Cloud ERP, Fusion Cloud HCM, Fusion Cloud SCM, Analytics Cloud
     - **Modern ERP - Microsoft**: Dynamics 365 Finance, Supply Chain, HR, Power BI
     - **Best-of-Breed Cloud**: Salesforce, Workday, ServiceNow, Coupa, Anaplan
     - **Digital & Analytics**: Snowflake, Tableau, Power Platform, Informatica Cloud

   - Select template category → Systems auto-add to selected phase
   - OR add blank system

2. **Reuse from AS-IS** button
   - Shows dropdown of systems marked as "KEEP" in current landscape
   - Click → System added to this phase marked as REUSED
   - Fields are read-only (disabled)
   - Shows info badge: "Reused from Current Landscape (AS-IS)"

**UI Layout:**
- Phases displayed in horizontal timeline
- Each phase has its own systems grid below
- Systems show:
  - **NEW systems**: Green indicator + border
  - **REUSED systems**: Blue indicator + border

---

#### Sub-step 4c: Build TO-BE Integration Architecture

**Purpose:** Show which systems integrate with each other in the future state

**Integration data:**
```typescript
{
  id: string;
  name: string;
  sourceSystemId: string;
  targetSystemId: string;
  method: string;            // "API", "SFTP", "EDI", etc.
  phaseId: string;           // Which phase this belongs to
}
```

**Interface:**
1. **Instructions panel** (blue info box):
   - "How to build your TO-BE architecture:"
   - Review all systems (NEW and REUSED from AS-IS)
   - Select external systems to retain in TO-BE
   - Click a system to start drawing integration
   - Click another system to complete integration

2. **External Systems Selection**:
   - Toggles for which external systems to keep
   - Selected ones show with yellow highlight
   - These are the ones from current landscape you want to retain

3. **Architecture Diagram** (3-column grid):
   - **LEFT**: NEW Systems (green)
   - **CENTER**: REUSED from AS-IS Systems (blue)
   - **RIGHT**: EXTERNAL Systems (yellow)
   
   - Each system is a clickable node
   - Click system 1 → it highlights
   - Click system 2 → integration created
   - Shows helper message: "Integration Mode: Click another system or click same to cancel"

4. **Integrations List** (below diagram):
   - All created integrations shown in list format
   - Each shows: System A → System B (METHOD)
   - Delete button for each integration

**Non-Intuitive Elements:**
- Integration mode activation is implicit (click first system)
- No visual arrows drawn (just list of integrations)
- Can't edit integration details after creation (only delete/recreate)

---

### Step 5: Style Selection (Before Diagram Generation)

**Purpose:** Choose visual presentation before generating diagram

**When:** User clicks "Generate Diagram" button on any tab → StyleSelector modal opens

**Available Selections:**

**1. Visual Style (3 options):**
- **Clean & Modern**: Subtle shadows, rounded corners (light gray/white)
- **Bold & Flat**: High contrast, bold colors, flat design (navy blue)
- **Premium & Gradient**: Glossy gradients, polished (purple gradient)

**2. Actor Display (2 options):**
- **Detailed Cards**: Full cards with role, department, activities
- **Simple Tags**: Compact tags with name and role only

**3. Layout Mode (2 options):**
- **Swim Lanes**: Separate section for each business entity
- **Grouped Grid**: All systems in one grid, tagged by entity

**4. Additional Options (checkboxes):**
- Show legend
- Show icons

**UI:** Modal with 4 sections, preview examples for each style

**Data structure:**
```typescript
{
  visualStyle: "clean" | "bold" | "gradient";
  actorDisplay: "cards" | "tags";
  layoutMode: "swim-lanes" | "grouped";
  showLegend: boolean;
  showIcons: boolean;
}
```

---

### Step 6: Diagram Generation & Display

**What happens:**
1. User selects style → clicks "Generate Diagram"
2. Page switches to DiagramGenerator component
3. Shows custom-rendered diagram with selected style

**Diagram Content (if data exists):**

**Section 1: Business Context Summary**
- Entities displayed as styled boxes (color by visual style)
- Each shows: Name, Location

**Section 2: Key Stakeholders**
- If "cards" display: Grid of cards with name, role, department, activities
- If "tags" display: Flex row of compact tags

**Section 3: Required Capabilities**
- Blue tags showing capability name
- Capabilities grouped by category internally

**Section 4: Pain Points & Motivation**
- Orange box showing full pain points text

**Section 5: Legend (if enabled)**
- Shows selected visual style and layout mode

**Action buttons:**
- ← Back to Edit (returns to tab editing mode)
- Change Style (re-opens style selector)
- Export to PDF / PowerPoint (not yet implemented)

---

### Step 7: Process Mapping Tab (Coming Soon)

**Placeholder message:**
- Title: "Process Mapping Canvas (Coming Soon)"
- Description: "This optional canvas will allow you to map business processes with flowcharts, swimlanes, and workflow diagrams - perfect for documenting AS-IS and TO-BE processes."
- Feature preview: "Planned Features: Drag-and-drop process nodes, swimlane diagrams, status flows, system integrations, role assignments, and workflow automation mapping"

---

## Component Architecture

### File Structure
```
src/app/architecture/v3/
├── page.tsx                          # Main page component
├── types.ts                          # All TypeScript interfaces
├── styles.module.css                 # Page-level styles
├── layout.tsx                        # Auth layout (inherited)
└── components/
    ├── BusinessContextTab.tsx
    ├── business-context-tab.module.css
    ├── CurrentLandscapeTab.tsx
    ├── current-landscape-tab.module.css
    ├── ProposedSolutionTab.tsx
    ├── proposed-solution-tab.module.css
    ├── DiagramGenerator.tsx
    └── StyleSelector.tsx
```

### Main Page Component (page.tsx)

**Responsibilities:**
- Project initialization and loading
- Tab state management
- Data state management for all 3 tabs
- Modal state for style selector and new project
- Global navigation rendering

**Key hooks:**
```typescript
const { currentProject, projects, fetchProjects, loadProject, createProject, updateProjectName, isLoading } 
  = useGanttToolStore();
```

**State variables:**
```typescript
const [initializing, setInitializing] = useState(true);
const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
const [activeTab, setActiveTab] = useState<Tab>("business-context");
const [version, setVersion] = useState("v1.0");
const [isGenerated, setIsGenerated] = useState(false);
const [showStyleSelector, setShowStyleSelector] = useState(false);

// Data for 3 tabs
const [businessContext, setBusinessContext] = useState<BusinessContextData>({...});
const [currentLandscape, setCurrentLandscape] = useState<CurrentLandscapeData>({...});
const [proposedSolution, setProposedSolution] = useState<ProposedSolutionData>({...});
const [diagramSettings, setDiagramSettings] = useState<DiagramSettings>({...});
```

**Flow control:**
```typescript
if (isGenerated) {
  // Show DiagramGenerator component
  // Offer: Edit button (back to tabs) + Change Style button
} else {
  // Show selected tab component
  // Each tab has Generate button
}
```

---

### Tab Components

Each tab component follows same pattern:

**Props interface:**
```typescript
interface [Tab]Props {
  data: [Tab]Data;
  onChange: (data: [Tab]Data) => void;
  onGenerate: () => void;
  // Plus additional props (entities from other tabs, etc.)
}
```

**Structure:**
```typescript
export function [Tab]({ data, onChange, onGenerate }) {
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Handlers for CRUD operations
  const add = () => { ... };
  const update = (id, updates) => { ... };
  const remove = (id) => { ... };
  const loadTemplate = (categoryName, items) => { ... };
  
  // Check if data exists to show Generate button
  const hasData = ...;
  
  return (
    <div className={styles.container}>
      {/* Template selector with modal */}
      {/* Section: Title + Subtitle */}
      {/* Add/Edit/Remove functionality */}
      {/* Generate button if hasData */}
    </div>
  );
}
```

---

### Shared UI Patterns

**Section Component:**
```typescript
function Section({ 
  title: string, 
  subtitle?: string, 
  children 
}) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {subtitle && <p className={styles.sectionDescription}>{subtitle}</p>}
      {children}
    </div>
  );
}
```

**Template Loader Pattern:**
```typescript
{showTemplates && (
  <div style={{ /* modal styling */ }}>
    <h4>Select Template Category</h4>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
      {Object.entries(TEMPLATE_MAP).map(([name, items]) => (
        <button onClick={() => loadTemplate(name, items)}>
          {name}
          <div>{items.length} items</div>
        </button>
      ))}
    </div>
  </div>
)}
```

**Card Component Pattern:**
```typescript
function [Type]Card({ item, onUpdate, onRemove }) {
  return (
    <div className={styles.card}>
      <button onClick={onRemove} className={styles.iconButton}>
        <Trash2 /> {/* Delete button */}
      </button>
      {/* Input fields for each property */}
      <input 
        value={item.name} 
        onChange={(e) => onUpdate({ name: e.target.value })} 
      />
    </div>
  );
}
```

---

## What "TO-BE Process" Means in This Tool

The **"TO-BE" (To Be)** architecture refers to the **future state** of the organization's IT systems.

### AS-IS vs. TO-BE Concept

**AS-IS (Current State):**
- What systems exist TODAY
- Example: "We have SAP ECC 6.0, legacy CRM, Excel planning"
- Color: Gray/neutral (systems marked with status)

**TO-BE (Future State):**
- What systems we WILL HAVE after transformation
- Organized by implementation PHASES
- What's NEW vs. what we REUSE from AS-IS
- Color: Green (new) + Blue (reused) + Yellow (external)

### Migration Strategy Visualization

The TO-BE tab shows a **migration strategy** not just a target state:

```
Phase 1 (Q1 2025): Foundation
├── NEW: Salesforce CRM
├── NEW: Workday HCM
└── REUSED: Oracle Database (from AS-IS)

Phase 2 (Q3 2025): Core ERP
├── NEW: SAP S/4HANA Finance
├── NEW: SAP S/4HANA Supply Chain
└── RETIRE: SAP ECC 6.0 (was in AS-IS)

Phase 3 (2026+): Analytics
├── NEW: Snowflake Data Cloud
├── NEW: Tableau Analytics
└── KEEP: Retained external bank gateway
```

### Key Distinctions

1. **Systems are phased**: Not all deployed at once
2. **Reuse decisions**: Explicitly mark systems to keep from AS-IS
3. **Integration points**: Show how NEW and REUSED systems connect
4. **External dependencies**: Show which external systems continue

---

## UI/UX Observations & Design Philosophy

### Strengths

1. **TOGAF Templates Everywhere**
   - Don't start from scratch
   - Pre-populated with realistic enterprise options
   - Dramatically reduces cognitive load

2. **Clear Visual Hierarchy**
   - Tabs separate concerns perfectly
   - Each tab has single responsibility
   - Status badges (ACTIVE/RETIRING/KEEP) are clear

3. **Multiple Display Modes**
   - Card view vs. List view
   - Allows different workflows

4. **Color Coding**
   - AS-IS systems: Gray/neutral with status badges
   - TO-BE NEW: Green
   - TO-BE REUSED: Blue
   - TO-BE EXTERNAL: Yellow
   - Very scannable

5. **Responsive Design**
   - CSS modules with Mobile-first approach
   - Grid layouts responsive
   - Tab buttons responsive

### Confusing/Non-Intuitive Elements

1. **Integration Drawing**
   - Not immediately obvious how to create integrations
   - Click first system → implicit mode activation
   - No visual feedback (arrows) to see integrations
   - Only see in text list below

2. **Reuse Systems UX**
   - Uses `prompt()` dialog instead of nice UI selector
   - User must manually select from numbered list
   - Very Web 1.0 feeling compared to rest of UI

3. **Phase Templates Loading**
   - Button says "Load Standard Phases"
   - Opens info box with another "Load 4 Standard Phases" button
   - Two-step process when could be one-click

4. **Capability Category Colors**
   - Category colors defined but hard to discover
   - No visual legend of what each color means
   - Hover tooltip only shows category name

5. **Generate Button Visibility**
   - "Generate Diagram" only appears when data exists
   - First time user might not know how to proceed
   - No "ready to generate" message

6. **Process Mapping Tab**
   - Completely empty placeholder
   - Takes up tab space and confuses users
   - Could be "hidden" or labeled clearly as "Coming Soon"

---

## Navigation & State Management

### Tab Navigation
```
User clicks tab → setActiveTab(tabName)
→ Conditional render of Tab component
→ Pass data, onChange, onGenerate props
```

### Data Flow (One-way binding)
```
Parent (page.tsx) has state
  ↓
Pass to child tab as props
  ↓
Child tab calls onChange callback
  ↓
Parent updates state
  ↓
Child re-renders with new data
```

### Project Management
- Uses `useGanttToolStore` (Zustand store)
- Auto-loads most recent project on mount
- Can switch projects via Tier2Header dropdown
- NewProjectModal allows creation

### Modal Stack
1. **StyleSelector** - For selecting diagram appearance
2. **NewProjectModal** - For creating new projects
3. **System template selector** - In tabs (inline modals)

---

## Design System Integration

### CSS Approach
- **Module CSS** for component-scoped styles
- **Inline styles** for dynamic/dynamic properties
- **CSS Variables** from design tokens
- **Tailwind utility classes** (minimal usage)

### Color Palette
- **Primary**: #2563A5 (buttons, accents)
- **Success**: #4CAF50 (green for NEW and IN-SCOPE)
- **Warning**: #FFC107 (yellow for external systems)
- **Error**: #FF9500 (orange for FUTURE scope)
- **Neutral**: #f5f5f5 - #ffffff (backgrounds)

### Typography
- **Display**: Design system's display font
- **Body**: Design system's text font
- **Sizes**: 12px (labels) → 16px (titles) → 24px (headers) → 28px (main title)

### Spacing
- **Grid gap**: 12px, 16px, 24px, 32px
- **Padding**: 12px, 16px, 20px, 24px, 32px
- **Responsive**: Scales down on mobile

### Shadows
```css
/* Light */
box-shadow: 0 2px 8px rgba(0,0,0,0.1);

/* Heavier */
box-shadow: 0 20px 60px rgba(0,0,0,0.3);
```

### Border Radius
- **Buttons**: 6-8px
- **Cards**: 8-12px
- **Modals**: 12px

---

## Potential Improvements

### High Priority (UX Issues)
1. **Fix reuse system selector**
   - Replace `prompt()` with nice dropdown modal
   - Show preview of system being reused
   
2. **Integration drawing UX**
   - Add visual arrows or connection lines
   - Show connection feedback during drawing
   - Visual connection list (not just text)

3. **Capability legend**
   - Add visual legend showing color → category mapping
   - Include in diagram output

4. **Process Mapping Tab**
   - Either implement or move to separate "Coming Soon" area
   - Or enable it fully if it's important

### Medium Priority (Polish)
1. **Loading states**
   - Show skeleton loaders for templates
   - Indicate when data is saving

2. **Validation**
   - Warn if removing systems still referenced in integrations
   - Require phase name/timeline

3. **Undo/Redo**
   - Currently no way to undo accidental deletions

4. **Diagram export**
   - "Export to PDF/PowerPoint" button non-functional
   - Would dramatically increase value

5. **Integrations display**
   - Show integration count in phase headers
   - Visual representation of integration density

### Low Priority (Nice to have)
1. **Advanced features**
   - Bulk import from CSV
   - API integrations with external architecture tools
   - Comparison mode (AS-IS vs. TO-BE side-by-side)

2. **Collaboration**
   - Comments/annotations
   - Version history
   - Change tracking

3. **Advanced styling**
   - Custom colors per system
   - Custom icons
   - Branding options

---

## Code Quality Observations

### Strengths
- **TypeScript**: Fully typed, strict mode
- **Component composition**: Clear separation of concerns
- **Props drilling**: Minimal (only 2-3 levels)
- **Event handling**: Consistent patterns
- **Template architecture**: DRY with reusable template objects

### Areas for improvement
- **Inline styles**: Lots of style prop usage instead of CSS classes
- **Magic numbers**: 280px, minmax, gap sizes scattered
- **Modal patterns**: Could extract to reusable Modal component
- **Form validation**: No validation, just state updates
- **Error handling**: No error boundaries or error states visible

---

## Complete Type System

```typescript
// BUSINESS CONTEXT
interface BusinessEntity {
  id: string;
  name: string;
  location?: string;
  description?: string;
}

interface Actor {
  id: string;
  name: string;
  role: string;
  department: string;
  activities: string[];
  entityId?: string;
}

interface Capability {
  id: string;
  name: string;
  category?: string;
}

interface BusinessContextData {
  entities: BusinessEntity[];
  actors: Actor[];
  capabilities: Capability[];
  painPoints: string;
}

// CURRENT LANDSCAPE (AS-IS)
interface CurrentSystem {
  id: string;
  name: string;
  vendor?: string;
  version?: string;
  modules: string[];
  entityId?: string;
  status?: "active" | "retiring" | "keep";
}

interface Integration {
  id: string;
  name: string;
  sourceSystemId: string;
  targetSystemId: string;
  method: string;
  frequency?: string;
  dataType?: string;
  direction: "one-way" | "two-way";
}

interface ExternalSystem {
  id: string;
  name: string;
  type: string;
  purpose: string;
  interface?: string;
}

interface CurrentLandscapeData {
  systems: CurrentSystem[];
  integrations: Integration[];
  externalSystems: ExternalSystem[];
}

// PROPOSED SOLUTION (TO-BE)
interface Phase {
  id: string;
  name: string;
  order: number;
  scope: "in-scope" | "future";
  timeline?: string;
  description?: string;
}

interface ProposedSystem {
  id: string;
  name: string;
  vendor?: string;
  modules: string[];
  phaseId: string;
  isNew: boolean;
  reusedFromId?: string;
}

interface ProposedIntegration {
  id: string;
  name: string;
  sourceSystemId: string;
  targetSystemId: string;
  method: string;
  phaseId: string;
}

interface ProposedSolutionData {
  phases: Phase[];
  systems: ProposedSystem[];
  integrations: ProposedIntegration[];
  retainedExternalSystems: string[];
}

// DIAGRAM SETTINGS
type VisualStyle = "clean" | "bold" | "gradient";
type ActorDisplay = "cards" | "tags";
type LayoutMode = "swim-lanes" | "grouped";

interface DiagramSettings {
  visualStyle: VisualStyle;
  actorDisplay: ActorDisplay;
  layoutMode: LayoutMode;
  showLegend: boolean;
  showIcons: boolean;
}

// COMPLETE PROJECT
interface ArchitectureProject {
  id: string;
  name: string;
  version: string;
  lastSaved: string;
  businessContext: BusinessContextData;
  currentLandscape: CurrentLandscapeData;
  proposedSolution: ProposedSolutionData;
  diagramSettings: DiagramSettings;
}
```

---

## Key Takeaways

1. **Three Views Philosophy**
   - Business Context: WHY? (Scope & motivation)
   - Current Landscape: WHAT EXISTS? (Technical reality)
   - Proposed Solution: WHAT/WHEN? (Future state + roadmap)

2. **Templates Drive Usage**
   - Pre-filled TOGAF-aligned options
   - Massive time saver
   - Increases quality of output

3. **Status Tracking**
   - Systems marked as RETIRING/KEEP/ACTIVE
   - Drives TO-BE planning
   - Shows transformation strategy

4. **Phased Implementation**
   - Not just target state, but migration path
   - Shows IN SCOPE vs. FUTURE
   - Realistic enterprise transformation planning

5. **Color-Coded Architecture**
   - Easy to scan and understand
   - Professional presentation
   - Support for different visual styles

6. **TOGAF Compliance**
   - Implements proper EA methodology
   - Professional output
   - Auditable transformation plan

This is enterprise architecture for mortals - making complex enterprise transformation planning accessible and intuitive!

