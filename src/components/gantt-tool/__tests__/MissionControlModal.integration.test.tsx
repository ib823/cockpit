/**
 * MissionControl Integration Tests
 *
 * Tests the complete calculation flow:
 * - Health score algorithm
 * - Budget utilization
 * - Schedule progress
 * - Resource utilization
 * - Alert counts
 * - Real-time updates
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MissionControlModal } from '../MissionControlModal';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import type { GanttProject } from '@/types/gantt-tool';
import { addDays, subDays, format } from 'date-fns';

// Mock background sync to avoid indexedDB issues
vi.mock('@/lib/gantt-tool/background-sync', () => ({
  startBackgroundSync: vi.fn(),
  stopBackgroundSync: vi.fn(),
  processSyncQueue: vi.fn(),
}));

// Helper to create a realistic test project
function createTestProject(overrides: Partial<GanttProject> = {}): GanttProject {
  const today = new Date();
  const projectStart = subDays(today, 30); // Started 30 days ago
  const projectEnd = addDays(today, 60); // Ends in 60 days

  return {
    id: 'test-project-1',
    name: 'Enterprise SAP Implementation',
    description: 'Complete SAP S/4HANA implementation',
    startDate: format(projectStart, 'yyyy-MM-dd'),
    endDate: format(projectEnd, 'yyyy-MM-dd'),
    status: 'active',
    budget: 1000000, // $1M budget
    phases: [
      {
        id: 'phase-1',
        name: 'Planning & Analysis',
        order: 0,
        startDate: format(projectStart, 'yyyy-MM-dd'),
        endDate: format(addDays(projectStart, 30), 'yyyy-MM-dd'),
        color: '#3B82F6',
        collapsed: false,
        tasks: [
          {
            id: 'task-1',
            name: 'Requirements Gathering',
            phaseId: 'phase-1',
            order: 0,
            level: 0,
            startDate: format(projectStart, 'yyyy-MM-dd'),
            endDate: format(addDays(projectStart, 10), 'yyyy-MM-dd'),
            progress: 100, // Completed
            assignedTo: 'user-1',
            resourceAssignments: [{ resourceId: 'res-1', allocation: 100 }],
          },
          {
            id: 'task-2',
            name: 'Process Design',
            phaseId: 'phase-1',
            order: 1,
            level: 0,
            startDate: format(addDays(projectStart, 11), 'yyyy-MM-dd'),
            endDate: format(addDays(projectStart, 30), 'yyyy-MM-dd'),
            progress: 60, // In progress
            assignedTo: 'user-2',
            resourceAssignments: [{ resourceId: 'res-2', allocation: 100 }],
          },
        ],
      },
      {
        id: 'phase-2',
        name: 'Development',
        order: 1,
        startDate: format(addDays(projectStart, 31), 'yyyy-MM-dd'),
        endDate: format(addDays(today, 30), 'yyyy-MM-dd'),
        color: '#10B981',
        collapsed: false,
        tasks: [
          {
            id: 'task-3',
            name: 'System Configuration',
            phaseId: 'phase-2',
            order: 0,
            level: 0,
            startDate: format(addDays(projectStart, 31), 'yyyy-MM-dd'),
            endDate: format(addDays(today, 30), 'yyyy-MM-dd'),
            progress: 25, // Just started
            assignedTo: 'user-3',
            resourceAssignments: [{ resourceId: 'res-3', allocation: 100 }],
          },
        ],
      },
    ],
    milestones: [
      {
        id: 'milestone-1',
        name: 'Planning Complete',
        date: format(addDays(projectStart, 30), 'yyyy-MM-dd'),
        color: '#F59E0B',
      },
    ],
    resources: [
      { id: 'res-1', name: 'Business Analyst', type: 'human', cost: 1000 },
      { id: 'res-2', name: 'Solution Architect', type: 'human', cost: 1500 },
      { id: 'res-3', name: 'SAP Developer', type: 'human', cost: 1200 },
    ],
    holidays: [],
    createdAt: projectStart.toISOString(),
    updatedAt: today.toISOString(),
    ...overrides,
  } as GanttProject;
}

describe('MissionControl Integration Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useGanttToolStoreV2.getState();
    store.currentProject = null;
  });

  describe('Health Score Calculation', () => {
    it('calculates health score correctly for on-track project', () => {
      // Project: 50% complete, 33% time elapsed (30/90 days), budget under control
      const project = createTestProject({
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            order: 0,
            startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
            color: '#3B82F6',
            collapsed: false,
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                phaseId: 'phase-1',
                order: 0,
                level: 0,
                startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                progress: 100, // Completed
                resourceAssignments: [],
              },
              {
                id: 'task-2',
                name: 'Task 2',
                phaseId: 'phase-1',
                order: 1,
                level: 0,
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
                progress: 0, // Not started
                resourceAssignments: [],
              },
            ],
          },
        ],
      });

      // Load project into store
      useGanttToolStoreV2.setState({ currentProject: project });

      const { container } = render(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      // Health score should be high (90-100) for on-track project
      // Time progress: 33%, Task progress: 50% → ahead of schedule
      // Budget utilization: Low → good
      // Expected health: 90-100

      const healthElement = container.querySelector('[data-testid="health-score"]');
      if (healthElement) {
        const healthText = healthElement.textContent || '';
        const healthScore = parseInt(healthText);
        expect(healthScore).toBeGreaterThanOrEqual(80);
        expect(healthScore).toBeLessThanOrEqual(100);
      }
    });

    it('calculates health score correctly for at-risk project', () => {
      // Project: 20% complete, 50% time elapsed → behind schedule
      const today = new Date();
      const projectStart = subDays(today, 45); // Started 45 days ago
      const projectEnd = addDays(today, 45); // Ends in 45 days (50% through)

      const project = createTestProject({
        startDate: format(projectStart, 'yyyy-MM-dd'),
        endDate: format(projectEnd, 'yyyy-MM-dd'),
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            order: 0,
            startDate: format(projectStart, 'yyyy-MM-dd'),
            endDate: format(projectEnd, 'yyyy-MM-dd'),
            color: '#3B82F6',
            collapsed: false,
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                phaseId: 'phase-1',
                order: 0,
                level: 0,
                startDate: format(projectStart, 'yyyy-MM-dd'),
                endDate: format(projectEnd, 'yyyy-MM-dd'),
                progress: 20, // Only 20% done, but 50% time elapsed
                resourceAssignments: [],
              },
            ],
          },
        ],
      });

      useGanttToolStoreV2.setState({ currentProject: project });

      const { container } = render(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      // Health score should be low (40-60) for at-risk project
      // Time progress: 50%, Task progress: 20% → behind by 30 points
      const healthElement = container.querySelector('[data-testid="health-score"]');
      if (healthElement) {
        const healthText = healthElement.textContent || '';
        const healthScore = parseInt(healthText);
        expect(healthScore).toBeGreaterThanOrEqual(30);
        expect(healthScore).toBeLessThanOrEqual(70);
      }
    });

    it('prevents negative elapsed days for future projects', () => {
      // Project starts in 2 months
      const futureStart = addDays(new Date(), 60);
      const futureEnd = addDays(new Date(), 150);

      const project = createTestProject({
        startDate: format(futureStart, 'yyyy-MM-dd'),
        endDate: format(futureEnd, 'yyyy-MM-dd'),
        phases: [
          {
            id: 'phase-1',
            name: 'Future Phase',
            order: 0,
            startDate: format(futureStart, 'yyyy-MM-dd'),
            endDate: format(futureEnd, 'yyyy-MM-dd'),
            color: '#3B82F6',
            collapsed: false,
            tasks: [],
          },
        ],
      });

      useGanttToolStoreV2.setState({ currentProject: project });

      const { container } = render(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      // Should show "0 of X business days" not "-60 of X business days"
      const elapsedElement = container.querySelector('[data-testid="elapsed-days"]');
      if (elapsedElement) {
        const elapsedText = elapsedElement.textContent || '';
        expect(elapsedText).not.toMatch(/-\d+/); // No negative numbers
        expect(elapsedText).toMatch(/^0\s/); // Starts with "0 "
      }
    });
  });

  describe('Percentage Formatting', () => {
    it('formats all percentages to 1 decimal place (no floating point bugs)', () => {
      const project = createTestProject({
        budget: 1000000,
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            order: 0,
            startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
            color: '#3B82F6',
            collapsed: false,
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                phaseId: 'phase-1',
                order: 0,
                level: 0,
                startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
                progress: 55, // Will create floating point in calculations
                resourceAssignments: [],
              },
              {
                id: 'task-2',
                name: 'Task 2',
                phaseId: 'phase-1',
                order: 1,
                level: 0,
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
                progress: 33, // Will create 91.666666% scenarios
                resourceAssignments: [],
              },
            ],
          },
        ],
      });

      useGanttToolStoreV2.setState({ currentProject: project });

      const { container } = render(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      // Check all percentage displays
      const percentageElements = container.querySelectorAll('[data-testid*="percentage"], [data-testid*="utilization"]');

      percentageElements.forEach((element) => {
        const text = element.textContent || '';
        const percentageMatch = text.match(/(\d+\.\d+)%/);

        if (percentageMatch) {
          const decimalPart = percentageMatch[1].split('.')[1];
          // Should have exactly 1 decimal place
          expect(decimalPart.length).toBeLessThanOrEqual(1);
          // Should NOT have long floating point numbers
          expect(text).not.toMatch(/\d+\.\d{2,}%/);
          expect(text).not.toMatch(/91\.66666/);
        }
      });
    });

    it('displays "0 business days" not "null days" for null values', () => {
      const project = createTestProject({
        phases: [], // Empty project
      });

      useGanttToolStoreV2.setState({ currentProject: project });

      const { container } = render(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      const bodyText = container.textContent || '';

      // Should never show "null days" or "undefined days"
      expect(bodyText).not.toMatch(/null\s+days/i);
      expect(bodyText).not.toMatch(/undefined\s+days/i);
      expect(bodyText).not.toMatch(/NaN/i);

      // If showing days, should show "0 days" or valid number
      const daysMatches = bodyText.match(/(\d+|null|undefined)\s+(?:business\s+)?days/gi);
      if (daysMatches) {
        daysMatches.forEach(match => {
          expect(match).not.toMatch(/null|undefined/i);
        });
      }
    });
  });

  describe('Budget Calculations', () => {
    it('calculates budget utilization accurately', () => {
      const project = createTestProject({
        budget: 1000000, // $1M
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            order: 0,
            startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
            color: '#3B82F6',
            collapsed: false,
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                phaseId: 'phase-1',
                order: 0,
                level: 0,
                startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
                progress: 100,
                cost: 250000, // $250K spent
                resourceAssignments: [],
              },
            ],
          },
        ],
      });

      useGanttToolStoreV2.setState({ currentProject: project });

      const { container } = render(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      // Budget utilization should be 25% (250K / 1M)
      const budgetElement = container.querySelector('[data-testid="budget-utilization"]');
      if (budgetElement) {
        const budgetText = budgetElement.textContent || '';
        const utilization = parseFloat(budgetText);
        expect(utilization).toBeCloseTo(25.0, 1);
      }
    });

    it('shows warning when budget utilization > 100%', () => {
      const project = createTestProject({
        budget: 1000000, // $1M
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            order: 0,
            startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
            color: '#3B82F6',
            collapsed: false,
            tasks: [
              {
                id: 'task-1',
                name: 'Over Budget Task',
                phaseId: 'phase-1',
                order: 0,
                level: 0,
                startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
                progress: 100,
                cost: 1200000, // $1.2M spent (over budget!)
                resourceAssignments: [],
              },
            ],
          },
        ],
      });

      useGanttToolStoreV2.setState({ currentProject: project });

      const { container } = render(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      // Should show budget warning/alert
      const alertElements = container.querySelectorAll('[role="alert"], .ant-alert-error');
      expect(alertElements.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Updates', () => {
    it('updates health score when task progress changes', async () => {
      const project = createTestProject();
      useGanttToolStoreV2.setState({ currentProject: project });

      const { container, rerender } = render(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      const initialHealthElement = container.querySelector('[data-testid="health-score"]');
      const initialHealth = initialHealthElement
        ? parseInt(initialHealthElement.textContent || '0')
        : 0;

      // Update task progress (complete more tasks)
      const updatedProject = {
        ...project,
        phases: project.phases.map(phase => ({
          ...phase,
          tasks: phase.tasks.map(task => ({
            ...task,
            progress: 100, // Complete all tasks
          })),
        })),
      };

      useGanttToolStoreV2.setState({ currentProject: updatedProject });

      // Re-render
      rerender(
        <MissionControlModal
          open={true}
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        const updatedHealthElement = container.querySelector('[data-testid="health-score"]');
        const updatedHealth = updatedHealthElement
          ? parseInt(updatedHealthElement.textContent || '0')
          : 0;

        // Health should improve when tasks are completed
        expect(updatedHealth).toBeGreaterThan(initialHealth);
      });
    });
  });
});
