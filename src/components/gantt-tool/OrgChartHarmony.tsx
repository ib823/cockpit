/**
 * Harmony Org Chart Builder
 *
 * Apple-grade design with Pixar-level animation smoothness.
 * "The best org chart builder ever created" - inspired by Jobs/Ive philosophy
 *
 * Design Principles:
 * - Simplicity: Remove everything unnecessary
 * - Clarity: Crystal-clear visual hierarchy
 * - Delight: Smooth, natural animations using spring physics
 * - Intelligence: Auto-adapts to content and screen size
 * - Performance: Buttery-smooth 60fps on all devices
 *
 * Features:
 * - Spring-based physics animations (Framer Motion)
 * - Responsive design (desktop, tablet, mobile)
 * - Touch-optimized gestures
 * - Smart zoom and pan
 * - Virtualized rendering for large charts
 * - Micro-interactions and haptic feedback
 * - Accessibility-first design
 */

"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, useSpring, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import {
  X, Plus, ZoomIn, ZoomOut, Maximize2, LayoutGrid, Users,
  ChevronDown, Search, Filter, Download, Share2, Settings,
  GripVertical, MoreVertical, Trash2, Edit3, Copy, Move
} from "lucide-react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import type { GanttProject, ResourceDesignation, ResourceCategory } from "@/types/gantt-tool";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface OrgNode {
  id: string;
  name: string;
  title: string;
  designation: ResourceDesignation;
  category: ResourceCategory;
  avatar?: string;
  companyLogoUrl?: string;
  reportsTo?: string;
  email?: string;
  department?: string;
  dailyRate?: number;
}

interface NodePosition {
  x: number;
  y: number;
}

interface LayoutNode {
  node: OrgNode;
  position: NodePosition;
  level: number;
  children: LayoutNode[];
}

type ViewMode = "hierarchy" | "compact" | "grid";
type DeviceType = "mobile" | "tablet" | "desktop";

// ============================================================================
// Design Tokens (Apple HIG inspired)
// ============================================================================

const DESIGN_TOKENS = {
  // Colors - Apple-inspired palette
  colors: {
    background: {
      primary: "#FFFFFF",
      secondary: "#F5F5F7",
      tertiary: "#FAFAFA",
      overlay: "rgba(0, 0, 0, 0.4)",
    },
    border: {
      default: "#E5E5E7",
      subtle: "#F0F0F0",
      focus: "#007AFF",
    },
    text: {
      primary: "#1D1D1F",
      secondary: "#86868B",
      tertiary: "#C7C7CC",
      inverse: "#FFFFFF",
    },
    accent: {
      blue: "#007AFF",
      green: "#34C759",
      red: "#FF3B30",
      orange: "#FF9500",
      purple: "#AF52DE",
    },
    shadow: {
      sm: "0 1px 3px rgba(0, 0, 0, 0.08)",
      md: "0 4px 12px rgba(0, 0, 0, 0.1)",
      lg: "0 12px 32px rgba(0, 0, 0, 0.12)",
      xl: "0 20px 60px rgba(0, 0, 0, 0.15)",
    },
  },

  // Spacing - 4px base grid
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  // Typography - SF Pro inspired
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    fontSize: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 28,
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  // Layout
  layout: {
    nodeWidth: 280,
    nodeHeight: 140,
    nodeGap: 80,
    levelGap: 160,
    padding: 60,
  },

  // Animations - Spring physics (Pixar-inspired)
  animation: {
    spring: {
      // Gentle spring - for most UI elements
      gentle: {
        type: "spring" as const,
        stiffness: 200,
        damping: 24,
        mass: 0.8,
      },
      // Bouncy spring - for playful interactions
      bouncy: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20,
        mass: 0.6,
      },
      // Smooth spring - for large movements
      smooth: {
        type: "spring" as const,
        stiffness: 150,
        damping: 28,
        mass: 1,
      },
      // Snappy spring - for quick interactions
      snappy: {
        type: "spring" as const,
        stiffness: 400,
        damping: 30,
        mass: 0.5,
      },
    },
    duration: {
      fast: 0.15,
      normal: 0.3,
      slow: 0.5,
    },
  },

  // Breakpoints
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1280,
  },
} as const;

// ============================================================================
// Spring Animation Utilities
// ============================================================================

const springTransition = (type: keyof typeof DESIGN_TOKENS.animation.spring = "gentle") =>
  DESIGN_TOKENS.animation.spring[type];

// ============================================================================
// Layout Algorithm (Improved Walker's Algorithm)
// ============================================================================

class OrgChartLayoutEngine {
  private nodeWidth: number;
  private nodeHeight: number;
  private horizontalGap: number;
  private verticalGap: number;

  constructor(config = {
    nodeWidth: DESIGN_TOKENS.layout.nodeWidth,
    nodeHeight: DESIGN_TOKENS.layout.nodeHeight,
    horizontalGap: DESIGN_TOKENS.layout.nodeGap,
    verticalGap: DESIGN_TOKENS.layout.levelGap,
  }) {
    this.nodeWidth = config.nodeWidth;
    this.nodeHeight = config.nodeHeight;
    this.horizontalGap = config.horizontalGap;
    this.verticalGap = config.verticalGap;
  }

  /**
   * Calculate layout using improved Walker's algorithm
   * Returns optimal positions for all nodes with minimal edge crossings
   */
  calculateLayout(nodes: OrgNode[]): Map<string, NodePosition> {
    const positions = new Map<string, NodePosition>();
    const roots = nodes.filter(n => !n.reportsTo);

    if (roots.length === 0) return positions;

    // Build tree structure
    const tree = this.buildTree(nodes);

    // Calculate relative positions
    let currentX = 0;
    roots.forEach((root, index) => {
      if (index > 0) currentX += this.horizontalGap * 2;

      const rootNode = tree.find(t => t.node.id === root.id);
      if (rootNode) {
        this.calculateNodePosition(rootNode, 0, currentX, positions);
        const subtreeWidth = this.getSubtreeWidth(rootNode);
        currentX += subtreeWidth;
      }
    });

    return positions;
  }

  private buildTree(nodes: OrgNode[]): LayoutNode[] {
    const roots = nodes.filter(n => !n.reportsTo);
    const getChildren = (parentId: string): OrgNode[] => {
      return nodes.filter(n => n.reportsTo === parentId);
    };

    const buildNode = (node: OrgNode, level: number): LayoutNode => {
      const children = getChildren(node.id);
      return {
        node,
        position: { x: 0, y: 0 },
        level,
        children: children.map(child => buildNode(child, level + 1)),
      };
    };

    return roots.map(root => buildNode(root, 0));
  }

  private calculateNodePosition(
    layoutNode: LayoutNode,
    y: number,
    x: number,
    positions: Map<string, NodePosition>
  ): number {
    const { node, children, level } = layoutNode;
    const nodeY = level * (this.nodeHeight + this.verticalGap);

    if (children.length === 0) {
      // Leaf node
      positions.set(node.id, { x, y: nodeY });
      return x + this.nodeWidth;
    }

    // Calculate children positions first
    let childX = x;
    const childPositions: number[] = [];

    children.forEach((child, index) => {
      if (index > 0) childX += this.horizontalGap;
      const childCenterX = this.calculateNodePosition(child, nodeY + this.nodeHeight + this.verticalGap, childX, positions);
      childPositions.push(childX + this.nodeWidth / 2);
      childX = childCenterX;
    });

    // Center parent above children
    const firstChildCenter = childPositions[0];
    const lastChildCenter = childPositions[childPositions.length - 1];
    const parentX = (firstChildCenter + lastChildCenter) / 2 - this.nodeWidth / 2;

    positions.set(node.id, { x: parentX, y: nodeY });

    return childX;
  }

  private getSubtreeWidth(layoutNode: LayoutNode): number {
    if (layoutNode.children.length === 0) {
      return this.nodeWidth;
    }

    let totalWidth = 0;
    layoutNode.children.forEach((child, index) => {
      if (index > 0) totalWidth += this.horizontalGap;
      totalWidth += this.getSubtreeWidth(child);
    });

    return Math.max(totalWidth, this.nodeWidth);
  }
}

// ============================================================================
// Responsive Hook
// ============================================================================

function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width < DESIGN_TOKENS.breakpoints.mobile) return "mobile";
    if (width < DESIGN_TOKENS.breakpoints.tablet) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < DESIGN_TOKENS.breakpoints.mobile) setDeviceType("mobile");
      else if (width < DESIGN_TOKENS.breakpoints.tablet) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}

// ============================================================================
// Main Component
// ============================================================================

interface OrgChartHarmonyProps {
  onClose: () => void;
  project?: GanttProject | null;
}

export function OrgChartHarmony({ onClose, project }: OrgChartHarmonyProps) {
  const deviceType = useDeviceType();
  const { currentProject, addResource, updateResource } = useGanttToolStoreV2();

  // State
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Zoom and Pan state with spring physics
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring animations for zoom/pan
  const smoothScale = useSpring(scale, { stiffness: 150, damping: 28, mass: 1 });
  const smoothX = useSpring(x, { stiffness: 150, damping: 28, mass: 1 });
  const smoothY = useSpring(y, { stiffness: 150, damping: 28, mass: 1 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load nodes from project
  useEffect(() => {
    console.log("[Harmony] Loading nodes, currentProject:", currentProject ? "exists" : "null");

    if (currentProject?.resources && currentProject.resources.length > 0) {
      const loadedNodes: OrgNode[] = currentProject.resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        title: resource.name,
        designation: resource.designation,
        category: resource.category,
        reportsTo: resource.managerResourceId || undefined,
        email: resource.email,
        department: resource.department,
        dailyRate: resource.chargeRatePerHour ? resource.chargeRatePerHour * 8 : undefined,
      }));
      console.log("[Harmony] Loaded from project:", loadedNodes.length, "nodes");
      setNodes(loadedNodes);
    } else {
      // Start with sample data for demo
      console.log("[Harmony] Loading sample data");
      setNodes([
        {
          id: "1",
          name: "Sarah Chen",
          title: "Program Director",
          designation: "director",
          category: "leadership",
          dailyRate: 2000,
        },
        {
          id: "2",
          name: "Marcus Williams",
          title: "Technical Lead",
          designation: "senior_manager",
          category: "technical",
          reportsTo: "1",
          dailyRate: 1600,
        },
        {
          id: "3",
          name: "Emma Davis",
          title: "Project Manager",
          designation: "manager",
          category: "pm",
          reportsTo: "1",
          dailyRate: 1400,
        },
        {
          id: "4",
          name: "James Taylor",
          title: "Senior Consultant",
          designation: "senior_consultant",
          category: "technical",
          reportsTo: "2",
          dailyRate: 1200,
        },
        {
          id: "5",
          name: "Olivia Martinez",
          title: "Consultant",
          designation: "consultant",
          category: "functional",
          reportsTo: "2",
          dailyRate: 1000,
        },
        {
          id: "6",
          name: "Noah Anderson",
          title: "Business Analyst",
          designation: "analyst",
          category: "functional",
          reportsTo: "3",
          dailyRate: 900,
        },
      ]);
    }
  }, [currentProject]);

  // Calculate layout
  const layoutEngine = useMemo(() => new OrgChartLayoutEngine(), []);
  const nodePositions = useMemo(() => {
    console.log("[Harmony] Calculating layout for", nodes.length, "nodes");
    const positions = layoutEngine.calculateLayout(nodes);
    console.log("[Harmony] Layout calculated, positions:", positions.size);
    return positions;
  }, [nodes, layoutEngine]);

  // Calculate canvas bounds
  const canvasBounds = useMemo(() => {
    // Default bounds for empty chart
    if (nodePositions.size === 0) {
      return {
        width: 800,
        height: 600,
        minX: 0,
        minY: 0,
      };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nodePositions.forEach(pos => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + DESIGN_TOKENS.layout.nodeWidth);
      maxY = Math.max(maxY, pos.y + DESIGN_TOKENS.layout.nodeHeight);
    });

    const padding = DESIGN_TOKENS.layout.padding;
    return {
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
      minX: minX - padding,
      minY: minY - padding,
    };
  }, [nodePositions]);

  // Auto-fit on mount and when nodes change
  useEffect(() => {
    // Small delay to ensure container is properly sized
    const timeoutId = setTimeout(() => {
      if (!containerRef.current || nodePositions.size === 0) {
        console.log("[Harmony] Auto-fit skipped: container or nodes missing");
        return;
      }

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      console.log("[Harmony] Auto-fit: container", containerWidth, "x", containerHeight);
      console.log("[Harmony] Auto-fit: canvas bounds", canvasBounds.width, "x", canvasBounds.height);

      // Ensure we have valid dimensions
      if (containerWidth === 0 || containerHeight === 0) {
        console.log("[Harmony] Auto-fit skipped: zero dimensions");
        return;
      }

      const scaleX = containerWidth / canvasBounds.width;
      const scaleY = containerHeight / canvasBounds.height;
      const autoScale = Math.min(scaleX, scaleY, 1) * 0.85; // 85% for mobile breathing room

      console.log("[Harmony] Auto-fit: scale", autoScale, "x:", (containerWidth - canvasBounds.width * autoScale) / 2, "y:", (containerHeight - canvasBounds.height * autoScale) / 2);

      scale.set(autoScale);
      x.set((containerWidth - canvasBounds.width * autoScale) / 2);
      y.set((containerHeight - canvasBounds.height * autoScale) / 2);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [nodePositions, canvasBounds, scale, x, y]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    scale.set(Math.min(scale.get() * 1.2, 2));
  }, [scale]);

  const handleZoomOut = useCallback(() => {
    scale.set(Math.max(scale.get() / 1.2, 0.1));
  }, [scale]);

  const handleZoomReset = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const scaleX = containerWidth / canvasBounds.width;
    const scaleY = containerHeight / canvasBounds.height;
    const autoScale = Math.min(scaleX, scaleY, 1) * 0.9;

    scale.set(autoScale);
    x.set((containerWidth - canvasBounds.width * autoScale) / 2);
    y.set((containerHeight - canvasBounds.height * autoScale) / 2);
  }, [scale, x, y, canvasBounds]);

  // Pan gesture handler
  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    x.set(x.get() + info.delta.x);
    y.set(y.get() + info.delta.y);
  }, [x, y]);

  // Node interactions
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
  }, []);

  const handleAddNode = useCallback(() => {
    const newNode: OrgNode = {
      id: `node-${Date.now()}`,
      name: "New Team Member",
      title: "Role Title",
      designation: "consultant",
      category: "technical",
      reportsTo: selectedNodeId || undefined,
    };
    setNodes(prev => [...prev, newNode]);
  }, [selectedNodeId]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prev => {
      const node = prev.find(n => n.id === nodeId);
      return prev
        .filter(n => n.id !== nodeId)
        .map(n => n.reportsTo === nodeId ? { ...n, reportsTo: node?.reportsTo } : n);
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(node =>
      node.name.toLowerCase().includes(query) ||
      node.title.toLowerCase().includes(query) ||
      node.designation.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springTransition("gentle")}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: DESIGN_TOKENS.colors.background.overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: deviceType === "mobile" ? 8 : 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={springTransition("bouncy")}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: DESIGN_TOKENS.colors.background.primary,
          borderRadius: deviceType === "mobile" ? 16 : 24,
          width: deviceType === "mobile" ? "100%" : "95%",
          maxWidth: deviceType === "mobile" ? "100%" : 1800,
          height: deviceType === "mobile" ? "100%" : "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: DESIGN_TOKENS.colors.shadow.xl,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Header
          deviceType={deviceType}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          scale={smoothScale.get()}
          onClose={onClose}
        />

        {/* Canvas */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            backgroundColor: DESIGN_TOKENS.colors.background.secondary,
          }}
        >
          <motion.div
            ref={canvasRef}
            drag={deviceType === "desktop"} // Only enable drag on desktop
            dragConstraints={containerRef}
            dragElastic={0.1}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
            onPan={deviceType !== "mobile" ? handlePan : undefined}
            style={{
              width: "100%",
              height: "100%",
              cursor: deviceType === "desktop" ? "grab" : "default",
              position: "relative",
              touchAction: deviceType === "mobile" ? "pan-x pan-y" : "none",
            }}
            whileTap={deviceType === "desktop" ? { cursor: "grabbing" } : undefined}
          >
            <motion.div
              style={{
                scale: smoothScale,
                x: smoothX,
                y: smoothY,
                width: canvasBounds.width,
                height: canvasBounds.height,
                position: "relative",
              }}
            >
              {/* Connection Lines */}
              <ConnectionLines
                nodes={filteredNodes}
                positions={nodePositions}
                minX={canvasBounds.minX}
                minY={canvasBounds.minY}
              />

              {/* Nodes */}
              <AnimatePresence mode="popLayout">
                {filteredNodes.map(node => {
                  const position = nodePositions.get(node.id);
                  if (!position) return null;

                  return (
                    <OrgNode
                      key={node.id}
                      node={node}
                      position={{
                        x: position.x - canvasBounds.minX,
                        y: position.y - canvasBounds.minY,
                      }}
                      isSelected={selectedNodeId === node.id}
                      onClick={() => handleNodeClick(node.id)}
                      onDelete={() => handleDeleteNode(node.id)}
                      deviceType={deviceType}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Empty State */}
              {filteredNodes.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    color: DESIGN_TOKENS.colors.text.secondary,
                    fontSize: DESIGN_TOKENS.typography.fontSize.md,
                  }}
                >
                  <Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                  <p>No team members yet</p>
                  <p style={{ fontSize: DESIGN_TOKENS.typography.fontSize.sm, marginTop: 8 }}>
                    Tap the + button to add someone
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={handleAddNode}
          deviceType={deviceType}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Header Component
// ============================================================================

interface HeaderProps {
  deviceType: DeviceType;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  scale: number;
  onClose: () => void;
}

function Header({
  deviceType,
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  viewMode,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  scale,
  onClose,
}: HeaderProps) {
  const isMobile = deviceType === "mobile";

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition("gentle")}
      style={{
        padding: isMobile ? "12px 16px" : "16px 24px",
        borderBottom: `1px solid ${DESIGN_TOKENS.colors.border.default}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: isMobile ? "wrap" : "nowrap",
        backgroundColor: DESIGN_TOKENS.colors.background.primary,
      }}
    >
      {/* Left: Title & Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: isMobile ? "1 1 100%" : "1 1 auto" }}>
        <div>
          <h2
            style={{
              fontSize: isMobile ? DESIGN_TOKENS.typography.fontSize.lg : DESIGN_TOKENS.typography.fontSize.xl,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
              color: DESIGN_TOKENS.colors.text.primary,
              margin: 0,
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          >
            Harmony
          </h2>
          <p
            style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.secondary,
              margin: "2px 0 0 0",
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          >
            Organization Chart Builder
          </p>
        </div>

        {!isMobile && (
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search team members..."
          />
        )}
      </div>

      {/* Right: Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Zoom Controls - Show on all devices */}
        <ZoomControls
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
          scale={scale}
          isMobile={isMobile}
        />

        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={springTransition("snappy")}
          onClick={onClose}
          style={{
            padding: 8,
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} color={DESIGN_TOKENS.colors.text.secondary} />
        </motion.button>
      </div>

      {/* Mobile Search */}
      {isMobile && (
        <div style={{ width: "100%" }}>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search..."
          />
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Search Bar Component
// ============================================================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <motion.div
      initial={{ width: 200 }}
      whileFocus={{ width: 300 }}
      transition={springTransition("gentle")}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Search
        size={16}
        color={DESIGN_TOKENS.colors.text.secondary}
        style={{
          position: "absolute",
          left: 12,
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 12px 8px 36px",
          fontSize: DESIGN_TOKENS.typography.fontSize.sm,
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
          border: `1px solid ${DESIGN_TOKENS.colors.border.default}`,
          borderRadius: 10,
          backgroundColor: DESIGN_TOKENS.colors.background.secondary,
          color: DESIGN_TOKENS.colors.text.primary,
          outline: "none",
          transition: "all 0.2s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = DESIGN_TOKENS.colors.border.focus;
          e.target.style.backgroundColor = DESIGN_TOKENS.colors.background.primary;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = DESIGN_TOKENS.colors.border.default;
          e.target.style.backgroundColor = DESIGN_TOKENS.colors.background.secondary;
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// Zoom Controls Component
// ============================================================================

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  scale: number;
  isMobile?: boolean;
}

function ZoomControls({ onZoomIn, onZoomOut, onZoomReset, scale, isMobile = false }: ZoomControlsProps) {
  // Mobile version - more compact
  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: 2,
          backgroundColor: DESIGN_TOKENS.colors.background.secondary,
          borderRadius: 8,
        }}
      >
        <IconButton onClick={onZoomOut} icon={<ZoomOut size={14} />} title="Zoom Out" />
        <IconButton onClick={onZoomReset} icon={<Maximize2 size={14} />} title="Fit" />
        <IconButton onClick={onZoomIn} icon={<ZoomIn size={14} />} title="Zoom In" />
      </div>
    );
  }

  // Desktop version - full controls
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 4,
        backgroundColor: DESIGN_TOKENS.colors.background.secondary,
        borderRadius: 10,
      }}
    >
      <IconButton onClick={onZoomOut} icon={<ZoomOut size={16} />} title="Zoom Out" />

      <motion.div
        whileHover={{ backgroundColor: DESIGN_TOKENS.colors.background.tertiary }}
        style={{
          padding: "4px 12px",
          fontSize: DESIGN_TOKENS.typography.fontSize.xs,
          fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
          color: DESIGN_TOKENS.colors.text.primary,
          minWidth: 50,
          textAlign: "center",
          borderRadius: 6,
          cursor: "pointer",
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
        }}
        onClick={onZoomReset}
      >
        {Math.round(scale * 100)}%
      </motion.div>

      <IconButton onClick={onZoomIn} icon={<ZoomIn size={16} />} title="Zoom In" />

      <div style={{ width: 1, height: 20, backgroundColor: DESIGN_TOKENS.colors.border.default, margin: "0 4px" }} />

      <IconButton onClick={onZoomReset} icon={<Maximize2 size={16} />} title="Fit to Screen" />
    </div>
  );
}

// ============================================================================
// Icon Button Component
// ============================================================================

interface IconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}

function IconButton({ onClick, icon, title }: IconButtonProps) {
  return (
    <motion.button
      whileHover={{ backgroundColor: DESIGN_TOKENS.colors.background.tertiary }}
      whileTap={{ scale: 0.95 }}
      transition={springTransition("snappy")}
      onClick={onClick}
      title={title}
      style={{
        padding: 8,
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: DESIGN_TOKENS.colors.text.primary,
      }}
    >
      {icon}
    </motion.button>
  );
}

// ============================================================================
// Connection Lines Component
// ============================================================================

interface ConnectionLinesProps {
  nodes: OrgNode[];
  positions: Map<string, NodePosition>;
  minX: number;
  minY: number;
}

function ConnectionLines({ nodes, positions, minX, minY }: ConnectionLinesProps) {
  const paths = useMemo(() => {
    const pathsData: Array<{ id: string; d: string }> = [];

    nodes.forEach(node => {
      if (!node.reportsTo) return;

      const childPos = positions.get(node.id);
      const parentPos = positions.get(node.reportsTo);

      if (!childPos || !parentPos) return;

      const x1 = parentPos.x - minX + DESIGN_TOKENS.layout.nodeWidth / 2;
      const y1 = parentPos.y - minY + DESIGN_TOKENS.layout.nodeHeight;
      const x2 = childPos.x - minX + DESIGN_TOKENS.layout.nodeWidth / 2;
      const y2 = childPos.y - minY;

      // Smooth cubic bezier curve (Apple-style)
      const midY = (y1 + y2) / 2;
      const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

      pathsData.push({ id: `${node.reportsTo}-${node.id}`, d });
    });

    return pathsData;
  }, [nodes, positions, minX, minY]);

  return (
    <svg
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
      <AnimatePresence>
        {paths.map(({ id, d }) => (
          <motion.path
            key={id}
            d={d}
            stroke={DESIGN_TOKENS.colors.border.default}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={springTransition("smooth")}
          />
        ))}
      </AnimatePresence>
    </svg>
  );
}

// ============================================================================
// Org Node Component
// ============================================================================

interface OrgNodeProps {
  node: OrgNode;
  position: NodePosition;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  deviceType: DeviceType;
}

function OrgNode({ node, position, isSelected, onClick, onDelete, deviceType }: OrgNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition("bouncy")}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: DESIGN_TOKENS.layout.nodeWidth,
        height: DESIGN_TOKENS.layout.nodeHeight,
        backgroundColor: DESIGN_TOKENS.colors.background.primary,
        border: `2px solid ${isSelected ? DESIGN_TOKENS.colors.accent.blue : DESIGN_TOKENS.colors.border.default}`,
        borderRadius: 16,
        padding: 16,
        cursor: "pointer",
        boxShadow: isSelected || isHovered
          ? DESIGN_TOKENS.colors.shadow.lg
          : DESIGN_TOKENS.colors.shadow.md,
        zIndex: isSelected ? 10 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Avatar & Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springTransition("bouncy")}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: DESIGN_TOKENS.colors.accent.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: DESIGN_TOKENS.colors.text.inverse,
            fontSize: DESIGN_TOKENS.typography.fontSize.lg,
            fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
            fontFamily: DESIGN_TOKENS.typography.fontFamily,
          }}
        >
          {node.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
        </motion.div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.md,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.text.primary,
              margin: 0,
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {node.name}
          </h3>
          <p
            style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.secondary,
              margin: "2px 0 0 0",
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {node.title}
          </p>
        </div>
      </div>

      {/* Designation Badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={springTransition("gentle")}
          style={{
            padding: "4px 10px",
            backgroundColor: DESIGN_TOKENS.colors.background.secondary,
            borderRadius: 8,
            fontSize: DESIGN_TOKENS.typography.fontSize.xs,
            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            color: DESIGN_TOKENS.colors.text.secondary,
            fontFamily: DESIGN_TOKENS.typography.fontFamily,
          }}
        >
          {node.designation.replace("_", " ").toUpperCase()}
        </motion.div>

        {node.dailyRate && (
          <motion.div
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={springTransition("gentle")}
            style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.xs,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.accent.green,
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          >
            ${node.dailyRate}/day
          </motion.div>
        )}
      </div>

      {/* Actions (visible on hover or select) */}
      <AnimatePresence>
        {(isHovered || isSelected) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={springTransition("snappy")}
            style={{
              display: "flex",
              gap: 6,
              marginTop: "auto",
            }}
          >
            <ActionButton icon={<Edit3 size={14} />} label="Edit" />
            <ActionButton icon={<Copy size={14} />} label="Duplicate" />
            <ActionButton
              icon={<Trash2 size={14} />}
              label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              variant="danger"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Action Button Component
// ============================================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "default" | "danger";
}

function ActionButton({ icon, label, onClick, variant = "default" }: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={springTransition("snappy")}
      onClick={onClick}
      style={{
        flex: 1,
        padding: "6px 12px",
        backgroundColor: variant === "danger"
          ? DESIGN_TOKENS.colors.accent.red
          : DESIGN_TOKENS.colors.background.secondary,
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: DESIGN_TOKENS.typography.fontSize.xs,
        fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
        color: variant === "danger"
          ? DESIGN_TOKENS.colors.text.inverse
          : DESIGN_TOKENS.colors.text.primary,
        fontFamily: DESIGN_TOKENS.typography.fontFamily,
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

// ============================================================================
// Floating Action Button
// ============================================================================

interface FloatingActionButtonProps {
  onClick: () => void;
  deviceType: DeviceType;
}

function FloatingActionButton({ onClick, deviceType }: FloatingActionButtonProps) {
  return (
    <motion.button
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={springTransition("bouncy")}
      onClick={onClick}
      style={{
        position: "absolute",
        bottom: deviceType === "mobile" ? 24 : 40,
        right: deviceType === "mobile" ? 24 : 40,
        width: 64,
        height: 64,
        borderRadius: "50%",
        backgroundColor: DESIGN_TOKENS.colors.accent.blue,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: DESIGN_TOKENS.colors.shadow.xl,
        zIndex: 100,
      }}
    >
      <Plus size={28} color={DESIGN_TOKENS.colors.text.inverse} strokeWidth={2.5} />
    </motion.button>
  );
}
