/**
 * L3 CATALOG TESTS
 *
 * Unit tests for L3 item catalog.
 */

import { describe, it, expect } from 'vitest';
import { L3Catalog, L3_CATALOG, L3_STATS } from '@/lib/estimator/l3-catalog';

describe('L3Catalog', () => {
  const catalog = new L3Catalog();

  describe('getAllItems', () => {
    it('should return all L3 items', () => {
      const items = catalog.getAllItems();
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have valid structure', () => {
      const items = catalog.getAllItems();
      items.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.code).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.module).toBeDefined();
        expect(item.tier).toMatch(/^[ABC]$/);
        expect(item.coefficient).toBeGreaterThan(0);
        expect(item.description).toBeDefined();
      });
    });
  });

  describe('getByModule', () => {
    it('should return FI items', () => {
      const items = catalog.getByModule('FI');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.module).toBe('FI');
      });
    });

    it('should return empty array for invalid module', () => {
      const items = catalog.getByModule('INVALID');
      expect(items).toEqual([]);
    });
  });

  describe('getByTier', () => {
    it('should return Tier A items', () => {
      const items = catalog.getByTier('A');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.tier).toBe('A');
        expect(item.coefficient).toBe(0.006);
      });
    });

    it('should return Tier B items', () => {
      const items = catalog.getByTier('B');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.tier).toBe('B');
        expect(item.coefficient).toBe(0.008);
      });
    });

    it('should return Tier C items', () => {
      const items = catalog.getByTier('C');
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.tier).toBe('C');
        expect(item.coefficient).toBe(0.010);
      });
    });
  });

  describe('getById', () => {
    it('should find item by ID', () => {
      const item = catalog.getById('fi-2tw');
      expect(item).toBeDefined();
      expect(item?.id).toBe('fi-2tw');
      expect(item?.code).toBe('2TW');
    });

    it('should return undefined for invalid ID', () => {
      const item = catalog.getById('invalid');
      expect(item).toBeUndefined();
    });
  });

  describe('getByCode', () => {
    it('should find item by code', () => {
      const item = catalog.getByCode('2TW');
      expect(item).toBeDefined();
      expect(item?.code).toBe('2TW');
      expect(item?.name).toBe('GL Master Data');
    });

    it('should return undefined for invalid code', () => {
      const item = catalog.getByCode('INVALID');
      expect(item).toBeUndefined();
    });
  });

  describe('getModules', () => {
    it('should return list of modules', () => {
      const modules = catalog.getModules();
      expect(modules).toContain('FI');
      expect(modules).toContain('CO');
      expect(modules).toContain('MM');
    });

    it('should not have duplicates', () => {
      const modules = catalog.getModules();
      const unique = [...new Set(modules)];
      expect(modules).toEqual(unique);
    });
  });

  describe('getStats', () => {
    it('should return catalog statistics', () => {
      const stats = catalog.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byModule).toBeDefined();
      expect(stats.byTier).toBeDefined();
    });

    it('should have consistent totals', () => {
      const stats = catalog.getStats();
      const moduleSum = Object.values(stats.byModule).reduce(
        (sum, count) => sum + count,
        0
      );
      const tierSum = stats.byTier.A + stats.byTier.B + stats.byTier.C;

      expect(moduleSum).toBe(stats.total);
      expect(tierSum).toBe(stats.total);
    });
  });

  describe('search', () => {
    it('should find items by name', () => {
      const results = catalog.search('master');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((item) => {
        expect(item.name.toLowerCase()).toContain('master');
      });
    });

    it('should find items by code', () => {
      const results = catalog.search('2TW');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((item) => {
        expect(item.code.toLowerCase()).toContain('2tw');
      });
    });

    it('should find items by description', () => {
      const results = catalog.search('invoice');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const lower = catalog.search('master');
      const upper = catalog.search('MASTER');
      expect(lower.length).toBe(upper.length);
    });

    it('should return empty array for no matches', () => {
      const results = catalog.search('xyzabc123');
      expect(results).toEqual([]);
    });
  });

  describe('L3_CATALOG structure', () => {
    it('should have FI module', () => {
      expect(L3_CATALOG.FI).toBeDefined();
      expect(L3_CATALOG.FI.length).toBeGreaterThan(0);
    });

    it('should have CO module', () => {
      expect(L3_CATALOG.CO).toBeDefined();
      expect(L3_CATALOG.CO.length).toBeGreaterThan(0);
    });

    it('should have MM module', () => {
      expect(L3_CATALOG.MM).toBeDefined();
      expect(L3_CATALOG.MM.length).toBeGreaterThan(0);
    });

    it('should have unique L3 IDs', () => {
      const allItems = catalog.getAllItems();
      const ids = allItems.map((item) => item.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should have unique L3 codes', () => {
      const allItems = catalog.getAllItems();
      const codes = allItems.map((item) => item.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });
  });

  describe('L3_STATS', () => {
    it('should be pre-computed', () => {
      expect(L3_STATS.total).toBeGreaterThan(0);
      expect(L3_STATS.byModule).toBeDefined();
      expect(L3_STATS.byTier).toBeDefined();
    });

    it('should match catalog stats', () => {
      const stats = catalog.getStats();
      expect(L3_STATS.total).toBe(stats.total);
      expect(L3_STATS.byTier.A).toBe(stats.byTier.A);
      expect(L3_STATS.byTier.B).toBe(stats.byTier.B);
      expect(L3_STATS.byTier.C).toBe(stats.byTier.C);
    });
  });
});
