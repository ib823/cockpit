/**
 * Org Chart Drag & Drop Hook
 * Steve Jobs/Jony Ive Design: Intuitive drag-and-drop for org chart hierarchy
 *
 * Features:
 * - Drag card onto top half = becomes manager
 * - Drag card onto bottom half = becomes direct report
 * - Prevents circular reporting structures
 * - Smooth animations and visual feedback
 */

import { useState, useCallback } from "react";
import type { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";

export type Designation =
  | "principal"
  | "director"
  | "senior-manager"
  | "manager"
  | "senior-consultant"
  | "consultant"
  | "analyst"
  | "subcontractor";

export type ResourceCategory =
  | "leadership"
  | "pm"
  | "technical"
  | "functional"
  | "change"
  | "qa"
  | "basis"
  | "security"
  | "other";

export interface OrgNode {
  id: string;
  roleTitle: string;
  designation: Designation;
  category?: ResourceCategory; // Resource category for grouping
  companyLogoUrl?: string; // URL to uploaded company logo
  companyName?: string; // Company name for fallback display
  dailyRate?: number;
  reportsTo?: string;
}

export type DropZoneType = "top" | "bottom" | "left" | "right";

export interface DropZoneData {
  type: DropZoneType;
  targetNodeId: string;
}

export interface DragData {
  type: "org-card";
  nodeId: string;
  currentParent?: string;
}

export function useOrgChartDragDrop(
  nodes: OrgNode[],
  onNodesChange: (nodes: OrgNode[]) => void,
  onInvalidDrop?: (targetId: string, reason: string) => void, // Callback for invalid drop feedback
  onPeerLinkCreated?: (node1Id: string, node2Id: string) => void // Callback when user creates peer link via left/right drop
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<DropZoneType | null>(null);
  const [invalidTargetId, setInvalidTargetId] = useState<string | null>(null);

  // Check if reassignment would create a circular dependency
  const wouldCreateCircularDependency = useCallback(
    (nodeId: string, newParentId: string): boolean => {
      // Can't report to yourself
      if (nodeId === newParentId) return true;

      // Check if newParent is a descendant of node
      const isDescendant = (ancestorId: string, descendantId: string): boolean => {
        const node = nodes.find(n => n.id === descendantId);
        if (!node || !node.reportsTo) return false;
        if (node.reportsTo === ancestorId) return true;
        return isDescendant(ancestorId, node.reportsTo);
      };

      return isDescendant(nodeId, newParentId);
    },
    [nodes]
  );

  // Get all descendants of a node
  const getDescendants = useCallback((nodeId: string): string[] => {
    const descendants: string[] = [];
    const stack = [nodeId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      const children = nodes.filter(n => n.reportsTo === currentId);

      children.forEach(child => {
        descendants.push(child.id);
        stack.push(child.id);
      });
    }

    return descendants;
  }, [nodes]);

  // Reassign reporting structure when card is dropped
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setOverId(null);
      setDropZone(null);

      if (!over) return;

      const draggedNodeId = active.id as string;
      const dropData = over.data.current as DropZoneData;

      if (!dropData) return;

      const { type, targetNodeId } = dropData;

      // Prevent invalid operations
      if (draggedNodeId === targetNodeId) {
        if (onInvalidDrop) {
          onInvalidDrop(targetNodeId, "Cannot drop on the same card");
        }
        return;
      }

      if (wouldCreateCircularDependency(draggedNodeId, targetNodeId)) {
        if (onInvalidDrop) {
          onInvalidDrop(targetNodeId, "Cannot create circular reporting structure");
        }
        return;
      }

      const newNodes = [...nodes];
      const draggedNode = newNodes.find(n => n.id === draggedNodeId);
      const targetNode = newNodes.find(n => n.id === targetNodeId);

      if (!draggedNode || !targetNode) return;

      if (type === "top") {
        // Dragged card becomes MANAGER of target
        // Target now reports to dragged card
        // Dragged card takes target's current manager
        const targetCurrentParent = targetNode.reportsTo;

        draggedNode.reportsTo = targetCurrentParent;
        targetNode.reportsTo = draggedNodeId;

      } else if (type === "bottom") {
        // Dragged card becomes DIRECT REPORT of target
        // Dragged card now reports to target
        draggedNode.reportsTo = targetNodeId;

      } else if (type === "left" || type === "right") {
        // Dragged card becomes PEER/SIBLING of target (same level)
        // Both report to same manager
        draggedNode.reportsTo = targetNode.reportsTo;

        // Create explicit peer link (visual connection line)
        if (onPeerLinkCreated) {
          onPeerLinkCreated(draggedNodeId, targetNodeId);
        }
      }

      onNodesChange(newNodes);
    },
    [nodes, onNodesChange, wouldCreateCircularDependency, onPeerLinkCreated]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (over) {
      const dropData = over.data.current as DropZoneData;
      if (dropData) {
        const draggedId = active.id as string;
        const targetId = dropData.targetNodeId;

        // Check if this drop would be invalid
        if (draggedId === targetId) {
          // Can't drop on self
          setInvalidTargetId(targetId);
          setOverId(null);
          setDropZone(null);
          return;
        }

        if (wouldCreateCircularDependency(draggedId, targetId)) {
          // Would create circular dependency
          setInvalidTargetId(targetId);
          setOverId(null);
          setDropZone(null);
          return;
        }

        // Valid drop target
        setInvalidTargetId(null);
        setOverId(dropData.targetNodeId);
        setDropZone(dropData.type);
      }
    } else {
      setOverId(null);
      setDropZone(null);
      setInvalidTargetId(null);
    }
  }, [wouldCreateCircularDependency]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
    setDropZone(null);
    setInvalidTargetId(null);
  }, []);

  return {
    activeId,
    overId,
    dropZone,
    invalidTargetId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragCancel,
    wouldCreateCircularDependency,
    getDescendants,
  };
}
