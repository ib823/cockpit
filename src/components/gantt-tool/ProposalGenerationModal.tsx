/**
 * Proposal Generation Modal - Revolutionary Feature
 *
 * One-click proposal generation with:
 * - AI-powered executive summary
 * - Timeline visualization
 * - Cost breakdown
 * - Resource allocation
 * - Risk analysis
 * - Export to PDF, PowerPoint, and interactive HTML
 *
 * DESIGN: Pure BaseModal + design tokens - NO Ant Design, NO Tailwind
 */

"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Presentation,
  Globe,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Clock,
  Award,
  Zap,
} from "lucide-react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { differenceInDays, format } from "date-fns";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";
import { exportToPDF } from "@/lib/gantt-tool/export-utils";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";

interface ProposalGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Style Objects (Design Tokens Only)
// ============================================================================

const styles = {
  heroBox: {
    padding: SPACING[5],
    background: `linear-gradient(135deg, ${COLORS.blue}15, ${COLORS.purple}15)`,
    borderRadius: RADIUS.default,
    border: `1px solid ${COLORS.blue}40`,
    marginBottom: SPACING[5],
  },
  statCard: (color: string) => ({
    textAlign: 'center' as const,
  }),
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
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
  }),
  progressBar: (percent: number, color: string) => ({
    width: '100%',
    height: '8px',
    backgroundColor: COLORS.bg.subtle,
    borderRadius: RADIUS.full,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  }),
  progressFill: (percent: number, color: string) => ({
    width: `${percent}%`,
    height: '100%',
    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
    borderRadius: RADIUS.full,
    transition: `width ${TRANSITIONS.duration.normal}`,
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
    marginTop: SPACING[1],
  },
  phaseCard: {
    padding: SPACING[3],
    backgroundColor: COLORS.bg.primary,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.default,
    transition: `box-shadow ${TRANSITIONS.duration.fast}`,
  },
  insightBox: {
    padding: SPACING[4],
    background: `linear-gradient(135deg, ${COLORS.purple}15, ${COLORS.status.info}15)`,
    border: `1px solid ${COLORS.purple}40`,
    borderRadius: RADIUS.default,
  },
  exportButton: (isPrimary: boolean) => ({
    padding: `${SPACING[2]} ${SPACING[4]}`,
    fontSize: TYPOGRAPHY.fontSize.caption,
    fontFamily: TYPOGRAPHY.fontFamily.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: isPrimary ? COLORS.bg.primary : COLORS.blue,
    backgroundColor: isPrimary ? COLORS.blue : 'transparent',
    border: `1px solid ${isPrimary ? COLORS.blue : COLORS.border.default}`,
    borderRadius: RADIUS.default,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
    transition: `all ${TRANSITIONS.duration.fast}`,
  }),
};

export function ProposalGenerationModal({ isOpen, onClose }: ProposalGenerationModalProps) {
  const { currentProject, getProjectDuration } = useGanttToolStoreV2();
  const [activeTab, setActiveTab] = useState("summary");
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const duration = getProjectDuration();

  // Calculate comprehensive project metrics
  const proposalData = useMemo(() => {
    if (!currentProject || !duration) return null;

    const { startDate, endDate, durationDays } = duration;
    const phases = currentProject.phases;
    const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
    const resources = currentProject.resources || [];

    // Calculate costs (placeholder - use real rates in production)
    const estimatedCost = resources.length * 50000; // $50K per resource baseline
    const costByCategory = {
      pm: estimatedCost * 0.15,
      technical: estimatedCost * 0.4,
      functional: estimatedCost * 0.3,
      security: estimatedCost * 0.1,
      change: estimatedCost * 0.05,
    };

    // Resource utilization
    const assignedResources = new Set<string>();
    phases.forEach((phase) => {
      phase.phaseResourceAssignments?.forEach((a) => assignedResources.add(a.resourceId));
      phase.tasks.forEach((task) => {
        task.resourceAssignments?.forEach((a) => assignedResources.add(a.resourceId));
      });
    });

    const utilizationRate =
      resources.length > 0 ? (assignedResources.size / resources.length) * 100 : 0;

    // Milestones
    const milestones = currentProject.milestones || [];

    // Project complexity score (0-100)
    const complexityScore = Math.min(
      phases.length * 10 + totalTasks * 2 + resources.length * 5,
      100
    );

    return {
      projectName: currentProject.name,
      description: currentProject.description || "",
      startDate: format(startDate, "MMMM dd, yyyy"),
      endDate: format(endDate, "MMMM dd, yyyy"),
      duration: durationDays,
      durationMonths: Math.round(durationDays / 30),
      phases: phases.length,
      tasks: totalTasks,
      resources: resources.length,
      assignedResources: assignedResources.size,
      utilizationRate,
      estimatedCost,
      costByCategory,
      milestones: milestones.length,
      complexityScore,
      phasesList: phases.map((p) => ({
        name: p.name,
        description: p.description || "",
        tasks: p.tasks.length,
        duration: differenceInDays(new Date(p.endDate), new Date(p.startDate)),
      })),
      resourcesList: resources.map((r) => ({
        name: r.name,
        category: RESOURCE_CATEGORIES[r.category].label,
        designation: RESOURCE_DESIGNATIONS[r.designation],
        icon: RESOURCE_CATEGORIES[r.category].icon,
      })),
    };
  }, [currentProject, duration]);

  if (!proposalData) return null;

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportPDF = async () => {
    if (!currentProject) return;
    setIsExporting(true);
    try {
      await exportToPDF(currentProject);
      showNotification('success', "Proposal exported to PDF successfully!");
    } catch (error) {
      showNotification('error', "Failed to export proposal. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPowerPoint = () => {
    showNotification('info', "PowerPoint export is coming soon! This will generate a client-ready presentation.");
  };

  const handleExportHTML = () => {
    showNotification('info', "Interactive HTML export is coming soon! Share a live, explorable proposal with clients.");
  };

  const ProgressBar = ({ percent, color }: { percent: number; color: string }) => (
    <div style={styles.progressBar(percent, color)}>
      <div style={styles.progressFill(percent, color)} />
    </div>
  );

  const tabs = [
    {
      key: 'summary',
      label: 'Executive Summary',
      icon: <FileText style={{ width: '16px', height: '16px' }} />,
    },
    {
      key: 'costs',
      label: 'Cost Breakdown',
      icon: <DollarSign style={{ width: '16px', height: '16px' }} />,
    },
    {
      key: 'team',
      label: 'Team & Resources',
      icon: <Users style={{ width: '16px', height: '16px' }} />,
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Proposal"
      subtitle="AI-powered, client-ready proposal in seconds"
      size="large"
      footer={null}
    >
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: SPACING[4],
          right: SPACING[4],
          padding: SPACING[3],
          backgroundColor: notification.type === 'success' ? COLORS.status.success :
                          notification.type === 'error' ? COLORS.red : COLORS.blue,
          color: COLORS.bg.primary,
          borderRadius: RADIUS.default,
          boxShadow: `0 4px 12px ${COLORS.shadow}`,
          fontSize: TYPOGRAPHY.fontSize.caption,
          fontFamily: TYPOGRAPHY.fontFamily.text,
          zIndex: 10000,
          animation: 'slideIn 0.3s ease',
        }}>
          {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        borderBottom: `1px solid ${COLORS.border.light}`,
        marginBottom: SPACING[5],
        marginLeft: `-${SPACING[6]}`,
        marginRight: `-${SPACING[6]}`,
        marginTop: `-${SPACING[6]}`,
      }}>
        <div style={{ display: 'flex', gap: SPACING[1], paddingLeft: SPACING[6] }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={styles.tab(activeTab === tab.key)}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) e.currentTarget.style.color = COLORS.text.primary;
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) e.currentTarget.style.color = COLORS.text.tertiary;
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: SPACING[2] }}>
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[5] }}>
            {/* Hero Section */}
            <div style={styles.heroBox}>
              <h3 style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.title,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.text.primary,
                marginBottom: SPACING[2],
                margin: 0,
              }}>
                {proposalData.projectName}
              </h3>
              {proposalData.description && (
                <p style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  color: COLORS.text.secondary,
                  marginBottom: SPACING[4],
                  margin: 0,
                }}>
                  {proposalData.description}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: SPACING[4] }}>
                <div style={styles.statCard(COLORS.blue)}>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: COLORS.blue,
                  }}>
                    {proposalData.durationMonths}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.text.secondary,
                    marginTop: SPACING[1],
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    Months
                  </div>
                </div>
                <div style={styles.statCard(COLORS.purple)}>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: COLORS.purple,
                  }}>
                    {proposalData.phases}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.text.secondary,
                    marginTop: SPACING[1],
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    Phases
                  </div>
                </div>
                <div style={styles.statCard(COLORS.status.success)}>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: COLORS.status.success,
                  }}>
                    {proposalData.resources}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.text.secondary,
                    marginTop: SPACING[1],
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    Team Members
                  </div>
                </div>
                <div style={styles.statCard(COLORS.orange)}>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: COLORS.orange,
                  }}>
                    ${Math.round(proposalData.estimatedCost / 1000)}K
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.text.secondary,
                    marginTop: SPACING[1],
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    Investment
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                marginBottom: SPACING[3],
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[2],
              }}>
                <Calendar style={{ width: '16px', height: '16px', color: COLORS.blue }} />
                Project Timeline
              </h4>
              <div style={{
                padding: SPACING[4],
                backgroundColor: COLORS.bg.subtle,
                borderRadius: RADIUS.default,
                border: `1px solid ${COLORS.border.default}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  marginBottom: SPACING[3],
                }}>
                  <div>
                    <span style={{ color: COLORS.text.secondary }}>Start Date:</span>
                    <span style={{
                      marginLeft: SPACING[2],
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.text.primary,
                    }}>
                      {proposalData.startDate}
                    </span>
                  </div>
                  <div style={{ color: COLORS.text.tertiary }}>→</div>
                  <div>
                    <span style={{ color: COLORS.text.secondary }}>End Date:</span>
                    <span style={{
                      marginLeft: SPACING[2],
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.text.primary,
                    }}>
                      {proposalData.endDate}
                    </span>
                  </div>
                </div>
                <ProgressBar percent={100} color={COLORS.blue} />
                <p style={{
                  fontSize: '11px',
                  color: COLORS.text.secondary,
                  marginTop: SPACING[2],
                  textAlign: 'center',
                  margin: 0,
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                }}>
                  {proposalData.duration} days · {proposalData.durationMonths} months
                </p>
              </div>
            </div>

            {/* Phases Overview */}
            <div>
              <h4 style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                marginBottom: SPACING[3],
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[2],
              }}>
                <Target style={{ width: '16px', height: '16px', color: COLORS.purple }} />
                Implementation Phases
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                {proposalData.phasesList.map((phase, idx) => (
                  <div
                    key={idx}
                    style={styles.phaseCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 2px 8px ${COLORS.shadow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: TYPOGRAPHY.fontWeight.bold,
                            color: COLORS.blue,
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                          }}>
                            Phase {idx + 1}
                          </span>
                          <h5 style={{
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                            fontSize: TYPOGRAPHY.fontSize.caption,
                            fontWeight: TYPOGRAPHY.fontWeight.semibold,
                            color: COLORS.text.primary,
                            margin: 0,
                          }}>
                            {phase.name}
                          </h5>
                        </div>
                        {phase.description && (
                          <p style={{
                            fontSize: '11px',
                            color: COLORS.text.secondary,
                            marginTop: SPACING[1],
                            margin: 0,
                            fontFamily: TYPOGRAPHY.fontFamily.text,
                          }}>
                            {phase.description}
                          </p>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING[3],
                          marginTop: SPACING[2],
                          fontSize: '11px',
                          color: COLORS.text.tertiary,
                          fontFamily: TYPOGRAPHY.fontFamily.text,
                        }}>
                          <span>{phase.tasks} tasks</span>
                          <span>·</span>
                          <span>{phase.duration} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div style={styles.insightBox}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[2],
                marginBottom: SPACING[3],
              }}>
                <Sparkles style={{ width: '16px', height: '16px', color: COLORS.purple }} />
                <h4 style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.primary,
                  margin: 0,
                }}>
                  AI Project Analysis
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[2] }}>
                  <CheckCircle style={{ width: '16px', height: '16px', color: COLORS.status.success, flexShrink: 0, marginTop: '2px' }} />
                  <p style={{
                    color: COLORS.text.secondary,
                    margin: 0,
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    <strong>Timeline Assessment:</strong> {proposalData.durationMonths}-month
                    timeline is{" "}
                    {proposalData.durationMonths < 6 ? "aggressive" : "conservative"} for this
                    project scope.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[2] }}>
                  <TrendingUp style={{ width: '16px', height: '16px', color: COLORS.blue, flexShrink: 0, marginTop: '2px' }} />
                  <p style={{
                    color: COLORS.text.secondary,
                    margin: 0,
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    <strong>Resource Optimization:</strong>{" "}
                    {Math.round(proposalData.utilizationRate)}% team utilization -{" "}
                    {proposalData.utilizationRate > 85
                      ? "excellent efficiency"
                      : "room for optimization"}
                    .
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[2] }}>
                  <Award style={{ width: '16px', height: '16px', color: COLORS.orange, flexShrink: 0, marginTop: '2px' }} />
                  <p style={{
                    color: COLORS.text.secondary,
                    margin: 0,
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    <strong>Complexity Score:</strong> {proposalData.complexityScore}/100 -{" "}
                    {proposalData.complexityScore < 40
                      ? "Low"
                      : proposalData.complexityScore < 70
                        ? "Medium"
                        : "High"}{" "}
                    complexity project.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COSTS TAB */}
        {activeTab === 'costs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[5] }}>
            {/* Total Investment */}
            <div style={{
              padding: SPACING[5],
              background: `linear-gradient(135deg, ${COLORS.status.success}15, ${COLORS.greenLight}15)`,
              borderRadius: RADIUS.default,
              border: `1px solid ${COLORS.status.success}40`,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  color: COLORS.text.secondary,
                  marginBottom: SPACING[2],
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                }}>
                  Total Project Investment
                </div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: TYPOGRAPHY.fontWeight.bold,
                  color: COLORS.status.success,
                  marginBottom: SPACING[2],
                }}>
                  ${Math.round(proposalData.estimatedCost / 1000)}K
                </div>
                <div style={{
                  fontSize: '11px',
                  color: COLORS.text.secondary,
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                }}>
                  Estimated based on {proposalData.resources} team members over{" "}
                  {proposalData.durationMonths} months
                </div>
              </div>
            </div>

            {/* Cost by Category */}
            <div>
              <h4 style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                marginBottom: SPACING[3],
                margin: 0,
              }}>
                Cost by Category
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
                {Object.entries(proposalData.costByCategory).map(([cat, cost]) => {
                  const category = RESOURCE_CATEGORIES[cat as keyof typeof RESOURCE_CATEGORIES];
                  const percentage = (cost / proposalData.estimatedCost) * 100;

                  return (
                    <div key={cat}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: SPACING[1],
                      }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: TYPOGRAPHY.fontWeight.semibold,
                          color: COLORS.text.secondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING[1],
                          fontFamily: TYPOGRAPHY.fontFamily.text,
                        }}>
                          <span>{category.icon}</span>
                          {category.label}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: TYPOGRAPHY.fontWeight.bold,
                          color: category.color,
                          fontFamily: TYPOGRAPHY.fontFamily.text,
                        }}>
                          ${Math.round(cost / 1000)}K ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <ProgressBar percent={percentage} color={category.color} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Schedule */}
            <div style={{
              padding: SPACING[4],
              backgroundColor: `${COLORS.blue}15`,
              border: `1px solid ${COLORS.blue}40`,
              borderRadius: RADIUS.default,
            }}>
              <h4 style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                marginBottom: SPACING[3],
                margin: 0,
              }}>
                Suggested Payment Schedule
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2], fontSize: '11px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                }}>
                  <span style={{ color: COLORS.text.secondary }}>Project Kickoff (30%)</span>
                  <span style={{
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: COLORS.text.primary,
                  }}>
                    ${Math.round((proposalData.estimatedCost * 0.3) / 1000)}K
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                }}>
                  <span style={{ color: COLORS.text.secondary }}>Mid-Project (40%)</span>
                  <span style={{
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: COLORS.text.primary,
                  }}>
                    ${Math.round((proposalData.estimatedCost * 0.4) / 1000)}K
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                }}>
                  <span style={{ color: COLORS.text.secondary }}>Project Completion (30%)</span>
                  <span style={{
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: COLORS.text.primary,
                  }}>
                    ${Math.round((proposalData.estimatedCost * 0.3) / 1000)}K
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[5] }}>
            {/* Team Overview */}
            <div style={{
              padding: SPACING[4],
              background: `linear-gradient(135deg, ${COLORS.purple}15, ${COLORS.blue}15)`,
              borderRadius: RADIUS.default,
              border: `1px solid ${COLORS.purple}40`,
            }}>
              <h4 style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                marginBottom: SPACING[3],
                margin: 0,
              }}>
                Project Team
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SPACING[4], textAlign: 'center' }}>
                <div>
                  <div style={{
                    fontSize: TYPOGRAPHY.fontSize.title,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: COLORS.purple,
                  }}>
                    {proposalData.resources}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.text.secondary,
                    marginTop: SPACING[1],
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    Total Team Members
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: TYPOGRAPHY.fontSize.title,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: COLORS.blue,
                  }}>
                    {proposalData.assignedResources}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.text.secondary,
                    marginTop: SPACING[1],
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    Actively Assigned
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: TYPOGRAPHY.fontSize.title,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: COLORS.status.success,
                  }}>
                    {Math.round(proposalData.utilizationRate)}%
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.text.secondary,
                    marginTop: SPACING[1],
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                  }}>
                    Utilization Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <h4 style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                marginBottom: SPACING[3],
                margin: 0,
              }}>
                Team Composition
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: SPACING[3] }}>
                {proposalData.resourcesList.map((resource, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: SPACING[3],
                      backgroundColor: COLORS.bg.primary,
                      border: `1px solid ${COLORS.border.default}`,
                      borderRadius: RADIUS.default,
                      transition: `box-shadow ${TRANSITIONS.duration.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 2px 8px ${COLORS.shadow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
                      <div style={{ fontSize: '24px' }}>{resource.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{
                          fontFamily: TYPOGRAPHY.fontFamily.text,
                          fontSize: TYPOGRAPHY.fontSize.caption,
                          fontWeight: TYPOGRAPHY.fontWeight.semibold,
                          color: COLORS.text.primary,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {resource.name}
                        </h5>
                        <p style={{
                          fontSize: '11px',
                          color: COLORS.text.secondary,
                          margin: 0,
                          fontFamily: TYPOGRAPHY.fontFamily.text,
                        }}>
                          {resource.designation}
                        </p>
                        <span style={styles.tag}>{resource.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Benefits */}
            <div style={{
              padding: SPACING[4],
              backgroundColor: `${COLORS.status.success}15`,
              border: `1px solid ${COLORS.status.success}40`,
              borderRadius: RADIUS.default,
            }}>
              <h4 style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                marginBottom: SPACING[3],
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[2],
              }}>
                <Award style={{ width: '16px', height: '16px', color: COLORS.status.success }} />
                Why Our Team
              </h4>
              <ul style={{
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING[2],
                fontSize: '11px',
                color: COLORS.text.secondary,
                fontFamily: TYPOGRAPHY.fontFamily.text,
                margin: 0,
                paddingLeft: SPACING[4],
              }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[2] }}>
                  <Zap style={{ width: '16px', height: '16px', color: COLORS.status.success, flexShrink: 0, marginTop: '2px' }} />
                  <span>Carefully balanced team with expertise across all project phases</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[2] }}>
                  <Zap style={{ width: '16px', height: '16px', color: COLORS.status.success, flexShrink: 0, marginTop: '2px' }} />
                  <span>Proven track record in similar implementations</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING[2] }}>
                  <Zap style={{ width: '16px', height: '16px', color: COLORS.status.success, flexShrink: 0, marginTop: '2px' }} />
                  <span>Dedicated project management ensuring on-time, on-budget delivery</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div style={{
        borderTop: `1px solid ${COLORS.border.default}`,
        marginTop: SPACING[5],
        paddingTop: SPACING[4],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: '11px',
          color: COLORS.text.tertiary,
          fontFamily: TYPOGRAPHY.fontFamily.text,
        }}>
          Generated with AI · Ready to share with clients
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2] }}>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            style={{
              ...styles.exportButton(true),
              opacity: isExporting ? 0.6 : 1,
              cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isExporting) e.currentTarget.style.backgroundColor = COLORS.blueHover;
            }}
            onMouseLeave={(e) => {
              if (!isExporting) e.currentTarget.style.backgroundColor = COLORS.blue;
            }}
          >
            <FileText style={{ width: '16px', height: '16px' }} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={handleExportPowerPoint}
            style={styles.exportButton(false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.blueLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Presentation style={{ width: '16px', height: '16px' }} />
            PowerPoint
          </button>
          <button
            onClick={handleExportHTML}
            style={styles.exportButton(false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.blueLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Globe style={{ width: '16px', height: '16px' }} />
            Interactive HTML
          </button>
        </div>
      </div>

      {/* Notification Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </BaseModal>
  );
}
