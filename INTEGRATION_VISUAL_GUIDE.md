# 🔄 Architecture Integration - Visual Guide & Quick Reference

---

## Data Flow Architecture

### Current State (Isolated)
```
┌──────────────────────────────────────────────┐
│         USER BROWSER SESSION                 │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Architecture Module (Standalone)      │  │
│  ├────────────────────────────────────────┤  │
│  │                                        │  │
│  │  Input: Form fields                   │  │
│  │    ↓                                   │  │
│  │  State: Zustand store                 │  │
│  │    ↓                                   │  │
│  │  Storage: localStorage                │  │
│  │         (key: "sap-rfp-architecture") │  │
│  │                                        │  │
│  │  ✗ No database persistence            │  │
│  │  ✗ No project linkage                 │  │
│  │  ✗ No collaboration                   │  │
│  │  ✗ Data lost on cache clear           │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘

Browser Cache (localStorage)
```

### Target State (Integrated)
```
┌──────────────────────────────────────────────────────────────┐
│         MULTI-USER PROJECT ENVIRONMENT                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          Project Context (User A)                      │  │
│  │    projectId = "550e8400-e29b-41d4-a716-446655440000" │  │
│  └──────────────┬─────────────────────────────────────────┘  │
│                 │                                             │
│        ┌────────┴─────────┐                                   │
│        │                  │                                   │
│        ▼                  ▼                                   │
│  ┌──────────────┐  ┌──────────────────┐                      │
│  │ Architecture │  │ Presales/Timeline│                      │
│  │   Store      │  │    Stores        │                      │
│  │ (enhanced)   │  │                  │                      │
│  └──────┬───────┘  └────────┬─────────┘                      │
│         │                   │                                 │
│         └───────┬───────────┘                                 │
│                 │                                             │
│         Auto-sync (30s intervals)                             │
│                 │                                             │
│                 ▼                                             │
│         ┌───────────────┐                                     │
│         │  API Routes   │                                     │
│         │  /api/projects│                                     │
│         │  [id]/arch    │                                     │
│         └───────┬───────┘                                     │
│                 │                                             │
│                 ▼                                             │
│    ┌────────────────────────┐                                │
│    │    PostgreSQL DB       │                                │
│    ├────────────────────────┤                                │
│    │ projects table         │                                │
│    │  • id (UUID)           │                                │
│    │  • architectureData    │                                │
│    │  • architectureVersion │                                │
│    │  • chips[]             │                                │
│    │  • phases[]            │                                │
│    │  • gantt[]             │                                │
│    └────────────────────────┘                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          Other Users (Can Access via Sharing)          │  │
│  │  User B, User C, User D → Same projectId               │  │
│  │  → Load latest architecture                            │  │
│  │  → See changes in real-time (or on refresh)            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT PAGE                             │
│            /project or /projects/[projectId]                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ProjectContext Provider                 │  │
│  │         {projectId, ownerId, status...}              │  │
│  │                                                      │  │
│  │  ┌─────────────────┐      ┌─────────────────────┐  │  │
│  │  │ Architecture    │      │ Presales/Timeline   │  │  │
│  │  │ Wizard Component│      │ Components          │  │  │
│  │  │                 │      │                     │  │  │
│  │  │ • Form inputs   │      │ • Chip parser       │  │  │
│  │  │ • 6 diagrams    │      │ • Timeline view     │  │  │
│  │  │ • Zoom/export   │      │ • Phase editor      │  │  │
│  │  │                 │      │                     │  │  │
│  │  │ Stores:         │      │ Stores:             │  │  │
│  │  │ architecture    │      │ presales-store      │  │  │
│  │  │ Store           │      │ timeline-store      │  │  │
│  │  │ (projectId)     │      │ (projectId)         │  │  │
│  │  └────────┬────────┘      └──────────┬──────────┘  │  │
│  │           │                         │             │  │
│  │           └──────────┬──────────────┘             │  │
│  │                      │                            │  │
│  │         ┌────────────▼──────────────┐             │  │
│  │         │  API Calls                │             │  │
│  │         ├────────────────────────────┤             │  │
│  │         │ GET /api/projects/[id]    │             │  │
│  │         │ PUT /api/projects/[id]    │             │  │
│  │         │ GET /api/projects/[id]    │             │  │
│  │         │     /architecture         │             │  │
│  │         │ PUT /api/projects/[id]    │             │  │
│  │         │     /architecture         │             │  │
│  │         │ POST .../snapshots        │             │  │
│  │         └────────────┬───────────────┘             │  │
│  └──────────────────────┼─────────────────────────────┘  │
│                         │                                 │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
                  ┌──────────────────┐
                  │   PostgreSQL     │
                  │   Database       │
                  └──────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id (UUID)      PRIMARY  │
│ email                   │
│ role                    │
│ ...                     │
└────────────┬────────────┘
             │
             │ ownerId (FK)
             │
             ▼
┌─────────────────────────────────────────┐
│        projects                         │
├─────────────────────────────────────────┤
│ id (UUID)              PRIMARY           │
│ ownerId (FK)           → users           │
│ name                                     │
│ status                                   │
│                                          │
│ *** NEW FIELDS ***                       │
│ architectureData       JSON              │
│ architectureVersion    INT (default: 0)  │
│ architectureUpdatedAt  TIMESTAMP         │
│                                          │
│ createdAt, updatedAt                     │
└────────┬──────────────────────────────────┘
         │
    ┌────┴─────────────┬──────────────┐
    │                  │              │
    ▼                  ▼              ▼
┌────────────┐  ┌──────────┐  ┌──────────────────┐
│  chips     │  │ phases   │  │architecture      │
│  (RFP)     │  │ (Timeline)  Snapshots     │
│            │  │          │  │ (NEW TABLE)      │
│ projectId  │  │projectId │  │ projectId (FK)   │
│ (FK)       │  │ (FK)     │  │ version          │
└────────────┘  └──────────┘  │ data (JSONB)     │
                                │ createdBy (FK)   │
                                │ createdAt        │
                                └──────────────────┘
    │
    └─────────────────┐
                      │ Can be prefilled from
                      │ chips data
                      │
              Architecture Data
              ├─ projectInfo
              ├─ actors[]
              ├─ externalSystems[]
              ├─ moduleAreas[]
              ├─ database
              ├─ integrationLayer
              ├─ interfaces[]
              ├─ environments[]
              ├─ infrastructure
              ├─ authMethods[]
              ├─ securityControls[]
              ├─ compliance
              ├─ phases[]
              └─ scalability
```

---

## State Management Flow

```
                    ┌──────────────────────┐
                    │   URL/Navigation     │
                    │  /project/[id]       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  useProjectStore()   │
                    │  - projectId         │
                    │  - mode              │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌────────────┐ ┌──────────┐ ┌──────────────┐
         │architecture│ │presales  │ │gantt-tool    │
         │Store       │ │Store     │ │Store         │
         │            │ │          │ │              │
         │projectId ✓ │ │projectId✓│ │projectId ✓   │
         │data        │ │chips[]   │ │projects[]    │
         │isDirty     │ │decisions │ │currentProj   │
         └────┬───────┘ └──────┬───┘ └──────┬───────┘
              │                 │            │
              └─────┬───────────┴────────────┘
                    │
         Auto-sync (useEffect)
         triggers PUT request
                    │
                    ▼
         ┌──────────────────────┐
         │  /api/projects/[id]  │
         │  /architecture       │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   PostgreSQL Store   │
         │   architectureData   │
         └──────────────────────┘
```

---

## User Journey

### Scenario: User Creates and Edits Architecture

```
1. User navigates to project
   └─ URL: /project or /projects/[projectId]
   └─ Session: authenticated with projectId

2. Project loads
   ├─ projectId set in multiple stores:
   │  ├─ useProjectStore.setProjectId()
   │  ├─ useArchitectureStore.setProjectId()
   │  ├─ usePresalesStore.setProjectId()
   │  └─ useTimelineStore.setProjectId()
   │
   └─ useArchitectureStore.loadProject()
      └─ API Call: GET /api/projects/[id]/architecture
         └─ Response: {data, version, updatedAt}
         └─ Store updated

3. User fills architecture form
   ├─ Step 1: System Context
   ├─ Step 2: Module Architecture
   ├─ Step 3: Integration
   ├─ Step 4: Deployment
   ├─ Step 5: Security
   └─ Step 6: Sizing

4. On each form change
   └─ useArchitectureStore.updateData()
   └─ set isDirty = true
   └─ Diagram preview updates immediately

5. Auto-save (every 30 seconds or on blur)
   ├─ Check if isDirty
   │
   ├─ YES: Call useArchitectureStore.saveProject()
   │  └─ API Call: PUT /api/projects/[id]/architecture
   │     ├─ Body: {data, version}
   │     ├─ Database optimistic lock check
   │     └─ Return: {version: incremented, updatedAt}
   │  └─ Store: isDirty = false, version updated
   │
   └─ NO: Skip

6. Snapshot creation (optional)
   └─ User clicks "Save Snapshot"
   └─ API Call: POST /api/projects/[id]/architecture/snapshots
      ├─ Body: {description}
      ├─ Creates architectureSnapshots entry
      └─ Response: {snapshotId}

7. Page refresh
   ├─ localStorage has cached projectId + data
   ├─ useArchitectureStore.loadProject()
   ├─ API fetches latest from DB
   └─ If conflict detected (version mismatch):
      ├─ Alert user of conflict
      ├─ Offer options: keep local, use server, merge
      └─ Resolve and re-save
```

---

## API Request/Response Examples

### Load Architecture
```javascript
// Request
GET /api/projects/550e8400-e29b-41d4-a716-446655440000/architecture
Header: Authorization: Bearer <token>

// Response 200 OK
{
  data: {
    projectInfo: {
      projectName: "SAP Finance Implementation",
      description: "Cloud-based..."
    },
    actors: [...],
    phases: [...],
    // ... all ArchitectureData fields
  },
  version: 5,
  updatedAt: "2025-11-11T14:30:00Z"
}

// Response 404
{ error: "Project not found" }

// Response 401
{ error: "Unauthorized" }
```

### Save Architecture
```javascript
// Request
PUT /api/projects/550e8400-e29b-41d4-a716-446655440000/architecture
Header: Authorization: Bearer <token>
Body: {
  data: {
    projectInfo: {...},
    actors: [...],
    // ... updated fields
  },
  version: 5  // Optimistic lock check
}

// Response 200 OK (Success)
{
  data: {...},
  version: 6,  // Incremented
  updatedAt: "2025-11-11T14:35:00Z"
}

// Response 409 Conflict
{
  error: "Version conflict",
  currentVersion: 6,  // Server's current version
  message: "Architecture was modified by another user"
}

// Response 403 Forbidden
{ error: "You don't have permission to edit this project" }
```

---

## Implementation Checklist

### ✅ Phase 1: Database (Week 1)
- [ ] Create Prisma migration file
- [ ] Add architectureData (JSON) to projects table
- [ ] Add architectureVersion (INT) to projects table
- [ ] Add architectureUpdatedAt (TIMESTAMP) to projects table
- [ ] Create architectureSnapshots table
- [ ] Run migration: `npx prisma migrate`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Test schema with `npx prisma studio`

### ✅ Phase 2: API Endpoints (Week 1-2)
- [ ] Create `/api/projects/[projectId]/architecture/route.ts`
  - [ ] GET endpoint (load)
  - [ ] PUT endpoint (save)
- [ ] Create `/api/projects/[projectId]/architecture/snapshots/route.ts`
  - [ ] GET endpoint (list)
  - [ ] POST endpoint (create)
- [ ] Create `/api/projects/[projectId]/architecture/snapshots/[snapshotId]/route.ts`
  - [ ] GET endpoint (fetch single)
  - [ ] POST restore endpoint
- [ ] Add authentication checks to all endpoints
- [ ] Test with Postman or API client
- [ ] Add error handling and logging

### ✅ Phase 3: Zustand Store (Week 2)
- [ ] Update architectureStore.ts interface:
  - [ ] Add projectId field
  - [ ] Add isDirty, isSaving, version, lastSavedAt fields
  - [ ] Add loadProject() method
  - [ ] Add saveProject() method
  - [ ] Add syncProject() method
  - [ ] Add setProjectId() method
  - [ ] Add createSnapshot() method
  - [ ] Add loadSnapshot() method
- [ ] Update persist middleware:
  - [ ] Add projectId to persisted fields
  - [ ] Keep localStorage key same
- [ ] Test store methods in isolation

### ✅ Phase 4: Component Updates (Week 2-3)
- [ ] Update DiagramWizard.tsx:
  - [ ] Use useParams() to get projectId
  - [ ] Call setProjectId() on mount
  - [ ] Add Save button with loading state
  - [ ] Add sync status indicator
  - [ ] Handle save errors with toast
- [ ] Update form components:
  - [ ] Add onBlur save trigger
  - [ ] Show unsaved indicator (*)
  - [ ] Prevent navigation if unsaved
- [ ] Add page wrapper for project context:
  - [ ] Provide projectId to all sub-components
  - [ ] Setup auto-sync interval (30s)
  - [ ] Handle offline scenarios

### ✅ Phase 5: Data Flow Integration (Week 3-4)
- [ ] Create presales → architecture converter:
  - [ ] Extract actors from chips
  - [ ] Extract systems from chips
  - [ ] Extract modules from chips
  - [ ] Test conversion
- [ ] Create architecture → timeline converter:
  - [ ] Map phases to timeline
  - [ ] Convert resources
  - [ ] Handle date calculations
  - [ ] Test conversion
- [ ] Create architecture → gantt converter:
  - [ ] Create GanttProject from architecture
  - [ ] Create GanttPhases from phases
  - [ ] Create GanttTasks from modules
  - [ ] Test conversion
- [ ] Link cross-module components:
  - [ ] Presales changes trigger architecture updates
  - [ ] Architecture changes propagate to timeline
  - [ ] Timeline changes reflected in Gantt

### ✅ Phase 6: Testing (Week 4-5)
- [ ] Unit tests:
  - [ ] Store methods (load, save, sync)
  - [ ] Converters (presales→arch, arch→timeline)
  - [ ] API error handling
- [ ] Integration tests:
  - [ ] Full save/load flow
  - [ ] Version conflict resolution
  - [ ] Snapshot creation and restore
  - [ ] Cross-module data flow
- [ ] E2E tests:
  - [ ] User creates architecture
  - [ ] User saves and refreshes
  - [ ] Multiple users editing same project
  - [ ] Offline edit and sync
- [ ] Performance tests:
  - [ ] Load time with large architectureData
  - [ ] Save latency
  - [ ] Auto-sync impact

### ✅ Phase 7: Deployment (Week 5)
- [ ] Code review and approval
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error logs and metrics
- [ ] Gather user feedback

---

## Key Decisions to Make

### Decision 1: Version Conflict Resolution
- [ ] **Option A:** Last-Write-Wins (simple, possible data loss)
- [ ] **Option B:** Optimistic Lock (version check, user retry)
- [ ] **Option C:** Operational Transformation (complex, real-time merge)
- [ ] **Option D:** Merge strategies (detect + merge changes)

**Recommendation:** Option B (balance of simplicity and safety)

### Decision 2: Auto-Save Frequency
- [ ] 5 seconds (very frequent, more API calls)
- [ ] 10 seconds (balanced)
- [ ] 30 seconds (less frequent, fewer API calls)
- [ ] Manual only (user explicitly clicks Save)

**Recommendation:** 30 seconds (good balance)

### Decision 3: Snapshot Strategy
- [ ] Manual snapshots only (user-initiated)
- [ ] Auto-snapshots every X saves
- [ ] Auto-snapshots every X minutes
- [ ] Both manual + auto

**Recommendation:** Manual snapshots with optional auto (let users decide)

### Decision 4: Offline Support
- [ ] Queue saves for later sync
- [ ] Conflict resolution when going online
- [ ] Prevent editing when offline
- [ ] Show warning when offline

**Recommendation:** Queue + auto-sync (transparent to user)

### Decision 5: URL Structure
- [ ] Keep separate: `/architecture` (standalone)
- [ ] Integrate: `/projects/[id]/architecture`
- [ ] Unified dashboard: `/projects/[id]` with tabs

**Recommendation:** `/projects/[id]/architecture` (consistent with Gantt)

---

## Success Metrics

### Adoption
- [ ] % of projects with architecture diagrams
- [ ] Average diagrams per project
- [ ] User retention in architecture module

### Performance
- [ ] Save latency < 500ms
- [ ] Load latency < 1000ms
- [ ] API error rate < 0.1%

### Reliability
- [ ] Zero data loss incidents
- [ ] Zero duplicate saves
- [ ] < 1% version conflicts

### User Satisfaction
- [ ] NPS score for module
- [ ] Feature request volume
- [ ] Bug report frequency

---

**This guide covers the complete integration strategy with visual representations, implementation checklist, and decision framework.**

