# 📋 Architecture Module Integration - Executive Summary

**Document Version:** 1.0
**Date:** November 11, 2025
**Status:** Strategy Complete - Ready for Implementation
**Time to Implement:** 4-5 weeks
**Team Size:** 2-3 developers

---

## The Problem

The **Architecture module** is currently **isolated**:
- ❌ Data stored only in browser localStorage
- ❌ No database persistence
- ❌ Cannot link with presales/chips/timeline/Gantt
- ❌ No collaboration between users
- ❌ Data lost on cache clear
- ❌ Cannot be shared with team members

---

## The Solution

Integrate the Architecture module with the existing **projects system** using **projectId** as the primary key:

```
Architecture Data ←→ projects.architectureData (PostgreSQL)
                          ↑
                     projectId (UUID)
                          ↓
              ┌─────────────┴──────────────┐
              │                            │
          Presales Data              Timeline Data
          (chips[])                  (phases[])
              │                            │
              └────────────┬───────────────┘
                           │
                       Gantt Tool
```

---

## Key Benefits

| Benefit | Impact | Users |
|---------|--------|-------|
| **Persistence** | Data survives refresh/close | All |
| **Collaboration** | Multiple users on same project | Teams |
| **Linking** | Connect presales→arch→timeline→gantt | Projects |
| **Sharing** | Leverage existing share mechanism | Organizations |
| **Versioning** | Full audit trail + rollback | Compliance |
| **Offline** | Queue saves for later sync | Mobile |
| **Scalability** | Unlimited projects per user | Enterprise |

---

## Architecture Overview

### Before Integration
```
┌─────────────────────────────────┐
│    Architecture Module          │
│ (Standalone, localStorage only) │
├─────────────────────────────────┤
│                                 │
│ Data: {projectInfo, actors...}  │
│ Storage: localStorage            │
│ Scope: Single browser session    │
│ Persistence: None               │
│ Sharing: N/A                    │
│                                 │
└─────────────────────────────────┘
```

### After Integration
```
┌────────────────────────────────────────────────┐
│         Unified Project Environment             │
├────────────────────────────────────────────────┤
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  Project Context                        │  │
│  │  projectId: "550e8400-e29b-41d4-a716"  │  │
│  └──────────┬──────────────────────────────┘  │
│             │                                  │
│      ┌──────┴─────────────┐                    │
│      │                    │                    │
│  Architecture          Presales                │
│  Store                 Store                   │
│  (projectId)           (projectId)             │
│      │                    │                    │
│      └──────┬─────────────┘                    │
│             │                                  │
│      API: PUT /api/projects/[id]/architecture │
│             │                                  │
│             ▼                                  │
│      PostgreSQL Database                       │
│      projects.architectureData                │
│                                                │
│  Linked with:                                  │
│  • chips[] (RFP data)                         │
│  • phases[] (timeline)                        │
│  • ganttProjects[] (planning)                 │
│  • comments[] (collaboration)                 │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Week 1: Database & API
```
Monday-Tuesday: Database Schema
  ├─ Extend projects table
  ├─ Create architectureSnapshots table
  ├─ Run Prisma migration
  └─ Generate Prisma client

Wednesday-Friday: API Endpoints
  ├─ GET /api/projects/[id]/architecture
  ├─ PUT /api/projects/[id]/architecture
  ├─ POST /api/projects/[id]/architecture/snapshots
  └─ GET/POST snapshot restore
```

### Week 2: Store & Auto-Save
```
Monday-Tuesday: Enhance Store
  ├─ Add projectId support
  ├─ Add loadProject() method
  ├─ Add saveProject() method
  └─ Add optimistic locking

Wednesday-Friday: Auto-Save Logic
  ├─ Implement 30-second auto-sync
  ├─ Handle version conflicts
  ├─ Add dirty flag tracking
  └─ Implement offline queue
```

### Week 3: Components & UI
```
Monday-Tuesday: DiagramWizard Updates
  ├─ Load project on mount
  ├─ Add Save button
  ├─ Add sync status indicator
  └─ Handle unsaved state

Wednesday-Friday: Form Components
  ├─ Add onBlur save triggers
  ├─ Show unsaved indicator (*)
  ├─ Prevent navigation if unsaved
  └─ Toast notifications
```

### Week 4: Cross-Module Integration
```
Monday-Tuesday: Data Converters
  ├─ chips → architecture
  ├─ architecture → timeline
  └─ architecture → gantt

Wednesday-Friday: Linking & Testing
  ├─ Wire up cross-module changes
  ├─ Test data flow
  ├─ Verify relationships
  └─ Integration testing
```

### Week 5: Testing & Deploy
```
Monday-Wednesday: Testing
  ├─ Unit tests (store, converters)
  ├─ Integration tests (full flow)
  ├─ E2E tests (UI scenarios)
  └─ Performance tests

Thursday-Friday: Deployment
  ├─ Code review & approval
  ├─ Deploy to staging
  ├─ Smoke tests
  └─ Deploy to production
```

---

## Database Changes Summary

### New Fields in `projects` Table
```
├─ architectureData (JSON)        ← Full ArchitectureData object
├─ architectureVersion (INT)       ← Version for optimistic locking
└─ architectureUpdatedAt (TIMESTAMP) ← Last modification time
```

### New Table: `architectureSnapshots`
```
├─ id (UUID)
├─ projectId (FK → projects)
├─ data (JSON)                    ← Full snapshot
├─ version (INT)                  ← Version at snapshot time
├─ description (TEXT)             ← User description
├─ createdBy (FK → users)
└─ createdAt (TIMESTAMP)
```

**Migration Commands:**
```bash
npx prisma migrate dev --name "add_architecture_fields"
npx prisma generate
npx prisma studio  # View database
```

---

## API Endpoints Added

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/projects/[id]/architecture` | GET | Load architecture |
| `/api/projects/[id]/architecture` | PUT | Save architecture |
| `/api/projects/[id]/architecture/snapshots` | GET | List snapshots |
| `/api/projects/[id]/architecture/snapshots` | POST | Create snapshot |
| `/api/projects/[id]/architecture/snapshots/[id]` | GET | Fetch snapshot |
| `/api/projects/[id]/architecture/snapshots/[id]` | POST | Restore snapshot |

**Authentication:** All endpoints require NextAuth session
**Permission Model:** Owner or shared with 'write' permission

---

## State Management Changes

### Enhanced `architectureStore`

**New Fields:**
- `projectId: string | null` - Links to projects table
- `isDirty: boolean` - Has unsaved changes
- `isSaving: boolean` - Currently saving
- `version: number` - DB version tracking
- `lastSavedAt: Date | null` - Last successful save

**New Methods:**
- `setProjectId(projectId)` - Set and load project
- `loadProject(projectId)` - Fetch from API
- `saveProject()` - Save to database
- `syncProject()` - Save if dirty
- `createSnapshot(description)` - Create version
- `loadSnapshot(snapshotId)` - Restore version

**Auto-Save:**
- Every 30 seconds if `isDirty`
- Also on form blur
- Logs errors but doesn't block

---

## Data Flow Examples

### Example 1: User Creates Architecture
```
1. User navigates to project
   └─ projectId loaded from context

2. Store calls loadProject(projectId)
   └─ GET /api/projects/[id]/architecture
   └─ Returns: {data, version, updatedAt}

3. User fills form (Step 1: System Context)
   └─ updateData() marks as isDirty=true

4. Auto-save triggers (30s interval)
   └─ saveProject()
   └─ PUT /api/projects/[id]/architecture
   └─ Body: {data, version}
   └─ Database version incremented

5. User navigates away
   └─ Data persisted in PostgreSQL
   └─ localStorage has cached copy
```

### Example 2: Cross-Module Linking
```
User enters RFP data (chips)
         ↓
presales-store updated
         ↓
Watch detects change → trigger sync
         ↓
architectureStore loads
presales data
         ↓
Call convertChipsToArchitecture()
         ↓
Pre-fill architecture form
with actors, systems, modules
         ↓
User can edit and save
```

### Example 3: Timeline Generation
```
Architecture complete
         ↓
User clicks "Generate Timeline"
         ↓
convertArchitectureToTimeline()
         ↓
Create timeline phases from
architecture.phases
         ↓
Save to timeline-store
         ↓
Update in Gantt tool
```

---

## Conflict Resolution Strategy

**Scenario:** Two users editing same architecture simultaneously

**Strategy:** Optimistic Locking with User Notification

```
User A: PUT /api/projects/123/architecture
        Body: {data: {...}, version: 5}
        ↓
        ✓ Success, version → 6

User B: PUT /api/projects/123/architecture
        Body: {data: {...}, version: 5}
        ↓
        ✗ Conflict! (current version is 6)
        ↓
        Response: 409 Conflict
        {
          error: "Version conflict",
          currentVersion: 6
        }
        ↓
User B's client:
  • Shows alert: "Modified by another user"
  • Fetches latest (version 6)
  • User can choose: Keep mine / Use theirs / Merge
  • Retries with new version

Result: No data loss, user aware of conflict
```

---

## Success Metrics

### Adoption
- % of projects with architecture diagrams
- Average diagrams per project
- User retention in module

### Performance
- Save latency < 500ms
- Load latency < 1000ms
- API error rate < 0.1%

### Reliability
- Zero data loss incidents
- Zero duplicate saves
- Version conflicts resolved < 1% of saves

### User Satisfaction
- NPS score > 4.5
- Feature request volume
- Support tickets

---

## Risk Analysis

### Risk 1: Version Conflicts ⚠️
**Probability:** Low (multi-user editing same doc simultaneously rare)
**Impact:** Medium (user experience confusion)
**Mitigation:** Optimistic locking + clear UI feedback

### Risk 2: Data Loss on Network Failure 🔴
**Probability:** Medium
**Impact:** High (user loses work)
**Mitigation:** Offline queue, localStorage cache, retry logic

### Risk 3: Performance Degradation ⚠️
**Probability:** Low
**Impact:** Medium (slow saves frustrate users)
**Mitigation:** Async saves, background syncing, timeout handling

### Risk 4: Schema Migration Issues 🟡
**Probability:** Low
**Impact:** High (database breaks)
**Mitigation:** Test migrations in staging first, backup before deploy

---

## Team Requirements

**Frontend (1 developer):**
- Update components (DiagramWizard, forms)
- Implement store changes
- Add UI for snapshots

**Backend (1 developer):**
- Create/test API endpoints
- Database migrations
- Permission checking

**DevOps/DBA (0.5 developer):**
- Schema review
- Migration testing
- Production deployment

---

## Documentation Provided

| Document | Purpose | Audience |
|----------|---------|----------|
| `ARCHITECTURE_INTEGRATION_STRATEGY.md` | Complete strategy + design decisions | Architects/Leads |
| `INTEGRATION_VISUAL_GUIDE.md` | Diagrams, flowcharts, checklists | All |
| `IMPLEMENTATION_CODE_REFERENCE.md` | Exact code to implement | Developers |
| `ARCHITECTURE_INTEGRATION_SUMMARY.md` | This document - quick overview | Executives/PMs |

---

## Next Steps

### Immediate (This Week)
- [ ] Review this document with team
- [ ] Approve architecture/design
- [ ] Assign team members
- [ ] Create Jira tickets

### Short-term (Next 2 Weeks)
- [ ] Start Phase 1 (Database)
- [ ] Create PR for schema changes
- [ ] Code review on API endpoints

### Medium-term (Weeks 3-5)
- [ ] Complete all 5 phases
- [ ] Run full test suite
- [ ] Deploy to staging
- [ ] User acceptance testing

### Long-term (Post-Launch)
- [ ] Monitor metrics
- [ ] Gather feedback
- [ ] Plan enhancements
- [ ] Document learnings

---

## Decision Points for Stakeholders

### Decision 1: Auto-Save Frequency
- **Option A:** 5 seconds (more responsive, more API calls)
- **Option B:** 30 seconds (balanced)
- **Option C:** Manual only (simple, user controls)
- **Recommendation:** 30 seconds

### Decision 2: Conflict Resolution
- **Option A:** Last-Write-Wins (simple, possible data loss)
- **Option B:** Optimistic Lock (safe, requires user action)
- **Option C:** Merge strategies (complex but best)
- **Recommendation:** Optimistic Lock

### Decision 3: Offline Support
- **Option A:** Queue saves (transparent)
- **Option B:** Prevent offline editing (simple)
- **Option C:** Conflict resolution when online
- **Recommendation:** Queue saves

### Decision 4: Snapshots
- **Option A:** Manual only
- **Option B:** Auto + Manual
- **Option C:** Auto-snapshots every 10 saves
- **Recommendation:** Manual only (simpler MVP)

---

## Budget & Resources

**Development:** 4-5 weeks, 2-3 developers
**Cost:** ~$40K-60K (depending on rates)
**Infrastructure:** Minimal (existing PostgreSQL)
**Timeline:** Ready for production in 5 weeks

---

## Success Criteria

✅ **Must Have:**
- Architecture data persists in PostgreSQL
- Multi-user can access same project
- Auto-save works with conflict resolution
- Version history available
- Cross-module linking works

✅ **Should Have:**
- Offline queueing
- Snapshot management
- Performance < 500ms saves
- Full test coverage

⭐ **Nice to Have:**
- Real-time collaboration (WebSockets)
- Change history viewer
- Conflict merge UI
- Mobile app support

---

## Timeline

```
Week 1: Database & API        ████░░░░░░░░░░░░░░░░ 20%
Week 2: Store & Auto-Save     ░░░░████░░░░░░░░░░░░ 40%
Week 3: Components & UI       ░░░░░░░░████░░░░░░░░ 60%
Week 4: Cross-Module Links    ░░░░░░░░░░░░████░░░░ 80%
Week 5: Testing & Deploy      ░░░░░░░░░░░░░░░░████ 100%
```

---

## Contact & Support

**Architecture Lead:** [Your Name]
**Backend Lead:** [Your Name]
**DevOps Contact:** [Your Name]

**Slack Channel:** #architecture-integration
**Repository:** cockpit
**Documentation:** `/workspaces/cockpit/`

---

## Appendix: File Locations

**Strategy Documents:**
- `ARCHITECTURE_INTEGRATION_STRATEGY.md` - Full strategy
- `INTEGRATION_VISUAL_GUIDE.md` - Visual diagrams
- `IMPLEMENTATION_CODE_REFERENCE.md` - Code snippets
- `ARCHITECTURE_INTEGRATION_SUMMARY.md` - This document

**Key Files to Modify:**
- `/prisma/schema.prisma` - Database schema
- `/src/stores/architectureStore.ts` - State management
- `/src/app/architecture/components/DiagramWizard.tsx` - UI
- `/src/app/architecture/page.tsx` - Page component

**New Files to Create:**
- `/src/app/api/projects/[projectId]/architecture/route.ts`
- `/src/app/api/projects/[projectId]/architecture/snapshots/route.ts`
- `/src/lib/architecture-converters.ts`

---

## Conclusion

The Architecture module integration is a **strategic investment** that will:

1. **Unlock collaboration** - Multiple users on same projects
2. **Enable data portability** - Connect presales→arch→timeline→gantt
3. **Build compliance** - Full audit trail and version history
4. **Scale the product** - Support enterprise use cases
5. **Improve UX** - Persistent data, offline support

**Estimated ROI:** High adoption, reduced customer friction, opens new markets.

---

**Document Prepared:** November 11, 2025
**Status:** Ready for Implementation
**Next Review:** Upon project completion

