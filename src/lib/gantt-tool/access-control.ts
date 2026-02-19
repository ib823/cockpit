/**
 * Access Control Helpers for Gantt Tool
 *
 * Provides utilities for checking user permissions on projects
 */

import { prisma } from "@/lib/db";

export type ProjectPermission = "read" | "write" | "admin";

export interface ProjectAccessCheck {
  hasAccess: boolean;
  role: "OWNER" | "EDITOR" | "VIEWER" | null;
  isOwner: boolean;
  canRead: boolean;
  canWrite: boolean;
  canEditResources: boolean;
  canAdmin: boolean;
}

/**
 * Check if a user has access to a project and what permissions they have
 */
export async function checkProjectAccess(
  projectId: string,
  userId: string
): Promise<ProjectAccessCheck> {
  const project = await prisma.ganttProject.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
    },
    select: {
      userId: true,
      collaborators: {
        where: {
          userId,
        },
        select: {
          role: true,
        },
      },
    },
  });

  if (!project) {
    return {
      hasAccess: false,
      role: null,
      isOwner: false,
      canRead: false,
      canWrite: false,
      canEditResources: false,
      canAdmin: false,
    };
  }

  const isOwner = project.userId === userId;
  const collaborator = project.collaborators[0];
  const role = isOwner ? "OWNER" : collaborator?.role || null;

  const hasAccess = isOwner || !!collaborator;
  const canRead = hasAccess;
  const canWrite = isOwner || role === "EDITOR" || role === "OWNER";
  const canEditResources = canWrite;
  const canAdmin = isOwner || role === "OWNER";

  return {
    hasAccess,
    role,
    isOwner,
    canRead,
    canWrite,
    canEditResources,
    canAdmin,
  };
}

/**
 * Check if user has specific permission level
 */
export async function hasProjectPermission(
  projectId: string,
  userId: string,
  permission: ProjectPermission
): Promise<boolean> {
  const access = await checkProjectAccess(projectId, userId);

  switch (permission) {
    case "read":
      return access.canRead;
    case "write":
      return access.canWrite;
    case "admin":
      return access.canAdmin;
    default:
      return false;
  }
}

/**
 * Ensure user has specific permission, throw error if not
 */
export async function requireProjectPermission(
  projectId: string,
  userId: string,
  permission: ProjectPermission
): Promise<ProjectAccessCheck> {
  const access = await checkProjectAccess(projectId, userId);

  let hasPermission = false;
  switch (permission) {
    case "read":
      hasPermission = access.canRead;
      break;
    case "write":
      hasPermission = access.canWrite;
      break;
    case "admin":
      hasPermission = access.canAdmin;
      break;
  }

  if (!hasPermission) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }

  return access;
}

/**
 * Check if user has any of the specified roles for a project
 * Used by Team Capacity API endpoints for role-based access control
 */
export async function hasAnyProjectRole(
  projectId: string,
  userId: string,
  allowedRoles: Array<"OWNER" | "EDITOR" | "VIEWER">
): Promise<boolean> {
  const access = await checkProjectAccess(projectId, userId);

  if (!access.hasAccess) {
    return false;
  }

  if (!access.role) {
    return false;
  }

  return allowedRoles.includes(access.role);
}
