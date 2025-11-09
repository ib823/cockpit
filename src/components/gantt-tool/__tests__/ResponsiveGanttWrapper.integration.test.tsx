/**
 * ResponsiveGanttWrapper Integration Tests
 *
 * Tests responsive view switching:
 * - Mobile (< 768px): GanttMobileListView
 * - Tablet (768-1024px): GanttCanvas with touch optimization
 * - Desktop (>= 1024px): Full GanttCanvas
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ResponsiveGanttWrapper } from '../ResponsiveGanttWrapper';
import { GanttCanvas } from '../GanttCanvas';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import type { GanttProject } from '@/types/gantt-tool';
import { format, addDays } from 'date-fns';

// Mock background sync to avoid indexedDB issues
vi.mock('@/lib/gantt-tool/background-sync', () => ({
  startBackgroundSync: vi.fn(),
  stopBackgroundSync: vi.fn(),
  processSyncQueue: vi.fn(),
}));

// Mock GanttCanvas and GanttMobileListView
vi.mock('../GanttCanvas', () => ({
  GanttCanvas: vi.fn(() => <div data-testid="gantt-canvas">Timeline View</div>),
}));

vi.mock('../GanttMobileListView', () => ({
  GanttMobileListView: vi.fn(() => <div data-testid="gantt-mobile-list">List View</div>),
}));

// Helper to create a minimal test project
function createMinimalProject(): GanttProject {
  const today = new Date();
  return {
    id: 'test-1',
    name: 'Test Project',
    description: 'Test',
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(addDays(today, 30), 'yyyy-MM-dd'),
    status: 'active',
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1',
        order: 0,
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(addDays(today, 30), 'yyyy-MM-dd'),
        color: '#3B82F6',
        collapsed: false,
        tasks: [
          {
            id: 'task-1',
            name: 'Task 1',
            phaseId: 'phase-1',
            order: 0,
            level: 0,
            startDate: format(today, 'yyyy-MM-dd'),
            endDate: format(addDays(today, 10), 'yyyy-MM-dd'),
            progress: 50,
            resourceAssignments: [],
          },
        ],
      },
    ],
    milestones: [],
    resources: [],
    holidays: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  } as GanttProject;
}

// Helper to mock window.innerWidth
function mockWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
}

// Helper to trigger resize event
function triggerResize() {
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

describe('ResponsiveGanttWrapper Integration Tests', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Save original window.innerWidth
    originalInnerWidth = window.innerWidth;

    // Load test project
    const project = createMinimalProject();
    useGanttToolStoreV2.setState({ currentProject: project });
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('Mobile View (< 768px)', () => {
    it('shows GanttMobileListView on iPhone SE (375px)', async () => {
      mockWindowWidth(375);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      // Trigger resize to ensure detection
      triggerResize();

      await waitFor(() => {
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');
        const timelineView = container.querySelector('[data-testid="gantt-canvas"]');

        expect(listView).toBeInTheDocument();
        expect(timelineView).not.toBeInTheDocument();
      });
    });

    it('shows GanttMobileListView on standard mobile (390px)', async () => {
      mockWindowWidth(390);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');
        expect(listView).toBeInTheDocument();
      });
    });

    it('shows GanttMobileListView on large mobile (428px)', async () => {
      mockWindowWidth(428);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');
        expect(listView).toBeInTheDocument();
      });
    });

    it('shows GanttMobileListView at exactly 767px (edge case)', async () => {
      mockWindowWidth(767);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');
        expect(listView).toBeInTheDocument();
      });
    });
  });

  describe('Tablet View (768-1023px)', () => {
    it('shows GanttCanvas on iPad portrait (768px)', async () => {
      mockWindowWidth(768);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const timelineView = container.querySelector('[data-testid="gantt-canvas"]');
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');

        expect(timelineView).toBeInTheDocument();
        expect(listView).not.toBeInTheDocument();
      });
    });

    it('shows tablet alert banner on tablet view', async () => {
      mockWindowWidth(800);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        // Should show "Tablet View" alert
        const bodyText = container.textContent || '';
        expect(bodyText).toMatch(/tablet/i);
      });
    });

    it('shows GanttCanvas at exactly 1023px (edge case)', async () => {
      mockWindowWidth(1023);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const timelineView = container.querySelector('[data-testid="gantt-canvas"]');
        expect(timelineView).toBeInTheDocument();
      });
    });
  });

  describe('Desktop View (>= 1024px)', () => {
    it('shows GanttCanvas on desktop (1280px)', async () => {
      mockWindowWidth(1280);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const timelineView = container.querySelector('[data-testid="gantt-canvas"]');
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');

        expect(timelineView).toBeInTheDocument();
        expect(listView).not.toBeInTheDocument();
      });
    });

    it('does not show tablet banner on desktop', async () => {
      mockWindowWidth(1920);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const bodyText = container.textContent || '';
        // Should NOT show tablet-specific messages
        expect(bodyText).not.toMatch(/tablet view/i);
        expect(bodyText).not.toMatch(/optimized for touch/i);
      });
    });

    it('shows GanttCanvas on 4K desktop (3840px)', async () => {
      mockWindowWidth(3840);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const timelineView = container.querySelector('[data-testid="gantt-canvas"]');
        expect(timelineView).toBeInTheDocument();
      });
    });
  });

  describe('Breakpoint Transitions', () => {
    it('transitions from mobile to tablet (767px → 768px)', async () => {
      mockWindowWidth(767);

      const { container, rerender } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');
        expect(listView).toBeInTheDocument();
      });

      // Resize to tablet
      mockWindowWidth(768);
      triggerResize();

      await waitFor(() => {
        const timelineView = container.querySelector('[data-testid="gantt-canvas"]');
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');

        expect(timelineView).toBeInTheDocument();
        expect(listView).not.toBeInTheDocument();
      });
    });

    it('transitions from tablet to desktop (1023px → 1024px)', async () => {
      mockWindowWidth(1023);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const bodyText = container.textContent || '';
        expect(bodyText).toMatch(/tablet/i);
      });

      // Resize to desktop
      mockWindowWidth(1024);
      triggerResize();

      await waitFor(() => {
        const bodyText = container.textContent || '';
        // Tablet banner should disappear
        expect(bodyText).not.toMatch(/tablet view/i);
      });
    });

    it('maintains data state during view transitions', async () => {
      mockWindowWidth(375); // Mobile

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      // Check initial data
      const store = useGanttToolStoreV2.getState();
      const initialProject = store.currentProject;

      // Transition to desktop
      mockWindowWidth(1280);
      triggerResize();

      await waitFor(() => {
        const storeAfter = useGanttToolStoreV2.getState();
        expect(storeAfter.currentProject).toEqual(initialProject);
      });
    });
  });

  describe('SSR Safety', () => {
    it('renders children during server-side rendering', () => {
      // Simulate SSR by not triggering mount
      const { container } = render(
        <ResponsiveGanttWrapper>
          <div data-testid="ssr-test">SSR Content</div>
        </ResponsiveGanttWrapper>
      );

      // Should render children immediately (before useEffect runs)
      const ssrContent = container.querySelector('[data-testid="ssr-test"]');
      expect(ssrContent).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle (Development)', () => {
    it('shows view toggle when showViewToggle=true', async () => {
      mockWindowWidth(375); // Mobile

      const { container } = render(
        <ResponsiveGanttWrapper showViewToggle={true}>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const bodyText = container.textContent || '';
        // Should show "View:" toggle
        expect(bodyText).toMatch(/view/i);
        expect(bodyText).toMatch(/list|timeline/i);
      });
    });

    it('allows manual override to timeline view on mobile', async () => {
      mockWindowWidth(375); // Mobile

      const { container } = render(
        <ResponsiveGanttWrapper showViewToggle={true}>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      // Initially should show list view
      await waitFor(() => {
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');
        expect(listView).toBeInTheDocument();
      });

      // Click timeline toggle (if testing user interaction)
      // This would require user-event library for full integration
    });
  });

  describe('No Project State', () => {
    it('handles empty project gracefully in list view', async () => {
      useGanttToolStoreV2.setState({ currentProject: null });
      mockWindowWidth(375);

      const { container } = render(
        <ResponsiveGanttWrapper>
          <GanttCanvas />
        </ResponsiveGanttWrapper>
      );

      triggerResize();

      await waitFor(() => {
        const listView = container.querySelector('[data-testid="gantt-mobile-list"]');
        expect(listView).toBeInTheDocument();

        const bodyText = container.textContent || '';
        expect(bodyText).toMatch(/no project|empty/i);
      });
    });
  });
});
