# Test Standards

Status: Active
Last Updated: 2026-02-20

## Test Runner

**Vitest** is the canonical test runner. Jest config has been removed.

- Config: `vitest.config.ts`
- Global setup: `tests/setup.ts`
- Naming: `.test.ts` / `.test.tsx` for Vitest, `.spec.ts` for Playwright

## Test Categories

### Unit Tests (mock DB)
- Location: `src/**/__tests__/` (colocated with source)
- DB strategy: Global in-memory Prisma mock (`tests/setup.ts`)
- Auth strategy: Global `getServerSession` mock returning admin session
- Run with: `pnpm test --run`

### Integration Tests (mock DB)
- Location: `tests/integration/`
- DB strategy: Same global mock, but tests exercise full API route handlers
- Helpers: `tests/integration/helpers/`

### Auth Tests (real DB when available)
- Location: `tests/auth/`
- DB strategy: Dual — uses global mock by default, `tests/auth/helpers/test-setup.ts` provides real DB via `testPrisma` when `DATABASE_URL` points to a live Postgres
- Helpers: `tests/auth/helpers/auth-helpers.ts` (request builders, response parsers)
- Fixtures: `tests/auth/helpers/mock-users.ts` (predefined user scenarios)

### Security Tests (mock DB)
- Location: `tests/security/`
- DB strategy: Global mock with selective `getServerSession` overrides
- Pattern: Override mock per-test with `vi.mocked(...).mockResolvedValueOnce()`

### Visual/A11y Tests (no DB)
- Location: `tests/visual/`, `tests/a11y/`
- DB strategy: Not applicable (CSS/token/DOM validation)

### E2E Tests (real DB, Playwright)
- Location: `tests/e2e/`
- Config: `playwright.config.ts`
- DB strategy: Requires live application server (`npm run dev`)
- Run with: `pnpm test:e2e`
- Excluded from Vitest via `vitest.config.ts` excludes

## Global Mock Strategy

`tests/setup.ts` provides:

1. **In-memory Prisma mock** — Map-based store supporting CRUD, filters (`contains`, `in`, `gte`, etc.), and relation resolution
2. **next-auth session mock** — Returns admin session by default; override per-test with `vi.mocked(getServerSession).mockResolvedValueOnce(null)` for unauthenticated scenarios
3. **Environment variables** — `NEXTAUTH_SECRET`, `DATABASE_URL`, etc. set to test values
4. **DOM cleanup** — `afterEach` cleanup of JSDOM state, portals, and overlays

## Writing New Tests

### For API route tests
```typescript
import { describe, test, expect, vi } from "vitest";

// The global mock provides an authenticated admin session.
// To test unauthenticated access:
const nextAuth = await import("next-auth");
vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(null);
```

### For component tests
```typescript
import { render, screen } from "@testing-library/react";
// Global setup handles JSDOM, cleanup, and matchMedia polyfills
```

### Fixture pattern
Create fixtures near their tests in a `helpers/` subdirectory. Use factory functions, not static objects, so each test gets isolated data.

## Coverage

- Provider: `@vitest/coverage-v8`
- Thresholds (regression floor): statements 10%, branches 70%, functions 50%, lines 10%
- CI runs `pnpm test:coverage --run` to enforce thresholds
- Increase thresholds as coverage improves; never decrease them

## CI Environment

GitHub Actions (`.github/workflows/ci.yml`) provides:
- PostgreSQL 16 service container
- All required env vars (NEXTAUTH_SECRET, DATABASE_URL, etc.)
- Runs: lint:strict, typecheck:strict, test:coverage, build
