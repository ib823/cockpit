/**
 * Org Chart Builder - Unified Visual Tree
 *
 * Jobs/Ive Design: Single org chart with visual hierarchy
 * Inspired by Image #1 reference - curved connector lines, proper tree layout
 *
 * Features:
 * - Single unified org chart (not dual hierarchy)
 * - Choose company per node (PartnerCo/Client/SAP)
 * - Direction toggle: top-to-bottom or left-to-right
 * - Visual SVG connecting lines
 * - Inline editing and company selection
 * - Real-time cost calculation
 */

"use client";

import { useState } from "react";
import { X, Plus, Trash2, Link2, DollarSign, ArrowDown, ArrowRight, Building2 } from "lucide-react";

interface OrgChartBuilderProps {
  onClose: () => void;
}

type Company = "partner" | "client" | "sap";
type Direction = "vertical" | "horizontal";

interface OrgNode {
  id: string;
  roleTitle: string;
  company: Company;
  dailyRate?: number;
  reportsTo?: string;
}

const COMPANY_COLORS = {
  partner: "#007AFF", // Blue
  client: "#34C759", // Green
  sap: "#FF9500", // Orange
};

const COMPANY_LABELS = {
  partner: "PartnerCo",
  client: "Client",
  sap: "SAP",
};

export function OrgChartBuilder({ onClose }: OrgChartBuilderProps) {
  const [direction, setDirection] = useState<Direction>("vertical");
  const [nodes, setNodes] = useState<OrgNode[]>([
    {
      id: "node-1",
      roleTitle: "Project Manager",
      company: "partner",
      dailyRate: 1500,
    },
    {
      id: "node-2",
      roleTitle: "SAP FI Lead",
      company: "partner",
      dailyRate: 1200,
      reportsTo: "node-1",
    },
    {
      id: "node-3",
      roleTitle: "Finance Director",
      company: "client",
      reportsTo: "node-1",
    },
    {
      id: "node-4",
      roleTitle: "FI Consultant",
      company: "partner",
      dailyRate: 1000,
      reportsTo: "node-2",
    },
    {
      id: "node-5",
      roleTitle: "SAP MM Lead",
      company: "partner",
      dailyRate: 1200,
      reportsTo: "node-1",
    },
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingRate, setEditingRate] = useState<number | undefined>(undefined);
  const [showCompanyPicker, setShowCompanyPicker] = useState<string | null>(null);

  // Build tree structure
  const buildTree = (allNodes: OrgNode[]) => {
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

  type TreeNode = {
    node: OrgNode;
    level: number;
    index: number;
    children: TreeNode[];
  };

  const tree = buildTree(nodes);

  // Add node
  const addNode = (parentId?: string) => {
    const newNode: OrgNode = {
      id: `node-${Date.now()}`,
      roleTitle: "New Role",
      company: "partner",
      dailyRate: 1000,
      reportsTo: parentId,
    };
    setNodes([...nodes, newNode]);
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
  const startEditing = (nodeId: string, currentTitle: string, currentRate?: number) => {
    setEditingNode(nodeId);
    setEditingTitle(currentTitle);
    setEditingRate(currentRate);
  };

  // Save edit
  const saveEdit = (nodeId: string) => {
    updateNode(nodeId, {
      roleTitle: editingTitle,
      dailyRate: editingRate
    });
    setEditingNode(null);
    setEditingTitle("");
    setEditingRate(undefined);
  };

  // Calculate total cost
  const totalDailyCost = nodes.reduce((sum, n) => sum + (n.dailyRate || 0), 0);

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

  // Render node card
  const renderNode = (
    treeNode: TreeNode,
    onAddChild: () => void,
    onDelete: () => void
  ) => {
    const { node } = treeNode;
    const isEditing = editingNode === node.id;
    const isSelected = selectedNode === node.id;
    const isShowingCompanyPicker = showCompanyPicker === node.id;
    const companyColor = COMPANY_COLORS[node.company];

    return (
      <div
        key={node.id}
        onClick={() => setSelectedNode(node.id)}
        style={{
          position: "relative",
          width: "200px",
          minHeight: "100px",
          backgroundColor: isSelected ? "#f5f5f7" : "#ffffff",
          border: `2px solid ${isSelected ? companyColor : "#e0e0e0"}`,
          borderRadius: "10px",
          padding: "14px",
          cursor: "pointer",
          boxShadow: isSelected
            ? "0 4px 16px rgba(0,0,0,0.12)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          transition: "all 0.2s ease",
        }}
      >
        {/* Company Badge - Clickable */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowCompanyPicker(isShowingCompanyPicker ? null : node.id);
          }}
          style={{
            position: "absolute",
            top: "-10px",
            right: "12px",
            backgroundColor: companyColor,
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          <Building2 className="w-3 h-3" />
          {COMPANY_LABELS[node.company]}
        </div>

        {/* Company Picker Dropdown */}
        {isShowingCompanyPicker && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 10,
              overflow: "hidden",
            }}
          >
            {(["partner", "client", "sap"] as Company[]).map((company) => (
              <button
                key={company}
                onClick={(e) => {
                  e.stopPropagation();
                  updateNode(node.id, { company });
                  setShowCompanyPicker(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  width: "140px",
                  backgroundColor:
                    node.company === company ? "#f5f5f7" : "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: node.company === company ? 600 : 400,
                  color: "#1d1d1f",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (node.company !== company) {
                    e.currentTarget.style.backgroundColor = "#fafafa";
                  }
                }}
                onMouseLeave={(e) => {
                  if (node.company !== company) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    backgroundColor: COMPANY_COLORS[company],
                  }}
                />
                {COMPANY_LABELS[company]}
              </button>
            ))}
          </div>
        )}

        {/* Role Title */}
        {isEditing ? (
          <div style={{ marginBottom: "8px" }}>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit(node.id);
                if (e.key === "Escape") {
                  setEditingNode(null);
                  setEditingTitle("");
                  setEditingRate(undefined);
                }
              }}
              autoFocus
              placeholder="Role title"
              style={{
                width: "100%",
                fontSize: "14px",
                fontWeight: 600,
                border: "1px solid #007AFF",
                borderRadius: "6px",
                padding: "6px 8px",
                marginBottom: "6px",
              }}
            />
            <input
              type="number"
              value={editingRate || ""}
              onChange={(e) => setEditingRate(e.target.value ? parseInt(e.target.value) : undefined)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit(node.id);
                if (e.key === "Escape") {
                  setEditingNode(null);
                  setEditingTitle("");
                  setEditingRate(undefined);
                }
              }}
              placeholder="Daily rate (optional)"
              style={{
                width: "100%",
                fontSize: "12px",
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                padding: "6px 8px",
              }}
            />
          </div>
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              startEditing(node.id, node.roleTitle, node.dailyRate);
            }}
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1d1d1f",
              marginBottom: "6px",
              cursor: "text",
              minHeight: "20px",
            }}
          >
            {node.roleTitle}
          </div>
        )}

        {/* Daily Rate */}
        {!isEditing && node.dailyRate && (
          <div
            style={{
              fontSize: "12px",
              color: "#86868b",
              marginBottom: "8px",
            }}
          >
            ${node.dailyRate.toLocaleString()}/day
          </div>
        )}

        {/* Action Buttons */}
        {isSelected && !isEditing && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginTop: "12px",
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              style={{
                flex: 1,
                padding: "6px",
                fontSize: "11px",
                backgroundColor: "#007AFF",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontWeight: 500,
              }}
            >
              <Plus className="w-3 h-3" />
              Add
            </button>

            {treeNode.children.length === 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={{
                  padding: "6px 8px",
                  fontSize: "11px",
                  backgroundColor: "#FF3B30",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              saveEdit(node.id);
            }}
            style={{
              width: "100%",
              padding: "6px",
              fontSize: "11px",
              backgroundColor: "#34C759",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "8px",
              fontWeight: 500,
            }}
          >
            Save
          </button>
        )}
      </div>
    );
  };

  // Render tree - VERTICAL (top-to-bottom)
  const renderTreeVertical = (
    treeNodes: TreeNode[],
    xOffset: number = 0
  ): { elements: JSX.Element[]; connectors: JSX.Element[]; maxWidth: number } => {
    const elements: JSX.Element[] = [];
    const connectors: JSX.Element[] = [];
    const nodeWidth = 200;
    const nodeHeight = 120;
    const horizontalGap = 60;
    const verticalGap = 80;

    let currentX = xOffset;

    const processNode = (
      treeNode: TreeNode,
      depth: number,
      parentX?: number,
      parentY?: number
    ) => {
      const nodeX = currentX;
      const nodeY = depth * (nodeHeight + verticalGap);

      // If node has children, calculate their total width first
      let childrenWidth = 0;
      if (treeNode.children.length > 0) {
        const tempX = currentX;
        treeNode.children.forEach((child, index) => {
          if (index > 0) {
            childrenWidth += nodeWidth + horizontalGap;
          }
          const childResult = calculateSubtreeWidth(child);
          childrenWidth += childResult;
          if (index < treeNode.children.length - 1) {
            // Add gap after each child except last
          }
        });

        // Center parent above children
        const childStartX = currentX;
        const childCenterX = childStartX + childrenWidth / 2;
        const centeredNodeX = childCenterX - nodeWidth / 2;

        // Render centered node
        elements.push(
          <div
            key={treeNode.node.id}
            style={{
              position: "absolute",
              left: `${centeredNodeX}px`,
              top: `${nodeY}px`,
            }}
          >
            {renderNode(
              treeNode,
              () => addNode(treeNode.node.id),
              () => deleteNode(treeNode.node.id)
            )}
          </div>
        );

        // Draw connectors and process children
        treeNode.children.forEach((child, index) => {
          if (index > 0) {
            currentX += nodeWidth + horizontalGap;
          }

          const childX = currentX;
          const childY = (depth + 1) * (nodeHeight + verticalGap);

          // Calculate child's subtree width and adjust currentX
          const childSubtreeWidth = calculateSubtreeWidth(child);
          const childCenterX = childX + childSubtreeWidth / 2 - nodeWidth / 2;

          // Draw connector from centered parent to child
          const startX = centeredNodeX + nodeWidth / 2;
          const startY = nodeY + 100; // Bottom of parent card
          const endX = childCenterX + nodeWidth / 2;
          const endY = childY;

          const midY = (startY + endY) / 2;
          const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

          connectors.push(
            <path
              key={`connector-${treeNode.node.id}-to-${child.node.id}-${index}`}
              d={path}
              stroke={COMPANY_COLORS[child.node.company]}
              strokeWidth="2.5"
              fill="none"
              opacity="0.5"
            />
          );

          processNode(child, depth + 1, centeredNodeX, nodeY);
        });

        currentX += calculateSubtreeWidth(
          treeNode.children[treeNode.children.length - 1]
        );
      } else {
        // Leaf node - just render it
        elements.push(
          <div
            key={treeNode.node.id}
            style={{
              position: "absolute",
              left: `${nodeX}px`,
              top: `${nodeY}px`,
            }}
          >
            {renderNode(
              treeNode,
              () => addNode(treeNode.node.id),
              () => deleteNode(treeNode.node.id)
            )}
          </div>
        );

        // Draw connector from parent if exists
        if (parentX !== undefined && parentY !== undefined) {
          const startX = parentX + nodeWidth / 2;
          const startY = parentY + 100;
          const endX = nodeX + nodeWidth / 2;
          const endY = nodeY;
          const midY = (startY + endY) / 2;
          const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

          connectors.push(
            <path
              key={`connector-leaf-${treeNode.node.id}-${depth}`}
              d={path}
              stroke={COMPANY_COLORS[treeNode.node.company]}
              strokeWidth="2.5"
              fill="none"
              opacity="0.5"
            />
          );
        }

        currentX += nodeWidth;
      }
    };

    const calculateSubtreeWidth = (treeNode: TreeNode): number => {
      if (treeNode.children.length === 0) {
        return nodeWidth;
      }

      let totalWidth = 0;
      treeNode.children.forEach((child, index) => {
        if (index > 0) {
          totalWidth += horizontalGap;
        }
        totalWidth += calculateSubtreeWidth(child);
      });

      return Math.max(totalWidth, nodeWidth);
    };

    treeNodes.forEach((root, index) => {
      if (index > 0) {
        currentX += horizontalGap * 3;
      }
      processNode(root, 0);
    });

    return {
      elements,
      connectors,
      maxWidth: currentX,
    };
  };

  // Render tree - HORIZONTAL (left-to-right)
  const renderTreeHorizontal = (
    treeNodes: TreeNode[],
    yOffset: number = 0
  ): { elements: JSX.Element[]; connectors: JSX.Element[]; maxHeight: number } => {
    const elements: JSX.Element[] = [];
    const connectors: JSX.Element[] = [];
    const nodeWidth = 200;
    const nodeHeight = 100;
    const horizontalGap = 100;
    const verticalGap = 40;

    let currentY = yOffset;

    const processNode = (
      treeNode: TreeNode,
      depth: number,
      parentX?: number,
      parentY?: number
    ) => {
      const nodeX = depth * (nodeWidth + horizontalGap);
      const nodeY = currentY;

      // If node has children, calculate their total height first
      if (treeNode.children.length > 0) {
        const childStartY = currentY;
        let childrenHeight = 0;

        treeNode.children.forEach((child, index) => {
          if (index > 0) {
            currentY += verticalGap;
          }
          const childSubtreeHeight = calculateSubtreeHeight(child);
          currentY += childSubtreeHeight;
          childrenHeight += childSubtreeHeight;
          if (index < treeNode.children.length - 1) {
            childrenHeight += verticalGap;
          }
        });

        // Center parent alongside children
        const childCenterY = childStartY + childrenHeight / 2;
        const centeredNodeY = childCenterY - nodeHeight / 2;

        // Render centered node
        elements.push(
          <div
            key={treeNode.node.id}
            style={{
              position: "absolute",
              left: `${nodeX}px`,
              top: `${centeredNodeY}px`,
            }}
          >
            {renderNode(
              treeNode,
              () => addNode(treeNode.node.id),
              () => deleteNode(treeNode.node.id)
            )}
          </div>
        );

        // Reset currentY and draw connectors
        currentY = childStartY;
        treeNode.children.forEach((child, index) => {
          if (index > 0) {
            currentY += verticalGap;
          }

          const childX = (depth + 1) * (nodeWidth + horizontalGap);
          const childY = currentY;
          const childSubtreeHeight = calculateSubtreeHeight(child);
          const childCenterY = childY + childSubtreeHeight / 2 - nodeHeight / 2;

          // Draw connector from centered parent to child
          const startX = nodeX + nodeWidth;
          const startY = centeredNodeY + nodeHeight / 2;
          const endX = childX;
          const endY = childCenterY + nodeHeight / 2;

          const midX = (startX + endX) / 2;
          const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

          connectors.push(
            <path
              key={`connector-h-${treeNode.node.id}-to-${child.node.id}-${index}-${depth}`}
              d={path}
              stroke={COMPANY_COLORS[child.node.company]}
              strokeWidth="2.5"
              fill="none"
              opacity="0.5"
            />
          );

          processNode(child, depth + 1, nodeX, centeredNodeY);
          currentY += childSubtreeHeight;
        });
      } else {
        // Leaf node
        elements.push(
          <div
            key={treeNode.node.id}
            style={{
              position: "absolute",
              left: `${nodeX}px`,
              top: `${nodeY}px`,
            }}
          >
            {renderNode(
              treeNode,
              () => addNode(treeNode.node.id),
              () => deleteNode(treeNode.node.id)
            )}
          </div>
        );

        if (parentX !== undefined && parentY !== undefined) {
          const startX = parentX + nodeWidth;
          const startY = parentY + nodeHeight / 2;
          const endX = nodeX;
          const endY = nodeY + nodeHeight / 2;
          const midX = (startX + endX) / 2;
          const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

          connectors.push(
            <path
              key={`connector-h-leaf-${treeNode.node.id}-p${parentX}-${depth}`}
              d={path}
              stroke={COMPANY_COLORS[treeNode.node.company]}
              strokeWidth="2.5"
              fill="none"
              opacity="0.5"
            />
          );
        }

        currentY += nodeHeight;
      }
    };

    const calculateSubtreeHeight = (treeNode: TreeNode): number => {
      if (treeNode.children.length === 0) {
        return nodeHeight;
      }

      let totalHeight = 0;
      treeNode.children.forEach((child, index) => {
        if (index > 0) {
          totalHeight += verticalGap;
        }
        totalHeight += calculateSubtreeHeight(child);
      });

      return Math.max(totalHeight, nodeHeight);
    };

    treeNodes.forEach((root, index) => {
      if (index > 0) {
        currentY += verticalGap * 3;
      }
      processNode(root, 0);
    });

    return {
      elements,
      connectors,
      maxHeight: currentY,
    };
  };

  const treeRender =
    direction === "vertical"
      ? renderTreeVertical(tree, 40)
      : renderTreeHorizontal(tree, 40);

  const containerWidth =
    direction === "vertical"
      ? ('maxWidth' in treeRender ? treeRender.maxWidth + 80 : 800)
      : (maxDepth + 1) * 300 + 200;
  const containerHeight =
    direction === "vertical"
      ? (maxDepth + 1) * 200 + 100
      : ('maxHeight' in treeRender ? treeRender.maxHeight + 80 : 600);

  return (
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
              Design your project structure with team members and client stakeholders
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Direction Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                backgroundColor: "#f5f5f7",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#86868b" }}>Layout:</span>
              <button
                onClick={() => setDirection("vertical")}
                style={{
                  padding: "6px 10px",
                  backgroundColor:
                    direction === "vertical" ? "#007AFF" : "transparent",
                  color: direction === "vertical" ? "#ffffff" : "#1d1d1f",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ArrowDown className="w-3 h-3" />
                Vertical
              </button>
              <button
                onClick={() => setDirection("horizontal")}
                style={{
                  padding: "6px 10px",
                  backgroundColor:
                    direction === "horizontal" ? "#007AFF" : "transparent",
                  color: direction === "horizontal" ? "#ffffff" : "#1d1d1f",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ArrowRight className="w-3 h-3" />
                Horizontal
              </button>
            </div>

            {/* Cost Summary */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                backgroundColor: "#f5f5f7",
                borderRadius: "8px",
              }}
            >
              <DollarSign className="w-4 h-4" style={{ color: "#34C759" }} />
              <span
                style={{ fontSize: "13px", fontWeight: 600, color: "#1d1d1f" }}
              >
                ${totalDailyCost.toLocaleString()}/day
              </span>
            </div>

            {/* Add Root Node */}
            <button
              onClick={() => addNode()}
              style={{
                padding: "8px 14px",
                backgroundColor: "#007AFF",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus className="w-4 h-4" />
              Add Root
            </button>

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
          style={{
            flex: 1,
            overflow: "auto",
            padding: "40px",
            backgroundColor: "#fafafa",
          }}
        >
          <div
            style={{
              position: "relative",
              minWidth: `${containerWidth}px`,
              minHeight: `${containerHeight}px`,
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e0e0e0",
            }}
          >
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              {treeRender.connectors}
            </svg>
            {treeRender.elements}
          </div>
        </div>
      </div>
    </div>
  );
}
