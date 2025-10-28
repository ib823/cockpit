# Claude.ai Project Knowledge Sync Strategy

This document defines **exactly** which files/folders to include when adding to Claude.ai project knowledge for comprehensive codebase assessment.

## Folder Order (VS Code Explorer Order)

### ✅ INCLUDE

#### 1. **/.github/**
- `workflows/*.yml` - CI/CD pipelines
- `dependabot.yml` - Dependency management

#### 2. **/.project-knowledge/**
- `PROJECT_DOCUMENTATION.md`
- `PROJECT_STATE.md`

#### 3. **/docs/**
- All `.md` files (architecture, flows, design)
- `/ui-toolkit/` - UI component documentation

#### 4. **/lib/**
- `session.ts` - Session management logic

#### 5. **/prisma/**
- `schema.prisma` - Database schema
- `_passkey_models.prisma` - Passkey models
- `seed.ts` - Seed data

#### 6. **/public/**
- All files - Assets, icons, logos (small files)

#### 7. **/scripts/**
- `bootstrap-admin.ts`
- `generate-holidays.js`
- `pack_for_gpt.sh`
- `set-admin-code.ts`

#### 8. **/src/** (MOST CRITICAL)
- `/app/` - Next.js app router pages
- `/components/` - All React components
- `/config/` - Application configuration
- `/data/` - Static/reference data
- `/hooks/` - Custom React hooks
- `/lib/` - Utility libraries
- `/pages/` - Pages router (if used)
- `/stores/` - State management
- `/styles/` - Global styles
- `/types/` - TypeScript type definitions
- `/utils/` - Utility functions
- `middleware.ts` - Next.js middleware

#### 9. **/tests/**
- `/components/` - Component tests
- `/e2e/` - End-to-end tests
- `/integration/` - Integration tests
- `/lib/` - Library tests
- `/unit/` - Unit tests
- `/visual/` - Visual regression tests
- `*.test.ts` - Test files
- `setup.ts` - Test configuration

#### 10. **Root Configuration Files**
- `.env.example` - Environment variable template (NOT .env or .env.local)
- `.eslintrc.js`
- `.eslintrc.json`
- `.prettierrc.json`
- `jest.config.js`
- `next.config.js`
- `package.json` - Dependencies and scripts
- `postcss.config.js`
- `tailwind.config.js`
- `tsconfig.json`
- `vitest.config.ts`
- `vercel.json` - Deployment config

#### 11. **Root Documentation Files (Selective)**
- `README.md`
- `COMPREHENSIVE_SOLUTION_OVERVIEW.md` ⭐ **CRITICAL** (complete solution context)
- `CODEBASE_OVERVIEW.md`
- `CLAUDE_AI_UPLOAD_GUIDE.md`
- `DEVELOPER_GUIDE.md`
- `SECURITY.md`
- `SECURITY_CONTROLS.md`
- `DEPLOYMENT_GUIDE.md`
- `ACCESSIBILITY_COMPLIANCE.md`
- `AUTHENTICATION.md`
- `BRANDING_GUIDE.md`

---

### ❌ EXCLUDE

#### Build Artifacts & Cache
- `/.next/` - Build output
- `/node_modules/` - Dependencies
- `*.tsbuildinfo` - TypeScript build info
- `/out/` - Export output
- `/build/` - Production build
- `/coverage/` - Test coverage reports

#### Environment & Secrets
- `.env` - **NEVER UPLOAD** (contains secrets)
- `.env.local` - **NEVER UPLOAD** (contains secrets)
- `.env.*.local` - Any local environment files
- `*.pem` - SSL certificates

#### IDE & Tooling
- `/.claude/` - Claude Code settings
- `/.vscode/` - VS Code settings
- `/.vercel/` - Vercel deployment data
- `.DS_Store` - macOS system files

#### Debug & Development Artifacts
- `/gptdebug/` - Debug exports
- `/env_report_*/` - Environment reports
- `*.zip` - Archive files
- `*.log` - Log files
- `build-output.log`
- `test-output.log`

#### Redundant Documentation (generated reports)
- `*_COMPLETE.md`
- `*_STATUS.md`
- `*_DELIVERY.md`
- `*_INTEGRATION.md`
- `*_REPORT.md`
- `*_AUDIT*.md`
- `SESSION_*.md`
- `*_SUMMARY.md` (unless it's PROJECT_SUMMARY.md)
- `*_IMPLEMENTATION*.md`
- `*_FIXES*.md`

#### Temporary & Misc
- `0` - Empty temp file
- `buffer_test.txt`
- `temp.json`
- `latestEnd`
- `*.backup`
- `create-test-milestones.js` (if temporary)
- Shell scripts used for debugging (`deploy-fixes.sh`, `setup-ui-toolkit.sh`, `extract-status.sh`, `verify-project-v2.sh`)

---

## Assessment Coverage

This selection provides comprehensive coverage for:

### 🔒 **Security Assessment**
- Authentication logic (`src/lib/`, `lib/session.ts`, `middleware.ts`)
- Database schema (`prisma/`)
- Environment config (`.env.example` only)
- Security documentation
- Test coverage

### 🎨 **UX Assessment**
- All components (`src/components/`)
- Pages and routing (`src/app/`, `src/pages/`)
- Styles and theming (`src/styles/`, `tailwind.config.js`)
- Design documentation (`docs/`)
- Accessibility compliance

### 🔄 **Flow Assessment**
- Business logic (`src/lib/`, `src/utils/`)
- State management (`src/stores/`)
- API routes (`src/app/api/`)
- Data flow (`src/hooks/`, `src/data/`)
- Type definitions (`src/types/`)

### 🏗️ **Architecture Assessment**
- Project structure (all folders)
- Configuration files
- Build/deployment setup
- Dependencies (`package.json`)
- Testing strategy (`tests/`)

---

## Quick Selection Checklist

When adding to Claude.ai Project Knowledge:

1. ✅ Source code folders: `src/`, `lib/`, `prisma/`, `scripts/`
2. ✅ Tests: `tests/` (all subfolders)
3. ✅ Documentation: `docs/` + selective root `.md` files
4. ✅ Config: All root config files (`.json`, `.js`, `.ts`)
5. ✅ `.env.example` ONLY (never actual `.env` files)
6. ❌ Skip: `.next/`, `node_modules/`, `.git/`, `.claude/`, `.vscode/`, `.vercel/`
7. ❌ Skip: All `.env` and `.env.local` files
8. ❌ Skip: All `*_COMPLETE.md`, `*_STATUS.md`, etc.
9. ❌ Skip: All `.zip`, `.log`, and debug folders

---

## File Count Estimate

**Included:** ~500-800 files (mostly source code)
**Excluded:** ~15,000+ files (node_modules) + build artifacts + redundant docs

This gives Claude.ai the exact files needed for accurate assessment without noise.
