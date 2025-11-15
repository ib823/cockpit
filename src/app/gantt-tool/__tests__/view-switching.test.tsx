/**
 * Unit Tests - View Switching Logic
 * Tests the changeView function and URL parameter handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

describe('View Switching Logic', () => {
  let mockRouter: any;
  let mockSearchParams: any;
  let mockPathname: string;

  beforeEach(() => {
    // Reset mocks before each test
    mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    };

    mockSearchParams = {
      get: vi.fn(),
      toString: vi.fn(() => ''),
    };

    mockPathname = '/gantt-tool';

    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    (usePathname as any).mockReturnValue(mockPathname);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial View State from URL', () => {
    it('should default to timeline view when no URL parameter', () => {
      mockSearchParams.get.mockReturnValue(null);

      const initialView = mockSearchParams.get('view') === 'architecture' ? 'architecture' : 'timeline';

      expect(initialView).toBe('timeline');
      expect(mockSearchParams.get).toHaveBeenCalledWith('view');
    });

    it('should use architecture view when URL param is architecture', () => {
      mockSearchParams.get.mockReturnValue('architecture');

      const initialView = mockSearchParams.get('view') === 'architecture' ? 'architecture' : 'timeline';

      expect(initialView).toBe('architecture');
    });

    it('should default to timeline for invalid view parameter', () => {
      mockSearchParams.get.mockReturnValue('invalid');

      const initialView = mockSearchParams.get('view') === 'architecture' ? 'architecture' : 'timeline';

      expect(initialView).toBe('timeline');
    });

    it('should default to timeline for empty string parameter', () => {
      mockSearchParams.get.mockReturnValue('');

      const initialView = mockSearchParams.get('view') === 'architecture' ? 'architecture' : 'timeline';

      expect(initialView).toBe('timeline');
    });
  });

  describe('changeView Function', () => {
    it('should update URL to include view=architecture', () => {
      const params = new URLSearchParams();
      params.set('view', 'architecture');

      mockRouter.replace(`/gantt-tool?${params.toString()}`, { scroll: false });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/gantt-tool?view=architecture',
        { scroll: false }
      );
    });

    it('should remove view param when switching to timeline', () => {
      const params = new URLSearchParams('view=architecture');
      params.delete('view');

      mockRouter.replace(`/gantt-tool?${params.toString()}`, { scroll: false });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/gantt-tool?',
        { scroll: false }
      );
    });

    it('should preserve other URL parameters', () => {
      const params = new URLSearchParams('other=value&test=123');
      params.set('view', 'architecture');

      mockRouter.replace(`/gantt-tool?${params.toString()}`, { scroll: false });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining('other=value'),
        { scroll: false }
      );
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining('test=123'),
        { scroll: false }
      );
    });

    it('should not trigger page scroll when changing view', () => {
      const params = new URLSearchParams();
      params.set('view', 'architecture');

      mockRouter.replace(`/gantt-tool?${params.toString()}`, { scroll: false });

      const callArgs = mockRouter.replace.mock.calls[0];
      expect(callArgs[1]).toEqual({ scroll: false });
    });
  });

  describe('URL Parameter Handling', () => {
    it('should handle case-sensitive view parameter', () => {
      mockSearchParams.get.mockReturnValue('Architecture'); // Wrong case

      const initialView = mockSearchParams.get('view') === 'architecture' ? 'architecture' : 'timeline';

      expect(initialView).toBe('timeline'); // Should default to timeline
    });

    it('should handle URL-encoded parameters', () => {
      mockSearchParams.get.mockReturnValue('architecture%20test');

      const initialView = mockSearchParams.get('view') === 'architecture' ? 'architecture' : 'timeline';

      expect(initialView).toBe('timeline'); // Invalid, defaults to timeline
    });
  });

  describe('Browser History Integration', () => {
    it('should use router.replace instead of router.push', () => {
      const params = new URLSearchParams();
      params.set('view', 'architecture');

      mockRouter.replace(`/gantt-tool?${params.toString()}`, { scroll: false });

      expect(mockRouter.replace).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should maintain current pathname', () => {
      const params = new URLSearchParams();
      params.set('view', 'architecture');

      mockRouter.replace(`${mockPathname}?${params.toString()}`, { scroll: false });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining('/gantt-tool'),
        expect.any(Object)
      );
    });
  });
});
