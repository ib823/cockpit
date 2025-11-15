/**
 * Resource Planning Modal
 *
 * Jobs/Ive Design: Intentional resource architecture
 * Purpose: Design team structure BEFORE timeline work
 *
 * User Flow:
 * 1. Define roles/skillsets needed
 * 2. Set rates per role
 * 3. Create org chart structure
 * 4. Add placeholders or real people
 * 5. Calculate costs before assigning to tasks
 */

"use client";

import { useState } from "react";
import { Plus, Trash2, Users, DollarSign, Briefcase, ChevronDown, ChevronRight } from "lucide-react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

interface ResourcePlanningModalProps {
  onClose: () => void;
}

type ResourceCategory = "PM" | "Technical" | "Functional" | "Basis" | "Security" | "SME" | "QA" | "Other";

interface RoleTemplate {
  id: string;
  name: string;
  category: ResourceCategory;
  dailyRate: number;
  currency: string;
  skillsets: string[];
  description: string;
}

interface PlaceholderResource {
  id: string;
  roleTemplateId: string;
  placeholderName: string; // "Senior SAP FI Consultant #1"
  reportingTo?: string; // For org chart
  assignedPersonId?: string; // Optional: link to real person later
}

const CATEGORIES: ResourceCategory[] = ["PM", "Technical", "Functional", "Basis", "Security", "SME", "QA", "Other"];

const DEFAULT_ROLE_TEMPLATES: RoleTemplate[] = [
  { id: "tpl-pm", name: "Project Manager", category: "PM", dailyRate: 1500, currency: "EUR", skillsets: ["Leadership", "Planning"], description: "Leads project delivery" },
  { id: "tpl-fi", name: "SAP FI Consultant", category: "Functional", dailyRate: 1200, currency: "EUR", skillsets: ["SAP FI", "Finance"], description: "Financial module expert" },
  { id: "tpl-mm", name: "SAP MM Consultant", category: "Functional", dailyRate: 1200, currency: "EUR", skillsets: ["SAP MM", "Procurement"], description: "Materials management expert" },
  { id: "tpl-abap", name: "ABAP Developer", category: "Technical", dailyRate: 1000, currency: "EUR", skillsets: ["ABAP", "Development"], description: "Custom development" },
  { id: "tpl-basis", name: "Basis Administrator", category: "Basis", dailyRate: 900, currency: "EUR", skillsets: ["Basis", "Infrastructure"], description: "System administration" },
  { id: "tpl-security", name: "Security Specialist", category: "Security", dailyRate: 1100, currency: "EUR", skillsets: ["Security", "Authorization"], description: "Security & roles" },
];

export function ResourcePlanningModal({ onClose }: ResourcePlanningModalProps) {
  const { currentProject } = useGanttToolStoreV2();

  const [activeTab, setActiveTab] = useState<"roles" | "structure" | "costs">("roles");
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>(DEFAULT_ROLE_TEMPLATES);
  const [placeholders, setPlaceholders] = useState<PlaceholderResource[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<ResourceCategory>>(new Set(["PM", "Functional"]));
  const [showAddRole, setShowAddRole] = useState(false);

  if (!currentProject) return null;

  const toggleCategory = (category: ResourceCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const addPlaceholder = (roleTemplateId: string) => {
    const template = roleTemplates.find(t => t.id === roleTemplateId);
    if (!template) return;

    const count = placeholders.filter(p => p.roleTemplateId === roleTemplateId).length + 1;
    const placeholder: PlaceholderResource = {
      id: `placeholder-${Date.now()}-${Math.random()}`,
      roleTemplateId,
      placeholderName: `${template.name} #${count}`,
    };

    setPlaceholders([...placeholders, placeholder]);
  };

  const removePlaceholder = (id: string) => {
    setPlaceholders(placeholders.filter(p => p.id !== id));
  };

  const calculateTotalDailyCost = () => {
    return placeholders.reduce((total, placeholder) => {
      const template = roleTemplates.find(t => t.id === placeholder.roleTemplateId);
      return total + (template?.dailyRate || 0);
    }, 0);
  };

  const getRolesByCategory = (category: ResourceCategory) => {
    return roleTemplates.filter(t => t.category === category);
  };

  const getPlaceholdersByRole = (roleId: string) => {
    return placeholders.filter(p => p.roleTemplateId === roleId);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Resource Planning"
      subtitle="Design your team structure, define roles, and calculate costs before timeline work"
      icon={<Users className="w-5 h-5" />}
      size="xlarge"
      footer={
        <>
          <div style={{
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#666",
            marginRight: "auto",
          }}>
            {placeholders.length} team {placeholders.length === 1 ? 'member' : 'members'} • EUR {calculateTotalDailyCost().toLocaleString()}/day
          </div>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton
            onClick={() => {
              // TODO: Save to store
              console.log("Saving resource plan:", { roleTemplates, placeholders });
              onClose();
            }}
            variant="primary"
          >
            Save Resource Plan
          </ModalButton>
        </>
      }
    >
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {[
          { key: "roles" as const, label: "Role Templates", icon: Briefcase },
          { key: "structure" as const, label: "Team Structure", icon: Users },
          { key: "costs" as const, label: "Cost Planning", icon: DollarSign },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "10px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: activeTab === key ? "var(--color-blue)" : "transparent",
              color: activeTab === key ? "#fff" : "#666",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== key) e.currentTarget.style.backgroundColor = "var(--color-gray-6)";
            }}
            onMouseLeave={(e) => {
              if (activeTab !== key) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
          {/* Tab: Role Templates */}
          {activeTab === "roles" && (
            <div>
              <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "4px",
                  }}>
                    Define Role Templates
                  </h3>
                  <p style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    color: "#666",
                  }}>
                    Create reusable role templates with rates and skillsets
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRole(true)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "var(--color-blue)",
                    color: "#fff",
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Role Template
                </button>
              </div>

              {/* Roles by Category */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {CATEGORIES.map(category => {
                  const roles = getRolesByCategory(category);
                  if (roles.length === 0) return null;

                  const isExpanded = expandedCategories.has(category);

                  return (
                    <div key={category} style={{
                      border: "1px solid var(--color-gray-4)",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}>
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          backgroundColor: "var(--color-gray-6)",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#000",
                          }}>
                            {category}
                          </span>
                          <span style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "12px",
                            color: "#999",
                          }}>
                            ({roles.length} {roles.length === 1 ? 'role' : 'roles'})
                          </span>
                        </div>
                      </button>

                      {/* Roles List */}
                      {isExpanded && (
                        <div style={{ padding: "12px" }}>
                          {roles.map(role => {
                            const placeholdersForRole = getPlaceholdersByRole(role.id);

                            return (
                              <div
                                key={role.id}
                                style={{
                                  padding: "16px",
                                  borderRadius: "6px",
                                  border: "1px solid var(--color-gray-4)",
                                  marginBottom: "8px",
                                  backgroundColor: "#fff",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{
                                      fontFamily: "var(--font-text)",
                                      fontSize: "15px",
                                      fontWeight: 600,
                                      color: "#000",
                                      marginBottom: "4px",
                                    }}>
                                      {role.name}
                                    </h4>
                                    <p style={{
                                      fontFamily: "var(--font-text)",
                                      fontSize: "13px",
                                      color: "#666",
                                      marginBottom: "8px",
                                    }}>
                                      {role.description}
                                    </p>
                                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                      {role.skillsets.map(skill => (
                                        <span
                                          key={skill}
                                          style={{
                                            padding: "2px 8px",
                                            borderRadius: "4px",
                                            backgroundColor: "var(--color-blue-light)",
                                            color: "var(--color-blue)",
                                            fontFamily: "var(--font-text)",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right", marginLeft: "16px" }}>
                                    <div style={{
                                      fontFamily: "var(--font-text)",
                                      fontSize: "18px",
                                      fontWeight: 700,
                                      color: "var(--color-blue)",
                                    }}>
                                      {role.currency} {role.dailyRate.toLocaleString()}
                                    </div>
                                    <div style={{
                                      fontFamily: "var(--font-text)",
                                      fontSize: "11px",
                                      color: "#999",
                                    }}>
                                      per day
                                    </div>
                                  </div>
                                </div>

                                {/* Placeholders for this role */}
                                {placeholdersForRole.length > 0 && (
                                  <div style={{
                                    padding: "12px",
                                    backgroundColor: "var(--color-gray-6)",
                                    borderRadius: "6px",
                                    marginBottom: "8px",
                                  }}>
                                    <div style={{
                                      fontFamily: "var(--font-text)",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      color: "#666",
                                      marginBottom: "8px",
                                    }}>
                                      Team Members ({placeholdersForRole.length})
                                    </div>
                                    {placeholdersForRole.map(placeholder => (
                                      <div
                                        key={placeholder.id}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          padding: "8px 12px",
                                          backgroundColor: "#fff",
                                          borderRadius: "4px",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        <span style={{
                                          fontFamily: "var(--font-text)",
                                          fontSize: "13px",
                                          color: "#000",
                                        }}>
                                          {placeholder.placeholderName}
                                        </span>
                                        <button
                                          onClick={() => removePlaceholder(placeholder.id)}
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
                                    ))}
                                  </div>
                                )}

                                {/* Add Person Button */}
                                <button
                                  onClick={() => addPlaceholder(role.id)}
                                  style={{
                                    width: "100%",
                                    padding: "8px",
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
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                  Add {role.name}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Team Structure */}
          {activeTab === "structure" && (
            <div>
              <h3 style={{
                fontFamily: "var(--font-text)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "16px",
              }}>
                Team Organization Chart
              </h3>
              <div style={{
                padding: "40px",
                backgroundColor: "var(--color-gray-6)",
                borderRadius: "8px",
                textAlign: "center",
                color: "#999",
              }}>
                Org chart visualization coming soon...
                <br />
                <span style={{ fontSize: "12px" }}>Drag and drop to define reporting structure</span>
              </div>
            </div>
          )}

          {/* Tab: Cost Planning */}
          {activeTab === "costs" && (
            <div>
              <h3 style={{
                fontFamily: "var(--font-text)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "16px",
              }}>
                Cost Calculation
              </h3>

              <div style={{
                padding: "24px",
                backgroundColor: "var(--color-gray-6)",
                borderRadius: "8px",
                marginBottom: "20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "4px",
                    }}>
                      Total Team
                    </div>
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#000",
                    }}>
                      {placeholders.length} {placeholders.length === 1 ? 'person' : 'people'}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "4px",
                    }}>
                      Daily Burn Rate
                    </div>
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "32px",
                      fontWeight: 700,
                      color: "var(--color-blue)",
                    }}>
                      EUR {calculateTotalDailyCost().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost projections */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {[
                  { label: "1 Month (20 days)", days: 20 },
                  { label: "3 Months", days: 60 },
                  { label: "6 Months", days: 120 },
                ].map(({ label, days }) => (
                  <div
                    key={label}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--color-gray-4)",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                    }}
                  >
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "8px",
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#000",
                    }}>
                      EUR {(calculateTotalDailyCost() * days).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </BaseModal>
  );
}
