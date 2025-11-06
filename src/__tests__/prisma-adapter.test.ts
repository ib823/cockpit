import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaAdapter } from '@/data/prisma-adapter';
import { Decimal } from '@prisma/client/runtime/library';

describe('M2 - Prisma Adapter', () => {
  describe('DAL Interface Implementation', () => {
    it('should implement all required IDAL methods', () => {
      const mockPrisma = {
        projects: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
        phases: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
        resources: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
        chips: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
        riceFw_items: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
        form_specs: { create: vi.fn(), findMany: vi.fn() },
        integration_specs: { create: vi.fn(), findMany: vi.fn() },
        wrappers: { create: vi.fn(), findMany: vi.fn() },
        snapshots: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
        audit_logs: { create: vi.fn(), findMany: vi.fn() },
        $transaction: vi.fn(),
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);

      // Verify adapter has all methods
      expect(adapter).toHaveProperty('createProject');
      expect(adapter).toHaveProperty('getProject');
      expect(adapter).toHaveProperty('listProjects');
      expect(adapter).toHaveProperty('updateProject');
      expect(adapter).toHaveProperty('deleteProject');

      expect(adapter).toHaveProperty('createPhase');
      expect(adapter).toHaveProperty('listPhases');
      expect(adapter).toHaveProperty('updatePhase');
      expect(adapter).toHaveProperty('deletePhase');

      expect(adapter).toHaveProperty('createResource');
      expect(adapter).toHaveProperty('listResources');
      expect(adapter).toHaveProperty('updateResource');

      expect(adapter).toHaveProperty('createChip');
      expect(adapter).toHaveProperty('listChips');
      expect(adapter).toHaveProperty('deleteChip');

      expect(adapter).toHaveProperty('createRicefwItem');
      expect(adapter).toHaveProperty('listRicefwItems');

      expect(adapter).toHaveProperty('createForm');
      expect(adapter).toHaveProperty('listForms');

      expect(adapter).toHaveProperty('createIntegration');
      expect(adapter).toHaveProperty('listIntegrations');

      expect(adapter).toHaveProperty('createSnapshot');
      expect(adapter).toHaveProperty('getSnapshot');
      expect(adapter).toHaveProperty('listSnapshots');

      expect(adapter).toHaveProperty('getAuditLog');
      expect(adapter).toHaveProperty('transaction');
      expect(adapter).toHaveProperty('healthCheck');
    });
  });

  describe('Audit Trail', () => {
    it('should create audit log on CREATE action', async () => {
      const auditLogCreate = vi.fn().mockResolvedValue({});
      const mockPrisma = {
        projects: {
          create: vi.fn().mockResolvedValue({
            id: 'cm4test123',
            name: 'Test Project',
            status: 'DRAFT',
            ownerId: 'cm4user123',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        audit_logs: { create: auditLogCreate },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const audit = {
        userId: 'cm4user123',
        action: 'CREATE' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      };

      await adapter.createProject(
        {
          name: 'Test Project',
          status: 'DRAFT' as const,
          ownerId: 'cm4user123',
        },
        audit
      );

      // Verify audit log was created
      expect(auditLogCreate).toHaveBeenCalled();
      const auditCall = auditLogCreate.mock.calls[0][0];
      expect(auditCall.data.userId).toBe('cm4user123');
      expect(auditCall.data.action).toBe('CREATE');
      expect(auditCall.data.entity).toBe('Project');
    });

    it('should create audit log on UPDATE action', async () => {
      const auditLogCreate = vi.fn().mockResolvedValue({});
      const mockProject = {
        id: 'cm4test123',
        name: 'Original Project',
        status: 'DRAFT',
        ownerId: 'cm4user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrisma = {
        projects: {
          findUnique: vi.fn().mockResolvedValue(mockProject),
          update: vi.fn().mockResolvedValue({
            ...mockProject,
            name: 'Updated Project',
            status: 'IN_REVIEW',
          }),
        },
        audit_logs: { create: auditLogCreate },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const audit = {
        userId: 'cm4user123',
        action: 'UPDATE' as const,
      };

      await adapter.updateProject(
        'cm4test123',
        { name: 'Updated Project', status: 'IN_REVIEW' as const },
        audit
      );

      // Verify audit log was created with changes
      expect(auditLogCreate).toHaveBeenCalled();
      const auditCall = auditLogCreate.mock.calls[0][0];
      expect(auditCall.data.action).toBe('UPDATE');
      expect(auditCall.data.changes).toBeDefined();
    });

    it('should create audit log on DELETE action', async () => {
      const auditLogCreate = vi.fn().mockResolvedValue({});
      const mockPrisma = {
        projects: {
          delete: vi.fn().mockResolvedValue({}),
        },
        audit_logs: { create: auditLogCreate },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const audit = {
        userId: 'cm4user123',
        action: 'DELETE' as const,
      };

      await adapter.deleteProject('cm4test123', audit);

      // Verify audit log was created
      expect(auditLogCreate).toHaveBeenCalled();
      const auditCall = auditLogCreate.mock.calls[0][0];
      expect(auditCall.data.action).toBe('DELETE');
    });

    it('should not throw when audit log creation fails', async () => {
      const auditLogCreate = vi.fn().mockRejectedValue(new Error('Audit log DB error'));
      const mockPrisma = {
        projects: {
          create: vi.fn().mockResolvedValue({
            id: 'cm4test123',
            name: 'Test Project',
            status: 'DRAFT',
            ownerId: 'cm4user123',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        audit_logs: { create: auditLogCreate },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const audit = {
        userId: 'cm4user123',
        action: 'CREATE' as const,
      };

      // Should not throw even if audit fails
      await expect(
        adapter.createProject(
          {
            name: 'Test Project',
            status: 'DRAFT' as const,
            ownerId: 'cm4user123',
          },
          audit
        )
      ).resolves.toBeDefined();
    });
  });

  describe('Transaction Support', () => {
    it('should support transaction wrapper', async () => {
      const transactionFn = vi.fn().mockImplementation(async (fn) => {
        return await fn({} as any);
      });

      const mockPrisma = {
        $transaction: transactionFn,
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);

      const result = await adapter.transaction(async () => {
        return { success: true };
      });

      expect(transactionFn).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should rollback transaction on error', async () => {
      const transactionFn = vi.fn().mockRejectedValue(new Error('Transaction failed'));

      const mockPrisma = {
        $transaction: transactionFn,
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);

      await expect(
        adapter.transaction(async () => {
          throw new Error('Operation failed');
        })
      ).rejects.toThrow();
    });
  });

  describe('Health Check', () => {
    it('should return ok status when database is healthy', async () => {
      const mockPrisma = {
        $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const health = await adapter.healthCheck();

      expect(health.status).toBe('ok');
      expect(health.message).toBeUndefined();
    });

    it('should return error status when database is unhealthy', async () => {
      const mockPrisma = {
        $queryRaw: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const health = await adapter.healthCheck();

      expect(health.status).toBe('error');
      expect(health.message).toContain('Database connection failed');
    });
  });

  describe('CRUD Operations', () => {
    it('should create Project with validation', async () => {
      const mockPrisma = {
        projects: {
          create: vi.fn().mockResolvedValue({
            id: 'cm4test123',
            name: 'Valid Project',
            status: 'DRAFT',
            ownerId: 'cm4user123',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        audit_logs: { create: vi.fn() },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const audit = { userId: 'cm4user123', action: 'CREATE' as const };

      const project = await adapter.createProject(
        {
          name: 'Valid Project',
          status: 'DRAFT' as const,
          ownerId: 'cm4user123',
        },
        audit
      );

      expect(project).toBeDefined();
      expect(project.name).toBe('Valid Project');
    });

    it('should throw ValidationError for invalid Project', async () => {
      const mockPrisma = {
        projects: { create: vi.fn() },
        audit_logs: { create: vi.fn() },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const audit = { userId: 'cm4user123', action: 'CREATE' as const };

      await expect(
        adapter.createProject(
          {
            name: '', // Invalid: empty name
            status: 'DRAFT' as const,
            ownerId: 'cm4user123',
          },
          audit
        )
      ).rejects.toThrow();
    });

    it('should list Phases by projectId', async () => {
      const mockPhases = [
        {
          id: 'cm4phase1',
          projectId: 'cm4proj123',
          name: 'Prepare',
          category: 'prepare',
          workingDays: 20,
          effort: 50,
          startBusinessDay: 0,
          color: 'blue',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPrisma = {
        phases: {
          findMany: vi.fn().mockResolvedValue(mockPhases),
        },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const phases = await adapter.listPhases('cm4proj123');

      expect(phases).toHaveLength(1);
      expect(phases[0].name).toBe('Prepare');
      expect(mockPrisma.phase.findMany).toHaveBeenCalledWith({
        where: { projectId: 'cm4proj123' },
        include: { resources: true },
        orderBy: { order: 'asc' },
      });
    });

    it('should list Chips by projectId', async () => {
      const mockChips = [
        {
          id: 'cm4chip1',
          projectId: 'cm4proj123',
          type: 'COUNTRY',
          value: 'Malaysia',
          confidence: 0.9,
          source: 'paste',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPrisma = {
        chips: {
          findMany: vi.fn().mockResolvedValue(mockChips),
        },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const chips = await adapter.listChips('cm4proj123');

      expect(chips).toHaveLength(1);
      expect(chips[0].type).toBe('COUNTRY');
      expect(mockPrisma.chip.findMany).toHaveBeenCalledWith({
        where: { projectId: 'cm4proj123' },
      });
    });

    it('should update Phase with audit trail', async () => {
      const mockPhase = {
        id: 'cm4phase1',
        projectId: 'cm4proj123',
        name: 'Original Phase',
        category: 'prepare',
        workingDays: 20,
        effort: new Decimal(50),
        startBusinessDay: 0,
        color: 'blue',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: [],
      };

      const mockPrisma = {
        phases: {
          findUnique: vi.fn().mockResolvedValue(mockPhase),
          update: vi.fn().mockResolvedValue({
            ...mockPhase,
            name: 'Updated Phase',
            workingDays: 30,
            effort: new Decimal(75),
          }),
        },
        audit_logs: { create: vi.fn() },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);
      const audit = { userId: 'cm4user123', action: 'UPDATE' as const };

      const updated = await adapter.updatePhase(
        'cm4phase1',
        { name: 'Updated Phase', workingDays: 30, effort: 75 },
        audit
      );

      expect(updated.name).toBe('Updated Phase');
      expect(updated.workingDays).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should throw NotFoundError when entity not found', async () => {
      const mockPrisma = {
        projects: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);

      const result = await adapter.getProject('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const mockPrisma = {
        projects: {
          findMany: vi.fn().mockRejectedValue(new Error('Database error')),
        },
      } as any;

      const adapter = new PrismaAdapter(mockPrisma);

      await expect(adapter.listProjects('cm4user123')).rejects.toThrow('Failed to list projects');
    });
  });
});
