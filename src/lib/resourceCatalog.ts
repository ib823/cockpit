import catalogFile from "@/config/resources.json" assert { type: "json" };
import type { ResourceWeekAlloc } from "@/types/gantt";

type CatalogItem = { id: string; name: string; required: string[] };
const CATALOG: CatalogItem[] = catalogFile.catalog as any;
const ALIASES: Record<string, string[]> = catalogFile.aliases as any;

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function resolveRole(name: string): { id: string; name: string } | null {
  const n = norm(name);
  // exact by name
  const exact = CATALOG.find((c) => norm(c.name) === n);
  if (exact) return { id: exact.id, name: exact.name };
  // by alias
  for (const [id, list] of Object.entries(ALIASES)) {
    if (list.some((a) => n === norm(a))) {
      const c = CATALOG.find((x) => x.id === id)!;
      return { id: c.id, name: c.name };
    }
  }
  // fuzzy contains
  for (const [id, list] of Object.entries(ALIASES)) {
    if (list.some((a) => n.includes(norm(a)))) {
      const c = CATALOG.find((x) => x.id === id)!;
      return { id: c.id, name: c.name };
    }
  }
  return null;
}

export function validateAllocationsAgainstCatalog(
  allocs: ResourceWeekAlloc[],
  activeByWeek: Record<number, string>
) {
  const unknownRoles = new Set<string>();
  const orphanWeeks: { role: string; week: number }[] = [];

  // check mapping + orphan weeks
  for (const a of allocs) {
    const resolved = resolveRole(a.roleName);
    if (!resolved) unknownRoles.add(a.roleName);
    if (!activeByWeek[a.week]) orphanWeeks.push({ role: a.roleName, week: a.week });
  }

  if (unknownRoles.size || orphanWeeks.length) {
    const msgs: string[] = [];
    if (unknownRoles.size)
      msgs.push(`Unmapped roles: ${[...unknownRoles].map((r) => `"${r}"`).join(", ")}`);
    if (orphanWeeks.length)
      msgs.push(
        `Allocations mapped to weeks without active tasks: ${orphanWeeks
          .slice(0, 10)
          .map((x) => `${x.role}@W${x.week}`)
          .join(", ")}${orphanWeeks.length > 10 ? "…" : ""}`
      );
    const err = msgs.join(" | ");
    throw new Error(err);
  }

  // Return allocs with resolved roleId for downstream systems
  return allocs.map((a) => {
    const r = resolveRole(a.roleName)!;
    return { ...a, roleId: r.id };
  });
}
