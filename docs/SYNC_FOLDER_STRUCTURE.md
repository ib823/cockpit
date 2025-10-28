# Claude.ai Sync - Folder Structure Reference

This document shows the **exact folder structure** that will be synced to Claude.ai, mirroring VS Code Explorer order.

## 📁 Synced Structure (VS Code Explorer Order)

```
claude-project-knowledge/
│
├── .github/                          ✅ CI/CD Configuration
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   └── test.yml
│   └── dependabot.yml
│
├── .project-knowledge/               ✅ Project Documentation
│   ├── PROJECT_DOCUMENTATION.md
│   └── PROJECT_STATE.md
│
├── docs/                             ✅ All Documentation
│   ├── ui-toolkit/
│   │   ├── components/
│   │   ├── design-tokens/
│   │   └── [all other toolkit docs]
│   ├── Admin_Journey_V2.md
│   ├── Holistic_Redesign_V2.md
│   ├── Mermaid_System_Maps.md
│   ├── README.md
│   ├── START_HERE.md
│   └── [all other .md files]
│
├── lib/                              ✅ Core Library
│   └── session.ts
│
├── prisma/                           ✅ Database Schema
│   ├── _passkey_models.prisma
│   ├── schema.prisma
│   └── seed.ts
│
├── public/                           ✅ Static Assets
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── icon.svg
│   ├── logo-dark.svg
│   └── logo-light.svg
│
├── scripts/                          ✅ Automation Scripts
│   ├── bootstrap-admin.ts
│   ├── generate-holidays.js
│   ├── pack_for_gpt.sh
│   └── set-admin-code.ts
│
├── src/                              ✅ SOURCE CODE (MOST CRITICAL)
│   ├── __tests__/                    → Unit tests alongside source
│   │   └── [test files]
│   │
│   ├── app/                          → Next.js App Router
│   │   ├── (auth)/                   → Auth route group
│   │   ├── (dashboard)/              → Dashboard route group
│   │   ├── admin/                    → Admin pages
│   │   ├── api/                      → API routes
│   │   ├── estimator/                → Estimator pages
│   │   ├── login/                    → Login pages
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   │
│   ├── components/                   → React Components
│   │   ├── admin/                    → Admin components
│   │   ├── auth/                     → Auth components
│   │   ├── charts/                   → Chart components
│   │   ├── dashboard/                → Dashboard components
│   │   ├── estimator/                → Estimator components
│   │   ├── forms/                    → Form components
│   │   ├── layout/                   → Layout components
│   │   ├── modals/                   → Modal components
│   │   ├── timeline/                 → Timeline components
│   │   ├── ui/                       → UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── [all other components]
│   │
│   ├── config/                       → App Configuration
│   │   ├── constants.ts
│   │   ├── features.ts
│   │   └── theme.ts
│   │
│   ├── data/                         → Static/Reference Data
│   │   ├── holidays.ts
│   │   ├── l3-catalog.ts
│   │   └── [other data files]
│   │
│   ├── hooks/                        → Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── useEstimator.ts
│   │   ├── useTimeline.ts
│   │   └── [all other hooks]
│   │
│   ├── lib/                          → Utility Libraries
│   │   ├── auth/                     → Auth utilities
│   │   ├── db/                       → Database utilities
│   │   ├── email/                    → Email utilities
│   │   ├── api.ts
│   │   ├── prisma.ts
│   │   └── [all other libs]
│   │
│   ├── pages/                        → Pages Router (if used)
│   │   └── [legacy pages]
│   │
│   ├── stores/                       → State Management
│   │   ├── estimatorStore.ts
│   │   ├── presalesStore.ts
│   │   ├── timelineStore.ts
│   │   └── [all other stores]
│   │
│   ├── styles/                       → Global Styles
│   │   ├── globals.css
│   │   ├── theme.css
│   │   └── [other stylesheets]
│   │
│   ├── types/                        → TypeScript Types
│   │   ├── admin.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── database.ts
│   │   ├── estimator.ts
│   │   ├── timeline.ts
│   │   └── [all other types]
│   │
│   ├── utils/                        → Utility Functions
│   │   ├── calculations.ts
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── [all other utils]
│   │
│   └── middleware.ts                 → Next.js Middleware
│
├── tests/                            ✅ Test Suites
│   ├── components/                   → Component tests
│   │   └── [*.test.tsx files]
│   ├── e2e/                          → E2E tests
│   │   └── [*.spec.ts files]
│   ├── integration/                  → Integration tests
│   │   └── [*.test.ts files]
│   ├── lib/                          → Library tests
│   │   └── [*.test.ts files]
│   ├── unit/                         → Unit tests
│   │   └── [*.test.ts files]
│   ├── visual/                       → Visual regression
│   │   └── [snapshot tests]
│   ├── estimator-integration.test.ts
│   └── setup.ts
│
├── .env.example                      ✅ Environment Template
├── .eslintrc.js                      ✅ ESLint Config
├── .eslintrc.json                    ✅ ESLint JSON Config
├── .gitignore                        ✅ Git Ignore Rules
├── .prettierrc.json                  ✅ Prettier Config
│
├── jest.config.js                    ✅ Jest Configuration
├── jest.setup.js                     ✅ Jest Setup
├── next.config.js                    ✅ Next.js Configuration
├── package.json                      ✅ Dependencies & Scripts
├── pnpm-lock.yaml                    ✅ Lock File
├── postcss.config.js                 ✅ PostCSS Config
├── tailwind.config.js                ✅ Tailwind Config
├── tsconfig.json                     ✅ TypeScript Config
├── vercel.json                       ✅ Vercel Deployment
├── vitest.config.ts                  ✅ Vitest Config
│
├── README.md                         ✅ Project README
├── CODEBASE_OVERVIEW.md              ✅ Architecture Overview
├── CLAUDE_AI_UPLOAD_GUIDE.md         ✅ Upload Instructions
├── CLAUDE_AI_SYNC_STRATEGY.md        ✅ Sync Strategy
├── DEVELOPER_GUIDE.md                ✅ Developer Guide
├── SECURITY.md                       ✅ Security Documentation
├── SECURITY_CONTROLS.md              ✅ Security Controls
├── DEPLOYMENT_GUIDE.md               ✅ Deployment Guide
├── ACCESSIBILITY_COMPLIANCE.md       ✅ Accessibility Guide
├── AUTHENTICATION.md                 ✅ Auth Documentation
├── BRANDING_GUIDE.md                 ✅ Branding Guide
├── ADMIN_DASHBOARD_GUIDE.md          ✅ Admin Guide
└── ACCESS_CODE_FLOW.txt              ✅ Access Code Flow

```

## ❌ Excluded Structure (NOT Synced)

```
[ROOT]
│
├── .next/                            ❌ Build artifacts
│   └── [all build files]
│
├── node_modules/                     ❌ Dependencies (~15,000+ files)
│   └── [all packages]
│
├── .claude/                          ❌ Claude Code settings
│   └── settings.local.json
│
├── .vscode/                          ❌ VS Code settings
│   └── [editor settings]
│
├── .vercel/                          ❌ Vercel deployment data
│   └── [deployment files]
│
├── gptdebug/                         ❌ Debug exports
│   └── [debug files]
│
├── env_report_*/                     ❌ Environment reports
│   └── [report files]
│
├── .env                              ❌ SECRETS (never sync!)
├── .env.local                        ❌ SECRETS (never sync!)
├── tsconfig.tsbuildinfo              ❌ Build cache
│
└── Redundant Documentation:          ❌ Generated reports
    ├── *_COMPLETE.md
    ├── *_STATUS.md
    ├── *_DELIVERY.md
    ├── *_INTEGRATION.md
    ├── *_REPORT.md
    ├── *_AUDIT*.md
    ├── SESSION_*.md
    ├── *_SUMMARY.md (except PROJECT_SUMMARY.md)
    └── [all completion/status reports]
```

## 📊 Size Comparison

| Category | Files | Size |
|----------|-------|------|
| **✅ Included (Synced)** | ~500-800 | ~5-15 MB |
| **❌ Excluded (Not Synced)** | ~15,000+ | ~500+ MB |
| **Total Reduction** | ~95% fewer | ~97% smaller |

## 🎯 Key Folders for Assessment

### 🔒 Security
- `src/lib/auth/` - Authentication logic
- `src/app/api/` - API routes
- `lib/session.ts` - Session management
- `middleware.ts` - Request middleware
- `prisma/schema.prisma` - Database security

### 🎨 UX
- `src/components/` - All UI components
- `src/app/` - Page routing & layouts
- `src/styles/` - Styling & theming
- `tailwind.config.js` - Design system
- `docs/ui-toolkit/` - Component docs

### 🔄 Business Logic
- `src/lib/` - Core business logic
- `src/utils/` - Utility functions
- `src/stores/` - State management
- `src/hooks/` - Custom hooks
- `src/data/` - Reference data

### 🏗️ Architecture
- `src/types/` - Type system
- `src/config/` - Configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript setup
- `tests/` - Test architecture

## 📝 Assessment Coverage Matrix

| Assessment Type | Primary Folders | Supporting Files |
|----------------|-----------------|------------------|
| **Security Audit** | `src/lib/auth/`, `src/app/api/`, `middleware.ts` | `SECURITY.md`, `prisma/schema.prisma` |
| **UX Review** | `src/components/`, `src/app/` | `docs/ui-toolkit/`, `ACCESSIBILITY_COMPLIANCE.md` |
| **Code Quality** | `src/`, `tests/` | `eslintrc`, `tsconfig.json` |
| **Architecture** | `src/types/`, `src/lib/` | `CODEBASE_OVERVIEW.md`, `package.json` |
| **Flow Analysis** | `src/stores/`, `src/hooks/` | `docs/`, `Mermaid_System_Maps.md` |

## 🔍 Verification Checklist

After sync, verify these critical files exist:

- [ ] `src/app/` - Next.js app router
- [ ] `src/components/` - React components
- [ ] `src/lib/` - Business logic
- [ ] `src/types/` - TypeScript definitions
- [ ] `src/stores/` - State management
- [ ] `prisma/schema.prisma` - Database schema
- [ ] `tests/` - Test suites
- [ ] `package.json` - Dependencies
- [ ] `README.md` - Project overview
- [ ] `SECURITY.md` - Security docs
- [ ] `.env.example` - Env template (NOT .env!)

## 🚀 Ready for Assessment

This structure provides Claude.ai with:
- ✅ Complete source code
- ✅ Full type definitions
- ✅ All business logic
- ✅ Database schema
- ✅ Test coverage
- ✅ Configuration files
- ✅ Key documentation
- ✅ Zero secrets
- ✅ No build artifacts
- ✅ No redundant files

**Perfect for comprehensive security, UX, flow, and architecture assessment!**
