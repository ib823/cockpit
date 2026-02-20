# Server/Client Rendering Strategy

Status: Active
Last Updated: 2026-02-20

## Current State

| Page | Rendering | Data Fetching | Status |
|------|-----------|---------------|--------|
| /login | Client | Client-side fetch | OK (auth entry point) |
| /dashboard | Server → Client | Server-side (getServerSession + prisma) | Ideal pattern |
| /gantt-tool | Client | Client-side fetch | OK (heavy interactive) |
| /admin | Server | Server-side (prisma with cache) | Ideal pattern |
| /admin/users | Server → Client | Server-side + client hydration | Ideal pattern |
| /admin/approvals | Client | Client-side fetch | Suboptimal |
| /admin/email-approvals | Client | Client-side fetch | Suboptimal |
| /admin/recovery-requests | Client | Client-side fetch | Suboptimal |
| /admin/security | Server → Client | Server-side + client refresh | Ideal pattern |
| /settings | Client | Client-side fetch | OK |
| /settings/security | Client | Client-side fetch | OK |
| /architecture | Server → Client | Server-side | Ideal pattern |

## Canonical Patterns

### Pattern 1: Server Component with Data Pre-fetch (Preferred)

```tsx
// page.tsx (NO "use client")
export default async function Page() {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");
  const data = await prisma.model.findMany({ ... });
  return <ClientComponent initialData={data} />;
}
```

Use for: Dashboard, admin pages, any page with initial data requirements.

### Pattern 2: Pure Client Component (Interactive Tools)

```tsx
"use client";
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetchData(); }, []);
  // ...
}
```

Use for: Login/register (auth entry), gantt-tool (heavy real-time interaction), settings (form-heavy).

### Pattern 3: Hybrid (Server Shell + Client Islands)

Server component provides layout/data, client components handle interactivity.

## Known Issues

1. **Hydration risk with Date formatting**: `toLocaleString()` and `formatDistanceToNow()` can produce different output on server vs client due to timezone/locale differences. Use `suppressHydrationWarning` on date elements or format dates client-side only.

2. **Admin sub-pages fetch client-side**: `/admin/approvals`, `/admin/email-approvals`, and `/admin/recovery-requests` are "use client" pages that fetch on mount. These could benefit from server-side pre-fetching but function correctly as-is.

3. **Gantt-tool size**: 1,230 lines with 40+ state variables. Decomposition plan exists in `docs/DECOMPOSITION_PLAN.md`.

## Rules for New Pages

1. Default to server components unless the page requires client-side interactivity.
2. Fetch data in server components, pass as props to client components.
3. Never use `window`, `document`, or browser APIs in server components.
4. Use `dynamic(() => import(...), { ssr: false })` for heavy client-only modules.
5. Add `suppressHydrationWarning` on elements with Date-derived content.
