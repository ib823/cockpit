/**
 * L3 CATALOG
 *
 * SAP L3 Process Navigator items with tier classification.
 * Each L3 item represents a testable business process unit.
 *
 * Tier classification:
 * - Tier A (0.006): Standard config, single variant, low risk
 * - Tier B (0.008): Cross-module touch, 2 variants, medium risk
 * - Tier C (0.010): E2E statutory, 3+ variants, high risk
 */

import type { L3Item } from './formula-engine';
import { TIER_COEFFICIENTS } from './formula-engine';

/**
 * Complete L3 catalog organized by module
 */
export const L3_CATALOG: Record<string, L3Item[]> = {
  // FINANCE (FI)
  FI: [
    {
      id: 'fi-2tw',
      code: '2TW',
      name: 'GL Master Data',
      module: 'FI',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Chart of accounts, GL accounts, cost centers'
    },
    {
      id: 'fi-2tx',
      code: '2TX',
      name: 'Accounts Payable',
      module: 'FI',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Vendor invoices, payments, aging'
    },
    {
      id: 'fi-2ty',
      code: '2TY',
      name: 'Accounts Receivable',
      module: 'FI',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Customer invoices, collections, dunning'
    },
    {
      id: 'fi-2tz',
      code: '2TZ',
      name: 'Asset Accounting',
      module: 'FI',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Fixed assets, depreciation, transfers'
    },
    {
      id: 'fi-2u0',
      code: '2U0',
      name: 'Bank Accounting',
      module: 'FI',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Bank statements, cash management, reconciliation'
    },
    {
      id: 'fi-2u1',
      code: '2U1',
      name: 'Financial Closing',
      module: 'FI',
      tier: 'C',
      coefficient: TIER_COEFFICIENTS.C,
      description: 'Period close, month-end, year-end, statutory reports'
    },
    {
      id: 'fi-2u2',
      code: '2U2',
      name: 'Intercompany Accounting',
      module: 'FI',
      tier: 'C',
      coefficient: TIER_COEFFICIENTS.C,
      description: 'IC transactions, reconciliation, elimination'
    },
    {
      id: 'fi-2u3',
      code: '2U3',
      name: 'Tax Accounting',
      module: 'FI',
      tier: 'C',
      coefficient: TIER_COEFFICIENTS.C,
      description: 'VAT, GST, withholding tax, tax returns'
    }
  ],

  // CONTROLLING (CO)
  CO: [
    {
      id: 'co-2u4',
      code: '2U4',
      name: 'Cost Center Accounting',
      module: 'CO',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Cost center planning, actuals, variance analysis'
    },
    {
      id: 'co-2u5',
      code: '2U5',
      name: 'Internal Orders',
      module: 'CO',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Order creation, budgeting, settlement'
    },
    {
      id: 'co-2u6',
      code: '2U6',
      name: 'Product Costing',
      module: 'CO',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Standard costing, material ledger, variance'
    },
    {
      id: 'co-2u7',
      code: '2U7',
      name: 'Profitability Analysis',
      module: 'CO',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'CO-PA, segment reporting, contribution margin'
    },
    {
      id: 'co-2u8',
      code: '2U8',
      name: 'Profit Center Accounting',
      module: 'CO',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Profit centers, transfer pricing, P&L'
    }
  ],

  // MATERIALS MANAGEMENT (MM)
  MM: [
    {
      id: 'mm-2u9',
      code: '2U9',
      name: 'Material Master',
      module: 'MM',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Material creation, classification, views'
    },
    {
      id: 'mm-2ua',
      code: '2UA',
      name: 'Purchasing',
      module: 'MM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'PR, PO, vendor selection, approval workflow'
    },
    {
      id: 'mm-2ub',
      code: '2UB',
      name: 'Goods Receipt',
      module: 'MM',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'GR posting, quality inspection, stock updates'
    },
    {
      id: 'mm-2uc',
      code: '2UC',
      name: 'Invoice Verification',
      module: 'MM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'IR, 3-way match, blocking, release'
    },
    {
      id: 'mm-2ud',
      code: '2UD',
      name: 'Inventory Management',
      module: 'MM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Stock movements, transfers, physical inventory'
    },
    {
      id: 'mm-2ue',
      code: '2UE',
      name: 'Vendor Master',
      module: 'MM',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Vendor creation, bank details, payment terms'
    }
  ],

  // SALES & DISTRIBUTION (SD)
  SD: [
    {
      id: 'sd-2uf',
      code: '2UF',
      name: 'Customer Master',
      module: 'SD',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Customer creation, credit management, partners'
    },
    {
      id: 'sd-2ug',
      code: '2UG',
      name: 'Sales Order Processing',
      module: 'SD',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Quotation, order, pricing, availability check'
    },
    {
      id: 'sd-2uh',
      code: '2UH',
      name: 'Delivery Processing',
      module: 'SD',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Outbound delivery, picking, packing, shipping'
    },
    {
      id: 'sd-2ui',
      code: '2UI',
      name: 'Billing',
      module: 'SD',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Invoice creation, credit/debit memos, cancellation'
    },
    {
      id: 'sd-2uj',
      code: '2UJ',
      name: 'Pricing & Conditions',
      module: 'SD',
      tier: 'C',
      coefficient: TIER_COEFFICIENTS.C,
      description: 'Condition types, pricing procedures, discounts'
    },
    {
      id: 'sd-2uk',
      code: '2UK',
      name: 'Credit Management',
      module: 'SD',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Credit checks, limits, blocking, release'
    }
  ],

  // PRODUCTION PLANNING (PP)
  PP: [
    {
      id: 'pp-2ul',
      code: '2UL',
      name: 'Production Orders',
      module: 'PP',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Order creation, release, confirmation, settlement'
    },
    {
      id: 'pp-2um',
      code: '2UM',
      name: 'MRP',
      module: 'PP',
      tier: 'C',
      coefficient: TIER_COEFFICIENTS.C,
      description: 'Material requirements planning, planning run'
    },
    {
      id: 'pp-2un',
      code: '2UN',
      name: 'BOM & Routing',
      module: 'PP',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Bill of materials, work centers, routings'
    },
    {
      id: 'pp-2uo',
      code: '2UO',
      name: 'Capacity Planning',
      module: 'PP',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Work center capacity, leveling, scheduling'
    }
  ],

  // WAREHOUSE MANAGEMENT (WM)
  WM: [
    {
      id: 'wm-2up',
      code: '2UP',
      name: 'Goods Receipt',
      module: 'WM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Inbound delivery, putaway, storage'
    },
    {
      id: 'wm-2uq',
      code: '2UQ',
      name: 'Goods Issue',
      module: 'WM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Outbound delivery, picking, loading'
    },
    {
      id: 'wm-2ur',
      code: '2UR',
      name: 'Stock Transfers',
      module: 'WM',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Internal transfers, replenishment'
    },
    {
      id: 'wm-2us',
      code: '2US',
      name: 'Physical Inventory',
      module: 'WM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Cycle counting, inventory differences'
    }
  ],

  // QUALITY MANAGEMENT (QM)
  QM: [
    {
      id: 'qm-2ut',
      code: '2UT',
      name: 'Inspection Planning',
      module: 'QM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Inspection plans, characteristics, sampling'
    },
    {
      id: 'qm-2uu',
      code: '2UU',
      name: 'Inspection Execution',
      module: 'QM',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Results recording, usage decision'
    },
    {
      id: 'qm-2uv',
      code: '2UV',
      name: 'Quality Notifications',
      module: 'QM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Defect recording, actions, closure'
    }
  ],

  // PLANT MAINTENANCE (PM)
  PM: [
    {
      id: 'pm-2uw',
      code: '2UW',
      name: 'Maintenance Orders',
      module: 'PM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Order creation, planning, execution, completion'
    },
    {
      id: 'pm-2ux',
      code: '2UX',
      name: 'Preventive Maintenance',
      module: 'PM',
      tier: 'B',
      coefficient: TIER_COEFFICIENTS.B,
      description: 'Maintenance plans, scheduling, strategy'
    },
    {
      id: 'pm-2uy',
      code: '2UY',
      name: 'Equipment Master',
      module: 'PM',
      tier: 'A',
      coefficient: TIER_COEFFICIENTS.A,
      description: 'Equipment creation, BOM, structure'
    }
  ]
};

/**
 * Helper functions for catalog access
 */
export class L3Catalog {
  /**
   * Get all L3 items
   */
  getAllItems(): L3Item[] {
    return Object.values(L3_CATALOG).flat();
  }

  /**
   * Get L3 items by module
   */
  getByModule(module: string): L3Item[] {
    return L3_CATALOG[module] || [];
  }

  /**
   * Get L3 items by tier
   */
  getByTier(tier: 'A' | 'B' | 'C'): L3Item[] {
    return this.getAllItems().filter(item => item.tier === tier);
  }

  /**
   * Get L3 item by ID
   */
  getById(id: string): L3Item | undefined {
    return this.getAllItems().find(item => item.id === id);
  }

  /**
   * Get L3 item by code
   */
  getByCode(code: string): L3Item | undefined {
    return this.getAllItems().find(item => item.code === code);
  }

  /**
   * Get modules with L3 items
   */
  getModules(): string[] {
    return Object.keys(L3_CATALOG);
  }

  /**
   * Get statistics
   */
  getStats() {
    const allItems = this.getAllItems();
    return {
      total: allItems.length,
      byModule: Object.fromEntries(
        Object.entries(L3_CATALOG).map(([module, items]) => [module, items.length])
      ),
      byTier: {
        A: this.getByTier('A').length,
        B: this.getByTier('B').length,
        C: this.getByTier('C').length
      }
    };
  }

  /**
   * Search L3 items by name or description
   */
  search(query: string): L3Item[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllItems().filter(
      item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.code.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
export const l3Catalog = new L3Catalog();

// Export statistics for reference
export const L3_STATS = l3Catalog.getStats();
