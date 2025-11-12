# 🔗 Architecture Module Integration Strategy

**Date:** November 11, 2025
**Status:** Strategy Document (Ready for Implementation)
**Goal:** Link Architecture module with existing project system using projectId

---

## Executive Summary

The Architecture module is currently **standalone** (localStorage only). We need to integrate it with the existing **projects** table to:
1. ✅ Save/load architecture diagrams per project
2. ✅ Link with presales chips, timeline, and Gantt data
3. ✅ Enable multi-user collaboration
4. ✅ Maintain version history
5. ✅ Support export/sharing

---

## Current State vs. Target State

### Current (Before Integration)
```
┌─────────────────────────────────────────────────────┐
│        Architecture Module (ISOLATED)               │
├─────────────────────────────────────────────────────┤
│ Data Storage: localStorage only                     │
│ State: architectureStore (Zustand)                  │
│ Key: "sap-rfp-architecture-storage" (hardcoded)     │
│ Scope: Single browser instance                      │
│ Persistence: None (browser cache dependent)         │
│ Collaboration: Not supported                        │
│ Sharing: Not possible                               │
└─────────────────────────────────────────────────────┘
```

### Target (After Integration)
```
┌──────────────────────────────────────────────────────────────┐
│          Architecture Module (INTEGRATED)                    │
├──────────────────────────────────────────────────────────────┤
│ Data Storage: projects.architectureData (PostgreSQL)         │
│ State: architectureStore (enhanced with projectId)           │
│ Key: projectId (UUID from projects table)                    │
│ Scope: Multi-user, cross-device                              │
│ Persistence: Cloud database + localStorage cache             │
│ Collaboration: Via shared projectId                          │
│ Sharing: Via existing share mechanism                        │
│                                                               │
│ Linked Entities:                                              │
│ • Project (owner, status, metadata)                          │
│ • Chips (presales data)                                      │
│ • Phases (timeline)                                          │
│ • GanttProject (project planning)                            │
│ • Comments (collaboration)                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### PHASE 1: Database Schema Updates

#### 1A. Extend `projects` Table
```prisma
model projects {
  // Existing fields
  id                  String    @id @default(uuid())
  ownerId             String
  name                String
  status              Status    // DRAFT | IN_REVIEW | APPROVED | ARCHIVED

  // NEW: Architecture Data
  architectureData    Json?                // Store ArchitectureData object
  architectureVersion Int       @default(0) // Version tracking
  architectureUpdatedAt DateTime?           // Last modified timestamp

  // Existing relationships
  owner               users     @relation(fields: [ownerId], references: [id])
  chips               chips[]
  phases              phases[]
  resources           resources[]
  comments            comments[]
  snapshots           snapshots[]
  shares              shares[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

#### 1B. Create `architectureSnapshots` Table (Optional but Recommended)
```prisma
model architectureSnapshots {
  id                String   @id @default(uuid())
  projectId         String
  project           projects @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Snapshot data
  data              Json     // Full ArchitectureData at this point in time
  version           Int      // Incremental version
  createdAt         DateTime @default(now())
  createdBy         String   // User ID who created snapshot
  creatorUser       users    @relation(fields: [createdBy], references: [id])

  // Metadata
  description       String?  // User-provided snapshot description
  changedFields     String[] // Which fields changed (delta tracking)

  @@index([projectId])
  @@index([createdAt])
}
```

**Migration SQL:**
```sql
ALTER TABLE projects ADD COLUMN architectureData JSONB;
ALTER TABLE projects ADD COLUMN architectureVersion INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN architectureUpdatedAt TIMESTAMP;

CREATE TABLE architectureSnapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  version INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  createdBy UUID NOT NULL REFERENCES users(id),
  description TEXT,
  changedFields TEXT[]
);

CREATE INDEX idx_architecture_snapshots_projectId ON architectureSnapshots(projectId);
CREATE INDEX idx_architecture_snapshots_createdAt ON architectureSnapshots(createdAt);
```

---

### PHASE 2: Zustand Store Integration

#### 2A. Enhanced `architectureStore.ts`
```typescript
// BEFORE (current)
interface ArchitectureState {
  data: Partial<ArchitectureData>
  currentStep: number
}

// AFTER (enhanced)
interface ArchitectureState {
  // Identity
  projectId: string | null        // NEW: Links to projects table

  // Data
  data: Partial<ArchitectureData>
  currentStep: number

  // Metadata
  isDirty: boolean                // NEW: Has unsaved changes
  isSaving: boolean               // NEW: Currently saving
  version: number                 // NEW: DB version tracking
  lastSavedAt: Date | null        // NEW: Last successful save

  // Actions
  loadProject: (projectId: string) => Promise<void>           // NEW
  saveProject: () => Promise<void>                            // NEW
  syncProject: () => Promise<void>                            // NEW
  setProjectId: (projectId: string) => void                   // NEW
  createSnapshot: (description: string) => Promise<void>     // NEW
  loadSnapshot: (snapshotId: string) => Promise<void>        // NEW

  // Existing actions
  updateData: (data: Partial<ArchitectureData>) => void
  setStep: (step: number) => void
  reset: () => void
}

// Store definition
export const useArchitectureStore = create<ArchitectureState>()(
  persist(
    (set, get) => ({
      projectId: null,
      data: {},
      currentStep: 0,
      isDirty: false,
      isSaving: false,
      version: 0,
      lastSavedAt: null,

      // NEW implementation
      loadProject: async (projectId: string) => {
        try {
          set({ isSaving: true })
          const response = await fetch(`/api/projects/${projectId}/architecture`)
          const { data, version } = await response.json()
          set({
            projectId,
            data,
            version,
            isDirty: false,
            lastSavedAt: new Date(),
          })
        } catch (error) {
          console.error('Failed to load architecture:', error)
        } finally {
          set({ isSaving: false })
        }
      },

      saveProject: async () => {
        const { projectId, data, version } = get()
        if (!projectId) return

        try {
          set({ isSaving: true })
          const response = await fetch(`/api/projects/${projectId}/architecture`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, version }),
          })

          if (!response.ok) throw new Error('Save failed')

          const { version: newVersion } = await response.json()
          set({
            version: newVersion,
            isDirty: false,
            lastSavedAt: new Date(),
          })
        } catch (error) {
          console.error('Failed to save architecture:', error)
          throw error
        } finally {
          set({ isSaving: false })
        }
      },

      syncProject: async () => {
        const { isDirty } = get()
        if (isDirty) {
          await get().saveProject()
        }
      },

      setProjectId: (projectId: string) => {
        set({ projectId })
        get().loadProject(projectId)
      },

      // ... snapshot methods
    }),
    {
      name: 'architecture-storage', // localStorage key
      partialize: (state) => ({
        projectId: state.projectId,
        data: state.data,
        currentStep: state.currentStep,
        version: state.version,
      }),
    }
  )
)
```

#### 2B. Subscribe to Project Context
```typescript
// In project page or layout
import { useProjectStore } from '@/stores/project-store'
import { useArchitectureStore } from '@/stores/architectureStore'

export function ProjectPage() {
  const projectId = useProjectStore((s) => s.projectId)
  const { setProjectId, syncProject } = useArchitectureStore()

  // Load architecture when project changes
  useEffect(() => {
    if (projectId) {
      setProjectId(projectId)
    }
  }, [projectId, setProjectId])

  // Auto-save on interval
  useEffect(() => {
    const interval = setInterval(() => {
      syncProject()
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [syncProject])
}
```

---

### PHASE 3: API Endpoints

#### 3A. New Endpoints Structure
```
GET    /api/projects/[projectId]/architecture
       → Fetch architecture for project

PUT    /api/projects/[projectId]/architecture
       → Save/update architecture

POST   /api/projects/[projectId]/architecture/snapshots
       → Create snapshot

GET    /api/projects/[projectId]/architecture/snapshots
       → List snapshots

GET    /api/projects/[projectId]/architecture/snapshots/[snapshotId]
       → Fetch specific snapshot

POST   /api/projects/[projectId]/architecture/snapshots/[snapshotId]/restore
       → Restore from snapshot
```

#### 3B. Implementation Example: `api/projects/[projectId]/architecture/route.ts`

```typescript
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authConfig)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const project = await prisma.projects.findFirst({
      where: {
        id: params.projectId,
        ownerId: session.user.id, // Or check shares/permissions
      },
    })

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    return Response.json({
      data: project.architectureData || {},
      version: project.architectureVersion,
      updatedAt: project.architectureUpdatedAt,
    })
  } catch (error) {
    console.error('Error fetching architecture:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authConfig)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, version } = await request.json()

  try {
    const project = await prisma.projects.findFirst({
      where: {
        id: params.projectId,
        ownerId: session.user.id,
      },
    })

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Optimistic locking: check version
    if (version && project.architectureVersion !== version) {
      return Response.json(
        { error: 'Version conflict', currentVersion: project.architectureVersion },
        { status: 409 }
      )
    }

    const updated = await prisma.projects.update({
      where: { id: params.projectId },
      data: {
        architectureData: data,
        architectureVersion: {
          increment: 1,
        },
        architectureUpdatedAt: new Date(),
      },
    })

    return Response.json({
      data: updated.architectureData,
      version: updated.architectureVersion,
      updatedAt: updated.architectureUpdatedAt,
    })
  } catch (error) {
    console.error('Error saving architecture:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

### PHASE 4: Data Flow Integration

#### Existing Data Flow (Before)
```
RFP Text Input
    ↓
presales-store (chips)
    ↓
timeline-store (phases)
    ↓
GanttProject (planning)
```

#### New Data Flow (After)
```
┌─────────────────────────────────────────────────────┐
│           User Creates Project                       │
│           (projects table, UUID)                     │
└──────────────┬──────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │  projectId  │
        └──────┬──────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ Architecture│  │ Presales/Timeline│
│   Store     │  │     Stores       │
│ (projectId) │  │   (projectId)    │
└──────┬──────┘  └─────────┬────────┘
       │                   │
       │ Linked via        │
       │ projectId         │
       │                   │
       └───────┬───────────┘
               │
               ▼
        ┌─────────────┐
        │   projects  │
        │    table    │
        │             │
        │ • chips[]   │
        │ • phases[]  │
        │ • archData  │
        │ • gantt[]   │
        └─────────────┘
               │
               ▼
        ┌─────────────┐
        │  Database   │
        │ PostgreSQL  │
        └─────────────┘
```

---

### PHASE 5: Component Integration

#### Modified DiagramWizard
```typescript
'use client'

import { useParams } from 'next/navigation'
import { useArchitectureStore } from '@/stores/architectureStore'
import { useEffect } from 'react'

export function DiagramWizard() {
  const params = useParams()
  const projectId = params.projectId as string

  const {
    setProjectId,
    data,
    updateData,
    currentStep,
    setStep,
    saveProject,
    isSaving,
  } = useArchitectureStore()

  // Load project architecture on mount
  useEffect(() => {
    if (projectId) {
      setProjectId(projectId)
    }
  }, [projectId, setProjectId])

  // Save on blur (form loses focus)
  const handleSave = async () => {
    try {
      await saveProject()
      // Show success message
    } catch (error) {
      // Show error message
    }
  }

  return (
    <div>
      {/* Wizard UI */}
      <Button
        loading={isSaving}
        onClick={handleSave}
      >
        Save Architecture
      </Button>
    </div>
  )
}
```

---

### PHASE 6: Cross-Module Linking

#### Link Architecture ↔ Presales
```typescript
// Get presales data for prefilling architecture
async function populateArchitectureFromPresales(projectId: string) {
  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    include: { chips: true },
  })

  const architecture: Partial<ArchitectureData> = {
    projectInfo: {
      projectName: project.name,
      description: project.description,
    },
    // Extract from chips
    actors: extractActorsFromChips(project.chips),
    externalSystems: extractSystemsFromChips(project.chips),
    moduleAreas: extractModulesFromChips(project.chips),
    // ... etc
  }

  return architecture
}
```

#### Link Architecture ↔ Timeline
```typescript
// Generate timeline phases from architecture phases
function convertArchitectureToTimeline(architecture: ArchitectureData) {
  return architecture.phases.map((phase) => ({
    name: phase.name,
    startDate: new Date(),
    endDate: addMonths(new Date(), parseInt(phase.timeline)),
    users: phase.users,
    resources: convertTransactionsToResources(phase.transactions),
  }))
}
```

#### Link Architecture ↔ Gantt
```typescript
// Create Gantt project from architecture
async function createGanttFromArchitecture(
  projectId: string,
  architecture: ArchitectureData
) {
  const ganttProject = await prisma.ganttProject.create({
    data: {
      projectId,
      name: `${architecture.projectInfo.projectName} - Architecture`,
      phases: {
        create: architecture.phases.map((phase) => ({
          name: phase.name,
          startDate: new Date(),
          endDate: addMonths(new Date(), parseInt(phase.timeline)),
          tasks: {
            create: [
              // Create tasks from modules, security, deployment
            ],
          },
        })),
      },
    },
  })

  return ganttProject
}
```

---

## Implementation Roadmap

### Week 1: Database & API
- [ ] Create Prisma migration (schema + tables)
- [ ] Implement GET/PUT endpoints for architecture
- [ ] Add authentication checks
- [ ] Test with Postman

### Week 2: Store Integration
- [ ] Enhance architectureStore with projectId support
- [ ] Implement loadProject/saveProject methods
- [ ] Add optimistic locking (version tracking)
- [ ] Implement auto-save interval

### Week 3: Component Updates
- [ ] Update DiagramWizard to accept projectId
- [ ] Add save button with loading state
- [ ] Add sync status indicator
- [ ] Handle conflicts gracefully

### Week 4: Cross-Module Linking
- [ ] Implement presales → architecture converter
- [ ] Implement architecture → timeline converter
- [ ] Implement architecture → gantt converter
- [ ] Test end-to-end data flow

### Week 5: Testing & Polish
- [ ] Integration tests
- [ ] E2E tests with multiple users
- [ ] Performance testing
- [ ] Documentation

---

## URL Structure Changes

### Before
```
/project                    (generic project page)
/project/capture
/project/plan
/project/architecture       (standalone)
/gantt-tool
```

### After (Option A: Keep Separate)
```
/project                    (main)
  /capture
  /plan
  /architecture/[projectId] (integrated but separate)
/gantt-tool/[projectId]     (already project-aware)
```

### After (Option B: Unified Structure)
```
/projects/[projectId]       (main project view)
  /overview
  /architecture
  /timeline
  /gantt
  /estimator
  /dashboard
```

**Recommendation:** Option A (minimal disruption, backward compatible)

---

## Security & Permissions

### Access Control
```typescript
// Check user has access to project
async function checkProjectAccess(
  projectId: string,
  userId: string,
  permission: 'read' | 'write'
) {
  const project = await prisma.projects.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId }, // Owner
        { shares: { some: { userId, permission } } }, // Shared
      ],
    },
  })

  return !!project
}
```

### Audit Trail
```typescript
// Log architecture changes
await prisma.auditLogs.create({
  data: {
    userId: session.user.id,
    action: 'UPDATE_ARCHITECTURE',
    projectId,
    changes: calculateDelta(oldData, newData),
    timestamp: new Date(),
  },
})
```

---

## Conflict Resolution Strategy

### Scenario: Two users editing simultaneously

**Strategy: Last-Write-Wins with Version Tracking**

```typescript
// Request A (User A)
PUT /api/projects/123/architecture
{ data: {...}, version: 5 }

// Request B (User B)  - arrives first
PUT /api/projects/123/architecture
{ data: {...}, version: 5 }
// ✓ Success, version → 6

// Request A - arrives second
PUT /api/projects/123/architecture
{ data: {...}, version: 5 }
// ✗ Conflict! Current version is 6
// Response: 409 Conflict
// Client: Re-fetch latest version, merge changes, retry
```

### Improvement: Operational Transformation (Optional)
For collaborative real-time editing, implement Yjs or Automerge for conflict-free replication.

---

## Migration Path

### Step 1: Dual Write
```typescript
// New: Write to database
await saveToDatabase(projectId, architecture)
// Old: Also update localStorage (for backward compatibility)
localStorage.setItem('architecture-storage', JSON.stringify(architecture))
```

### Step 2: Migrate Existing Data
```typescript
// For each user with architecture data in localStorage:
// 1. Read from localStorage
// 2. Create new project (or link to existing)
// 3. Write to database
// 4. Verify
// 5. Delete localStorage
```

### Step 3: Full Cutover
```typescript
// Remove localStorage fallback
// Archive old localStorage format
// All reads/writes go to database
```

---

## Monitoring & Observability

### Metrics to Track
```typescript
// Architecture module
- Save operations (success/failure rate)
- Auto-sync frequency and latency
- Conflict resolution occurrences
- Data size over time
- User adoption by projectId

// Database
- Query performance for architecture queries
- Storage size per project
- Snapshot growth rate
```

### Example Instrumentation
```typescript
const saveStart = performance.now()
await saveProject()
const duration = performance.now() - saveStart

// Log to PostHog/Sentry
analytics.track('architecture_saved', {
  projectId,
  duration,
  dataSize: JSON.stringify(data).length,
  version,
})
```

---

## Benefits of Integration

| Benefit | Impact |
|---------|--------|
| **Persistence** | Data survives browser refresh/close |
| **Collaboration** | Multiple users can access same architecture |
| **Versioning** | Full audit trail and rollback capability |
| **Sharing** | Leverage existing share mechanism |
| **Linking** | Connect with presales, timeline, Gantt |
| **Export** | Include in project reports/PDFs |
| **Scalability** | Support unlimited projects per user |
| **Offline** | Can still edit locally, sync when online |

---

## Summary

By integrating the Architecture module with the projects table:

1. **Data becomes persistent** and cloud-backed
2. **Multiple modules** can access the same projectId
3. **Collaboration** becomes possible through shared projects
4. **Cross-linking** between presales, timeline, Gantt, architecture
5. **Full versioning & audit** trails
6. **Existing permissions** and sharing framework apply

**Next Steps:**
1. Review this strategy with stakeholders
2. Create Prisma migration
3. Implement Phase 1 (Database)
4. Test with manual testing
5. Deploy incrementally

