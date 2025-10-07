# How to use this bundle (for GPT)

This folder contains everything needed to reason about, run, and fix the app **without guessing**:

- system.txt: OS/CPU/memory/disk
- tooling.txt: Node/npm/pnpm/yarn/bun + Next/TSC/Vitest/Jest/Prisma versions
- package.json + package_scripts_deps.json: scripts + deps
- Configs: next.config.js, tsconfig.json, tailwind, postcss, jest, vitest (if present)
- Prisma: schema.prisma + migrate status (if present)
- db_endpoints.txt: masked hints to DB locations
- env_public.txt: masked environment variables
- .env.share: keys template (NO values)
- ports.txt / processes_top.txt
- repo_top_level.txt
- **smoke_test.sh**: one-click install → build → test (logs to `smoke_run.log`)

## Typical run flow
1) Install deps: `./smoke_test.sh --install-only` or run full smoke test.
2) Dev: `pnpm dev` (or `npm run dev`)
3) Test: `pnpm test` / `pnpm vitest` / `pnpm jest`
4) Lint/Build: `pnpm lint && pnpm build`
5) Prisma (if used): `pnpm prisma generate` then `pnpm prisma migrate dev` (needs DB)

If anything fails, propose patch diffs for files in `src/`, `prisma/`, or config files, then show ready-to-run git commands.
