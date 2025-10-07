/**
 * Data Access Layer (DAL)
 * 
 * Provides unified interface for all database operations with:
 * - Type safety
 * - Validation (Zod)
 * - Audit trail
 * - Transaction support
 * - Error handling
 */

import { z } from 'zod';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface AuditContext {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SHARE' | 'EXPORT' | 'APPROVE' | 'ARCHIVE';
  ipAddress?: string;
  userAgent?: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  category: 'prepare' | 'explore' | 'realize' | 'deploy' | 'run';
  workingDays: number;
  effort: number;
  startBusinessDay: number;
  color: string;
  dependencies?: string[];
  order: number;
  resources?: Resource[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  projectId: string;
  phaseId?: string;
  name: string;
  role: 'PM' | 'Technical' | 'Functional' | 'Architect' | 'Basis' | 'Security' | 'ChangeManagement';
  region: string;
  allocation: number; // Percentage 0-100
  hourlyRate: number;
  createdAt: Date;
}

export interface Wrapper {
  id: string;
  projectId: string;
  type: 'projectManagement' | 'basis' | 'security' | 'testing' | 'training' | 'changeManagement';
  effort: number;
  cost: number;
  phases: string[]; // Phase IDs this wrapper applies to
}

export interface RicefwItem {
  id: string;
  projectId: string;
  type: 'report' | 'interface' | 'conversion' | 'enhancement' | 'form' | 'workflow';
  name: string;
  description?: string;
  complexity: 'S' | 'M' | 'L';
  count: number;
  effortPerItem: number;
  totalEffort: number;
  phase: 'explore' | 'realize' | 'deploy';
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSpec {
  id: string;
  projectId: string;
  name: string;
  type: 'po' | 'invoice' | 'deliveryNote' | 'custom';
  languages: string[];
  complexity: 'S' | 'M' | 'L';
  effort: number;
  createdAt: Date;
}

export interface IntegrationSpec {
  id: string;
  projectId: string;
  name: string;
  type: 'api' | 'file' | 'database' | 'realtime' | 'batch';
  source: string;
  target: string;
  complexity: 'S' | 'M' | 'L';
  volume: 'low' | 'medium' | 'high';
  effort: number;
  createdAt: Date;
}

export interface EstimateSnapshot {
  id: string;
  projectId: string;
  version: number;
  data: Record<string, any>;
  createdBy: string;
  label?: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ARCHIVED';
  clientName?: string;
  industry?: string;
  region?: string;
  employees?: number;
  revenue?: number;
  legalEntities?: number;
  moduleCombo?: string;
  complexity?: string;
  ssoMode?: string;
  integrationPosture?: string;
  rateRegion?: string;
  totalEffort?: number;
  totalCost?: number;
  duration?: number;
  startDate?: Date;
  endDate?: Date;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ChipSource = 'paste' | 'upload' | 'voice' | 'manual' | 'photo_ocr' | 'test';

export interface Chip {
  id: string;
  projectId: string;
  type: ChipType;
  value: string;
  confidence: number;
  evidence?: string;
  source: ChipSource;
  createdAt: Date;
}

export type ChipType = z.infer<typeof ChipSchema>['type'];

// ============================================================================
// DAL INTERFACE
// ============================================================================

export interface IDAL {
  // Project Operations
  createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, audit: AuditContext): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  updateProject(id: string, data: Partial<Project>, audit: AuditContext): Promise<Project>;
  deleteProject(id: string, audit: AuditContext): Promise<void>;
  listProjects(ownerId: string, filters?: { status?: Project['status'] }): Promise<Project[]>;

  // Phase Operations
  createPhase(data: Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>, audit: AuditContext): Promise<Phase>;
  getPhase(id: string): Promise<Phase | null>;
  updatePhase(id: string, data: Partial<Phase>, audit: AuditContext): Promise<Phase>;
  deletePhase(id: string, audit: AuditContext): Promise<void>;
  listPhases(projectId: string): Promise<Phase[]>;
  bulkCreatePhases(phases: Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>[], audit: AuditContext): Promise<Phase[]>;
  bulkUpdatePhases(phases: Array<{ id: string; data: Partial<Phase> }>, audit: AuditContext): Promise<Phase[]>;

  // Resource Operations
  createResource(data: Omit<Resource, 'id' | 'createdAt'>, audit: AuditContext): Promise<Resource>;
  getResource(id: string): Promise<Resource | null>;
  updateResource(id: string, data: Partial<Resource>, audit: AuditContext): Promise<Resource>;
  deleteResource(id: string, audit: AuditContext): Promise<void>;
  listResources(projectId: string, phaseId?: string): Promise<Resource[]>;
  bulkCreateResources(resources: Omit<Resource, 'id' | 'createdAt'>[], audit: AuditContext): Promise<Resource[]>;

  // RICEFW Operations
  createRicefwItem(data: Omit<RicefwItem, 'id' | 'createdAt' | 'updatedAt'>, audit: AuditContext): Promise<RicefwItem>;
  getRicefwItem(id: string): Promise<RicefwItem | null>;
  updateRicefwItem(id: string, data: Partial<RicefwItem>, audit: AuditContext): Promise<RicefwItem>;
  deleteRicefwItem(id: string, audit: AuditContext): Promise<void>;
  listRicefwItems(projectId: string, type?: RicefwItem['type']): Promise<RicefwItem[]>;

  // Form Operations
  createForm(data: Omit<FormSpec, 'id' | 'createdAt'>, audit: AuditContext): Promise<FormSpec>;
  listForms(projectId: string): Promise<FormSpec[]>;

  // Integration Operations
  createIntegration(data: Omit<IntegrationSpec, 'id' | 'createdAt'>, audit: AuditContext): Promise<IntegrationSpec>;
  listIntegrations(projectId: string): Promise<IntegrationSpec[]>;

  // Chip Operations
  createChip(data: Omit<Chip, 'id' | 'createdAt'>, audit: AuditContext): Promise<Chip>;
  listChips(projectId: string, type?: Chip['type']): Promise<Chip[]>;
  deleteChip(id: string, audit: AuditContext): Promise<void>;

  // Snapshot Operations
  createSnapshot(data: Omit<EstimateSnapshot, 'id' | 'createdAt'>, audit: AuditContext): Promise<EstimateSnapshot>;
  getSnapshot(id: string): Promise<EstimateSnapshot | null>;
  listSnapshots(projectId: string): Promise<EstimateSnapshot[]>;

  // Audit Trail
  getAuditLog(entityId: string, limit?: number): Promise<any[]>;

  // Transaction Support
  transaction<T>(fn: (dal: IDAL) => Promise<T>): Promise<T>;

  // Health Check
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }>;
}

// ============================================================================
// VALIDATION SCHEMAS (ZOD)
// ============================================================================

export const ProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED']),
  clientName: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  employees: z.number().int().min(0).max(1000000).optional(),
  revenue: z.number().min(0).max(999999999999.99).optional(),
  legalEntities: z.number().int().min(0).max(1000).optional(),
  moduleCombo: z.string().max(500).optional(),
  complexity: z.string().max(50).optional(),
  ssoMode: z.string().max(50).optional(),
  integrationPosture: z.string().max(50).optional(),
  rateRegion: z.string().max(50).optional(),
  totalEffort: z.number().min(0).max(100000).optional(),
  totalCost: z.number().min(0).max(999999999999.99).optional(),
  duration: z.number().int().min(0).max(3650).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  ownerId: z.string().cuid(),
});

export const PhaseSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1).max(255),
  category: z.enum(['prepare', 'explore', 'realize', 'deploy', 'run']),
  workingDays: z.number().int().min(0).max(1000),
  effort: z.number().min(0).max(10000),
  startBusinessDay: z.number().int().min(0).max(10000),
  color: z.string().regex(/^(blue|green|yellow|red|purple|orange|gray)$/),
  dependencies: z.array(z.string().cuid()).optional(),
  order: z.number().int().min(0).max(1000),
});

export const ResourceSchema = z.object({
  projectId: z.string().cuid(),
  phaseId: z.string().cuid().optional(),
  name: z.string().min(1).max(255),
  role: z.enum(['PM', 'Technical', 'Functional', 'Architect', 'Basis', 'Security', 'ChangeManagement']),
  region: z.string().min(1).max(100),
  allocation: z.number().int().min(0).max(100),
  hourlyRate: z.number().min(0).max(10000),
});

export const RicefwItemSchema = z.object({
  projectId: z.string().cuid(),
  type: z.enum(['report', 'interface', 'conversion', 'enhancement', 'form', 'workflow']),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  complexity: z.enum(['S', 'M', 'L']),
  count: z.number().int().min(0).max(10000),
  effortPerItem: z.number().min(0).max(1000),
  totalEffort: z.number().min(0).max(100000),
  phase: z.enum(['explore', 'realize', 'deploy']),
});

export const FormSpecSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1).max(255),
  type: z.enum(['po', 'invoice', 'deliveryNote', 'custom']),
  languages: z.array(z.string().min(2).max(5)),
  complexity: z.enum(['S', 'M', 'L']),
  effort: z.number().min(0).max(1000),
});

export const IntegrationSpecSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1).max(255),
  type: z.enum(['api', 'file', 'database', 'realtime', 'batch']),
  source: z.string().min(1).max(255),
  target: z.string().min(1).max(255),
  complexity: z.enum(['S', 'M', 'L']),
  volume: z.enum(['low', 'medium', 'high']),
  effort: z.number().min(0).max(1000),
});

export const ChipSchema = z.object({
  projectId: z.string().cuid(),
  type: z.enum(['COUNTRY', 'EMPLOYEES', 'REVENUE', 'INDUSTRY', 'MODULES', 'TIMELINE', 'INTEGRATION', 'COMPLIANCE', 'LEGAL_ENTITIES', 'SSO', 'LOCATIONS', 'DATA_VOLUME', 'USERS']),
  value: z.string().max(2000),
  confidence: z.number().min(0).max(1),
  evidence: z.string().max(5000).optional(),
});

export const SnapshotSchema = z.object({
  projectId: z.string().cuid(),
  version: z.number().int().min(1),
  data: z.record(z.string(), z.any()),
  createdBy: z.string().cuid(),
  label: z.string().max(255).optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateProject(data: any): z.infer<typeof ProjectSchema> {
  return ProjectSchema.parse(data);
}

export function validatePhase(data: any): z.infer<typeof PhaseSchema> {
  return PhaseSchema.parse(data);
}

export function validateResource(data: any): z.infer<typeof ResourceSchema> {
  return ResourceSchema.parse(data);
}

export function validateRicefwItem(data: any): z.infer<typeof RicefwItemSchema> {
  return RicefwItemSchema.parse(data);
}

export function validateFormSpec(data: any): z.infer<typeof FormSpecSchema> {
  return FormSpecSchema.parse(data);
}

export function validateIntegrationSpec(data: any): z.infer<typeof IntegrationSpecSchema> {
  return IntegrationSpecSchema.parse(data);
}

export function validateChip(data: any): z.infer<typeof ChipSchema> {
  return ChipSchema.parse(data);
}

export function validateSnapshot(data: any): z.infer<typeof SnapshotSchema> {
  return SnapshotSchema.parse(data);
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class DALError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'UNAUTHORIZED' | 'DATABASE' | 'UNKNOWN',
    public details?: any
  ) {
    super(message);
    this.name = 'DALError';
  }
}

export class ValidationError extends DALError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DALError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}