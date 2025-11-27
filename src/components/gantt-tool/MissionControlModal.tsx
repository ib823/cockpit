/**
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 *
 * Mission Control Modal
 * Pattern: "Mission Control" from showcase (lines 729-743, 1655-1726)
 */

"use client";

import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

interface MissionControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthScore?: number;
  budgetUtilization?: number;
  spentToDate?: number;
  totalBudget?: number;
  tasksComplete?: number;
  totalTasks?: number;
  alerts?: Array<{
    id: string;
    message: string;
  }>;
}

export function MissionControlModal({
  isOpen,
  onClose,
  healthScore = 87,
  budgetUtilization = 78,
  spentToDate = 193650,
  totalBudget = 248500,
  tasksComplete = 34,
  totalTasks = 52,
  alerts = [],
}: MissionControlModalProps) {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const displayAlerts = alerts.length > 0
    ? alerts
    : [
        { id: "1", message: "Phase 2 approaching 90% budget threshold" },
        { id: "2", message: "Resource allocation gap in December timeline" },
      ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Mission Control"
      subtitle="Executive project overview and analytics"
      size="xlarge"
      footer={
        <ModalButton onClick={onClose} variant="primary">
          Close Dashboard
        </ModalButton>
      }
    >
      {/* Health Score Card */}
      <div style={{
        padding: "24px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        color: "white",
        marginBottom: "24px",
      }}>
        <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
          Project Health Score
        </div>
        <div style={{ fontSize: "48px", fontWeight: 700, marginBottom: "8px" }}>
          {healthScore}/100
        </div>
        <div style={{ fontSize: "13px", opacity: 0.8 }}>
          ✓ On Track • Budget: {budgetUtilization}% • Schedule: 82% • Resources: 91%
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "24px",
      }}>
        {[
          { label: "Total Budget", value: formatCurrency(totalBudget), change: "+12%" },
          { label: "Spent to Date", value: formatCurrency(spentToDate), change: `${budgetUtilization}%` },
          { label: "Tasks Complete", value: `${tasksComplete}/${totalTasks}`, change: `${Math.round((tasksComplete / totalTasks) * 100)}%` },
        ].map((metric, idx) => (
          <div key={idx} style={{
            padding: "16px",
            backgroundColor: "#F5F5F7",
            borderRadius: "10px",
          }}>
            <div style={{ fontSize: "12px", color: "#86868B", marginBottom: "8px" }}>
              {metric.label}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: "#1D1D1F", marginBottom: "4px" }}>
              {metric.value}
            </div>
            <div style={{ fontSize: "12px", color: "#34C759" }}>
              {metric.change}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div style={{
        padding: "16px",
        backgroundColor: "#FEF3C7",
        border: "1px solid #FCD34D",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#92400E" }}>
            {displayAlerts.length} Active Alerts
          </span>
        </div>
        <ul style={{ margin: 0, padding: "0 0 0 28px", fontSize: "13px", color: "#92400E", lineHeight: 1.7 }}>
          {displayAlerts.map((alert) => (
            <li key={alert.id}>{alert.message}</li>
          ))}
        </ul>
      </div>
    </BaseModal>
  );
}
