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

import { useState, useEffect, useRef } from "react";
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { X, Plus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useOrgChartDragDrop } from "@/hooks/useOrgChartDragDrop";
import type { OrgNode, Designation } from "@/hooks/useOrgChartDragDrop";
import { DraggableOrgCardV4 } from "./DraggableOrgCardV4";
import {
  calculateTreeLayout,
  calculateAllConnectionPaths,
  type LayoutNode,
  CARD_WIDTH,
  CARD_HEIGHT,
  CANVAS_MARGIN,
  LEVEL_GAP
} from "@/lib/org-chart/spacing-algorithm";
import "../../styles/org-chart-drag-drop.css";

interface OrgChartBuilderV2Props {
  onClose: () => void;
}

type Direction = "vertical" | "horizontal";

type TreeNode = {
  node: OrgNode;
  level: number;
  index: number;
  children: TreeNode[];
};

type ZoomMode = "auto-fit" | "scrollable";

export function OrgChartBuilderV2({ onClose }: OrgChartBuilderV2Props) {
  const [direction, setDirection] = useState<Direction>("vertical");
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [successNodeId, setSuccessNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<OrgNode[]>([
    {
      id: "node-1",
      roleTitle: "Project Manager",
      designation: "senior-manager",
      companyName: "ABeam Consulting",
    },
    {
      id: "node-2",
      roleTitle: "SAP FI Lead",
      designation: "manager",
      companyName: "ABeam Consulting",
      reportsTo: "node-1",
    },
    {
      id: "node-3",
      roleTitle: "Finance Director",
      designation: "director",
      companyName: "Client Co.",
      reportsTo: "node-1",
    },
    {
      id: "node-4",
      roleTitle: "FI Consultant",
      designation: "consultant",
      companyName: "ABeam Consulting",
      reportsTo: "node-2",
    },
    {
      id: "node-5",
      roleTitle: "SAP MM Lead",
      designation: "manager",
      companyName: "ABeam Consulting",
      reportsTo: "node-1",
    },
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDesignation, setEditingDesignation] = useState<Designation>("consultant");
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("auto-fit");
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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

  // Drag-and-drop hook
  const {
    activeId,
    overId,
    dropZone,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragCancel,
  } = useOrgChartDragDrop(nodes, setNodes);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevents accidental drags
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
  const addPeer = (nodeId: string) => {
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) return;

    const newPeerNode: OrgNode = {
      id: `node-${Date.now()}`,
      roleTitle: "New Peer",
      designation: currentNode.designation,
      companyName: currentNode.companyName || "Company",
      reportsTo: currentNode.reportsTo,
    };

    setNodes([...nodes, newPeerNode]);
    setSelectedNode(newPeerNode.id);
    setEditingNode(newPeerNode.id);
    setEditingTitle("New Peer");
    setEditingDesignation(currentNode.designation);

    showToast(`Added same-level role as peer to ${currentNode.roleTitle}`);
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

  // Update node
  const updateNode = (nodeId: string, updates: Partial<OrgNode>) => {
    setNodes(nodes.map(n => (n.id === nodeId ? { ...n, ...updates } : n)));
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

      elements.push(
        <div
          key={node.id}
          className={successNodeId === node.id ? "org-card-drop-success" : ""}
          style={{
            position: "absolute",
            left: `${nodePos.x}px`,
            top: `${nodePos.y}px`,
            zIndex: 1,
          }}
        >
          <DraggableOrgCardV4
            node={node}
            isSelected={selectedNode === node.id}
            isDragging={isDragging}
            isOver={isDropTarget}
            dropZone={dropZone}
            hasChildren={hasChildren}
            onSelect={() => setSelectedNode(node.id)}
            onUpdateTitle={(newTitle) => updateNode(node.id, { roleTitle: newTitle })}
            onUpdateDesignation={(newDesignation) => updateNode(node.id, { designation: newDesignation })}
            onDelete={() => deleteNode(node.id)}
            onAddTop={() => addManager(node.id)}
            onAddBottom={() => addNode(node.id)}
            onAddLeft={() => addPeer(node.id)}
            onAddRight={() => addPeer(node.id)}
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
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomMode === "scrollable" && e.button === 0) {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes.length]); // Re-bind when node count changes

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
                Drag cards to rearrange • Zoom with ⌘+/⌘- • {zoomMode === "scrollable" ? "Click & drag to pan" : "Auto-fit enabled"}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Zoom Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px",
                  backgroundColor: "#f5f5f7",
                  borderRadius: "8px",
                }}
              >
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out (⌘-)"
                  style={{
                    padding: "6px 8px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 150ms",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e5e5e7"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <ZoomOut className="w-4 h-4" style={{ color: "#1d1d1f" }} />
                </button>

                <div
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1d1d1f",
                    minWidth: "50px",
                    textAlign: "center",
                  }}
                >
                  {Math.round(zoomScale * 100)}%
                </div>

                <button
                  onClick={handleZoomIn}
                  title="Zoom In (⌘+)"
                  style={{
                    padding: "6px 8px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 150ms",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e5e5e7"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <ZoomIn className="w-4 h-4" style={{ color: "#1d1d1f" }} />
                </button>

                <div style={{ width: "1px", height: "20px", backgroundColor: "#d0d0d0", margin: "0 4px" }} />

                <button
                  onClick={handleZoomReset}
                  title="Reset View (⌘0)"
                  style={{
                    padding: "6px 8px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 150ms",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e5e5e7"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Maximize2 className="w-4 h-4" style={{ color: "#1d1d1f" }} />
                </button>
              </div>

              {/* Mode indicator */}
              <div
                style={{
                  padding: "6px 10px",
                  backgroundColor: zoomMode === "auto-fit" ? "#e3f2fd" : "#fff3e0",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: zoomMode === "auto-fit" ? "#1976d2" : "#e65100",
                }}
              >
                {zoomMode === "auto-fit" ? "Auto-Fit" : "Manual"}
              </div>

              <button
                onClick={onClose}
                style={{
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X className="w-5 h-5" style={{ color: "#86868b" }} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div
            ref={contentAreaRef}
            style={{
              flex: 1,
              overflow: zoomMode === "scrollable" ? "auto" : "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fafafa",
              cursor: isPanning ? "grabbing" : (zoomMode === "scrollable" ? "grab" : "default"),
              position: "relative",
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
                transform: zoomMode === "scrollable"
                  ? `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`
                  : `scale(${zoomScale})`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              {connectionLines}
              {treeResult.elements}
            </div>

            {/* Hint text for panning (scrollable mode only) */}
            {zoomMode === "scrollable" && !isPanning && nodes.length > 6 && (
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
                Click and drag to pan • Use scroll to navigate
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
      `}</style>
    </DndContext>
  );
}
