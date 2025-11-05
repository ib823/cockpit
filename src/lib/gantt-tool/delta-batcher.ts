/**
 * Delta Batcher - Splits large deltas into smaller batches to avoid timeouts
 *
 * When saving projects with many resource assignments or tasks, a single
 * transaction can timeout. This utility breaks large deltas into smaller
 * chunks that can be saved sequentially.
 */

import type { ProjectDelta } from '@/types/gantt-tool';

export interface DeltaBatch {
  batch: ProjectDelta;
  batchNumber: number;
  totalBatches: number;
  description: string;
}

/**
 * Configuration for batching thresholds
 */
const BATCH_THRESHOLDS = {
  // Max items per batch to avoid timeout
  maxPhasesPerBatch: 10,
  maxResourcesPerBatch: 50,
  maxTasksPerBatch: 50, // Across all phases in a batch

  // Minimum items to trigger batching
  minItemsForBatching: 100, // Total items across all entity types
};

/**
 * Count total items in a delta
 */
function countDeltaItems(delta: ProjectDelta): number {
  let count = 0;

  if (delta.phases) {
    count += (delta.phases.created?.length || 0);
    count += (delta.phases.updated?.length || 0);
    count += (delta.phases.deleted?.length || 0);

    // Count tasks within phases
    delta.phases.created?.forEach(phase => {
      count += (phase.tasks?.length || 0);
    });
    delta.phases.updated?.forEach(phase => {
      count += (phase.tasks?.length || 0);
    });
  }

  if (delta.resources) {
    count += (delta.resources.created?.length || 0);
    count += (delta.resources.updated?.length || 0);
    count += (delta.resources.deleted?.length || 0);
  }

  if (delta.milestones) {
    count += (delta.milestones.created?.length || 0);
    count += (delta.milestones.updated?.length || 0);
    count += (delta.milestones.deleted?.length || 0);
  }

  if (delta.holidays) {
    count += (delta.holidays.created?.length || 0);
    count += (delta.holidays.updated?.length || 0);
    count += (delta.holidays.deleted?.length || 0);
  }

  return count;
}

/**
 * Determine if a delta needs to be batched
 */
export function shouldBatchDelta(delta: ProjectDelta): boolean {
  const totalItems = countDeltaItems(delta);
  return totalItems >= BATCH_THRESHOLDS.minItemsForBatching;
}

/**
 * Split a delta into multiple batches
 *
 * Strategy:
 * 1. Always process project-level updates in first batch
 * 2. Resources must be processed before phases (FK dependency)
 * 3. Phases and tasks are batched together
 * 4. Milestones and holidays in final batch
 */
export function batchDelta(delta: ProjectDelta): DeltaBatch[] {
  const batches: DeltaBatch[] = [];
  let batchNumber = 0;

  // Batch 1: Project updates + resources
  if (delta.projectUpdates || delta.resources) {
    const batch: ProjectDelta = {};

    if (delta.projectUpdates) {
      batch.projectUpdates = delta.projectUpdates;
    }

    if (delta.resources) {
      // Split resources if too many
      const resourceBatches = batchResources(delta.resources);

      for (let i = 0; i < resourceBatches.length; i++) {
        batches.push({
          batch: {
            projectUpdates: i === 0 ? delta.projectUpdates : undefined,
            resources: resourceBatches[i],
          },
          batchNumber: ++batchNumber,
          totalBatches: 0, // Will be set at the end
          description: `Saving project metadata and resources (${i + 1}/${resourceBatches.length})`,
        });
      }
    } else {
      batches.push({
        batch,
        batchNumber: ++batchNumber,
        totalBatches: 0,
        description: 'Saving project metadata',
      });
    }
  }

  // Batch 2+: Phases (with tasks)
  if (delta.phases) {
    const phaseBatches = batchPhases(delta.phases);

    for (let i = 0; i < phaseBatches.length; i++) {
      batches.push({
        batch: { phases: phaseBatches[i] },
        batchNumber: ++batchNumber,
        totalBatches: 0,
        description: `Saving phases and tasks (${i + 1}/${phaseBatches.length})`,
      });
    }
  }

  // Final batch: Milestones and holidays
  if (delta.milestones || delta.holidays) {
    batches.push({
      batch: {
        milestones: delta.milestones,
        holidays: delta.holidays,
      },
      batchNumber: ++batchNumber,
      totalBatches: 0,
      description: 'Saving milestones and holidays',
    });
  }

  // Set total batches count
  const totalBatches = batches.length;
  batches.forEach(b => b.totalBatches = totalBatches);

  return batches;
}

/**
 * Batch resources into smaller chunks
 */
function batchResources(resources: {
  created?: any[];
  updated?: any[];
  deleted?: string[];
}) {
  const batches: typeof resources[] = [];
  const maxPerBatch = BATCH_THRESHOLDS.maxResourcesPerBatch;

  // Calculate how many batches we need
  const totalCreated = resources.created?.length || 0;
  const totalUpdated = resources.updated?.length || 0;
  const totalDeleted = resources.deleted?.length || 0;
  const total = totalCreated + totalUpdated + totalDeleted;

  if (total <= maxPerBatch) {
    return [resources];
  }

  // Split into batches
  let currentBatch: typeof resources = {};
  let currentBatchSize = 0;

  const addToBatch = (items: any[] | string[] | undefined, type: 'created' | 'updated' | 'deleted') => {
    if (!items || items.length === 0) return;

    for (const item of items) {
      if (currentBatchSize >= maxPerBatch) {
        batches.push(currentBatch);
        currentBatch = {};
        currentBatchSize = 0;
      }

      if (!currentBatch[type]) {
        currentBatch[type] = [];
      }
      (currentBatch[type] as any[]).push(item);
      currentBatchSize++;
    }
  };

  // Process in order: created -> updated -> deleted
  addToBatch(resources.created, 'created');
  addToBatch(resources.updated, 'updated');
  addToBatch(resources.deleted, 'deleted');

  // Add remaining batch
  if (currentBatchSize > 0) {
    batches.push(currentBatch);
  }

  return batches.length > 0 ? batches : [resources];
}

/**
 * Batch phases into smaller chunks
 */
function batchPhases(phases: {
  created?: any[];
  updated?: any[];
  deleted?: string[];
}) {
  const batches: typeof phases[] = [];
  const maxPerBatch = BATCH_THRESHOLDS.maxPhasesPerBatch;

  // For phases, we need to be careful because they include tasks
  // We'll batch by phase count, not task count

  const batchPhaseArray = (items: any[] | undefined) => {
    if (!items || items.length === 0) return [];

    const result: any[][] = [];
    for (let i = 0; i < items.length; i += maxPerBatch) {
      result.push(items.slice(i, i + maxPerBatch));
    }
    return result;
  };

  const createdBatches = batchPhaseArray(phases.created);
  const updatedBatches = batchPhaseArray(phases.updated);
  const deletedBatches = phases.deleted
    ? [phases.deleted.slice(0, maxPerBatch * 2)] // Deletes are cheap, allow more
    : [];

  const maxBatches = Math.max(
    createdBatches.length,
    updatedBatches.length,
    deletedBatches.length
  );

  for (let i = 0; i < maxBatches; i++) {
    const batch: typeof phases = {};

    if (createdBatches[i]) batch.created = createdBatches[i];
    if (updatedBatches[i]) batch.updated = updatedBatches[i];
    if (deletedBatches[i]) batch.deleted = deletedBatches[i];

    if (Object.keys(batch).length > 0) {
      batches.push(batch);
    }
  }

  return batches.length > 0 ? batches : [phases];
}
