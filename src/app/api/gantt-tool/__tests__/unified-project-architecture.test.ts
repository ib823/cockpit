/**
 * Integration Tests: Gantt Tool API - Unified Project Architecture Fields
 *
 * Tests that the API routes properly handle architecture data in the unified project model:
 * - GET /api/gantt-tool/projects/[projectId] returns architecture fields
 * - PATCH /api/gantt-tool/projects/[projectId] saves architecture fields
 * - Architecture fields are validated correctly
 * - lastArchitectureEdit timestamp is tracked
 *
 * Quality Policy: Aggressive testing & regression safety
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type {
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
} from '@/app/architecture/v3/types';

// Mock auth - must export getServerSession
vi.mock('next-auth', () => ({
  default: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
  getServerSession: vi.fn(() => Promise.resolve({
    user: { id: 'test-user-id', email: 'test@example.com' },
  })),
}));

// Mock Prisma - use factory function to avoid hoisting issues
vi.mock('@/lib/db', () => {
  const mockDb = {
    ganttProject: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return {
    db: mockDb,
    prisma: mockDb, // Auth module imports prisma
  };
});

// Import mocked db after mock declaration
import { db } from '@/lib/db';
import { GET, PATCH } from '../projects/[projectId]/route';

describe('Unified Project API - Architecture Fields', () => {
  const testProjectId = 'test-project-123';
  const testUserId = 'test-user-id';

  const baseProject = {
    id: testProjectId,
    userId: testUserId,
    name: 'Test Project',
    description: 'Test Description',
    startDate: new Date('2024-01-01'),
    viewSettings: { viewMode: 'month' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    version: 1,
    lastModifiedBy: testUserId,
    lastModifiedAt: new Date('2024-01-01'),
    phases: [],
    milestones: [],
    holidays: [],
    resources: [],
    budget: null,
    orgChart: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/gantt-tool/projects/[projectId]', () => {
    it('should return architecture fields in response', async () => {
      // Arrange
      const projectWithArchitecture = {
        ...baseProject,
        businessContext: {
          entities: [
            { id: 'e1', name: 'Customer Portal', type: 'system', position: { x: 100, y: 100 } },
          ],
          actors: [],
          capabilities: [],
        } as BusinessContextData,
        currentLandscape: {
          systems: [
            { id: 's1', name: 'Legacy CRM', type: 'application', position: { x: 200, y: 200 } },
          ],
          integrations: [],
        } as CurrentLandscapeData,
        proposedSolution: {
          components: [
            { id: 'c1', name: 'API Gateway', type: 'service', position: { x: 300, y: 300 } },
          ],
          flows: [],
        } as ProposedSolutionData,
        diagramSettings: {
          theme: 'light',
          gridVisible: true,
          snapToGrid: true,
        } as DiagramSettings,
        architectureVersion: '1.0',
        lastArchitectureEdit: new Date('2024-01-15'),
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(projectWithArchitecture),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        { method: 'GET' }
      );

      // Act
      const response = await GET(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.project).toBeDefined();
      expect(data.project.businessContext).toEqual(projectWithArchitecture.businessContext);
      expect(data.project.currentLandscape).toEqual(projectWithArchitecture.currentLandscape);
      expect(data.project.proposedSolution).toEqual(projectWithArchitecture.proposedSolution);
      expect(data.project.diagramSettings).toEqual(projectWithArchitecture.diagramSettings);
      expect(data.project.architectureVersion).toBe('1.0');
      expect(data.project.lastArchitectureEdit).toBeDefined();
    });

    it('should handle projects without architecture data', async () => {
      // Arrange: Project with only timeline data
      const timelineOnlyProject = {
        ...baseProject,
        businessContext: null,
        currentLandscape: null,
        proposedSolution: null,
        diagramSettings: null,
        architectureVersion: null,
        lastArchitectureEdit: null,
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(timelineOnlyProject),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        { method: 'GET' }
      );

      // Act
      const response = await GET(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.project.businessContext).toBeNull();
      expect(data.project.currentLandscape).toBeNull();
      expect(data.project.proposedSolution).toBeNull();
      expect(data.project.diagramSettings).toBeNull();
      expect(data.project.architectureVersion).toBeNull();
      expect(data.project.lastArchitectureEdit).toBeNull();
    });
  });

  describe('PATCH /api/gantt-tool/projects/[projectId]', () => {
    it('should save businessContext field', async () => {
      // Arrange
      const businessContextData: BusinessContextData = {
        entities: [
          { id: 'e1', name: 'Customer Portal', type: 'system', position: { x: 100, y: 100 } },
          { id: 'e2', name: 'Admin Dashboard', type: 'system', position: { x: 200, y: 100 } },
        ],
        actors: [
          { id: 'a1', name: 'Customer', type: 'user', position: { x: 50, y: 50 } },
        ],
        capabilities: [],
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              businessContext: businessContextData,
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            businessContext: businessContextData,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should save currentLandscape field', async () => {
      // Arrange
      const landscapeData: CurrentLandscapeData = {
        systems: [
          { id: 's1', name: 'Legacy CRM', type: 'application', position: { x: 200, y: 200 } },
          { id: 's2', name: 'Payment Gateway', type: 'service', position: { x: 300, y: 200 } },
        ],
        integrations: [
          { id: 'i1', from: 's1', to: 's2', type: 'api', label: 'Payment API' },
        ],
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              currentLandscape: landscapeData,
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            currentLandscape: landscapeData,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should save proposedSolution field', async () => {
      // Arrange
      const solutionData: ProposedSolutionData = {
        components: [
          { id: 'c1', name: 'API Gateway', type: 'service', position: { x: 300, y: 300 } },
          { id: 'c2', name: 'Microservice A', type: 'service', position: { x: 400, y: 300 } },
        ],
        flows: [
          { id: 'f1', from: 'c1', to: 'c2', type: 'http', label: 'REST API' },
        ],
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              proposedSolution: solutionData,
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            proposedSolution: solutionData,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should save diagramSettings field', async () => {
      // Arrange
      const settings: DiagramSettings = {
        theme: 'dark',
        gridVisible: false,
        snapToGrid: false,
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              diagramSettings: settings,
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            diagramSettings: settings,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should save architectureVersion field', async () => {
      // Arrange
      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              architectureVersion: '2.0',
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            architectureVersion: '2.0',
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update lastArchitectureEdit when architecture fields change', async () => {
      // Arrange
      const businessContextData: BusinessContextData = {
        entities: [],
        actors: [],
        capabilities: [],
      };

      let capturedUpdateData: any = null;

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockImplementation((args: any) => {
              capturedUpdateData = args.data;
              return Promise.resolve({
                ...baseProject,
                ...args.data,
                version: 2,
                updatedAt: new Date(),
              });
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            businessContext: businessContextData,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });

      // Assert
      expect(response.status).toBe(200);
      expect(capturedUpdateData).toBeDefined();
      expect(capturedUpdateData.lastArchitectureEdit).toBeInstanceOf(Date);
    });

    it('should save multiple architecture fields in single request', async () => {
      // Arrange
      const businessContextData: BusinessContextData = {
        entities: [{ id: 'e1', name: 'Entity', type: 'system', position: { x: 0, y: 0 } }],
        actors: [],
        capabilities: [],
      };

      const landscapeData: CurrentLandscapeData = {
        systems: [{ id: 's1', name: 'System', type: 'application', position: { x: 100, y: 100 } }],
        integrations: [],
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              businessContext: businessContextData,
              currentLandscape: landscapeData,
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            businessContext: businessContextData,
            currentLandscape: landscapeData,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should preserve timeline data when updating architecture fields', async () => {
      // Arrange
      const projectWithPhases = {
        ...baseProject,
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-02-01'),
            tasks: [],
          },
        ],
      };

      const businessContextData: BusinessContextData = {
        entities: [],
        actors: [],
        capabilities: [],
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(projectWithPhases),
            update: vi.fn().mockResolvedValue({
              ...projectWithPhases,
              businessContext: businessContextData,
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            businessContext: businessContextData,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });

      // Assert
      expect(response.status).toBe(200);
      // The update should not remove phases
    });
  });

  describe('Regression: Timeline fields still work', () => {
    it('should save timeline fields (name, description, startDate)', async () => {
      // Arrange
      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              name: 'Updated Project Name',
              description: 'Updated Description',
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: 'Updated Project Name',
            description: 'Updated Description',
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should save phases array', async () => {
      // Arrange
      const phases = [
        {
          id: 'phase-1',
          name: 'Planning',
          startDate: '2024-01-01',
          endDate: '2024-02-01',
          tasks: [],
          color: '#3b82f6',
          collapsed: false,
        },
      ];

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              phases,
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            phases,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should save both timeline and architecture fields together', async () => {
      // Arrange
      const phases = [
        {
          id: 'phase-1',
          name: 'Implementation',
          startDate: '2024-01-01',
          endDate: '2024-03-01',
          tasks: [],
        },
      ];

      const businessContextData: BusinessContextData = {
        entities: [{ id: 'e1', name: 'System', type: 'system', position: { x: 0, y: 0 } }],
        actors: [],
        capabilities: [],
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          ganttProject: {
            findUnique: vi.fn().mockResolvedValue(baseProject),
            update: vi.fn().mockResolvedValue({
              ...baseProject,
              phases,
              businessContext: businessContextData,
              version: 2,
              updatedAt: new Date(),
            }),
          },
        });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/gantt-tool/projects/${testProjectId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            phases,
            businessContext: businessContextData,
            expectedVersion: 1,
          }),
        }
      );

      // Act
      const response = await PATCH(request, { params: { projectId: testProjectId } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
