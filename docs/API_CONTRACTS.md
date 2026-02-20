# API Contract Standards

Status: Active
Version: 1.0.0
Last Updated: 2026-02-20

## 1. Request Validation

All API routes MUST validate incoming data using Zod schemas defined in `src/lib/api-validators.ts`.

### Canonical validation pattern

```typescript
import { validateRequest, ValidationError } from "@/lib/api-validators";
import { ProjectCreateSchema } from "@/lib/api-validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = validateRequest(ProjectCreateSchema, body);
    // data is fully typed and validated
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: err.fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Rules

1. **Use `validateRequest()`** — the canonical helper that calls `safeParse` internally and throws a typed `ValidationError`.
2. **Define schemas in `api-validators.ts`** — keep all reusable schemas centralized. Route-specific schemas (e.g., inline `z.object(...)` for a single route) are acceptable only if they cannot be reused.
3. **Never trust client input** — always parse before use.

## 2. Response Envelope

The codebase currently uses multiple response patterns across different API domains. The following conventions apply when writing new routes or refactoring existing ones.

### Domain-specific conventions

| Domain | Success pattern | Error pattern |
|--------|----------------|---------------|
| Auth/Admin (`/api/auth/*`, `/api/admin/*`) | `{ ok: true, ...data }` | `{ ok: false, message: "..." }` |
| Gantt-tool (`/api/gantt-tool/*`) | `{ success: true, data: ..., count?: n }` | `{ error: "...", details?: [...] }` |
| Account/General (`/api/account/*`, other) | Direct data object | `{ error: "..." }` |

### Error responses

All error responses MUST:
1. Use the correct HTTP status code (400, 401, 403, 404, 409, 500).
2. Never expose stack traces, raw database errors, or environment details (A-06).
3. Include a human-readable message in the `error` or `message` field.

### Validation error responses

```json
{
  "error": "Validation failed",
  "fieldErrors": {
    "name": ["Name required"],
    "endDate": ["End date must be after start date"]
  }
}
```

## 3. HTTP Status Code Reference

| Code | When to use |
|------|------------|
| 200 | Success (GET, PATCH, DELETE that returns data) |
| 201 | Resource created (POST that creates) |
| 204 | Success with no body (DELETE with no return) |
| 400 | Client input invalid (validation failure) |
| 401 | No session / expired token |
| 403 | Authenticated but insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate, race condition) |
| 500 | Unhandled server error |

## 4. Schema Coverage

All schemas in `src/lib/api-validators.ts` have contract tests in `tests/api/api-validators.test.ts`. These tests verify:
- Required field enforcement
- Boundary values (min/max lengths, ranges)
- Enum validation
- Cross-field refinements (e.g., endDate >= startDate)
- The `validateRequest` helper and `ValidationError` contract

## 5. Known Debt

1. **Envelope inconsistency**: Three response patterns exist (see table above). Unifying to a single envelope pattern is deferred to avoid breaking frontend consumers.
2. **Inline schemas**: Some gantt-tool routes define `z.object(...)` inline rather than importing from `api-validators.ts`. These should migrate to the centralized file over time.
3. **Manual validation**: A few routes (e.g., `account/profile`) use manual `typeof` checks instead of Zod. These should adopt `validateRequest`.
