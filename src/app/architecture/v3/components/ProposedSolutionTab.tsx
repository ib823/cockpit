/**
 * Proposed Solution Tab - TO-BE Architecture
 * TOGAF Phase E/F - Target State & Migration Planning
 *
 * Purpose: Design the FUTURE STATE
 * - Future systems and applications
 * - Implementation phases (roadmap)
 * - What's new vs. reused from AS-IS
 * - Migration strategy
 */

"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, CheckCircle, Clock, Sparkles, Package, X, HelpCircle, Zap, Share2 } from "lucide-react";
import type { ProposedSolutionData, Phase, ProposedSystem, ProposedIntegration, CurrentSystem, ExternalSystem } from "../types";
import styles from "./proposed-solution-tab.module.css";
import { ReuseSystemModal } from "./ReuseSystemModal";
import { PhaseTimeline } from "./PhaseTimeline";

interface ProposedSolutionTabProps {
  data: ProposedSolutionData;
  currentSystems: CurrentSystem[];
  externalSystems: ExternalSystem[];
  onChange: (data: ProposedSolutionData) => void;
  onGenerate: () => void;
}

// Status Legend Popover Component
const StatusLegendPopover = () => (
  <div style={{
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
    minWidth: '200px',
    marginTop: '4px'
  }}>
    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Status Legend</div>
    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
        <span>In Scope - Current Phase</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
        <span>Future Phase</span>
      </div>
    </div>
  </div>
);

// ... (rest of the constants)

const TOGAF_FUTURE_SYSTEMS_TEMPLATES = {
  "Modern ERP - SAP": [
    { name: "SAP S/4HANA Cloud", vendor: "SAP", modules: ["Finance", "Supply Chain", "Manufacturing", "Procurement"], isNew: true },
    { name: "SAP Analytics Cloud", vendor: "SAP", modules: ["Planning", "Analytics", "Reporting"], isNew: true },
    { name: "SAP Ariba", vendor: "SAP", modules: ["Procurement", "Supplier Management"], isNew: true },
    { name: "SAP SuccessFactors", vendor: "SAP", modules: ["HR", "Talent Management", "Learning"], isNew: true },
  ],
  "Modern ERP - Oracle": [
    { name: "Oracle Fusion Cloud ERP", vendor: "Oracle", modules: ["Financials", "Procurement", "Project Management"], isNew: true },
    { name: "Oracle Fusion Cloud HCM", vendor: "Oracle", modules: ["HR", "Talent", "Payroll"], isNew: true },
    { name: "Oracle Fusion Cloud SCM", vendor: "Oracle", modules: ["Supply Chain", "Manufacturing", "Logistics"], isNew: true },
    { name: "Oracle Analytics Cloud", vendor: "Oracle", modules: ["BI", "Analytics", "ML"], isNew: true },
  ],
  "Modern ERP - Microsoft": [
    { name: "Microsoft Dynamics 365 Finance", vendor: "Microsoft", modules: ["Finance", "Budgeting", "Cash Management"], isNew: true },
    { name: "Microsoft Dynamics 365 Supply Chain", vendor: "Microsoft", modules: ["Inventory", "Warehouse", "Manufacturing"], isNew: true },
    { name: "Microsoft Dynamics 365 HR", vendor: "Microsoft", modules: ["HR", "Benefits", "Leave Management"], isNew: true },
    { name: "Microsoft Power BI", vendor: "Microsoft", modules: ["Analytics", "Reporting", "Dashboards"], isNew: true },
  ],
  "Best-of-Breed Cloud": [
    { name: "Salesforce Sales Cloud", vendor: "Salesforce", modules: ["CRM", "Sales", "Lead Management"], isNew: true },
    { name: "Workday HCM", vendor: "Workday", modules: ["HR", "Talent", "Payroll", "Time Tracking"], isNew: true },
    { name: "ServiceNow ITSM", vendor: "ServiceNow", modules: ["IT Service Management", "Incident", "Change"], isNew: true },
    { name: "Coupa Procurement", vendor: "Coupa", modules: ["Procurement", "Invoicing", "Expense"], isNew: true },
    { name: "Anaplan Planning", vendor: "Anaplan", modules: ["Financial Planning", "Sales Planning", "Supply Planning"], isNew: true },
  ],
  "Digital & Analytics": [
    { name: "Snowflake Data Cloud", vendor: "Snowflake", modules: ["Data Warehouse", "Data Lake", "Analytics"], isNew: true },
    { name: "Tableau Analytics", vendor: "Salesforce", modules: ["Data Visualization", "Dashboards", "Self-Service BI"], isNew: true },
    { name: "Microsoft Power Platform", vendor: "Microsoft", modules: ["Power Apps", "Power Automate", "Power BI"], isNew: true },
    { name: "Informatica Cloud", vendor: "Informatica", modules: ["Data Integration", "MDM", "Data Quality"], isNew: true },
  ],
};

const TOGAF_PHASE_TEMPLATES = [
  {
    name: "Phase 1: Foundation & Quick Wins",
    scope: "in-scope" as const,
    timeline: "Q1-Q2 2025",
    description: "Deploy foundational systems, minimal disruption, quick ROI",
  },
  {
    name: "Phase 2: Core Transformation",
    scope: "in-scope" as const,
    timeline: "Q3-Q4 2025",
    description: "Major system replacements, core business processes",
  },
  {
    name: "Phase 3: Extended Value",
    scope: "in-scope" as const,
    timeline: "Q1-Q2 2026",
    description: "Advanced capabilities, analytics, optimization",
  },
  {
    name: "Phase 4: Future Scope",
    scope: "future" as const,
    timeline: "2026+",
    description: "Innovation, AI/ML, advanced automation",
  },
];

export function ProposedSolutionTab({
  data,
  currentSystems,
  externalSystems,
  onChange,
  onGenerate,
}: ProposedSolutionTabProps) {
  const [showSystemTemplates, setShowSystemTemplates] = useState(false);
  const [showPhaseTemplates, setShowPhaseTemplates] = useState(false);
  const [selectedPhaseForSystem, setSelectedPhaseForSystem] = useState<string | null>(null);
  const [isReuseModalOpen, setIsReuseModalOpen] = useState(false);
  const [selectedPhaseForReuse, setSelectedPhaseForReuse] = useState<string | null>(null);
  const [showStatusLegend, setShowStatusLegend] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPhaseId && data.phases.length > 0) {
      setSelectedPhaseId(data.phases.sort((a, b) => a.order - b.order)[0].id);
    }
    if (data.phases.length === 0) {
      setSelectedPhaseId(null);
    }
  }, [data.phases, selectedPhaseId]);

  // Compute selectedPhase from selectedPhaseId
  const selectedPhase = selectedPhaseId ? data.phases.find(p => p.id === selectedPhaseId) : null;

  const updatePhase = (id: string, updates: Partial<Phase>) => {
    onChange({
      ...data,
      phases: data.phases.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  const removePhase = (id: string) => {
    onChange({
      ...data,
      phases: data.phases.filter((p) => p.id !== id),
      systems: data.systems.filter((s) => s.phaseId !== id),
    });
  };

  const addPhase = () => {
    const newOrder = data.phases.length > 0
      ? Math.max(...data.phases.map(p => p.order)) + 1
      : 1;

    const newPhase: Phase = {
      id: Date.now().toString(),
      name: `Phase ${newOrder}`,
      order: newOrder,
      scope: "in-scope",
      timeline: "",
      description: "",
    };

    onChange({
      ...data,
      phases: [...data.phases, newPhase],
    });

    // Select the newly created phase
    setSelectedPhaseId(newPhase.id);
  };

  const loadPhaseTemplates = () => {
    const newPhases = TOGAF_PHASE_TEMPLATES.map((template, index) => ({
      id: Date.now().toString() + index,
      order: data.phases.length + index + 1,
      ...template,
    }));
    onChange({ ...data, phases: [...data.phases, ...newPhases] });
    setShowPhaseTemplates(false);
  };

  // Systems
  const addSystem = (phaseId: string) => {
    const newSystem: ProposedSystem = {
      id: Date.now().toString(),
      name: "",
      vendor: "",
      modules: [],
      phaseId,
      isNew: true,
    };
    onChange({ ...data, systems: [...data.systems, newSystem] });
  };

  const updateSystem = (id: string, updates: Partial<ProposedSystem>) => {
    onChange({
      ...data,
      systems: data.systems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const removeSystem = (id: string) => {
    onChange({ ...data, systems: data.systems.filter((s) => s.id !== id) });
  };

  const loadSystemTemplate = (templateName: string, systems: any[], phaseId: string) => {
    const newSystems = systems.map((sys) => ({
      id: Date.now().toString() + Math.random(),
      phaseId,
      ...sys,
    }));
    onChange({ ...data, systems: [...data.systems, ...newSystems] });
    setShowSystemTemplates(false);
    setSelectedPhaseForSystem(null);
  };

  const reuseSystemFromAsIs = (asIsSystem: CurrentSystem, phaseId: string) => {
    const newSystem: ProposedSystem = {
      id: Date.now().toString(),
      name: asIsSystem.name,
      vendor: asIsSystem.vendor,
      modules: asIsSystem.modules,
      phaseId,
      isNew: false,
      reusedFromId: asIsSystem.id,
    };
    onChange({ ...data, systems: [...data.systems, newSystem] });
  };

  const systemsToKeep = currentSystems.filter((s) => s.status === "keep");
  const hasData = data.phases.length > 0 && data.systems.length > 0;

  return (
    <div className={styles.container}>
      {/* Info Banner */}
      <div className={styles.infoBanner}>
        <h4 className={styles.infoBannerTitle}>
          Proposed Solution (TO-BE Architecture + Migration Roadmap)
        </h4>
        <p className={styles.infoBannerText}>
          Design your <strong>future state</strong> - what systems you&apos;ll implement and when. Define phases, select new
          systems, and reuse systems marked as &quot;KEEP&quot; from your AS-IS architecture.
        </p>
      </div>

      {/* Phase Management */}
      <Section title="Implementation Phases" subtitle="Define your migration roadmap">
        <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowPhaseTemplates(!showPhaseTemplates)}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            <Calendar className="w-4 h-4" />
            Load Standard Phases
          </button>
          <button
            onClick={addPhase}
            className={`${styles.button} ${styles.buttonSecondary}`}
            style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
          >
            <Plus className="w-4 h-4" />
            Add Custom Phase
          </button>
        </div>

        {showPhaseTemplates && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f0f7ff",
              borderRadius: "8px",
              border: "1px solid #2563A5",
              marginBottom: "16px",
            }}
          >
            <h4 className={styles.sectionTitle}>
              Standard 4-Phase Migration Roadmap
            </h4>
            <p style={{ fontFamily: "var(--font-text)", fontSize: "13px", color: "#666", marginBottom: "16px" }}>
              TOGAF-aligned implementation phases for enterprise transformations
            </p>
            <button
              onClick={loadPhaseTemplates}
              className={`${styles.button} ${styles.buttonPrimary}`}
              style={{ padding: "12px 24px" }}
            >
              Load 4 Standard Phases
            </button>
          </div>
        )}

        <PhaseTimeline
          phases={data.phases}
          onAddPhase={addPhase}
          onUpdatePhase={updatePhase}
          onRemovePhase={removePhase}
          selectedPhaseId={selectedPhaseId}
          onSelectPhase={setSelectedPhaseId}
        />
      </Section>

      {/* Systems by Phase */}
      {selectedPhase && (
        <div className={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h3 className={styles.sectionTitle}>Details for: {selectedPhase.name}</h3>
            <div style={{ position: 'relative' }}>
              <HelpCircle
                className="w-5 h-5"
                style={{ color: '#999', cursor: 'pointer' }}
                onMouseEnter={() => setShowStatusLegend(true)}
                onMouseLeave={() => setShowStatusLegend(false)}
              />
              {showStatusLegend && <StatusLegendPopover />}
            </div>
          </div>
          
          <PhaseCard
            key={selectedPhase.id}
            phase={selectedPhase}
            phaseNumber={selectedPhase.order}
            onUpdate={(updates) => updatePhase(selectedPhase.id, updates)}
            onRemove={() => removePhase(selectedPhase.id)}
          />

          <div style={{ marginTop: '24px' }}>
             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h4 className={styles.sectionTitle} style={{fontSize: '18px'}}>Systems in {selectedPhase.name}</h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setSelectedPhaseForSystem(selectedPhase.id);
                      setShowSystemTemplates(true);
                    }}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    style={{ fontSize: "13px" }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Add New System
                  </button>
                  {systemsToKeep.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedPhaseForReuse(selectedPhase.id);
                        setIsReuseModalOpen(true);
                      }}
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      style={{ borderColor: "#4CAF50", color: "#4CAF50", fontSize: "13px" }}
                    >
                      <Package className="w-4 h-4" />
                      Reuse from AS-IS ({systemsToKeep.length})
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.systemsGrid}>
                {data.systems.filter(s => s.phaseId === selectedPhase.id).map((system) => (
                  <SystemCard
                    key={system.id}
                    system={system}
                    onUpdate={(updates) => updateSystem(system.id, updates)}
                    onRemove={() => removeSystem(system.id)}
                  />
                ))}
                {data.systems.filter(s => s.phaseId === selectedPhase.id).length === 0 && (
                  <div
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: "#999",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      border: "2px dashed #ddd",
                      borderRadius: "8px",
                    }}
                  >
                    No systems assigned to this phase yet.
                  </div>
                )}
              </div>
          </div>
        </div>
      )}

      {/* System Templates Modal */}
      {showSystemTemplates && selectedPhaseForSystem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowSystemTemplates(false);
            setSelectedPhaseForSystem(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "900px",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.sectionTitle} style={{ marginBottom: "24px" }}>
              Select Future System Template
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px",
              }}
            >
              {Object.entries(TOGAF_FUTURE_SYSTEMS_TEMPLATES).map(([templateName, systems]) => (
                <button
                  key={templateName}
                  onClick={() => loadSystemTemplate(templateName, systems, selectedPhaseForSystem)}
                  className={styles.templateButton}
                  style={{ padding: "20px" }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#000",
                      marginBottom: "8px",
                    }}
                  >
                    {templateName}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "13px",
                      color: "#666",
                    }}
                  >
                    {systems.length} systems
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <button
                onClick={() => {
                  addSystem(selectedPhaseForSystem);
                  setShowSystemTemplates(false);
                  setSelectedPhaseForSystem(null);
                }}
                className={`${styles.button} ${styles.buttonSecondary}`}
                style={{ marginRight: "12px" }}
              >
                Add Blank System
              </button>
              <button
                onClick={() => {
                  setShowSystemTemplates(false);
                  setSelectedPhaseForSystem(null);
                }}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ReuseSystemModal
        isOpen={isReuseModalOpen}
        onClose={() => setIsReuseModalOpen(false)}
        systemsToKeep={systemsToKeep}
        onReuse={(system) => {
          if (selectedPhaseForReuse) {
            reuseSystemFromAsIs(system, selectedPhaseForReuse);
          }
        }}
      />

      {/* TO-BE Integration & Architecture Diagram */}
      {data.systems.length > 0 && (
        <Section title="TO-BE Integration Architecture" subtitle="Visualize how future systems integrate with each other and existing systems">
          <TOBEArchitectureDiagram
            proposedSystems={data.systems}
            currentSystems={currentSystems}
            externalSystems={externalSystems}
            retainedExternalSystemIds={data.retainedExternalSystems}
            integrations={data.integrations}
            onUpdateIntegrations={(integrations) => onChange({ ...data, integrations })}
            onUpdateRetainedExternalSystems={(ids) => onChange({ ...data, retainedExternalSystems: ids })}
          />
        </Section>
      )}

      {/* Generate Button */}
      {hasData && (
        <div style={{ textAlign: "right", marginTop: "32px" }}>
          <button
            onClick={onGenerate}
            className={`${styles.button} ${styles.buttonPrimary}`}
            style={{ padding: "14px 32px", backgroundColor: "#9C27B0" }}
          >
            Generate TO-BE Diagram + Roadmap
          </button>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        {title}
      </h3>
      {subtitle && (
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            color: "#666",
            marginBottom: "20px",
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

function PhaseCard({
  phase,
  phaseNumber,
  onUpdate,
  onRemove,
}: {
  phase: Phase;
  phaseNumber: number;
  onUpdate: (updates: Partial<Phase>) => void;
  onRemove: () => void;
}) {
  const scopeColors = {
    "in-scope": { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32", icon: CheckCircle },
    future: { bg: "#FFF3E0", border: "#FF9800", text: "#E65100", icon: Clock },
  };

  const colors = scopeColors[phase.scope];
  const Icon = colors.icon;
  const scopeClass = phase.scope === "in-scope" ? styles.scopeInScope : styles.scopeFuture;

  return (
    <div
      className={styles.phaseCard}
      style={{
        border: `2px solid ${colors.border}`,
      }}
    >
      <button
        onClick={onRemove}
        className={styles.iconButton}
        style={{ position: "absolute", top: "12px", right: "12px" }}
        aria-label={`Remove phase ${phase.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: colors.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-text)",
            fontSize: "18px",
            fontWeight: 700,
            color: colors.text,
          }}
        >
          {phaseNumber}
        </div>
        <input
          type="text"
          value={phase.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Phase Name (e.g., Phase 1: Foundation)"
          className={styles.input}
          style={{
            flex: 1,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            borderBottom: `2px solid ${colors.border}`,
            borderRadius: 0,
            fontWeight: 600,
            fontSize: "16px",
          }}
        />
        <div className={`${styles.scopeBadge} ${scopeClass}`} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon className="w-4 h-4" />
          {phase.scope.toUpperCase()}
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
        <input
          type="text"
          value={phase.timeline || ""}
          onChange={(e) => onUpdate({ timeline: e.target.value })}
          placeholder="Timeline (e.g., Q1-Q2 2025)"
          className={styles.input}
          style={{ flex: 1 }}
        />
        <select
          value={phase.scope}
          onChange={(e) => onUpdate({ scope: e.target.value as "in-scope" | "future" })}
          className={styles.select}
        >
          <option value="in-scope">In Scope</option>
          <option value="future">Future Scope</option>
        </select>
      </div>

      <textarea
        value={phase.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Phase description and objectives"
        className={styles.textarea}
      />
    </div>
  );
}

function SystemCard({
  system,
  onUpdate,
  onRemove,
}: {
  system: ProposedSystem;
  onUpdate: (updates: Partial<ProposedSystem>) => void;
  onRemove: () => void;
}) {
  const typeColors = {
    new: { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32", label: "NEW" },
    reused: { bg: "#E3F2FD", border: "#2196F3", text: "#1565C0", label: "REUSED" },
  };

  const colors = typeColors[system.isNew ? "new" : "reused"];
  const indicatorClass = system.isNew ? styles.newIndicator : styles.reusedIndicator;

  return (
    <div
      className={styles.systemCard}
      style={{
        border: `2px solid ${colors.border}`,
      }}
    >
      <button
        onClick={onRemove}
        className={styles.iconButton}
        style={{ position: "absolute", top: "10px", right: "10px" }}
        aria-label={`Remove system ${system.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Badge */}
      <div className={indicatorClass} style={{ position: "absolute", top: "10px", left: "10px" }}>
        {colors.label}
      </div>

      <input
        type="text"
        value={system.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="System Name (e.g., SAP S/4HANA)"
        disabled={!system.isNew}
        className={styles.input}
        style={{
          padding: "8px 0",
          borderTop: "none",
borderLeft: "none",
          borderRight: "none",
          borderBottom: "2px solid #e0e0e0",
          borderRadius: 0,
          fontWeight: 600,
          fontSize: "16px",
          marginBottom: "12px",
          marginTop: "28px",
          backgroundColor: "transparent",
          opacity: system.isNew ? 1 : 0.7,
        }}
      />
      <input
        type="text"
        value={system.vendor || ""}
        onChange={(e) => onUpdate({ vendor: e.target.value })}
        placeholder="Vendor"
        disabled={!system.isNew}
        className={styles.input}
        style={{
          fontSize: "13px",
          marginBottom: "8px",
          opacity: system.isNew ? 1 : 0.7,
        }}
      />
      <input
        type="text"
        value={system.modules.join(", ")}
        onChange={(e) => onUpdate({ modules: e.target.value.split(",").map((m) => m.trim()).filter((m) => m) })}
        placeholder="Modules (comma-separated)"
        disabled={!system.isNew}
        className={styles.input}
        style={{
          fontSize: "13px",
          opacity: system.isNew ? 1 : 0.7,
        }}
      />
      {!system.isNew && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px",
            backgroundColor: "#f0f7ff",
            borderRadius: "4px",
            fontFamily: "var(--font-text)",
            fontSize: "12px",
            color: "#1565C0",
          }}
        >
          Reused from Current Landscape (AS-IS)
        </div>
      )}
    </div>
  );
}

/**
 * TO-BE Architecture Diagram Component
 * Shows all systems (new + reused) with their integrations
 */
function TOBEArchitectureDiagram({
  proposedSystems,
  currentSystems,
  externalSystems,
  retainedExternalSystemIds,
  integrations,
  onUpdateIntegrations,
  onUpdateRetainedExternalSystems,
}: {
  proposedSystems: ProposedSystem[];
  currentSystems: CurrentSystem[];
  externalSystems: ExternalSystem[];
  retainedExternalSystemIds: string[];
  integrations: ProposedIntegration[];
  onUpdateIntegrations: (integrations: ProposedIntegration[]) => void;
  onUpdateRetainedExternalSystems: (ids: string[]) => void;
}) {
  const [selectedSourceSystem, setSelectedSourceSystem] = useState<string | null>(null);

  // Get all systems that should appear in TO-BE diagram
  const newSystems = proposedSystems.filter(s => s.isNew);
  const reusedSystems = proposedSystems.filter(s => !s.isNew);
  const retainedExternalSystems = externalSystems.filter(es => retainedExternalSystemIds.includes(es.id));

  const addIntegration = (sourceId: string, targetId: string) => {
    const newIntegration: ProposedIntegration = {
      id: Date.now().toString(),
      name: "Integration",
      sourceSystemId: sourceId,
      targetSystemId: targetId,
      method: "API",
      phaseId: proposedSystems.find(s => s.id === sourceId)?.phaseId || "",
    };
    onUpdateIntegrations([...integrations, newIntegration]);
    setSelectedSourceSystem(null);
  };

  const removeIntegration = (id: string) => {
    onUpdateIntegrations(integrations.filter(i => i.id !== id));
  };

  const toggleExternalSystem = (externalId: string) => {
    if (retainedExternalSystemIds.includes(externalId)) {
      onUpdateRetainedExternalSystems(retainedExternalSystemIds.filter(id => id !== externalId));
    } else {
      onUpdateRetainedExternalSystems([...retainedExternalSystemIds, externalId]);
    }
  };

  return (
    <div>
      {/* Instructions */}
      <div style={{
        padding: "16px",
        backgroundColor: "#f0f7ff",
        borderRadius: "8px",
        marginBottom: "24px",
        fontFamily: "var(--font-text)",
        fontSize: "14px",
        color: "#666",
      }}>
        <strong style={{ color: "#1565C0" }}>How to build your TO-BE architecture:</strong>
        <ol style={{ marginTop: "8px", paddingLeft: "20px", margin: 0 }}>
          <li>Review all systems (NEW and REUSED from AS-IS)</li>
          <li>Select external systems to retain in TO-BE</li>
          <li>Click a system to start drawing an integration</li>
          <li>Click another system to complete the integration</li>
        </ol>
      </div>

      {/* External Systems Selection */}
      {externalSystems.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h4 style={{
            fontFamily: "var(--font-text)",
            fontSize: "16px",
            fontWeight: 600,
            color: "#000",
            marginBottom: "12px",
          }}>
            External Systems (select which to retain in TO-BE)
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {externalSystems.map(es => (
              <button
                key={es.id}
                onClick={() => toggleExternalSystem(es.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: retainedExternalSystemIds.includes(es.id)
                    ? "2px solid #FFC107"
                    : "1px solid #ddd",
                  backgroundColor: retainedExternalSystemIds.includes(es.id)
                    ? "#FFF9C4"
                    : "#fff",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: retainedExternalSystemIds.includes(es.id) ? 600 : 400,
                  color: "#000",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {retainedExternalSystemIds.includes(es.id) ? "✓ " : ""}{es.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Architecture Diagram */}
      <div style={{
        backgroundColor: "#fafafa",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        padding: "32px",
        minHeight: "400px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
          {/* NEW Systems */}
          <div>
            <h4 style={{
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#4CAF50",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              NEW Systems
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {newSystems.map(system => (
                <SystemNode
                  key={system.id}
                  id={system.id}
                  name={system.name}
                  type="new"
                  isSelected={selectedSourceSystem === system.id}
                  onClick={() => {
                    if (selectedSourceSystem && selectedSourceSystem !== system.id) {
                      addIntegration(selectedSourceSystem, system.id);
                    } else {
                      setSelectedSourceSystem(system.id);
                    }
                  }}
                />
              ))}
              {newSystems.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", color: "#999", fontSize: "13px" }}>
                  No new systems yet
                </div>
              )}
            </div>
          </div>

          {/* REUSED Systems */}
          <div>
            <h4 style={{
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#2196F3",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              REUSED from AS-IS
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {reusedSystems.map(system => (
                <SystemNode
                  key={system.id}
                  id={system.id}
                  name={system.name}
                  type="reused"
                  isSelected={selectedSourceSystem === system.id}
                  onClick={() => {
                    if (selectedSourceSystem && selectedSourceSystem !== system.id) {
                      addIntegration(selectedSourceSystem, system.id);
                    } else {
                      setSelectedSourceSystem(system.id);
                    }
                  }}
                />
              ))}
              {reusedSystems.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", color: "#999", fontSize: "13px" }}>
                  No reused systems
                </div>
              )}
            </div>
          </div>

          {/* EXTERNAL Systems */}
          <div>
            <h4 style={{
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#FFC107",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              EXTERNAL Systems
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {retainedExternalSystems.map(system => (
                <SystemNode
                  key={system.id}
                  id={system.id}
                  name={system.name}
                  type="external"
                  isSelected={selectedSourceSystem === system.id}
                  onClick={() => {
                    if (selectedSourceSystem && selectedSourceSystem !== system.id) {
                      addIntegration(selectedSourceSystem, system.id);
                    } else {
                      setSelectedSourceSystem(system.id);
                    }
                  }}
                />
              ))}
              {retainedExternalSystems.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", color: "#999", fontSize: "13px" }}>
                  No external systems selected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selection Helper */}
        {selectedSourceSystem && (
          <div style={{
            marginTop: "24px",
            padding: "12px",
            backgroundColor: "#E3F2FD",
            border: "1px solid #2196F3",
            borderRadius: "8px",
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            color: "#1565C0",
            textAlign: "center",
          }}>
            <strong>Integration Mode:</strong> Click another system to create integration, or click the same system to cancel
          </div>
        )}
      </div>

      {/* Integrations List */}
      {integrations.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h4 style={{
            fontFamily: "var(--font-text)",
            fontSize: "16px",
            fontWeight: 600,
            color: "#000",
            marginBottom: "12px",
          }}>
            Integrations ({integrations.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {integrations.map(integration => {
              const sourceSystem = [...proposedSystems, ...retainedExternalSystems].find(s => s.id === integration.sourceSystemId);
              const targetSystem = [...proposedSystems, ...retainedExternalSystems].find(s => s.id === integration.targetSystemId);

              return (
                <div
                  key={integration.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-text)", fontSize: "14px", color: "#000" }}>
                    <strong>{sourceSystem?.name}</strong> → <strong>{targetSystem?.name}</strong>
                    <span style={{ marginLeft: "12px", color: "#666" }}>({integration.method})</span>
                  </div>
                  <button
                    onClick={() => removeIntegration(integration.id)}
                    style={{
                      padding: "4px 8px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#F44336",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * System Node Component
 */
function SystemNode({
  id,
  name,
  type,
  isSelected,
  onClick,
}: {
  id: string;
  name: string;
  type: "new" | "reused" | "external";
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = {
    new: { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32" },
    reused: { bg: "#E3F2FD", border: "#2196F3", text: "#1565C0" },
    external: { bg: "#FFF9C4", border: "#FFC107", text: "#F57F17" },
  };

  const color = colors[type];

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px",
        backgroundColor: isSelected ? color.border : color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "var(--font-text)",
        fontSize: "13px",
        fontWeight: 600,
        color: isSelected ? "#fff" : color.text,
      }}
    >
      {name}
    </div>
  );
}
