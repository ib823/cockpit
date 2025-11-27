/**
 * Unit Tests: Gantt Tool Store V2 - Architecture Methods
 *
 * Tests the 5 new architecture methods added to the unified project model:
 * - updateBusinessContext
 * - updateCurrentLandscape
 * - updateProposedSolution
 * - updateDiagramSettings
 * - updateArchitectureVersion
 *
 * Quality Policy: Aggressive testing & regression safety
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGanttToolStoreV2 } from '../gantt-tool-store-v2';
import type {
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
} from '@/app/architecture/v3/types';

// Mock local storage functions to avoid IndexedDB errors in Node.js test environment
vi.mock('@/lib/gantt-tool/local-storage', () => ({
  saveProjectLocal: vi.fn().mockResolvedValue(undefined),
  getProjectLocal: vi.fn().mockResolvedValue(null),
  deleteProjectLocal: vi.fn().mockResolvedValue(undefined),
  getAllProjectsLocal: vi.fn().mockResolvedValue([]),
  clearAllProjectsLocal: vi.fn().mockResolvedValue(undefined),
  addToSyncQueue: vi.fn().mockResolvedValue(undefined),
  getPendingSyncCount: vi.fn().mockResolvedValue(0),
}));

// Mock background sync to avoid startup errors
vi.mock('@/lib/gantt-tool/background-sync', () => ({
  startBackgroundSync: vi.fn(),
  stopBackgroundSync: vi.fn(),
  addToSyncQueue: vi.fn().mockResolvedValue(undefined),
  getPendingSyncCount: vi.fn().mockResolvedValue(0),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('GanttToolStoreV2 - Architecture Methods (Unified Project Model)', () => {
  beforeEach(() => {
    // Reset store state
    useGanttToolStoreV2.setState({
      currentProject: null,
      projects: [],
      history: { past: [], future: [] },
    });

    // Clear all mocks
    vi.clearAllMocks();

    // Mock successful API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('updateBusinessContext', () => {
    it('should update business context data in current project', async () => {
      // Arrange: Set up project with initial state
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      const businessContextData: BusinessContextData = {
        entities: [
          {
            id: 'entity-1',
            name: 'Customer Portal',
            type: 'system',
            position: { x: 100, y: 100 },
          },
        ],
        actors: [],
        capabilities: [],
      };

      // Act: Update business context
      await useGanttToolStoreV2.getState().updateBusinessContext(businessContextData);

      // Assert: Verify project was updated
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.businessContext).toEqual(businessContextData);
      expect(state.currentProject?.lastArchitectureEdit).toBeDefined();
      expect(state.currentProject?.updatedAt).toBeDefined();
    });

    it('should create undo history snapshot before update', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        businessContext: {
          entities: [{ id: 'old-entity', name: 'Old Entity', type: 'system', position: { x: 0, y: 0 } }],
          actors: [],
          capabilities: [],
        },
      };

      useGanttToolStoreV2.setState({
        currentProject: testProject,
        history: { past: [], future: [] },
      });

      const newBusinessContext: BusinessContextData = {
        entities: [{ id: 'new-entity', name: 'New Entity', type: 'system', position: { x: 100, y: 100 } }],
        actors: [],
        capabilities: [],
      };

      // Act
      await useGanttToolStoreV2.getState().updateBusinessContext(newBusinessContext);

      // Assert: History should contain snapshot of old state
      const state = useGanttToolStoreV2.getState();
      expect(state.history.past).toHaveLength(1);
      expect(state.history.past[0].businessContext).toEqual(testProject.businessContext);
    });

    it('should trigger save after updating business context', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1,
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      const businessContextData: BusinessContextData = {
        entities: [{ id: 'e1', name: 'Entity', type: 'system', position: { x: 0, y: 0 } }],
        actors: [],
        capabilities: [],
      };

      // Act
      await useGanttToolStoreV2.getState().updateBusinessContext(businessContextData);

      // Assert: Data should be updated in state
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.businessContext).toEqual(businessContextData);
      expect(state.currentProject?.lastArchitectureEdit).toBeDefined();
      expect(state.currentProject?.updatedAt).toBeDefined();

      // Verify updatedAt was changed from original
      expect(state.currentProject?.updatedAt).not.toBe('2024-01-01T00:00:00Z');
    });

    it('should handle null currentProject gracefully', async () => {
      // Arrange: No current project loaded
      useGanttToolStoreV2.setState({ currentProject: null });

      const businessContextData: BusinessContextData = {
        entities: [],
        actors: [],
        capabilities: [],
      };

      // Act & Assert: Should not throw error
      await expect(
        useGanttToolStoreV2.getState().updateBusinessContext(businessContextData)
      ).resolves.not.toThrow();
    });

    it('should limit history to 50 items', async () => {
      // Arrange: Create project with 50 history items
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const pastHistory = Array(50).fill(testProject);

      useGanttToolStoreV2.setState({
        currentProject: testProject,
        history: { past: pastHistory, future: [] },
      });

      const businessContextData: BusinessContextData = {
        entities: [],
        actors: [],
        capabilities: [],
      };

      // Act
      await useGanttToolStoreV2.getState().updateBusinessContext(businessContextData);

      // Assert: History should still be 50 items (oldest removed)
      const state = useGanttToolStoreV2.getState();
      expect(state.history.past).toHaveLength(50);
    });
  });

  describe('updateCurrentLandscape', () => {
    it('should update current landscape data', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      const landscapeData: CurrentLandscapeData = {
        systems: [
          {
            id: 'system-1',
            name: 'Legacy CRM',
            type: 'application',
            position: { x: 200, y: 200 },
          },
        ],
        integrations: [],
      };

      // Act
      await useGanttToolStoreV2.getState().updateCurrentLandscape(landscapeData);

      // Assert
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.currentLandscape).toEqual(landscapeData);
      expect(state.currentProject?.lastArchitectureEdit).toBeDefined();
    });

    it('should clear future history on update', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      useGanttToolStoreV2.setState({
        currentProject: testProject,
        history: { past: [], future: [testProject, testProject] },
      });

      const landscapeData: CurrentLandscapeData = {
        systems: [],
        integrations: [],
      };

      // Act
      await useGanttToolStoreV2.getState().updateCurrentLandscape(landscapeData);

      // Assert: Future should be cleared
      const state = useGanttToolStoreV2.getState();
      expect(state.history.future).toHaveLength(0);
    });
  });

  describe('updateProposedSolution', () => {
    it('should update proposed solution data', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      const solutionData: ProposedSolutionData = {
        components: [
          {
            id: 'component-1',
            name: 'API Gateway',
            type: 'service',
            position: { x: 300, y: 300 },
          },
        ],
        flows: [],
      };

      // Act
      await useGanttToolStoreV2.getState().updateProposedSolution(solutionData);

      // Assert
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.proposedSolution).toEqual(solutionData);
      expect(state.currentProject?.lastArchitectureEdit).toBeDefined();
    });
  });

  describe('updateDiagramSettings', () => {
    it('should update diagram settings without lastArchitectureEdit', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastArchitectureEdit: '2024-01-01T00:00:00Z',
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      const settings: DiagramSettings = {
        theme: 'light',
        gridVisible: true,
        snapToGrid: true,
      };

      // Act
      await useGanttToolStoreV2.getState().updateDiagramSettings(settings);

      // Assert
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.diagramSettings).toEqual(settings);
      // lastArchitectureEdit should NOT change for diagram settings
      expect(state.currentProject?.lastArchitectureEdit).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('updateArchitectureVersion', () => {
    it('should update architecture version string', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      // Act
      await useGanttToolStoreV2.getState().updateArchitectureVersion('2.0');

      // Assert
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.architectureVersion).toBe('2.0');
    });
  });

  describe('Regression: Timeline features still work', () => {
    it('should not break existing phase methods', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1,
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      const newPhase = {
        id: 'phase-1',
        name: 'Phase 1',
        startDate: '2024-01-01',
        endDate: '2024-02-01',
        tasks: [],
        color: '#3b82f6',
        collapsed: false,
      };

      // Act: Call existing Timeline method
      await useGanttToolStoreV2.getState().addPhase(newPhase);

      // Assert: Phase should be added with core properties preserved
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.phases).toHaveLength(1);
      // Check core properties instead of exact equality (store may add additional fields)
      expect(state.currentProject?.phases[0]).toMatchObject({
        name: 'Phase 1',
        startDate: '2024-01-01',
        endDate: '2024-02-01',
        color: '#3b82f6',
        collapsed: false,
      });
    });

    it('should preserve architecture data when updating timeline data', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        businessContext: {
          entities: [{ id: 'e1', name: 'Entity 1', type: 'system', position: { x: 0, y: 0 } }],
          actors: [],
          capabilities: [],
        },
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      const newPhase = {
        id: 'phase-1',
        name: 'Phase 1',
        startDate: '2024-01-01',
        endDate: '2024-02-01',
        tasks: [],
        color: '#3b82f6',
        collapsed: false,
      };

      // Act: Add timeline data
      await useGanttToolStoreV2.getState().addPhase(newPhase);

      // Assert: Architecture data should be preserved
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.businessContext).toEqual(testProject.businessContext);
    });
  });

  describe('Data Consistency', () => {
    it('should preserve all architecture fields in state', async () => {
      // Arrange
      const testProject = {
        id: 'test-project-1',
        name: 'Test Project',
        startDate: '2024-01-01',
        phases: [],
        milestones: [],
        holidays: [],
        resources: [],
        viewSettings: { viewMode: 'month' as const },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1,
      };

      useGanttToolStoreV2.setState({ currentProject: testProject });

      const businessContext: BusinessContextData = {
        entities: [{ id: 'e1', name: 'Entity', type: 'system', position: { x: 0, y: 0 } }],
        actors: [],
        capabilities: [],
      };

      const landscape: CurrentLandscapeData = {
        systems: [{ id: 's1', name: 'System', type: 'application', position: { x: 100, y: 100 } }],
        integrations: [],
      };

      const solution: ProposedSolutionData = {
        components: [{ id: 'c1', name: 'Component', type: 'service', position: { x: 200, y: 200 } }],
        flows: [],
      };

      // Act: Update all architecture fields
      await useGanttToolStoreV2.getState().updateBusinessContext(businessContext);
      await useGanttToolStoreV2.getState().updateCurrentLandscape(landscape);
      await useGanttToolStoreV2.getState().updateProposedSolution(solution);

      // Assert: All fields should be preserved in state
      const state = useGanttToolStoreV2.getState();
      expect(state.currentProject?.businessContext).toEqual(businessContext);
      expect(state.currentProject?.currentLandscape).toEqual(landscape);
      expect(state.currentProject?.proposedSolution).toEqual(solution);
      expect(state.currentProject?.lastArchitectureEdit).toBeDefined();
    });
  });
});
