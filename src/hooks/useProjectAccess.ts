/**
 * useProjectAccess Hook
 *
 * Client-side hook for fetching and caching project access permissions.
 * Supports the presales-to-project team collaboration workflow.
 *
 * Usage:
 * ```tsx
 * const { access, isLoading, error } = useProjectAccess(projectId);
 *
 * if (access?.permissions.write) {
 *   // Show timeline editing controls
 * }
 *
 * if (access?.permissions.editResources) {
 *   // Show resource editing controls
 * }
 * ```
 */

import { useState, useEffect, useCallback } from "react";

export type CollaboratorRole = "OWNER" | "EDITOR" | "RESOURCE_EDITOR" | "VIEWER";

export interface ProjectPermissions {
  read: boolean;
  write: boolean;
  editResources: boolean;
  admin: boolean;
}

export interface ProjectAccess {
  projectId: string;
  userId: string;
  role: CollaboratorRole | null;
  permissions: ProjectPermissions;
  isOwner: boolean;
}

export interface UseProjectAccessResult {
  access: ProjectAccess | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache to avoid redundant fetches
const accessCache = new Map<string, { data: ProjectAccess; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export function useProjectAccess(projectId: string | null | undefined): UseProjectAccessResult {
  const [access, setAccess] = useState<ProjectAccess | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccess = useCallback(async () => {
    if (!projectId) {
      setAccess(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = accessCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setAccess(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gantt-tool/projects/${projectId}/access`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        if (response.status === 403) {
          throw new Error("Access denied");
        }
        throw new Error("Failed to fetch access");
      }

      const data: ProjectAccess = await response.json();

      // Update cache
      accessCache.set(projectId, { data, timestamp: Date.now() });

      setAccess(data);
    } catch (err) {
      console.error("Error fetching project access:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setAccess(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  return {
    access,
    isLoading,
    error,
    refetch: fetchAccess,
  };
}

/**
 * Clear the access cache for a specific project or all projects
 */
export function clearProjectAccessCache(projectId?: string) {
  if (projectId) {
    accessCache.delete(projectId);
  } else {
    accessCache.clear();
  }
}

/**
 * Helper function to check if a role can edit timeline
 */
export function canEditTimeline(role: CollaboratorRole | null): boolean {
  return role === "OWNER" || role === "EDITOR";
}

/**
 * Helper function to check if a role can edit resources
 */
export function canEditResources(role: CollaboratorRole | null): boolean {
  return role === "OWNER" || role === "EDITOR" || role === "RESOURCE_EDITOR";
}

/**
 * Helper function to check if a role can share the project
 */
export function canShareProject(role: CollaboratorRole | null): boolean {
  return role === "OWNER";
}

/**
 * Helper function to check if a role can edit context
 */
export function canEditContext(role: CollaboratorRole | null): boolean {
  return role === "OWNER" || role === "EDITOR";
}
