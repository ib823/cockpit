/**
 * Template Library Modal
 *
 * Steve Jobs: "Innovation distinguishes between a leader and a follower."
 *
 * Browse and import from 50+ pre-built project templates.
 * Revolutionary one-click project creation.
 *
 * DESIGN: Pure BaseModal + design tokens - NO Ant Design, NO Tailwind
 */

"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Star,
  Calendar,
  CheckCircle,
  Rocket,
  TrendingUp,
  Building,
  X,
} from "lucide-react";
import {
  PROJECT_TEMPLATES,
  getTemplatesByCategory,
  type ProjectTemplate,
} from "@/lib/gantt-tool/project-templates";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { format } from "date-fns";
import type { GanttProject } from "@/types/gantt-tool";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Style Objects (Design Tokens Only)
// ============================================================================

const styles = {
  searchInput: {
    width: '100%',
    padding: `${SPACING[2]} ${SPACING[3]} ${SPACING[2]} ${SPACING[7]}`,
    fontFamily: TYPOGRAPHY.fontFamily.text,
    fontSize: TYPOGRAPHY.fontSize.body,
    color: COLORS.text.primary,
    backgroundColor: COLORS.bg.primary,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.default,
    outline: 'none',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: SPACING[3],
    top: '50%',
    transform: 'translateY(-50%)',
    color: COLORS.text.tertiary,
  },
  tab: (isActive: boolean) => ({
    padding: `${SPACING[2]} ${SPACING[3]}`,
    fontSize: TYPOGRAPHY.fontSize.caption,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontFamily.text,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: isActive ? COLORS.blue : COLORS.text.tertiary,
    borderBottom: `2px solid ${isActive ? COLORS.blue : 'transparent'}`,
    transition: `all ${TRANSITIONS.duration.fast}`,
  }),
  templateCard: (isSelected: boolean) => ({
    border: `2px solid ${isSelected ? COLORS.blue : COLORS.border.default}`,
    borderRadius: RADIUS.default,
    padding: SPACING[4],
    cursor: 'pointer',
    transition: `all ${TRANSITIONS.duration.fast}`,
    backgroundColor: isSelected ? COLORS.blueLight : COLORS.bg.primary,
  }),
  tag: {
    display: 'inline-block',
    padding: `2px ${SPACING[2]}`,
    fontSize: '11px',
    fontFamily: TYPOGRAPHY.fontFamily.text,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.bg.subtle,
    borderRadius: RADIUS.small,
    border: `1px solid ${COLORS.border.default}`,
  },
  popularityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    backgroundColor: "rgba(255, 193, 7, 0.15)",
    color: "#F59E0B",
    padding: `2px ${SPACING[1]}`,
    borderRadius: RADIUS.small,
    fontSize: '11px',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
};

export function TemplateLibraryModal({ isOpen, onClose }: Props) {
  const { createProjectFromTemplate } = useGanttToolStoreV2();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = PROJECT_TEMPLATES;

    // Filter by category
    if (selectedCategory !== "all") {
      templates = getTemplatesByCategory(selectedCategory as ProjectTemplate["category"]);
    }

    // Filter by search query
    if (searchQuery) {
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  const handleImportTemplate = async (template: ProjectTemplate) => {
    // Create a copy of the template with updated name and dates
    const projectCopy = {
      ...template,
      name: `${template.name} - ${format(new Date(), "MMM dd, yyyy")}`,
      startDate: new Date().toISOString().split("T")[0],
    } as unknown as GanttProject;

    await createProjectFromTemplate(projectCopy);
    onClose();
  };

  const categoryTabs = [
    { key: "all", label: "All Templates", icon: <Rocket style={{ width: '16px', height: '16px' }} /> },
    { key: "sap-activate", label: "SAP Activate", icon: <TrendingUp style={{ width: '16px', height: '16px' }} /> },
    { key: "greenfield", label: "Greenfield", icon: <Rocket style={{ width: '16px', height: '16px' }} /> },
    { key: "brownfield", label: "Brownfield", icon: <Building style={{ width: '16px', height: '16px' }} /> },
    { key: "migration", label: "Migration", icon: <TrendingUp style={{ width: '16px', height: '16px' }} /> },
    { key: "rapid", label: "Rapid Deploy", icon: <Rocket style={{ width: '16px', height: '16px' }} /> },
    { key: "industry", label: "Industry", icon: <Building style={{ width: '16px', height: '16px' }} /> },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Library"
      subtitle="50+ pre-built project templates to get started instantly"
      size="large"
      footer={null}
    >
      {/* Search Bar */}
      <div style={{ marginBottom: SPACING[4], position: 'relative' }}>
        <div style={styles.searchIcon}>
          <Search style={{ width: '16px', height: '16px' }} />
        </div>
        <input
          type="text"
          placeholder="Search templates by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
          onFocus={(e) => {
            e.target.style.borderColor = COLORS.blue;
            e.target.style.boxShadow = `0 0 0 3px ${COLORS.blueLight}`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = COLORS.border.default;
            e.target.style.boxShadow = 'none';
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              position: 'absolute',
              right: SPACING[3],
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: COLORS.text.tertiary,
              padding: SPACING[1],
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.text.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.text.tertiary;
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div style={{
        borderBottom: `1px solid ${COLORS.border.default}`,
        marginBottom: SPACING[4],
        display: 'flex',
        gap: SPACING[1],
        overflowX: 'auto',
      }}>
        {categoryTabs.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            style={styles.tab(selectedCategory === cat.key)}
            onMouseEnter={(e) => {
              if (selectedCategory !== cat.key) {
                e.currentTarget.style.color = COLORS.text.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCategory !== cat.key) {
                e.currentTarget.style.color = COLORS.text.tertiary;
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], whiteSpace: 'nowrap' }}>
              {cat.icon}
              <span>{cat.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: SPACING[4],
        maxHeight: '500px',
        overflowY: 'auto',
        paddingRight: SPACING[2],
      }}>
        {filteredTemplates.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: `${SPACING[8]} 0`,
          }}>
            <BookOpen style={{
              width: '64px',
              height: '64px',
              color: COLORS.bg.subtle,
              margin: '0 auto',
              marginBottom: SPACING[4],
            }} />
            <h3 style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.subtitle,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.secondary,
              marginBottom: SPACING[2],
              margin: 0,
            }}>
              No templates found
            </h3>
            <p style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.text.tertiary,
              margin: 0,
            }}>
              Try adjusting your search or category filter
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              style={styles.templateCard(selectedTemplate?.id === template.id)}
              onClick={() => setSelectedTemplate(template)}
              onMouseEnter={(e) => {
                if (selectedTemplate?.id !== template.id) {
                  e.currentTarget.style.borderColor = COLORS.blueLight;
                  e.currentTarget.style.boxShadow = `0 2px 8px ${COLORS.shadow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTemplate?.id !== template.id) {
                  e.currentTarget.style.borderColor = COLORS.border.default;
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Template Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: SPACING[3],
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '24px' }}>{template.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.caption,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.text.primary,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {template.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], marginTop: SPACING[1] }}>
                      <div style={styles.popularityBadge}>
                        {[...Array(template.popularity)].map((_, i) => (
                          <Star key={i} style={{ width: '10px', height: '10px' }} fill="currentColor" />
                        ))}
                      </div>
                      <span style={styles.tag}>{template.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Description */}
              <p style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: '11px',
                color: COLORS.text.secondary,
                marginBottom: SPACING[3],
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {template.description}
              </p>

              {/* Template Metrics */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[3],
                fontSize: '11px',
                color: COLORS.text.tertiary,
                marginBottom: SPACING[3],
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[1] }}>
                  <Calendar style={{ width: '12px', height: '12px' }} />
                  <span>{template.phases.length} phases</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[1] }}>
                  <CheckCircle style={{ width: '12px', height: '12px' }} />
                  <span>{template.phases.reduce((sum, p) => sum + p.tasks.length, 0)} tasks</span>
                </div>
              </div>

              {/* Tags */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: SPACING[1],
                marginBottom: SPACING[3],
              }}>
                {template.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} style={styles.tag}>
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span style={styles.tag}>+{template.tags.length - 3}</span>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImportTemplate(template);
                }}
                style={{
                  width: '100%',
                  padding: `${SPACING[2]} ${SPACING[3]}`,
                  backgroundColor: COLORS.blue,
                  color: COLORS.bg.primary,
                  borderRadius: RADIUS.default,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: SPACING[2],
                  transition: `background-color ${TRANSITIONS.duration.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.blueHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.blue;
                }}
              >
                <Rocket style={{ width: '16px', height: '16px' }} />
                Use This Template
              </button>
            </div>
          ))
        )}
      </div>

      {/* Template Preview Panel */}
      {selectedTemplate && (
        <div style={{
          marginTop: SPACING[4],
          padding: SPACING[4],
          backgroundColor: COLORS.bg.subtle,
          borderRadius: RADIUS.default,
          border: `1px solid ${COLORS.border.default}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: SPACING[3],
          }}>
            <h4 style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.body,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              margin: 0,
            }}>
              Template Preview
            </h4>
            <button
              onClick={() => setSelectedTemplate(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: COLORS.text.tertiary,
                padding: SPACING[1],
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.text.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.text.tertiary;
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Phases Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
            <p style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.secondary,
              margin: 0,
            }}>
              Phases ({selectedTemplate.phases.length}):
            </p>
            {selectedTemplate.phases.map((phase, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[2],
                fontSize: '11px',
                fontFamily: TYPOGRAPHY.fontFamily.text,
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: RADIUS.small,
                  backgroundColor: phase.color,
                }} />
                <span style={{
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.primary,
                }}>
                  {phase.name}
                </span>
                <span style={{ color: COLORS.text.tertiary }}>
                  ({phase.tasks.length} tasks)
                </span>
              </div>
            ))}
          </div>

          {/* Milestones Preview */}
          {selectedTemplate.milestones.length > 0 && (
            <div style={{
              marginTop: SPACING[4],
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING[2],
            }}>
              <p style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.secondary,
                margin: 0,
              }}>
                Milestones ({selectedTemplate.milestones.length}):
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING[2] }}>
                {selectedTemplate.milestones.map((milestone, idx) => (
                  <span key={idx} style={styles.tag}>
                    {milestone.icon} {milestone.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Note */}
      <div style={{
        marginTop: SPACING[4],
        textAlign: 'center',
        fontSize: '11px',
        fontFamily: TYPOGRAPHY.fontFamily.text,
        color: COLORS.text.tertiary,
      }}>
        💡 Tip: All templates are fully customizable after import. Dates will be adjusted to start
        from today.
      </div>
    </BaseModal>
  );
}
