/**
 * COMPLETE L3 CATALOG
 *
 * Re-exports the full 158-item L3 catalog from parsed CSV data.
 * Maintains backward compatibility with existing code.
 */

import {
  L3_SCOPE_ITEMS,
  type L3ScopeItem,
  getL3ItemByCode,
  getL3ItemsByModule,
  getL3ItemsByTier,
  L3_MODULES,
} from "@/data/l3-catalog";

/**
 * L3 Item in formula engine format
 */
export interface L3Item {
  id: string;
  code: string;
  name: string;
  module: string;
  tier: "A" | "B" | "C";
  coefficient: number;
  description: string;
}

/**
 * Convert L3ScopeItem to L3Item (formula engine format)
 */
function convertToL3Item(item: L3ScopeItem): L3Item {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    module: item.module,
    tier: item.tier as "A" | "B" | "C",
    coefficient: item.coefficient,
    description: item.description,
  };
}

/**
 * Complete L3 catalog organized by module (158 items)
 */
export const L3_CATALOG_COMPLETE: Record<string, L3Item[]> = L3_MODULES.reduce(
  (acc, module) => {
    const items = getL3ItemsByModule(module);
    acc[module] = items
      .filter((item) => item.tier !== "D") // Exclude Tier D (extensions)
      .map(convertToL3Item);
    return acc;
  },
  {} as Record<string, L3Item[]>
);

/**
 * Enhanced L3 Catalog with complete dataset
 */
export class L3CatalogComplete {
  /**
   * Get all L3 items (149 items, excluding Tier D)
   */
  getAllItems(): L3Item[] {
    return L3_SCOPE_ITEMS.filter((item) => item.tier !== "D").map(convertToL3Item);
  }

  /**
   * Get L3 items by module
   */
  getByModule(module: string): L3Item[] {
    return L3_CATALOG_COMPLETE[module] || [];
  }

  /**
   * Get L3 items by tier
   */
  getByTier(tier: "A" | "B" | "C"): L3Item[] {
    return getL3ItemsByTier(tier).map(convertToL3Item);
  }

  /**
   * Get L3 item by ID
   */
  getById(id: string): L3Item | undefined {
    const item = L3_SCOPE_ITEMS.find((item) => item.id === id);
    return item && item.tier !== "D" ? convertToL3Item(item) : undefined;
  }

  /**
   * Get L3 item by code
   */
  getByCode(code: string): L3Item | undefined {
    const item = getL3ItemByCode(code);
    return item && item.tier !== "D" ? convertToL3Item(item) : undefined;
  }

  /**
   * Get modules with L3 items
   */
  getModules(): readonly string[] {
    return L3_MODULES;
  }

  /**
   * Get statistics
   */
  getStats() {
    const allItems = this.getAllItems();
    return {
      total: allItems.length,
      byModule: Object.fromEntries(
        L3_MODULES.map((module) => [module, this.getByModule(module).length])
      ),
      byTier: {
        A: this.getByTier("A").length,
        B: this.getByTier("B").length,
        C: this.getByTier("C").length,
      },
    };
  }

  /**
   * Search L3 items by name, description, or code
   */
  search(query: string): L3Item[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllItems().filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.code.toLowerCase().includes(lowerQuery) ||
        item.module.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get recommended L3 items for a profile
   */
  getRecommendedForProfile(modules: string[]): L3Item[] {
    return modules.flatMap((module) => {
      const items = this.getByModule(module);
      // Return top 5-10 most common items per module
      return items.filter((item) => item.tier === "A" || item.tier === "B").slice(0, 8);
    });
  }
}

// Export singleton instance
export const l3CatalogComplete = new L3CatalogComplete();

// Export statistics for reference
export const L3_STATS_COMPLETE = l3CatalogComplete.getStats();

// Export for backward compatibility
export { L3_CATALOG_COMPLETE as L3_CATALOG };
export { l3CatalogComplete as l3Catalog };
