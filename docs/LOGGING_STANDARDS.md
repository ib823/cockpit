# Structured Logging Standards

Status: Active
Last Updated: 2026-02-20

## Canonical Logger

All server-side logging must use `src/lib/logger.ts`:

```typescript
import { logger } from "@/lib/logger";

// Direct usage
logger.info("Project created", { projectId, userId });
logger.error("Save failed", { error: err, projectId });

// Module-scoped child logger (preferred for libraries/services)
const log = logger.child("BackgroundSync");
log.info("Sync started", { projectId });
log.warn("Retry exhausted", { projectId, attempts: 3 });
```

## Output Format

| Environment | Format | Example |
|---|---|---|
| Development | `[LEVEL] [Module] message {data}` | `[INFO] [BackgroundSync] Sync started { projectId: "abc" }` |
| Production | Single-line JSON | `{"level":"info","module":"BackgroundSync","msg":"Sync started","projectId":"abc","timestamp":"..."}` |

## Log Levels

| Level | When to use | Production default |
|---|---|---|
| `debug` | Verbose diagnostic info (loop iterations, state dumps) | Suppressed |
| `info` | Normal operational events (request served, job completed) | Emitted |
| `warn` | Recoverable issues (retry, fallback activated, deprecated usage) | Emitted |
| `error` | Failures requiring attention (unhandled rejection, external service down) | Emitted |
| `fatal` | Unrecoverable failures (startup crash, data corruption detected) | Emitted |

Configure via `LOG_LEVEL` environment variable (default: `debug` in dev, `info` in production).

## Rules

1. **Use the canonical logger** — never raw `console.log/error/warn` in new server-side code.
2. **Use child loggers** — every module/service should create `const log = logger.child("ModuleName")`.
3. **Pass structured data** — use the `data` parameter, not string interpolation for variables.
4. **Normalize errors** — pass errors as `{ error: err }`. The logger safely serializes them.
5. **No PII in logs** — never log passwords, tokens, full email addresses, or session IDs.
6. **No stack traces in production** — the logger strips them automatically.
7. **One log per event** — avoid multi-line console.warn sequences. Use a single structured call.

## Existing Patterns (Legacy)

The codebase contains ~667 raw `console.*` calls across 178 files with 26 context-prefix conventions (e.g., `[BackgroundSync]`, `[Cache]`, `[API]`). These are functional but should migrate to the structured logger incrementally. Do not bulk-refactor; migrate during normal feature/fix work.

## Integration Points

| System | Status | Notes |
|---|---|---|
| Sentry | Placeholder (`src/lib/monitoring/sentry.ts`) | Install `@sentry/nextjs` to activate |
| PostHog | Active | Product analytics only, not operational logging |
| Audit trail | Active (`src/lib/audit.ts`) | DB-backed, uses Prisma |
| Error sanitizer | Active (`src/lib/error-sanitizer.ts`) | Client-facing error messages |
| Health check | Active (`/api/health`) | Returns DB latency, component status |

## Known Debt

1. ~667 raw console calls across 178 files need incremental migration.
2. No request correlation IDs (future: middleware to inject `x-request-id`).
3. Sentry SDK not installed (placeholder ready).
4. Audit logs write to DB but also console.log (should use structured logger).
