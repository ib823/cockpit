/**
 * Resource Planning Modal V2
 *
 * Jobs/Ive Design: Unified structure + roles
 * Purpose: Design team AND client alignment in ONE place
 *
 * User Flow:
 * 1. See client structure (departments/divisions)
 * 2. Build YOUR team structure to mirror it
 * 3. Each node has: Role + Person (or placeholder)
 * 4. Visual hierarchy shows reporting lines
 * 5. Costs calculated in real-time
 */

"use client";

import { useState } from "react";
import { X, Plus, Trash2, Building2, Users2, DollarSign, ChevronDown, ChevronRight, Edit3, GripVertical } from "lucide-react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";

interface ResourcePlanningModalV2Props {
  onClose: () => void;
}

type ResourceCategory = "PM" | "Technical" | "Functional" | "Basis" | "Security" | "SME" | "QA";

interface RoleTemplate {
  id: string;
  name: string;
  category: ResourceCategory;
  dailyRate: number;
  currency: string;
  skillsets: string[];
}

interface TeamMember {
  id: string;
  roleTemplateId: string;
  personName?: string; // "John Smith" or undefined for placeholder
  placeholderName: string; // "Senior SAP FI Consultant #1"
  reportingTo?: string; // Parent member ID
  alignedTo?: string; // Client structure ID they're aligned to
}

interface ClientStructureNode {
  id: string;
  name: string; // "Finance Department", "IT Division"
  type: "division" | "department" | "team";
  parentId?: string;
}

const DEFAULT_ROLES: RoleTemplate[] = [
  { id: "role-pm", name: "Project Manager", category: "PM", dailyRate: 1500, currency: "EUR", skillsets: ["Leadership", "Planning"] },
  { id: "role-fi", name: "SAP FI Consultant (Senior)", category: "Functional", dailyRate: 1200, currency: "EUR", skillsets: ["SAP FI", "Finance"] },
  { id: "role-mm", name: "SAP MM Consultant", category: "Functional", dailyRate: 1100, currency: "EUR", skillsets: ["SAP MM", "Procurement"] },
  { id: "role-abap", name: "ABAP Developer", category: "Technical", dailyRate: 1000, currency: "EUR", skillsets: ["ABAP", "Development"] },
  { id: "role-basis", name: "Basis Administrator", category: "Basis", dailyRate: 900, currency: "EUR", skillsets: ["Basis", "Infrastructure"] },
  { id: "role-security", name: "Security Specialist", category: "Security", dailyRate: 1100, currency: "EUR", skillsets: ["Security", "Authorization"] },
];

const DEFAULT_CLIENT_STRUCTURE: ClientStructureNode[] = [
  { id: "client-finance", name: "Finance Department", type: "department" },
  { id: "client-operations", name: "Operations Department", type: "department" },
  { id: "client-it", name: "IT Department", type: "department" },
];

export function ResourcePlanningModalV2({ onClose }: ResourcePlanningModalV2Props) {
  const { currentProject } = useGanttToolStoreV2();

  const [roleTemplates] = useState<RoleTemplate[]>(DEFAULT_ROLES);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clientStructure, setClientStructure] = useState<ClientStructureNode[]>(DEFAULT_CLIENT_STRUCTURE);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["client-finance", "client-operations", "client-it"]));
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showClientEditor, setShowClientEditor] = useState(false);

  if (!currentProject) return null;

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const addTeamMember = (roleTemplateId: string, alignedTo?: string, reportingTo?: string) => {
    const role = roleTemplates.find(r => r.id === roleTemplateId);
    if (!role) return;

    const count = teamMembers.filter(m => m.roleTemplateId === roleTemplateId).length + 1;
    const member: TeamMember = {
      id: `member-${Date.now()}-${Math.random()}`,
      roleTemplateId,
      placeholderName: `${role.name} #${count}`,
      alignedTo,
      reportingTo,
    };

    setTeamMembers([...teamMembers, member]);
  };

  const removeMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const getMembersByAlignment = (clientNodeId: string) => {
    return teamMembers.filter(m => m.alignedTo === clientNodeId);
  };

  const getRole = (roleId: string) => {
    return roleTemplates.find(r => r.id === roleId);
  };

  const calculateTotalCost = () => {
    return teamMembers.reduce((total, member) => {
      const role = getRole(member.roleTemplateId);
      return total + (role?.dailyRate || 0);
    }, 0);
  };

  const addClientNode = (name: string, type: ClientStructureNode["type"], parentId?: string) => {
    const node: ClientStructureNode = {
      id: `client-${Date.now()}`,
      name,
      type,
      parentId,
    };
    setClientStructure([...clientStructure, node]);
    setExpandedNodes(new Set([...expandedNodes, node.id]));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          maxWidth: "1400px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "24px",
          borderBottom: "1px solid var(--color-gray-4)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "8px",
              }}>
                Team Structure & Resource Planning
              </h2>
              <p style={{
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                color: "#666",
              }}>
                Design your team structure aligned with client organization. Drag roles, set reporting lines, calculate costs.
              </p>
            </div>

            {/* Cost Summary - Top Right */}
            <div style={{
              marginLeft: "32px",
              padding: "16px 24px",
              backgroundColor: "var(--color-blue-light)",
              borderRadius: "8px",
              textAlign: "right",
            }}>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-blue)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "4px",
              }}>
                Daily Burn Rate
              </div>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--color-blue)",
              }}>
                EUR {calculateTotalCost().toLocaleString()}
              </div>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                color: "#666",
                marginTop: "4px",
              }}>
                {teamMembers.length} {teamMembers.length === 1 ? 'person' : 'people'}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "16px",
              }}
            >
              <X className="w-5 h-5" style={{ color: "#666" }} />
            </button>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div style={{
          flex: 1,
          overflow: "auto",
          display: "grid",
          gridTemplateColumns: "2fr 3fr",
          gap: "24px",
          padding: "24px",
        }}>
          {/* LEFT: Role Library */}
          <div>
            <div style={{
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: 600,
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "16px",
            }}>
              Role Library
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {roleTemplates.map(role => (
                <div
                  key={role.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("roleId", role.id);
                    setSelectedRole(role.id);
                  }}
                  onDragEnd={() => setSelectedRole(null)}
                  style={{
                    padding: "12px",
                    borderRadius: "6px",
                    border: `1px solid ${selectedRole === role.id ? 'var(--color-blue)' : 'var(--color-gray-4)'}`,
                    backgroundColor: selectedRole === role.id ? 'var(--color-blue-light)' : '#fff',
                    cursor: "grab",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRole !== role.id) e.currentTarget.style.backgroundColor = "var(--color-gray-6)";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRole !== role.id) e.currentTarget.style.backgroundColor = "#fff";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#000",
                        marginBottom: "2px",
                      }}>
                        {role.name}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "11px",
                        color: "#999",
                        marginBottom: "6px",
                      }}>
                        {role.category}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-blue)",
                    }}>
                      €{role.dailyRate}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {role.skillsets.map(skill => (
                      <span
                        key={skill}
                        style={{
                          padding: "2px 6px",
                          borderRadius: "3px",
                          backgroundColor: "var(--color-blue-light)",
                          color: "var(--color-blue)",
                          fontFamily: "var(--font-text)",
                          fontSize: "10px",
                          fontWeight: 600,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "var(--color-gray-6)",
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "12px",
              color: "#666",
            }}>
              💡 <strong>Tip:</strong> Drag roles to client departments to build your team structure
            </div>
          </div>

          {/* RIGHT: Client Structure + Your Team */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                fontWeight: 600,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Organization Structure
              </div>
              <button
                onClick={() => setShowClientEditor(!showClientEditor)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-gray-4)",
                  backgroundColor: "#fff",
                  fontFamily: "var(--font-text)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#666",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Client Structure
              </button>
            </div>

            {/* Client Structure Tree */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {clientStructure.filter(node => !node.parentId).map(node => (
                <div key={node.id}>
                  {/* Client Node */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor = "var(--color-blue-light)";
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.backgroundColor = "transparent";
                      const roleId = e.dataTransfer.getData("roleId");
                      if (roleId) {
                        addTeamMember(roleId, node.id);
                      }
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      border: "1px solid var(--color-gray-4)",
                      marginBottom: "8px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <Building2 className="w-4 h-4" style={{ color: "#666" }} />
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#000",
                        flex: 1,
                      }}>
                        {node.name}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "11px",
                        color: "#999",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        Client {node.type}
                      </div>
                    </div>

                    {/* Your Team aligned to this client node */}
                    {getMembersByAlignment(node.id).length > 0 && (
                      <div style={{
                        paddingLeft: "28px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#666",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "4px",
                        }}>
                          Your Team ({getMembersByAlignment(node.id).length})
                        </div>
                        {getMembersByAlignment(node.id).map(member => {
                          const role = getRole(member.roleTemplateId);
                          if (!role) return null;

                          return (
                            <div
                              key={member.id}
                              style={{
                                padding: "10px 12px",
                                borderRadius: "6px",
                                backgroundColor: "#fff",
                                border: "1px solid var(--color-blue)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontFamily: "var(--font-text)",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#000",
                                }}>
                                  {member.personName || member.placeholderName}
                                </div>
                                <div style={{
                                  fontFamily: "var(--font-text)",
                                  fontSize: "11px",
                                  color: "#666",
                                }}>
                                  {role.name}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{
                                  fontFamily: "var(--font-text)",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "var(--color-blue)",
                                }}>
                                  €{role.dailyRate}
                                </div>
                                <button
                                  onClick={() => removeMember(member.id)}
                                  style={{
                                    padding: "4px",
                                    borderRadius: "4px",
                                    border: "none",
                                    backgroundColor: "transparent",
                                    cursor: "pointer",
                                    color: "#FF3B30",
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Drop zone hint */}
                    {getMembersByAlignment(node.id).length === 0 && (
                      <div style={{
                        padding: "16px",
                        borderRadius: "6px",
                        border: "1px dashed var(--color-gray-4)",
                        backgroundColor: "var(--color-gray-6)",
                        textAlign: "center",
                        fontFamily: "var(--font-text)",
                        fontSize: "12px",
                        color: "#999",
                      }}>
                        Drop roles here to build your team for {node.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Client Node */}
            {showClientEditor && (
              <button
                onClick={() => {
                  const name = prompt("Client department name:");
                  if (name) addClientNode(name, "department");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px dashed var(--color-gray-4)",
                  backgroundColor: "transparent",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-blue)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  marginTop: "8px",
                }}
              >
                <Plus className="w-4 h-4" />
                Add Client Department
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "20px 24px",
          borderTop: "1px solid var(--color-gray-4)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--color-gray-6)",
        }}>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <div>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "11px",
                color: "#999",
                marginBottom: "2px",
              }}>
                Total Team
              </div>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "16px",
                fontWeight: 700,
                color: "#000",
              }}>
                {teamMembers.length} {teamMembers.length === 1 ? 'person' : 'people'}
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "11px",
                color: "#999",
                marginBottom: "2px",
              }}>
                Monthly Cost (20 days)
              </div>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--color-blue)",
              }}>
                EUR {(calculateTotalCost() * 20).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                border: "1px solid var(--color-gray-4)",
                backgroundColor: "#fff",
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log("Saving resource plan:", { teamMembers, clientStructure });
                onClose();
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "var(--color-blue)",
                color: "#fff",
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Team Structure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
