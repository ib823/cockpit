/**
 * Prisma Adapter for DAL
 *
 * Concrete implementation of IDAL using Prisma ORM and PostgreSQL
 */

import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto";
import {
  AuditContext,
  Chip,
  DALError,
  EstimateSnapshot,
  FormSpec,
  IDAL,
  IntegrationSpec,
  NotFoundError,
  Phase,
  Project,
  Resource,
  RicefwItem,
  validateChip,
  validateFormSpec,
  validateIntegrationSpec,
  validatePhase,
  validateProject,
  validateResource,
  validateRicefwItem,
  validateSnapshot,
  ValidationError,
} from "./dal";

// Singleton Prisma client
let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return prismaInstance;
}

export class PrismaAdapter implements IDAL {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
  }

  // ============================================================================
  // AUDIT TRAIL HELPER
  // ============================================================================

  private async createAuditLog(
    audit: AuditContext,
    entity: string,
    entityId: string,
    changes?: any
  ): Promise<void> {
    try {
      await this.prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          userId: audit.userId,
          action: audit.action,
          entity,
          entityId,
          changes: changes || null,
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
        },
      });
    } catch (error: any) {
      console.error("Failed to create audit log:", error);
      // Don't throw - audit failure shouldn't break business operations
    }
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  async createProject(
    data: Omit<Project, "id" | "createdAt" | "updatedAt">,
    audit: AuditContext
  ): Promise<Project> {
    try {
      const validated = validateProject(data);

      const project = await this.prisma.projects.create({
        data: {
          id: randomUUID(),
          ...validated,
          updatedAt: new Date(),
          revenue: validated.revenue ? new Decimal(validated.revenue) : null,
          totalEffort: validated.totalEffort ? new Decimal(validated.totalEffort) : null,
          totalCost: validated.totalCost ? new Decimal(validated.totalCost) : null,
        },
      });

      await this.createAuditLog(audit, "Project", project.id, { created: validated });

      return this.mapProject(project);
    } catch (error: any) {
      if (error instanceof Error && error.name === "ZodError") {
        throw new ValidationError("Invalid project data", (error as any).errors);
      }
      throw new DALError("Failed to create project", "DATABASE", error);
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const project = await this.prisma.projects.findUnique({
        where: { id },
      });

      return project ? this.mapProject(project) : null;
    } catch (error: any) {
      throw new DALError("Failed to get project", "DATABASE", error);
    }
  }

  async updateProject(id: string, data: Partial<Project>, audit: AuditContext): Promise<Project> {
    try {
      const existing = await this.getProject(id);
      if (!existing) {
        throw new NotFoundError("Project", id);
      }

      const validated = validateProject({ ...existing, ...data });

      const project = await this.prisma.projects.update({
        where: { id },
        data: {
          ...validated,
          revenue: validated.revenue ? new Decimal(validated.revenue) : null,
          totalEffort: validated.totalEffort ? new Decimal(validated.totalEffort) : null,
          totalCost: validated.totalCost ? new Decimal(validated.totalCost) : null,
        },
      });

      await this.createAuditLog(audit, "Project", id, { updated: data });

      return this.mapProject(project);
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      if (error instanceof Error && error.name === "ZodError") {
        throw new ValidationError("Invalid project data", (error as any).errors);
      }
      throw new DALError("Failed to update project", "DATABASE", error);
    }
  }

  async deleteProject(id: string, audit: AuditContext): Promise<void> {
    try {
      await this.prisma.projects.delete({
        where: { id },
      });

      await this.createAuditLog(audit, "Project", id, { deleted: true });
    } catch (error: any) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
        throw new NotFoundError("Project", id);
      }
      throw new DALError("Failed to delete project", "DATABASE", error);
    }
  }

  async listProjects(
    ownerId: string,
    filters?: { status?: Project["status"] }
  ): Promise<Project[]> {
    try {
      const projects = await this.prisma.projects.findMany({
        where: {
          ownerId,
          ...(filters?.status && { status: filters.status }),
        },
        orderBy: { updatedAt: "desc" },
      });

      return projects.map((p) => this.mapProject(p));
    } catch (error: any) {
      throw new DALError("Failed to list projects", "DATABASE", error);
    }
  }

  // ============================================================================
  // PHASE OPERATIONS
  // ============================================================================

  async createPhase(
    data: Omit<Phase, "id" | "createdAt" | "updatedAt">,
    audit: AuditContext
  ): Promise<Phase> {
    try {
      const validated = validatePhase(data);

      const phase = await this.prisma.phases.create({
        data: {
          id: randomUUID(),
          ...validated,
          updatedAt: new Date(),
          effort: new Decimal(validated.effort),
          dependencies: validated.dependencies ? JSON.stringify(validated.dependencies) : null,
        },
      });

      await this.createAuditLog(audit, "Phase", phase.id, { created: validated });

      return this.mapPhase(phase);
    } catch (error: any) {
      if (error instanceof Error && error.name === "ZodError") {
        throw new ValidationError("Invalid phase data", (error as any).errors);
      }
      throw new DALError("Failed to create phase", "DATABASE", error);
    }
  }

  async getPhase(id: string): Promise<Phase | null> {
    try {
      const phase = await this.prisma.phases.findUnique({
        where: { id },
        include: { resources: true },
      });

      return phase ? this.mapPhase(phase) : null;
    } catch (error: any) {
      throw new DALError("Failed to get phase", "DATABASE", error);
    }
  }

  async updatePhase(id: string, data: Partial<Phase>, audit: AuditContext): Promise<Phase> {
    try {
      const existing = await this.getPhase(id);
      if (!existing) {
        throw new NotFoundError("Phase", id);
      }

      const validated = validatePhase({ ...existing, ...data });

      const phase = await this.prisma.phases.update({
        where: { id },
        data: {
          ...validated,
          effort: new Decimal(validated.effort),
          dependencies: validated.dependencies ? JSON.stringify(validated.dependencies) : null,
        },
        include: { resources: true },
      });

      await this.createAuditLog(audit, "Phase", id, { updated: data });

      return this.mapPhase(phase);
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      if (error instanceof Error && error.name === "ZodError") {
        throw new ValidationError("Invalid phase data", (error as any).errors);
      }
      throw new DALError("Failed to update phase", "DATABASE", error);
    }
  }

  async deletePhase(id: string, audit: AuditContext): Promise<void> {
    try {
      await this.prisma.phases.delete({
        where: { id },
      });

      await this.createAuditLog(audit, "Phase", id, { deleted: true });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Phase", id);
      }
      throw new DALError("Failed to delete phase", "DATABASE", error);
    }
  }

  async listPhases(projectId: string): Promise<Phase[]> {
    try {
      const phases = await this.prisma.phases.findMany({
        where: { projectId },
        include: { resources: true },
        orderBy: { order: "asc" },
      });

      return phases.map((p) => this.mapPhase(p));
    } catch (error: any) {
      throw new DALError("Failed to list phases", "DATABASE", error);
    }
  }

  async bulkCreatePhases(
    phases: Omit<Phase, "id" | "createdAt" | "updatedAt">[],
    audit: AuditContext
  ): Promise<Phase[]> {
    try {
      const validated = phases.map((p) => validatePhase(p));

      const created = await this.prisma.$transaction(
        validated.map((p) => {
          return this.prisma.phases.create({
            data: {
              id: randomUUID(),
              ...p,
              updatedAt: new Date(),
              effort: new Decimal(p.effort),
              dependencies: p.dependencies ? JSON.stringify(p.dependencies) : null,
            },
          });
        })
      );

      await this.createAuditLog(audit, "Phase", "bulk", { count: created.length });

      return created.map((p) => this.mapPhase(p));
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid phase data in bulk operation", error.errors);
      }
      throw new DALError("Failed to bulk create phases", "DATABASE", error);
    }
  }

  async bulkUpdatePhases(
    phases: Array<{ id: string; data: Partial<Phase> }>,
    audit: AuditContext
  ): Promise<Phase[]> {
    try {
      const updated = await this.prisma.$transaction(
        phases.map(({ id, data }) => {
          const {
            id: _,
            projectId: __,
            createdAt: ___,
            updatedAt: ____,
            resources: _____,
            ...updateData
          } = data;
          return this.prisma.phases.update({
            where: { id },
            data: {
              ...updateData,
              effort: data.effort ? new Decimal(data.effort) : undefined,
              dependencies: data.dependencies ? JSON.stringify(data.dependencies) : undefined,
            },
          });
        })
      );

      await this.createAuditLog(audit, "Phase", "bulk", { count: updated.length });

      return updated.map((p) => this.mapPhase(p));
    } catch (error: any) {
      throw new DALError("Failed to bulk update phases", "DATABASE", error);
    }
  }

  // ============================================================================
  // RESOURCE OPERATIONS
  // ============================================================================

  async createResource(
    data: Omit<Resource, "id" | "createdAt">,
    audit: AuditContext
  ): Promise<Resource> {
    try {
      const validated = validateResource(data);

      const resource = await this.prisma.resources.create({
        data: {
          id: randomUUID(),
          ...validated,
          hourlyRate: new Decimal(validated.hourlyRate),
        },
      });

      await this.createAuditLog(audit, "Resource", resource.id, { created: validated });

      return this.mapResource(resource);
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid resource data", error.errors);
      }
      throw new DALError("Failed to create resource", "DATABASE", error);
    }
  }

  async getResource(id: string): Promise<Resource | null> {
    try {
      const resource = await this.prisma.resources.findUnique({
        where: { id },
      });

      return resource ? this.mapResource(resource) : null;
    } catch (error: any) {
      throw new DALError("Failed to get resource", "DATABASE", error);
    }
  }

  async updateResource(
    id: string,
    data: Partial<Resource>,
    audit: AuditContext
  ): Promise<Resource> {
    try {
      const resource = await this.prisma.resources.update({
        where: { id },
        data: {
          ...data,
          hourlyRate: data.hourlyRate ? new Decimal(data.hourlyRate) : undefined,
        },
      });

      await this.createAuditLog(audit, "Resource", id, { updated: data });

      return this.mapResource(resource);
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Resource", id);
      }
      throw new DALError("Failed to update resource", "DATABASE", error);
    }
  }

  async deleteResource(id: string, audit: AuditContext): Promise<void> {
    try {
      await this.prisma.resources.delete({
        where: { id },
      });

      await this.createAuditLog(audit, "Resource", id, { deleted: true });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Resource", id);
      }
      throw new DALError("Failed to delete resource", "DATABASE", error);
    }
  }

  async listResources(projectId: string, phaseId?: string): Promise<Resource[]> {
    try {
      const resources = await this.prisma.resources.findMany({
        where: {
          projectId,
          ...(phaseId && { phaseId }),
        },
      });

      return resources.map((r) => this.mapResource(r));
    } catch (error: any) {
      throw new DALError("Failed to list resources", "DATABASE", error);
    }
  }

  async bulkCreateResources(
    resources: Omit<Resource, "id" | "createdAt">[],
    audit: AuditContext
  ): Promise<Resource[]> {
    try {
      const validated = resources.map((r) => validateResource(r));

      const created = await this.prisma.$transaction(
        validated.map((r) =>
          this.prisma.resources.create({
            data: {
              id: randomUUID(),
              ...r,
              hourlyRate: new Decimal(r.hourlyRate),
            },
          })
        )
      );

      await this.createAuditLog(audit, "Resource", "bulk", { count: created.length });

      return created.map((r) => this.mapResource(r));
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid resource data in bulk operation", error.errors);
      }
      throw new DALError("Failed to bulk create resources", "DATABASE", error);
    }
  }

  // ============================================================================
  // RICEFW OPERATIONS (using generic JSON table temporarily)
  // ============================================================================

  async createRicefwItem(
    data: Omit<RicefwItem, "id" | "createdAt" | "updatedAt">,
    audit: AuditContext
  ): Promise<RicefwItem> {
    try {
      const validated = validateRicefwItem(data);

      // Store in Snapshot table temporarily until we add RICEFW table to schema
      const snapshot = await this.prisma.snapshots.create({
        data: {
          id: randomUUID(),
          projectId: validated.projectId,
          version: Date.now(),
          data: validated as any,
          createdBy: audit.userId,
          label: `RICEFW_${validated.type}_${validated.name}`,
        },
      });

      await this.createAuditLog(audit, "RicefwItem", snapshot.id, { created: validated });

      return {
        id: snapshot.id,
        ...validated,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.createdAt,
      };
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid RICEFW item data", error.errors);
      }
      throw new DALError("Failed to create RICEFW item", "DATABASE", error);
    }
  }

  async getRicefwItem(id: string): Promise<RicefwItem | null> {
    try {
      const snapshot = await this.prisma.snapshots.findUnique({
        where: { id },
      });

      if (!snapshot || !snapshot.label?.startsWith("RICEFW_")) {
        return null;
      }

      return {
        id: snapshot.id,
        ...(snapshot.data as any),
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.createdAt,
      };
    } catch (error: any) {
      throw new DALError("Failed to get RICEFW item", "DATABASE", error);
    }
  }

  async updateRicefwItem(
    id: string,
    data: Partial<RicefwItem>,
    audit: AuditContext
  ): Promise<RicefwItem> {
    try {
      const existing = await this.getRicefwItem(id);
      if (!existing) {
        throw new NotFoundError("RicefwItem", id);
      }

      const validated = validateRicefwItem({ ...existing, ...data });

      const snapshot = await this.prisma.snapshots.update({
        where: { id },
        data: {
          data: validated as any,
        },
      });

      await this.createAuditLog(audit, "RicefwItem", id, { updated: data });

      return {
        id: snapshot.id,
        ...validated,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.createdAt,
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid RICEFW item data", error.errors);
      }
      throw new DALError("Failed to update RICEFW item", "DATABASE", error);
    }
  }

  async deleteRicefwItem(id: string, audit: AuditContext): Promise<void> {
    try {
      await this.prisma.snapshots.delete({
        where: { id },
      });

      await this.createAuditLog(audit, "RicefwItem", id, { deleted: true });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("RicefwItem", id);
      }
      throw new DALError("Failed to delete RICEFW item", "DATABASE", error);
    }
  }

  async listRicefwItems(projectId: string, type?: RicefwItem["type"]): Promise<RicefwItem[]> {
    try {
      const snapshots = await this.prisma.snapshots.findMany({
        where: {
          projectId,
          label: {
            startsWith: type ? `RICEFW_${type}_` : "RICEFW_",
          },
        },
      });

      return snapshots.map((s) => ({
        id: s.id,
        ...(s.data as any),
        createdAt: s.createdAt,
        updatedAt: s.createdAt,
      }));
    } catch (error: any) {
      throw new DALError("Failed to list RICEFW items", "DATABASE", error);
    }
  }

  // ============================================================================
  // FORM OPERATIONS (using Snapshot table temporarily)
  // ============================================================================

  async createForm(
    data: Omit<FormSpec, "id" | "createdAt">,
    audit: AuditContext
  ): Promise<FormSpec> {
    try {
      const validated = validateFormSpec(data);

      const snapshot = await this.prisma.snapshots.create({
        data: {
          id: randomUUID(),
          projectId: validated.projectId,
          version: Date.now(),
          data: validated as any,
          createdBy: audit.userId,
          label: `FORM_${validated.type}_${validated.name}`,
        },
      });

      await this.createAuditLog(audit, "FormSpec", snapshot.id, { created: validated });

      return {
        id: snapshot.id,
        ...validated,
        createdAt: snapshot.createdAt,
      };
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid form data", error.errors);
      }
      throw new DALError("Failed to create form", "DATABASE", error);
    }
  }

  async listForms(projectId: string): Promise<FormSpec[]> {
    try {
      const snapshots = await this.prisma.snapshots.findMany({
        where: {
          projectId,
          label: { startsWith: "FORM_" },
        },
      });

      return snapshots.map((s) => ({
        id: s.id,
        ...(s.data as any),
        createdAt: s.createdAt,
      }));
    } catch (error: any) {
      throw new DALError("Failed to list forms", "DATABASE", error);
    }
  }

  // ============================================================================
  // INTEGRATION OPERATIONS (using Snapshot table temporarily)
  // ============================================================================

  async createIntegration(
    data: Omit<IntegrationSpec, "id" | "createdAt">,
    audit: AuditContext
  ): Promise<IntegrationSpec> {
    try {
      const validated = validateIntegrationSpec(data);

      const snapshot = await this.prisma.snapshots.create({
        data: {
          id: randomUUID(),
          projectId: validated.projectId,
          version: Date.now(),
          data: validated as any,
          createdBy: audit.userId,
          label: `INTEGRATION_${validated.type}_${validated.name}`,
        },
      });

      await this.createAuditLog(audit, "IntegrationSpec", snapshot.id, { created: validated });

      return {
        id: snapshot.id,
        ...validated,
        createdAt: snapshot.createdAt,
      };
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid integration data", error.errors);
      }
      throw new DALError("Failed to create integration", "DATABASE", error);
    }
  }

  async listIntegrations(projectId: string): Promise<IntegrationSpec[]> {
    try {
      const snapshots = await this.prisma.snapshots.findMany({
        where: {
          projectId,
          label: { startsWith: "INTEGRATION_" },
        },
      });

      return snapshots.map((s) => ({
        id: s.id,
        ...(s.data as any),
        createdAt: s.createdAt,
      }));
    } catch (error: any) {
      throw new DALError("Failed to list integrations", "DATABASE", error);
    }
  }

  // ============================================================================
  // CHIP OPERATIONS
  // ============================================================================

  async createChip(data: Omit<Chip, "id" | "createdAt">, audit: AuditContext): Promise<Chip> {
    try {
      const validated = validateChip(data);

      const chip = await this.prisma.chips.create({
        data: {
          id: randomUUID(),
          ...validated,
          confidence: new Decimal(validated.confidence),
        },
      });

      await this.createAuditLog(audit, "Chip", chip.id, { created: validated });

      return this.mapChip(chip);
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid chip data", error.errors);
      }
      throw new DALError("Failed to create chip", "DATABASE", error);
    }
  }

  async listChips(projectId: string, type?: Chip["type"]): Promise<Chip[]> {
    try {
      const chips = await this.prisma.chips.findMany({
        where: {
          projectId,
          ...(type && { type }),
        },
      });

      return chips.map((c) => this.mapChip(c));
    } catch (error: any) {
      throw new DALError("Failed to list chips", "DATABASE", error);
    }
  }

  async deleteChip(id: string, audit: AuditContext): Promise<void> {
    try {
      await this.prisma.chips.delete({
        where: { id },
      });

      await this.createAuditLog(audit, "Chip", id, { deleted: true });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Chip", id);
      }
      throw new DALError("Failed to delete chip", "DATABASE", error);
    }
  }

  // ============================================================================
  // SNAPSHOT OPERATIONS
  // ============================================================================

  async createSnapshot(
    data: Omit<EstimateSnapshot, "id" | "createdAt">,
    audit: AuditContext
  ): Promise<EstimateSnapshot> {
    try {
      const validated = validateSnapshot(data);

      const snapshot = await this.prisma.snapshots.create({
        data: {
          id: randomUUID(),
          ...validated,
        },
      });

      await this.createAuditLog(audit, "Snapshot", snapshot.id, { created: validated });

      return {
        ...snapshot,
        data: snapshot.data as Record<string, any>,
        label: snapshot.label ?? undefined,
      };
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new ValidationError("Invalid snapshot data", error.errors);
      }
      throw new DALError("Failed to create snapshot", "DATABASE", error);
    }
  }

  async getSnapshot(id: string): Promise<EstimateSnapshot | null> {
    try {
      const snapshot = await this.prisma.snapshots.findUnique({
        where: { id },
      });
      if (!snapshot) return null;
      return {
        ...snapshot,
        data: snapshot.data as Record<string, any>,
        label: snapshot.label ?? undefined,
      };
    } catch (error: any) {
      throw new DALError("Failed to get snapshot", "DATABASE", error);
    }
  }

  async listSnapshots(projectId: string): Promise<EstimateSnapshot[]> {
    try {
      const snapshots = await this.prisma.snapshots.findMany({
        where: {
          projectId,
          label: { not: { startsWith: "RICEFW_" } }, // Exclude RICEFW items stored as snapshots
        },
        orderBy: { version: "desc" },
      });
      return snapshots.map((s) => ({
        ...s,
        data: s.data as Record<string, any>,
        label: s.label ?? undefined,
      }));
    } catch (error: any) {
      throw new DALError("Failed to list snapshots", "DATABASE", error);
    }
  }

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  async getAuditLog(entityId: string, limit: number = 50): Promise<any[]> {
    try {
      return await this.prisma.audit_logs.findMany({
        where: { entityId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error: any) {
      throw new DALError("Failed to get audit log", "DATABASE", error);
    }
  }

  // ============================================================================
  // TRANSACTION SUPPORT
  // ============================================================================

  async transaction<T>(fn: (dal: IDAL) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (prisma) => {
      const transactionalDAL = new PrismaAdapter(prisma as PrismaClient);
      return await fn(transactionalDAL);
    });
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ status: "ok" | "error"; message?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  }

  // ============================================================================
  // MAPPING HELPERS (Prisma types -> DAL types)
  // ============================================================================

  private mapProject(p: any): Project {
    return {
      ...p,
      revenue: p.revenue ? parseFloat(p.revenue.toString()) : undefined,
      totalEffort: p.totalEffort ? parseFloat(p.totalEffort.toString()) : undefined,
      totalCost: p.totalCost ? parseFloat(p.totalCost.toString()) : undefined,
    };
  }

  private mapPhase(p: any): Phase {
    return {
      ...p,
      effort: parseFloat(p.effort.toString()),
      dependencies: p.dependencies ? JSON.parse(p.dependencies) : undefined,
      resources: p.resources?.map((r: any) => this.mapResource(r)),
    };
  }

  private mapResource(r: any): Resource {
    return {
      ...r,
      hourlyRate: parseFloat(r.hourlyRate.toString()),
    };
  }

  private mapChip(c: any): Chip {
    return {
      ...c,
      confidence: parseFloat(c.confidence.toString()),
    };
  }
}

// Export singleton instance
export const dal: IDAL = new PrismaAdapter();
