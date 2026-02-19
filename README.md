# Cockpit

Private/proprietary application codebase published for controlled visibility only.

## Repository Policy
1. License: strictly proprietary (`LICENSE`).
2. Branch model: single long-lived branch (`main`).
3. Quality model: strict, blocking gates only (no bypass).
4. Public hygiene: no secrets, no personal identifiers, no generated artifacts.

## Canonical Docs
1. `docs/MASTER_PLAN.md`
2. `docs/AI_EXECUTION_PROTOCOL.md`
3. `docs/HANDOFF.md`
4. `docs/README.md`

## Local Development (Minimum)
1. Install dependencies: `pnpm install`
2. Configure environment from `.env.example`
3. Start dev server: `pnpm dev`

## Strict Validation Commands
1. `pnpm lint:strict`
2. `pnpm typecheck:strict`
3. `pnpm test --run`
4. `pnpm build`
