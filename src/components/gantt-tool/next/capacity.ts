/**
 * Strangler seam — resource capacity results → the capacity matrix.
 *
 * The numbers come from `calculateResourceCapacity`, the same calculator the
 * legacy panel uses with the same inputs, so the two panels can never show
 * different allocations for the same plan. This file only reshapes: aligned
 * per-week percentage arrays for the matrix, and the search haystack.
 *
 * The haystack reproduces legacy's four searchable fields exactly — name,
 * category label, company name, project role — because "search finds it in
 * one panel but not the other" is the kind of parity break that erodes trust
 * in the whole port.
 */

import { format } from "date-fns";
import type { Resource } from "@/types/gantt-tool";
import { RESOURCE_CATEGORIES } from "@/types/gantt-tool";
import type {
  ResourceCapacityResult,
} from "@/lib/gantt-tool/resource-capacity-calculator";
import type {
  CapacityColumn,
  CapacityRow,
} from "@/components/ds/gantt/GanttCapacityPanel";

export interface CapacityMatrix {
  columns: CapacityColumn[];
  rows: CapacityRow[];
}

export function toCapacityMatrix(
  results: ResourceCapacityResult[],
  resources: Resource[]
): CapacityMatrix {
  if (results.length === 0) return { columns: [], rows: [] };

  const resourceById = new Map(resources.map((r) => [r.id, r]));

  // Every result carries the same project weeks (the calculator builds them
  // once from the project bounds), so the first result defines the columns.
  const columns: CapacityColumn[] = results[0].weeks.map((week) => ({
    key: week.weekIdentifier,
    label: week.weekIdentifier,
    title: `${week.weekIdentifier}, ${format(week.weekStartDate, "d MMM")} – ${format(
      week.weekEndDate,
      "d MMM yy"
    )}`,
  }));

  const rows: CapacityRow[] = results.map((result) => {
    const resource = resourceById.get(result.resourceId);
    const category =
      RESOURCE_CATEGORIES[
        (resource?.category ?? "other") as keyof typeof RESOURCE_CATEGORIES
      ] ?? RESOURCE_CATEGORIES.other;

    return {
      id: result.resourceId,
      name: result.resourceName,
      meta: category.label,
      // Legacy's four fields, lower-cased once here instead of per keystroke.
      searchText: [
        result.resourceName,
        category.label,
        resource?.companyName ?? "",
        resource?.projectRole ?? "",
      ]
        .join(" ")
        .toLowerCase(),
      percents: result.weeks.map((week) => week.allocatedPercent),
    };
  });

  return { columns, rows };
}
