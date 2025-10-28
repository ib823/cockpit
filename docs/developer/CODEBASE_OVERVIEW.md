# Keystone - Codebase Overview

## Project Summary
Enterprise SAP presales estimation system that converts RFP requirements into timeline estimates and cost projections.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + Prisma ORM
- **State**: Zustand with persist middleware
- **Auth**: WebAuthn/Passkey (passwordless)
- **Validation**: Zod schemas
- **Testing**: Vitest (428 tests passing)
- **Deployment**: Vercel

## Architecture

### Data Layer (`src/data/`)
- `dal.ts` - Data Access Layer interface + Zod schemas (single source of truth)
- `prisma-adapter.ts` - Concrete DAL implementation (938 lines)
- `holidays.ts` - Business day calculations with regional holidays

### Business Logic (`src/lib/`)
- `scenario-generator.ts` - Core: Generates SAP implementation scenarios (918 lines)
- `estimation-engine.ts` - Calculates effort using SAP Activate methodology
- `estimation-constants.ts` - SAP estimation constants (282 lines)
- `presales-to-timeline-bridge.ts` - Converts presales chips → timeline phases
- `enhanced-chip-parser.ts` - RFP text parsing (extracts entities, branches, etc.)
- `critical-patterns.ts` - Multi-entity/branch detection (Bahasa Malaysia support)

### State Management (`src/stores/`)
- `presales-store.ts` - Chips, decisions (with persistence)
- `timeline-store.ts` - Phases, resources (with persistence)
- `project-store.ts` - Orchestrates presales → timeline conversion

### Security (`src/lib/security/`)
- `validation.ts` - Input sanitization, XSS prevention
- `src/middleware.ts` - Route protection, RBAC, rate limiting, CVE protection

### Types (`src/types/`)
- `core.ts` - All TypeScript interfaces (Chip, Phase, Resource, Project, etc.)

### Components (`src/components/`)
- `project-v2/modes/PlanMode.tsx` - Main project planning UI
- `timeline/ActivateGanttChart.tsx` - SAP Activate Gantt visualization

### Database (`prisma/`)
- `schema.prisma` - 13 tables: User, Project, Phase, Resource, Chip, RicefwItem, FormItem, IntegrationItem, AuditLog, Share, Comment, Snapshot, Authenticator

## Key Features Implemented

### ✅ Complete
1. **Schema Validation** - Single source of truth in dal.ts
2. **Stub Functions** - All 3 implemented:
   - `applyRateRegionImpact` - Regional cost multipliers (ABMY 1.0x, ABSG 1.2x, ABVN 0.6x)
   - `applyFRICEWTargetImpact` - Customization effort (Low 1.1x, Med 1.25x, High 1.5x)
   - `applyIntegrationPostureImpact` - Integration posture (P2P 1.4x, Cloud 0.8x)
3. **State Persistence** - Timeline + Presales stores persist to localStorage
4. **Authentication** - WebAuthn/Passkey (passwordless, FIDO2 compliant)
5. **Database Layer** - Full CRUD with Prisma, audit logs, transactions
6. **Testing** - 428 tests passing (100% core business logic coverage)

### 📊 Production Readiness: ~97%

## Data Flow
```
RFP Text Input
  ↓
enhanced-chip-parser.ts (extract requirements)
  ↓
Chips stored in presales-store
  ↓
presales-to-timeline-bridge.ts (convert to phases)
  ↓
scenario-generator.ts (apply decisions, multipliers)
  ↓
Phases stored in timeline-store
  ↓
ActivateGanttChart.tsx (visualize)
```

## Critical Business Rules
- **SAP Activate Phases**: Prepare, Explore, Realize, Deploy, Run
- **Effort Multipliers**:
  - Legal entities: 1-3 entities (1.5x), 3-5 (2.0x), 5+ (3.0x)
  - Locations: 1-3 (1.3x), 3-10 (1.8x), 10+ (2.5x)
  - Integrations: 2-5 systems (1.3x), 5-10 (1.6x), 10+ (2.0x)
- **Regional Rates**: Malaysia baseline, Singapore +20%, Vietnam -40%
- **Working Days**: Excludes weekends + regional holidays (Malaysia, Singapore, Vietnam)

## Recent Changes (Commit 4f1eaf77)
- Consolidated duplicate Zod schemas
- Implemented 3 critical stub functions
- Added state persistence to 2 stores
- Improved type safety (reduced unsafe `any` usage)
- All tests passing, TypeScript clean

## Assessment Questions for Claude
1. Are there any architectural anti-patterns?
2. Security vulnerabilities beyond what's already implemented?
3. Performance bottlenecks in scenario generation?
4. Missing test coverage areas?
5. Opportunities for code simplification?
6. Database schema optimization opportunities?
7. Type safety improvements (remaining `any` usage)?
8. Accessibility (a11y) gaps in UI components?

## Metrics
- **Files**: ~150 TypeScript files
- **Tests**: 428 passing
- **Database Tables**: 13
- **LOC (business logic)**: ~3,000
- **Dependencies**: 47 production, 38 dev
- **Bundle Size**: Not yet optimized
