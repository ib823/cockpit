"use client";

/**
 * Costing Configuration Modal
 *
 * SECURITY: Finance-only access required
 * Allows configuration of:
 * - Realization Rate (RR%)
 * - Internal Cost Percentage
 * - OPE (Out of Pocket Expense) defaults
 * - Intercompany Markup
 * - Cost Visibility Level
 *
 * Design: Apple HIG compliant, minimal, enterprise-grade
 */

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, AlertCircle, Settings, DollarSign, Percent, Building2 } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface CostingConfig {
  id: string;
  projectId: string;
  realizationRatePercent: number;
  internalCostPercent: number;
  opeAccommodationPerDay: number;
  opeMealsPerDay: number;
  opeTransportPerDay: number;
  opeTotalDefaultPerDay: number;
  intercompanyMarkupPercent: number;
  baseCurrency: string;
  costVisibilityLevel: "PUBLIC" | "PRESALES_AND_FINANCE" | "FINANCE_ONLY";
  createdAt: string;
  updatedAt: string;
}

interface CostingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSave?: () => void;
}

// ============================================================================
// Design Tokens (Apple HIG compliant)
// ============================================================================

const TOKENS = {
  colors: {
    text: {
      primary: "#1D1D1F",
      secondary: "#6B7280",
      tertiary: "#9CA3AF",
    },
    border: "#E5E7EB",
    borderFocus: "#007AFF",
    surface: "#F9FAFB",
    blue: "#007AFF",
    green: "#34C759",
    orange: "#FF9500",
    red: "#FF3B30",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
  },
};

// ============================================================================
// Styled Components
// ============================================================================

const styles = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "16px",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: TOKENS.radius.lg,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: `1px solid ${TOKENS.colors.border}`,
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    color: TOKENS.colors.text.primary,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  closeButton: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: TOKENS.colors.text.secondary,
    transition: "background-color 0.15s ease",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: "24px",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: TOKENS.colors.text.primary,
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: TOKENS.colors.text.secondary,
  },
  inputWrapper: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: "44px",
    padding: "0 12px",
    paddingRight: "40px",
    border: `1px solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.radius.sm,
    fontSize: "14px",
    color: TOKENS.colors.text.primary,
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
  inputSuffix: {
    position: "absolute" as const,
    right: "12px",
    fontSize: "13px",
    color: TOKENS.colors.text.tertiary,
    pointerEvents: "none" as const,
  },
  select: {
    width: "100%",
    height: "44px",
    padding: "0 12px",
    border: `1px solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.radius.sm,
    fontSize: "14px",
    color: TOKENS.colors.text.primary,
    backgroundColor: "#FFFFFF",
    outline: "none",
    cursor: "pointer",
  },
  hint: {
    fontSize: "12px",
    color: TOKENS.colors.text.tertiary,
    marginTop: "4px",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    borderTop: `1px solid ${TOKENS.colors.border}`,
    backgroundColor: TOKENS.colors.surface,
  },
  button: {
    height: "44px",
    padding: "0 20px",
    borderRadius: TOKENS.radius.sm,
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  buttonPrimary: {
    backgroundColor: TOKENS.colors.blue,
    color: "#FFFFFF",
    border: "none",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    color: TOKENS.colors.text.secondary,
    border: `1px solid ${TOKENS.colors.border}`,
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderRadius: TOKENS.radius.sm,
    color: TOKENS.colors.red,
    fontSize: "13px",
    marginBottom: "16px",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px",
    color: TOKENS.colors.text.secondary,
    gap: "12px",
  },
};

// ============================================================================
// Component
// ============================================================================

export function CostingConfigModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSave,
}: CostingConfigModalProps) {
  const [config, setConfig] = useState<CostingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    realizationRatePercent: number;
    internalCostPercent: number;
    opeAccommodationPerDay: number;
    opeMealsPerDay: number;
    opeTransportPerDay: number;
    opeTotalDefaultPerDay: number;
    intercompanyMarkupPercent: number;
    baseCurrency: string;
    costVisibilityLevel: "PUBLIC" | "PRESALES_AND_FINANCE" | "FINANCE_ONLY";
  }>({
    realizationRatePercent: 43,
    internalCostPercent: 35,
    opeAccommodationPerDay: 150,
    opeMealsPerDay: 50,
    opeTransportPerDay: 100,
    opeTotalDefaultPerDay: 500,
    intercompanyMarkupPercent: 15,
    baseCurrency: "MYR",
    costVisibilityLevel: "FINANCE_ONLY",
  });

  // Fetch config on mount
  const fetchConfig = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/gantt-tool/projects/${projectId}/costing-config`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch configuration");
      }

      const data: CostingConfig = await response.json();
      setConfig(data);

      // Update form with fetched data (convert decimal to percentage for display)
      setFormData({
        realizationRatePercent: Math.round(data.realizationRatePercent * 100),
        internalCostPercent: Math.round(data.internalCostPercent * 100),
        opeAccommodationPerDay: data.opeAccommodationPerDay,
        opeMealsPerDay: data.opeMealsPerDay,
        opeTransportPerDay: data.opeTransportPerDay,
        opeTotalDefaultPerDay: data.opeTotalDefaultPerDay,
        intercompanyMarkupPercent: Math.round((data.intercompanyMarkupPercent - 1) * 100),
        baseCurrency: data.baseCurrency,
        costVisibilityLevel: data.costVisibilityLevel,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch configuration");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen, fetchConfig]);

  // Handle input changes
  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Convert percentage display values back to decimals for API
      const payload = {
        realizationRatePercent: formData.realizationRatePercent / 100,
        internalCostPercent: formData.internalCostPercent / 100,
        opeAccommodationPerDay: formData.opeAccommodationPerDay,
        opeMealsPerDay: formData.opeMealsPerDay,
        opeTransportPerDay: formData.opeTransportPerDay,
        opeTotalDefaultPerDay: formData.opeTotalDefaultPerDay,
        intercompanyMarkupPercent: 1 + formData.intercompanyMarkupPercent / 100,
        baseCurrency: formData.baseCurrency,
        costVisibilityLevel: formData.costVisibilityLevel,
      };

      const response = await fetch(`/api/gantt-tool/projects/${projectId}/costing-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save configuration");
      }

      onSave?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <Settings size={20} style={{ color: TOKENS.colors.blue }} />
            <span>Costing Configuration</span>
          </div>
          <button
            style={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>
              <Loader2 size={20} className="animate-spin" />
              <span>Loading configuration...</span>
            </div>
          ) : (
            <>
              {error && (
                <div style={styles.error}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Project Info */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", color: TOKENS.colors.text.tertiary }}>
                  Project
                </div>
                <div style={{ fontSize: "15px", fontWeight: 500, color: TOKENS.colors.text.primary }}>
                  {projectName}
                </div>
              </div>

              {/* Rate Configuration */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <Percent size={16} style={{ color: TOKENS.colors.blue }} />
                  Rate Configuration
                </div>
                <div style={styles.grid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Realization Rate (RR%)</label>
                    <div style={styles.inputWrapper}>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.realizationRatePercent}
                        onChange={(e) => handleChange("realizationRatePercent", Number(e.target.value))}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <span style={styles.inputSuffix}>%</span>
                    </div>
                    <div style={styles.hint}>% of GSR converted to NSR</div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Internal Cost %</label>
                    <div style={styles.inputWrapper}>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.internalCostPercent}
                        onChange={(e) => handleChange("internalCostPercent", Number(e.target.value))}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <span style={styles.inputSuffix}>%</span>
                    </div>
                    <div style={styles.hint}>% of standard rate for internal cost</div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Intercompany Markup</label>
                    <div style={styles.inputWrapper}>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.intercompanyMarkupPercent}
                        onChange={(e) => handleChange("intercompanyMarkupPercent", Number(e.target.value))}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <span style={styles.inputSuffix}>%</span>
                    </div>
                    <div style={styles.hint}>Markup for cross-region resources</div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Base Currency</label>
                    <select
                      style={styles.select}
                      value={formData.baseCurrency}
                      onChange={(e) => handleChange("baseCurrency", e.target.value)}
                    >
                      <option value="MYR">MYR - Malaysian Ringgit</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="SGD">SGD - Singapore Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* OPE Configuration */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <DollarSign size={16} style={{ color: TOKENS.colors.green }} />
                  OPE Defaults (Per Day)
                </div>
                <div style={styles.grid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Accommodation</label>
                    <div style={styles.inputWrapper}>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.opeAccommodationPerDay}
                        onChange={(e) => handleChange("opeAccommodationPerDay", Number(e.target.value))}
                        min={0}
                        step={10}
                      />
                      <span style={styles.inputSuffix}>{formData.baseCurrency}</span>
                    </div>
                    <div style={styles.hint}>Hotel per night</div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Meals</label>
                    <div style={styles.inputWrapper}>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.opeMealsPerDay}
                        onChange={(e) => handleChange("opeMealsPerDay", Number(e.target.value))}
                        min={0}
                        step={10}
                      />
                      <span style={styles.inputSuffix}>{formData.baseCurrency}</span>
                    </div>
                    <div style={styles.hint}>Daily meal allowance</div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Transport</label>
                    <div style={styles.inputWrapper}>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.opeTransportPerDay}
                        onChange={(e) => handleChange("opeTransportPerDay", Number(e.target.value))}
                        min={0}
                        step={10}
                      />
                      <span style={styles.inputSuffix}>{formData.baseCurrency}</span>
                    </div>
                    <div style={styles.hint}>Local transport per day</div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Total Default OPE</label>
                    <div style={styles.inputWrapper}>
                      <input
                        type="number"
                        style={{ ...styles.input, fontWeight: 600 }}
                        value={formData.opeTotalDefaultPerDay}
                        onChange={(e) => handleChange("opeTotalDefaultPerDay", Number(e.target.value))}
                        min={0}
                        step={50}
                      />
                      <span style={styles.inputSuffix}>{formData.baseCurrency}</span>
                    </div>
                    <div style={styles.hint}>All-inclusive daily OPE</div>
                  </div>
                </div>
              </div>

              {/* Access Control */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <Building2 size={16} style={{ color: TOKENS.colors.orange }} />
                  Visibility Settings
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Cost Data Visibility</label>
                  <select
                    style={styles.select}
                    value={formData.costVisibilityLevel}
                    onChange={(e) => handleChange("costVisibilityLevel", e.target.value as "PUBLIC" | "PRESALES_AND_FINANCE" | "FINANCE_ONLY")}
                  >
                    <option value="FINANCE_ONLY">Finance Only - Full access (margins, costs)</option>
                    <option value="PRESALES_AND_FINANCE">Presales + Finance - Revenue only (GSR, NSR)</option>
                    <option value="PUBLIC">Public - No financial data visible</option>
                  </select>
                  <div style={styles.hint}>
                    Controls who can see financial data for this project
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.buttonPrimary, opacity: saving ? 0.7 : 1 }}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CostingConfigModal;
