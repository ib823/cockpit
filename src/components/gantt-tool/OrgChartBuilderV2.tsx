/**
 * Org Chart Builder V2 - With Drag & Drop
 * Steve Jobs/Jony Ive Design: Intuitive drag-and-drop for org chart hierarchy
 *
 * Features:
 * - Drag cards to rearrange reporting structure
 * - Drop on top half = becomes manager
 * - Drop on bottom half = becomes direct report
 * - Smooth animations and visual feedback
 * - Keyboard shortcuts
 * - Real-time cost calculation
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { X, Plus, ZoomIn, ZoomOut, Save, Check } from "lucide-react";
import { useOrgChartDragDrop } from "@/hooks/useOrgChartDragDrop";
import type { OrgNode, Designation, ResourceCategory } from "@/hooks/useOrgChartDragDrop";
import { DraggableOrgCardV4 } from "./DraggableOrgCardV4";
import {
  calculateTreeLayout,
  calculateAllConnectionPaths,
  calculatePeerConnectionPaths,
  type LayoutNode,
  CARD_WIDTH,
  CARD_HEIGHT,
  CANVAS_MARGIN,
  LEVEL_GAP
} from "@/lib/org-chart/spacing-algorithm";
import type { GanttProject } from "@/types/gantt-tool";
import type { ResourceDesignation } from "@/types/gantt-tool";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { getAllCompanyLogos } from "@/lib/default-company-logos";
import { getTotalResourceCount } from "@/lib/gantt-tool/resource-utils";
import { diagnoseResourceHierarchy, getOrphanedResourceIds } from "@/lib/gantt-tool/resource-diagnostics";
import "../../styles/org-chart-drag-drop.css";

interface OrgChartBuilderV2Props {
  onClose: () => void;
  project?: GanttProject | null; // Project for accessing company logos
}

type Direction = "vertical" | "horizontal";

type TreeNode = {
  node: OrgNode;
  level: number;
  index: number;
  children: TreeNode[];
};

type ZoomMode = "auto-fit" | "scrollable";

export function OrgChartBuilderV2({ onClose, project }: OrgChartBuilderV2Props) {
  // Merge default logos with custom project logos
  const customLogos = project?.orgChartPro?.companyLogos || {};
  const companyLogos = getAllCompanyLogos(customLogos);
  const { addResource, updateResource, currentProject, addPeerLink, getPeerLinks, removePeerLink } = useGanttToolStoreV2();
  const [direction, setDirection] = useState<Direction>("vertical");
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [successNodeId, setSuccessNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Map resource designation to org chart designation
  const mapToOrgDesignation = (designation: ResourceDesignation): Designation => {
    const mapping: Record<ResourceDesignation, Designation> = {
      "principal": "principal",
      "director": "director",
      "senior_manager": "senior-manager",
      "manager": "manager",
      "senior_consultant": "senior-consultant",
      "consultant": "consultant",
      "analyst": "analyst",
      "subcontractor": "subcontractor"
    };
    return mapping[designation] || "consultant";
  };

  // Load existing resources from project or start with empty state
  const getInitialNodes = (): OrgNode[] => {
    if (currentProject?.resources && currentProject.resources.length > 0) {
      // Convert existing resources to OrgNodes
      return currentProject.resources.map(resource => ({
        id: resource.id,
        roleTitle: resource.name,
        designation: mapToOrgDesignation(resource.designation),
        category: resource.category,
        companyName: resource.description || "Company",
        reportsTo: resource.managerResourceId || undefined,
        dailyRate: resource.chargeRatePerHour ? resource.chargeRatePerHour * 8 : undefined,
      }));
    }

    // Empty state - user can add resources from scratch
    return [];
  };

  const [nodes, setNodes] = useState<OrgNode[]>(getInitialNodes());

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDesignation, setEditingDesignation] = useState<Designation>("consultant");
  const [multiSelectedNodes, setMultiSelectedNodes] = useState<Set<string>>(new Set());
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("auto-fit");
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false); // Space key held = pan mode
  const [invalidNodeId, setInvalidNodeId] = useState<string | null>(null); // Invalid drop target
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Toast notification helper
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  };

  // Success animation helper
  const triggerSuccessAnimation = (nodeId: string) => {
    setSuccessNodeId(nodeId);
    setTimeout(() => setSuccessNodeId(null), 600);
  };

  // Invalid drop handler
  const handleInvalidDrop = useCallback((targetId: string, reason: string) => {
    setInvalidNodeId(targetId);
    showToast(reason);

    // Clear invalid state after animation
    setTimeout(() => {
      setInvalidNodeId(null);
    }, 600);
  }, []);

  // Handle peer link creation/removal when user drops on left/right zone
  // Toggle behavior: create if doesn't exist, remove if it does
  const handlePeerLinkCreated = useCallback(
    (node1Id: string, node2Id: string) => {
      const peerLinks = getPeerLinks();
      const existingLink = peerLinks.find(
        (link) =>
          (link.resource1Id === node1Id && link.resource2Id === node2Id) ||
          (link.resource1Id === node2Id && link.resource2Id === node1Id)
      );

      if (existingLink) {
        // Remove existing peer link
        removePeerLink(existingLink.id);
        showToast("Peer link removed");
      } else {
        // Create new peer link
        addPeerLink(node1Id, node2Id);
        showToast("Peer link created");
      }
    },
    [addPeerLink, getPeerLinks, removePeerLink]
  );

  // Drag-and-drop hook
  const {
    activeId,
    overId,
    dropZone,
    invalidTargetId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragCancel,
  } = useOrgChartDragDrop(nodes, setNodes, handleInvalidDrop, handlePeerLinkCreated);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 12, // 12px threshold for better disambiguation with pan
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,      // 200ms long-press for touch devices
        tolerance: 8,    // 8px tolerance during long-press
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Build tree structure
  const buildTree = (allNodes: OrgNode[]): TreeNode[] => {
    const roots = allNodes.filter(n => !n.reportsTo);
    const getChildren = (parentId: string): OrgNode[] => {
      return allNodes.filter(n => n.reportsTo === parentId);
    };

    const assignPositions = (
      node: OrgNode,
      level: number,
      siblingIndex: number
    ): TreeNode => {
      return {
        node,
        level,
        index: siblingIndex,
        children: getChildren(node.id).map((child, idx) =>
          assignPositions(child, level + 1, idx)
        ),
      };
    };

    return roots.map((root, idx) => assignPositions(root, 0, idx));
  };

  const tree = buildTree(nodes);

  // Diagnostic: Run hierarchy analysis to detect orphaned resources
  useEffect(() => {
    if (currentProject && nodes.length > 0) {
      const diagnostics = diagnoseResourceHierarchy(currentProject);

      if (diagnostics.issues.length > 0 || diagnostics.orphanedResources > 0) {
        console.warn("⚠️ Org Chart Hierarchy Issues Detected:");
        console.warn(`Total Resources in Project: ${diagnostics.totalResources}`);
        console.warn(`Resources Showing in Org Chart: ${diagnostics.validHierarchyResources}`);
        console.warn(`Orphaned Resources (invisible): ${diagnostics.orphanedResources}`);
        console.warn("Issues:");
        diagnostics.issues.forEach((issue, i) => {
          console.warn(`  ${i + 1}. ${issue}`);
        });
        console.warn("\nDetailed Resource Breakdown:");
        console.table(diagnostics.resourceBreakdown);
      } else {
        console.log("✓ Org Chart Hierarchy: All resources have valid hierarchy");
        console.log(`Total Resources: ${diagnostics.totalResources}`);
        console.log(`Hierarchy Levels: ${diagnostics.hierarchyLevels}`);
      }
    }
  }, [currentProject, nodes.length]);

  // Add node with focus animation
  const addNode = (parentId?: string, designation: Designation = "consultant") => {
    const newNode: OrgNode = {
      id: `node-${Date.now()}`,
      roleTitle: "New Role",
      designation,
      companyName: "Company",
      reportsTo: parentId,
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
    setEditingNode(newNode.id);
    setEditingTitle("New Role");
    setEditingDesignation(designation);

    const parentNode = parentId ? nodes.find(n => n.id === parentId) : null;
    showToast(parentNode ? `Added new role reporting to ${parentNode.roleTitle}` : "Added new top-level role");
    triggerSuccessAnimation(newNode.id);

    // Focus animation: Briefly highlight and ensure visibility
    setTimeout(() => {
      // If we're in scrollable mode and many nodes, we could add smooth scroll to new node
      // For now, the success animation provides visual feedback
    }, 100);
  };

  // Add manager (creates a new node above current node)
  const addManager = (nodeId: string) => {
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) return;

    const newManagerNode: OrgNode = {
      id: `node-${Date.now()}`,
      roleTitle: "New Manager",
      designation: "manager",
      companyName: currentNode.companyName || "Company",
      reportsTo: currentNode.reportsTo,
    };

    setNodes([
      ...nodes.map(n => n.id === nodeId ? { ...n, reportsTo: newManagerNode.id } : n),
      newManagerNode
    ]);
    setSelectedNode(newManagerNode.id);
    setEditingNode(newManagerNode.id);
    setEditingTitle("New Manager");
    setEditingDesignation("manager");

    showToast(`Added manager above ${currentNode.roleTitle}`);
    triggerSuccessAnimation(newManagerNode.id);
  };

  // Add peer (creates a new node at same level)
  const addPeer = (nodeId: string, direction: "left" | "right" = "right") => {
    const currentNodeIndex = nodes.findIndex(n => n.id === nodeId);
    if (currentNodeIndex === -1) return;

    const currentNode = nodes[currentNodeIndex];

    const newPeerNode: OrgNode = {
      id: `node-${Date.now()}`,
      roleTitle: "New Peer",
      designation: currentNode.designation,
      companyName: currentNode.companyName || "Company",
      reportsTo: currentNode.reportsTo,
    };

    // Insert the new peer at the correct position
    const newNodes = [...nodes];
    if (direction === "left") {
      // Insert before current node (on the left)
      newNodes.splice(currentNodeIndex, 0, newPeerNode);
    } else {
      // Insert after current node (on the right)
      newNodes.splice(currentNodeIndex + 1, 0, newPeerNode);
    }

    setNodes(newNodes);
    setSelectedNode(newPeerNode.id);
    setEditingNode(newPeerNode.id);
    setEditingTitle("New Peer");
    setEditingDesignation(currentNode.designation);

    showToast(`Added same-level role as peer to ${currentNode.roleTitle} (${direction})`);
    triggerSuccessAnimation(newPeerNode.id);
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    setNodes(
      nodes
        .filter(n => n.id !== nodeId)
        .map(n =>
          n.reportsTo === nodeId ? { ...n, reportsTo: node?.reportsTo } : n
        )
    );
    setSelectedNode(null);
  };

  // Update node with validation (Jobs/Ive: anticipate user needs, prevent errors)
  const updateNode = (nodeId: string, updates: Partial<OrgNode>) => {
    // If updating roleTitle, check for duplicates and auto-increment
    if (updates.roleTitle !== undefined) {
      let newTitle = updates.roleTitle.trim();

      // Check if this title already exists (excluding current node)
      const existingTitles = nodes
        .filter(n => n.id !== nodeId)
        .map(n => n.roleTitle);

      if (existingTitles.includes(newTitle)) {
        // Find the next available increment
        let increment = 2;
        let candidateTitle = `${newTitle}_${increment}`;

        while (existingTitles.includes(candidateTitle)) {
          increment++;
          candidateTitle = `${newTitle}_${increment}`;
        }

        newTitle = candidateTitle;
        showToast(`Name already exists, renamed to "${newTitle}"`);
      }

      updates = { ...updates, roleTitle: newTitle };
    }

    setNodes(nodes.map(n => (n.id === nodeId ? { ...n, ...updates } : n)));
  };

  // Multi-select toggle
  const toggleNodeSelection = (nodeId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setMultiSelectedNodes(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(nodeId)) {
        newSelection.delete(nodeId);
      } else {
        newSelection.add(nodeId);
      }
      return newSelection;
    });
  };

  // Clear multi-selection
  const clearMultiSelection = () => {
    setMultiSelectedNodes(new Set());
    setShowCategoryPicker(false);
  };

  // Assign category to selected nodes
  const assignCategoryToSelected = (category: ResourceCategory) => {
    if (multiSelectedNodes.size === 0) return;

    const updatedNodes = nodes.map(node =>
      multiSelectedNodes.has(node.id) ? { ...node, category } : node
    );

    setNodes(updatedNodes);
    showToast(`Assigned ${multiSelectedNodes.size} resource(s) to ${category}`);
    clearMultiSelection();
  };

  // Map org chart designation to resource designation
  const mapDesignation = (designation: Designation): ResourceDesignation => {
    const mapping: Record<Designation, ResourceDesignation> = {
      "principal": "principal",
      "director": "director",
      "senior-manager": "senior_manager",
      "manager": "manager",
      "senior-consultant": "senior_consultant",
      "consultant": "consultant",
      "analyst": "analyst",
      "subcontractor": "subcontractor"
    };
    return mapping[designation] || "consultant";
  };

  // Save org chart as project resources
  const saveToProject = async () => {
    if (nodes.length === 0) {
      showToast("No resources to save");
      return;
    }

    setIsSaving(true);
    try {
      const existingResources = currentProject?.resources || [];

      // Convert each OrgNode to a Resource and add/update in project
      for (const node of nodes) {
        const resourceData = {
          name: node.roleTitle,
          category: node.category || "other",
          description: `${node.companyName || ""}`,
          designation: mapDesignation(node.designation),
          managerResourceId: node.reportsTo || null,
          assignmentLevel: "both" as const,
          isBillable: true,
          chargeRatePerHour: node.dailyRate ? node.dailyRate / 8 : 0,
        };

        // Check if resource already exists (by ID)
        const existingResource = existingResources.find(r => r.id === node.id);

        if (existingResource) {
          // Update existing resource
          await updateResource(node.id, resourceData);
        } else {
          // Add new resource
          await addResource(resourceData);
        }
      }

      setSaveSuccess(true);
      showToast(`Successfully saved ${nodes.length} resource(s) to project!`);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving resources:", error);
      showToast("Failed to save resources. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Start editing
  const startEditing = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setEditingNode(nodeId);
    setEditingTitle(node.roleTitle);
    setEditingDesignation(node.designation);
  };

  // Save edit
  const saveEdit = (nodeId: string) => {
    updateNode(nodeId, {
      roleTitle: editingTitle,
      designation: editingDesignation,
    });
    setEditingNode(null);
    setEditingTitle("");
    setEditingDesignation("consultant");
  };

  // Calculate total cost (hidden for now - sensitive information)
  // const totalDailyCost = nodes.reduce((sum, n) => sum + (n.dailyRate || 0), 0);

  // Calculate max depth for container sizing
  const calculateMaxDepth = (treeNodes: TreeNode[]): number => {
    if (treeNodes.length === 0) return 0;
    return Math.max(
      ...treeNodes.map(t => {
        if (t.children.length === 0) return t.level;
        return calculateMaxDepth(t.children);
      })
    );
  };

  const maxDepth = tree.length > 0 ? calculateMaxDepth(tree) : 0;

  // Convert tree structure to LayoutNode format for new algorithm
  const convertToLayoutNodes = (treeNodes: TreeNode[]): LayoutNode[] => {
    return treeNodes.map(treeNode => convertTreeNode(treeNode));
  };

  const convertTreeNode = (treeNode: TreeNode): LayoutNode => {
    return {
      id: treeNode.node.id,
      children: treeNode.children.map(child => convertTreeNode(child))
    };
  };

  // Use new spacing algorithm (Apple HIG compliant, mathematically proven correct)
  const layoutNodes = convertToLayoutNodes(tree);
  const layout = calculateTreeLayout(layoutNodes);

  // Render nodes using calculated positions
  const renderNodesFromLayout = (): { elements: JSX.Element[], positions: Map<string, {x: number, y: number}> } => {
    const elements: JSX.Element[] = [];
    const centerPositions = new Map<string, {x: number, y: number}>();

    // Recursive function to render tree nodes
    const renderTreeNode = (treeNode: TreeNode) => {
      const nodePos = layout.positions.get(treeNode.node.id);
      if (!nodePos) return;

      const { node } = treeNode;
      const hasChildren = treeNode.children.length > 0;

      // Store center position for connection lines (top-left pos + half card dimensions)
      centerPositions.set(node.id, {
        x: nodePos.x + CARD_WIDTH / 2,
        y: nodePos.y
      });

      const isDragging = activeId === node.id;
      const isDropTarget = overId === node.id;

      // Determine CSS class for feedback
      const cardClassName = successNodeId === node.id
        ? "org-card-drop-success"
        : (invalidNodeId === node.id || invalidTargetId === node.id
          ? "org-card-invalid-drop"
          : "");

      elements.push(
        <div
          key={node.id}
          className={cardClassName}
          style={{
            position: "absolute",
            left: `${nodePos.x}px`,
            top: `${nodePos.y}px`,
            zIndex: 1,
          }}
        >
          <DraggableOrgCardV4
            node={{
              ...node,
              companyLogoUrl: node.companyName ? companyLogos[node.companyName] : undefined
            }}
            isSelected={selectedNode === node.id}
            isDragging={isDragging}
            isOver={isDropTarget}
            dropZone={dropZone}
            hasChildren={hasChildren}
            isMultiSelected={multiSelectedNodes.has(node.id)}
            companyLogos={companyLogos}
            onSelect={() => setSelectedNode(node.id)}
            onToggleMultiSelect={(e) => toggleNodeSelection(node.id, e)}
            onUpdateTitle={(newTitle) => updateNode(node.id, { roleTitle: newTitle })}
            onUpdateDesignation={(newDesignation) => updateNode(node.id, { designation: newDesignation })}
            onUpdateCompany={(companyName) => {
              const logoUrl = companyLogos[companyName];
              updateNode(node.id, { companyName, companyLogoUrl: logoUrl });
            }}
            onDelete={() => deleteNode(node.id)}
            onAddTop={() => addManager(node.id)}
            onAddBottom={() => addNode(node.id)}
            onAddLeft={() => addPeer(node.id, "left")}
            onAddRight={() => addPeer(node.id, "right")}
          />
        </div>
      );

      // Recursively render children
      treeNode.children.forEach(child => renderTreeNode(child));
    };

    // Render all root nodes
    tree.forEach(root => renderTreeNode(root));

    return { elements, positions: centerPositions };
  };

  const treeResult = renderNodesFromLayout();

  // Use bounds calculated by the new algorithm (guaranteed correct)
  const containerWidth = Math.max(layout.bounds.width, 800);
  const containerHeight = Math.max(layout.bounds.height, 600);

  // Smart Auto-Zoom: Hybrid approach (auto-fit for small charts, scrollable for large)
  useEffect(() => {
    const calculateSmartZoom = () => {
      if (!contentAreaRef.current || !chartContainerRef.current) return;

      const viewportWidth = contentAreaRef.current.clientWidth;
      const viewportHeight = contentAreaRef.current.clientHeight;
      const nodeCount = nodes.length;

      // Decision threshold: Auto-fit for small charts (≤6 nodes), scrollable for larger
      if (nodeCount <= 6) {
        // AUTO-FIT MODE: Scale to fit viewport
        const padding = 80; // Minimal padding
        const availableWidth = viewportWidth - padding;
        const availableHeight = viewportHeight - padding;

        // Calculate scale factors for both dimensions
        const scaleX = availableWidth / containerWidth;
        const scaleY = availableHeight / containerHeight;

        // Use the smaller scale to ensure everything fits (never zoom beyond 100%)
        const scale = Math.min(scaleX, scaleY, 1.0);

        setZoomScale(scale);
        setZoomMode("auto-fit");
        setPanPosition({ x: 0, y: 0 }); // Reset pan
      } else {
        // SCROLLABLE MODE: Keep 1:1 scale for readability
        setZoomScale(1.0);
        setZoomMode("scrollable");
      }
    };

    // Calculate on mount and when dependencies change
    calculateSmartZoom();

    // Recalculate on window resize
    const handleResize = () => calculateSmartZoom();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [containerWidth, containerHeight, nodes.length, maxDepth]);

  // Zoom control handlers
  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev * 1.2, 2.0));
    setZoomMode("scrollable"); // Switch to manual control
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(prev / 1.2, 0.1));
    setZoomMode("scrollable"); // Switch to manual control
  };

  const handleZoomReset = () => {
    // Reset to smart auto mode
    const nodeCount = nodes.length;
    if (nodeCount <= 6) {
      setZoomMode("auto-fit");
      // Auto-fit will be recalculated by useEffect
    } else {
      setZoomScale(1.0);
      setPanPosition({ x: 0, y: 0 });
      setZoomMode("scrollable");
    }
  };

  // Pan handlers (for manual panning in scrollable mode)
  // FIX: Only allow panning when Space is held AND not currently dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomMode === "scrollable" && isPanMode && !activeId && e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomMode === "scrollable") {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Keyboard shortcuts + Pan mode (Space key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pan mode: Space key (Apple/Adobe/Figma standard)
      if (e.code === 'Space' && !e.repeat && zoomMode === "scrollable") {
        e.preventDefault();
        setIsPanMode(true);
        return;
      }

      // Zoom shortcuts: Cmd/Ctrl + Plus/Minus
      if ((e.metaKey || e.ctrlKey) && e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Exit pan mode when Space released
      if (e.code === 'Space') {
        setIsPanMode(false);
        setIsPanning(false); // Also stop any active panning
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nodes.length, zoomMode]); // Re-bind when node count or zoom mode changes

  // Render connection lines using new algorithm (Apple 40% control point ratio)
  const connectionPaths = calculateAllConnectionPaths(layout.positions, layoutNodes);
  const connectionLines: JSX.Element[] = connectionPaths.map(({ parentId, childId, path }) => (
    <svg
      key={`line-${parentId}-${childId}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <path
        d={path}
        stroke="var(--color-border-default)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        style={{
          transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
    </svg>
  ));

  // Render peer connection lines (ONLY for explicitly linked peers)
  const explicitPeerLinks = project?.orgChartPro?.peerLinks || [];
  const peerConnectionPaths = calculatePeerConnectionPaths(layout.positions, explicitPeerLinks);
  const peerConnectionLines: JSX.Element[] = peerConnectionPaths.map(({ peer1Id, peer2Id, path }) => (
    <svg
      key={`peer-line-${peer1Id}-${peer2Id}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 1, // Always visible (peer lines only created when user explicitly links resources)
        transition: "opacity 300ms ease-out",
      }}
    >
      <path
        d={path}
        stroke="rgba(0, 0, 0, 0.1)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="4 4" // Dotted line style
        style={{
          transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
    </svg>
  ));

  // Get active node for drag overlay
  const activeNode = activeId ? nodes.find(n => n.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            width: "95%",
            maxWidth: "1600px",
            height: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#1d1d1f",
                  margin: 0,
                }}
              >
                Organization Chart Builder
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#86868b",
                  margin: "4px 0 0 0",
                }}
              >
                {/* GLOBAL POLICY: Use canonical count to match Resource Management Modal */}
                {getTotalResourceCount(currentProject)} {getTotalResourceCount(currentProject) === 1 ? "resource" : "resources"} in project
                {nodes.length !== getTotalResourceCount(currentProject) && (
                  <span style={{ color: "#FF9500", fontWeight: 600 }}>
                    {" "}• {nodes.length} in org chart (unsaved)
                  </span>
                )}
                {" "}• Drag to rearrange • {zoomMode === "scrollable" ? "Pan & zoom" : "Auto-fit"}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Zoom Controls - Refined toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {/* Zoom Out */}
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out (⌘-)"
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 100ms",
                    borderRight: "1px solid rgba(0, 0, 0, 0.08)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <ZoomOut className="w-4 h-4" style={{ color: "rgba(0, 0, 0, 0.6)" }} />
                </button>

                {/* Percentage Display */}
                <div
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "rgba(0, 0, 0, 1)",
                    minWidth: "60px",
                    textAlign: "center",
                    letterSpacing: "-0.01em",
                    borderRight: "1px solid rgba(0, 0, 0, 0.08)",
                  }}
                >
                  {Math.round(zoomScale * 100)}%
                </div>

                {/* Zoom In */}
                <button
                  onClick={handleZoomIn}
                  title="Zoom In (⌘+)"
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 100ms",
                    borderRight: "1px solid rgba(0, 0, 0, 0.08)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <ZoomIn className="w-4 h-4" style={{ color: "rgba(0, 0, 0, 0.6)" }} />
                </button>

                {/* Fit to Screen */}
                <button
                  onClick={handleZoomReset}
                  title="Fit to Screen (⌘0)"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 100ms",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "rgba(0, 0, 0, 0.6)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Fit
                </button>
              </div>

              {/* Save to Project Button */}
              <button
                onClick={saveToProject}
                disabled={isSaving || saveSuccess || nodes.length === 0}
                style={{
                  padding: "8px 16px",
                  backgroundColor: saveSuccess ? "#34C759" : "#007AFF",
                  border: "none",
                  cursor: (isSaving || saveSuccess || nodes.length === 0) ? "not-allowed" : "pointer",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 150ms",
                  opacity: (isSaving || nodes.length === 0) ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving && !saveSuccess && nodes.length > 0) {
                    e.currentTarget.style.backgroundColor = "#0051D5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saveSuccess) {
                    e.currentTarget.style.backgroundColor = "#007AFF";
                  }
                }}
                title={nodes.length === 0 ? "Add resources before saving" : "Save resources to project"}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save to Project"}
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                title="Close (Esc)"
                style={{
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 100ms",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <X className="w-5 h-5" style={{ color: "rgba(0, 0, 0, 0.6)" }} />
              </button>
            </div>
          </div>

          {/* Multi-Select Toolbar (Apple HIG: appears when needed) */}
          {/* Orphaned Resources Warning Banner */}
          {(() => {
            const orphanedIds = getOrphanedResourceIds(currentProject);
            if (orphanedIds.length === 0) return null;

            const handleFixOrphanedResources = async () => {
              if (!currentProject) return;

              for (const resourceId of orphanedIds) {
                await updateResource(resourceId, { managerResourceId: undefined });
              }

              showToast(`Fixed ${orphanedIds.length} orphaned resource${orphanedIds.length > 1 ? 's' : ''}`);
              setNodes(getInitialNodes());
            };

            return (
              <div
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#FF3B30",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(255, 59, 48, 0.3)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                    {orphanedIds.length} resource{orphanedIds.length > 1 ? 's' : ''} not showing in org chart
                  </div>
                  <div style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "12px" }}>
                    {orphanedIds.length > 1 ? 'These resources reference' : 'This resource references'} non-existent managers. Click "Fix All" to clear invalid references.
                  </div>
                </div>
                <button
                  onClick={handleFixOrphanedResources}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FF3B30",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    transition: "all 150ms",
                    flexShrink: 0,
                    marginLeft: "16px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F5F5F7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }}
                >
                  Fix All
                </button>
              </div>
            );
          })()}

          {/* Multi-Select Toolbar */}
          {multiSelectedNodes.size > 0 && (
            <div
              style={{
                padding: "12px 24px",
                backgroundColor: "#007AFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600 }}>
                  {multiSelectedNodes.size} resource{multiSelectedNodes.size > 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearMultiSelection}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "6px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"}
                >
                  Clear Selection
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    color: "#007AFF",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  Assign Category
                </button>

                {/* Category Picker Dropdown */}
                {showCategoryPicker && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                      border: "1px solid #e0e0e0",
                      padding: "8px",
                      zIndex: 10000,
                      minWidth: "200px",
                    }}
                  >
                    {([
                      { value: "leadership", label: "Leadership" },
                      { value: "pm", label: "Project Management" },
                      { value: "technical", label: "Technical" },
                      { value: "functional", label: "Functional" },
                      { value: "change", label: "Change Management" },
                      { value: "qa", label: "Quality Assurance" },
                      { value: "basis", label: "Basis/Infrastructure" },
                      { value: "security", label: "Security & Authorization" }
                    ] as { value: ResourceCategory; label: string }[]).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => assignCategoryToSelected(value)}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          textAlign: "left",
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#1d1d1f",
                          transition: "all 100ms",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f7"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div
            ref={contentAreaRef}
            style={{
              flex: 1,
              overflow: "auto", // Always allow scrolling to prevent clipping
              backgroundColor: "#fafafa",
              cursor: isPanning
                ? "grabbing"
                : (isPanMode && zoomMode === "scrollable"
                  ? "grab"
                  : (activeId ? "default" : "default")),
              position: "relative",
              padding: "40px", // Add padding for breathing room
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              ref={chartContainerRef}
              style={{
                position: "relative",
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e0e0e0",
                margin: "0 auto", // Center horizontally when smaller than parent
                transform: zoomMode === "scrollable"
                  ? `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`
                  : `scale(${zoomScale})`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              {connectionLines}
              {peerConnectionLines}
              {treeResult.elements}
            </div>

            {/* Pan mode indicator (Space key held) */}
            {isPanMode && zoomMode === "scrollable" && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "10px 20px",
                  backgroundColor: "#007AFF",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "24px",
                  pointerEvents: "none",
                  boxShadow: "0 4px 12px rgba(0, 122, 255, 0.4)",
                  animation: "fade-in 200ms ease-out",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 2L6 4h4L8 2zM8 14l2-2H6l2 2zM2 8l2-2v4L2 8zM14 8l-2 2V6l2 2z"/>
                </svg>
                <span>Pan Mode (Space)</span>
              </div>
            )}

            {/* Hint text for panning (scrollable mode only) */}
            {zoomMode === "scrollable" && !isPanning && !isPanMode && nodes.length > 6 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "8px 16px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 500,
                  borderRadius: "20px",
                  pointerEvents: "none",
                  opacity: 0.8,
                  transition: "opacity 200ms",
                }}
              >
                Hold Space + drag to pan • Drag cards to rearrange
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeNode ? (
          <div className="org-card-drag-overlay" style={{ width: "240px", height: "96px" }}>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#ffffff",
                border: `2px solid var(--color-blue)`,
                borderRadius: "12px",
                boxShadow: "var(--shadow-xl)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}>
                {activeNode.roleTitle}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Toast Notification */}
      {toast.visible && (
        <div
          style={{
            position: "fixed",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1d1d1f",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "24px",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "toast-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {toast.message}
        </div>
      )}

      <style jsx>{`
        @keyframes toast-slide-up {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </DndContext>
  );
}
