import traceability from "../../docs/traceability.json";
import { z } from "zod";

// --- Zod Schemas for Validation ---

const StatusEnum = z.enum(["mock", "db", "derived", "user_input"]);

const FieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: StatusEnum,
  source: z.array(z.string()),
  transform: z.string(),
  destinations: z.array(z.string()),
  page: z.string(),
  component: z.string(),
  validation: z.string().optional(),
  auditTrail: z.boolean().optional(),
  currency: z.string().optional(),
  proposedDerivation: z.string().optional(),
  mdMultipliers: z.record(z.string(), z.number()).optional(),
  confidence: z.string().optional(),
});

const PageSchema = z.object({
  fields: z.array(z.string()),
  mockCount: z.number(),
  dbCount: z.number(),
  derivedCount: z.number(),
  proposedFix: z.string().optional(),
});

const MigrationSchema = z.object({
  field: z.string(),
  currentStatus: StatusEnum,
  targetStatus: StatusEnum,
  migration: z.string(),
  dependencies: z.array(z.string()),
});

const TraceabilitySchema = z.object({
  version: z.string(),
  updated: z.string(),
  legend: z.object({
    status: z.record(z.string(), z.string()),
  }),
  fields: z.record(z.string(), FieldSchema),
  pages: z.record(z.string(), PageSchema),
  proposedMigrations: z.array(MigrationSchema),
});

// --- Type Definitions ---

export type Status = z.infer<typeof StatusEnum>;
export type Field = z.infer<typeof FieldSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Migration = z.infer<typeof MigrationSchema>;
export type TraceabilityData = z.infer<typeof TraceabilitySchema>;

// --- Lineage Class ---

class Lineage {
  private data: TraceabilityData;

  constructor(data: unknown) {
    try {
      this.data = TraceabilitySchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Traceability data validation failed:", (error as any).errors);
      }
      throw new Error("Failed to initialize Lineage due to invalid data.");
    }
  }

  /**
   * Retrieves a field by its ID.
   * @param id - The ID of the field (e.g., "project.totalEffort").
   * @returns The field object or undefined if not found.
   */
  getField(id: string): Field | undefined {
    return this.data.fields[id];
  }

  /**
   * Gets all fields associated with a specific page.
   * @param pageName - The name of the page (e.g., "Dashboard").
   * @returns An array of field objects.
   */
  getFieldsByPage(pageName: string): Field[] {
    const page = this.data.pages[pageName];
    if (!page) return [];
    return page.fields.map((fieldId) => this.getField(fieldId)).filter((f): f is Field => !!f);
  }

  /**
   * Finds all fields that are in a 'mock' state.
   * @returns An array of mock fields.
   */
  getMockFields(): Field[] {
    return Object.values(this.data.fields).filter((field) => field.status === "mock");
  }

  /**
   * Traces the lineage of a field from its sources to its destinations.
   * @param id - The ID of the field to trace.
   * @returns An object containing the field, its sources, and its destinations.
   */
  trace(
    id: string
  ): { field: Field; sources: (Field | string)[]; destinations: (Field | string)[] } | null {
    const field = this.getField(id);
    if (!field) return null;

    const sources = field.source.map((srcId) => this.getField(srcId) || `External: ${srcId}`);
    const destinations = field.destinations.map(
      (destId) => this.getField(destId) || `External: ${destId}`
    );

    return { field, sources, destinations };
  }

  /**
   * Returns all proposed migrations.
   * @returns An array of migration objects.
   */
  getMigrations(): Migration[] {
    return this.data.proposedMigrations;
  }

  /**
   * Validates the entire traceability data against the schema.
   * @returns True if the data is valid, false otherwise.
   */
  validate(): boolean {
    try {
      TraceabilitySchema.parse(this.data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Provides a summary of the data lineage status.
   * @returns An object with counts of fields by status.
   */
  getSummary(): Record<Status, number> {
    const summary: Record<Status, number> = {
      mock: 0,
      db: 0,
      derived: 0,
      user_input: 0,
    };
    for (const field of Object.values(this.data.fields)) {
      summary[field.status]++;
    }
    return summary;
  }
}

// --- Singleton Instance ---

/**
 * A singleton instance of the Lineage class, pre-loaded with the traceability data.
 * Use this instance to query the data lineage of fields throughout the application.
 *
 * @example
 * import lineage from '@/lib/lineage';
 *
 * const totalEffortField = lineage.getField('project.totalEffort');
 * const dashboardMocks = lineage.getFieldsByPage('Dashboard').filter(f => f.status === 'mock');
 * const migrations = lineage.getMigrations();
 */
const lineage = new Lineage(traceability);

export default lineage;
