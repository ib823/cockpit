/**
 * Proposed Solution Tab - TO-BE Architecture
 * TOGAF Phase E/F - Target State & Migration Planning
 *
 * Rebuilt on the design system: Card/Banner/Button/Input/Select/Textarea/
 * StatusPill/Modal/EmptyState plus the shared tabs.module.css. All state
 * handling and the onChange data shapes are unchanged.
 */

"use client";

// Explicit default import: tsconfig uses `jsx: "preserve"` with no automatic
// runtime, so the compiled JSX calls React.createElement by name. Next's own
// build injects it, which is why this only ever surfaced under the test
// transform — as `ReferenceError: React is not defined` on render.
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, CheckCircle, Clock, Sparkles, Package, HelpCircle } from "lucide-react";
import type { ProposedSolutionData, Phase, ProposedSystem, ProposedIntegration, CurrentSystem, ExternalSystem } from "../types";
import { ReuseSystemModal } from "./ReuseSystemModal";
import { PhaseTimeline } from "./PhaseTimeline";
import { Card } from "@/components/ds/AppShell";
import { Banner } from "@/components/ds/Banner";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Select } from "@/components/ds/Select";
import { Textarea } from "@/components/ds/Textarea";
import { StatusPill } from "@/components/ds/Display";
import { EmptyState } from "@/components/ds/Feedback";
import { Modal } from "@/components/ds/Modal";
import clsx from "clsx";
import styles from "./tabs.module.css";

interface ProposedSolutionTabProps {
  data: ProposedSolutionData;
  currentSystems: CurrentSystem[];
  externalSystems: ExternalSystem[];
  onChange: (data: ProposedSolutionData) => void;
  onGenerate: () => void;
}

// Status Legend Popover Component
const StatusLegendPopover = () => (
  <div className={styles.legendPop}>
    <div className={styles.legendTitle}>Status Legend</div>
    <div>
      <div className={styles.legendRow}>
        <CheckCircle size={16} className={styles.legendGlyphSuccess} aria-hidden="true" />
        <span>In Scope - Current Phase</span>
      </div>
      <div className={styles.legendRow}>
        <Clock size={16} className={styles.legendGlyphWarning} aria-hidden="true" />
        <span>Future Phase</span>
      </div>
    </div>
  </div>
);

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

  const loadSystemTemplate = (templateName: string, systems: Omit<ProposedSystem, "id" | "phaseId">[], phaseId: string) => {
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

  const closeSystemTemplates = () => {
    setShowSystemTemplates(false);
    setSelectedPhaseForSystem(null);
  };

  const systemsToKeep = currentSystems.filter((s) => s.status === "keep");
  const hasData = data.phases.length > 0 && data.systems.length > 0;

  return (
    <div className={styles.stack}>
      {/* Info Banner */}
      <Banner tone="info" title="Proposed Solution (TO-BE Architecture + Migration Roadmap)">
        Design your <strong>future state</strong> - what systems you&apos;ll implement and when. Define phases, select new
        systems, and reuse systems marked as &quot;KEEP&quot; from your AS-IS architecture.
      </Banner>

      {/* Phase Management */}
      <Card label="Implementation phases">
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Implementation Phases</h3>
          <p className={styles.sectionSubtitle}>Define your migration roadmap</p>
        </div>

        <div className={styles.stack}>
          <div className={styles.buttonRow}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Calendar size={14} />}
              onClick={() => setShowPhaseTemplates(!showPhaseTemplates)}
              aria-expanded={showPhaseTemplates}
            >
              Load Standard Phases
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={addPhase}
            >
              Add Custom Phase
            </Button>
          </div>

          {showPhaseTemplates && (
            <div className={styles.templatePanel}>
              <h4 className={styles.templatePanelTitle}>Standard 4-Phase Migration Roadmap</h4>
              <p className={styles.sectionSubtitle}>TOGAF-aligned implementation phases for enterprise transformations</p>
              <div className={styles.buttonRow} style={{ marginTop: "var(--ds-space-3)" }}>
                <Button variant="primary" size="sm" onClick={loadPhaseTemplates}>
                  Load 4 Standard Phases
                </Button>
              </div>
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
        </div>
      </Card>

      {/* Systems by Phase */}
      {selectedPhase && (
        <Card label={`Details for ${selectedPhase.name}`}>
          <div className={styles.stack}>
            <div className={styles.buttonRow}>
              <h3 className={styles.sectionTitle}>Details for: {selectedPhase.name}</h3>
              <div className={styles.legendWrap}>
                <HelpCircle
                  size={18}
                  className={styles.legendTrigger}
                  onMouseEnter={() => setShowStatusLegend(true)}
                  onMouseLeave={() => setShowStatusLegend(false)}
                />
                {showStatusLegend && <StatusLegendPopover />}
              </div>
            </div>

            <PhaseCard
              phase={selectedPhase}
              phaseNumber={selectedPhase.order}
              onUpdate={(updates) => updatePhase(selectedPhase.id, updates)}
              onRemove={() => removePhase(selectedPhase.id)}
            />

            <div className={styles.rowBetween}>
              <h4 className={styles.subHead}>Systems in {selectedPhase.name}</h4>
              <div className={styles.buttonRow}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Sparkles size={14} />}
                  onClick={() => {
                    setSelectedPhaseForSystem(selectedPhase.id);
                    setShowSystemTemplates(true);
                  }}
                >
                  Add New System
                </Button>
                {systemsToKeep.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Package size={14} />}
                    onClick={() => {
                      setSelectedPhaseForReuse(selectedPhase.id);
                      setIsReuseModalOpen(true);
                    }}
                  >
                    Reuse from AS-IS ({systemsToKeep.length})
                  </Button>
                )}
              </div>
            </div>

            <div className={styles.cardGrid}>
              {data.systems.filter(s => s.phaseId === selectedPhase.id).map((system) => (
                <SystemCard
                  key={system.id}
                  system={system}
                  onUpdate={(updates) => updateSystem(system.id, updates)}
                  onRemove={() => removeSystem(system.id)}
                />
              ))}
              {data.systems.filter(s => s.phaseId === selectedPhase.id).length === 0 && (
                <div className={styles.emptySpan}>
                  <EmptyState
                    kind="first-run"
                    title="No systems in this phase"
                    body="No systems assigned to this phase yet."
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* System Templates Modal */}
      <Modal
        open={showSystemTemplates && Boolean(selectedPhaseForSystem)}
        onClose={closeSystemTemplates}
        title="Select Future System Template"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (selectedPhaseForSystem) addSystem(selectedPhaseForSystem);
                closeSystemTemplates();
              }}
            >
              Add Blank System
            </Button>
            <Button variant="primary" onClick={closeSystemTemplates}>
              Close
            </Button>
          </>
        }
      >
        <div className={styles.templateGrid}>
          {Object.entries(TOGAF_FUTURE_SYSTEMS_TEMPLATES).map(([templateName, systems]) => (
            <button
              key={templateName}
              type="button"
              onClick={() => {
                if (selectedPhaseForSystem) {
                  loadSystemTemplate(templateName, systems, selectedPhaseForSystem);
                }
              }}
              className={styles.templateBtn}
            >
              <span className={styles.templateBtnName}>{templateName}</span>
              <span className={styles.templateBtnCount}>{systems.length} systems</span>
            </button>
          ))}
        </div>
      </Modal>

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
        <Card label="TO-BE integration architecture">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>TO-BE Integration Architecture</h3>
            <p className={styles.sectionSubtitle}>Visualize how future systems integrate with each other and existing systems</p>
          </div>
          <TOBEArchitectureDiagram
            proposedSystems={data.systems}
            currentSystems={currentSystems}
            externalSystems={externalSystems}
            retainedExternalSystemIds={data.retainedExternalSystems}
            integrations={data.integrations}
            onUpdateIntegrations={(integrations) => onChange({ ...data, integrations })}
            onUpdateRetainedExternalSystems={(ids) => onChange({ ...data, retainedExternalSystems: ids })}
          />
        </Card>
      )}

      {/* Generate Button */}
      {hasData && (
        <div className={styles.generateRow}>
          <Button variant="primary" size="lg" onClick={onGenerate}>
            Generate TO-BE Diagram + Roadmap
          </Button>
        </div>
      )}
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
  return (
    <div className={clsx(
      styles.phaseCard,
      phase.scope === "in-scope" ? styles.phaseInScope : styles.phaseFuture
    )}>
      <div className={styles.phaseHead}>
        <span className={styles.phaseNumber} aria-hidden="true">{phaseNumber}</span>
        <Input
          aria-label="Phase name"
          value={phase.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Phase Name (e.g., Phase 1: Foundation)"
          className={styles.grow}
        />
        <StatusPill tone={phase.scope === "in-scope" ? "success" : "warning"}>
          {phase.scope}
        </StatusPill>
        <Button
          iconOnly
          label={`Remove phase ${phase.name || 'untitled'}`}
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={onRemove}
        />
      </div>

      <div className={styles.phaseFieldGrid}>
        <Input
          label="Timeline"
          size="sm"
          value={phase.timeline || ""}
          onChange={(e) => onUpdate({ timeline: e.target.value })}
          placeholder="e.g., Q1-Q2 2025"
        />
        <Select
          label="Scope"
          size="sm"
          value={phase.scope}
          onChange={(e) => onUpdate({ scope: e.target.value as "in-scope" | "future" })}
        >
          <option value="in-scope">In Scope</option>
          <option value="future">Future Scope</option>
        </Select>
      </div>

      <Textarea
        label="Description"
        value={phase.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Phase description and objectives"
        rows={3}
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
  return (
    <div className={clsx(
      styles.itemCard,
      system.isNew ? styles.itemCardSuccess : styles.itemCardInfo
    )}>
      <div className={styles.itemCardHead}>
        <StatusPill tone={system.isNew ? "success" : "info"}>
          {system.isNew ? "NEW" : "REUSED"}
        </StatusPill>
        <Button
          iconOnly
          label={`Remove system ${system.name || 'untitled'}`}
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={onRemove}
        />
      </div>

      <Input
        aria-label="Proposed system name"
        size="sm"
        value={system.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="System Name (e.g., SAP S/4HANA)"
        disabled={!system.isNew}
      />
      <Input
        aria-label="Proposed system vendor"
        size="sm"
        value={system.vendor || ""}
        onChange={(e) => onUpdate({ vendor: e.target.value })}
        placeholder="Vendor"
        disabled={!system.isNew}
      />
      <Input
        aria-label="Proposed system modules"
        size="sm"
        value={system.modules.join(", ")}
        onChange={(e) => onUpdate({ modules: e.target.value.split(",").map((m) => m.trim()).filter((m) => m) })}
        placeholder="Modules (comma-separated)"
        disabled={!system.isNew}
      />
      {!system.isNew && (
        <div className={styles.reusedNote}>
          Reused from AS-IS Landscape
        </div>
      )}
    </div>
  );
}

function TOBEArchitectureDiagram({
  proposedSystems,
  currentSystems: _currentSystems,
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
    <div className={styles.stack}>
      <Banner tone="info" title="How to build your TO-BE architecture:">
        <ol className={styles.howToList}>
          <li>Review all systems (NEW and REUSED from AS-IS)</li>
          <li>Select external systems to retain in TO-BE</li>
          <li>Click a system to start drawing an integration</li>
          <li>Click another system to complete the integration</li>
        </ol>
      </Banner>

      {externalSystems.length > 0 && (
        <div>
          <h4 className={styles.subHead} style={{ marginBottom: "var(--ds-space-3)" }}>
            External Systems (Retain in TO-BE)
          </h4>
          <div className={styles.pillRow}>
            {externalSystems.map(es => (
              <button
                key={es.id}
                type="button"
                onClick={() => toggleExternalSystem(es.id)}
                aria-pressed={retainedExternalSystemIds.includes(es.id)}
                className={clsx(
                  styles.extToggle,
                  retainedExternalSystemIds.includes(es.id) && styles.extToggleActive
                )}
              >
                {retainedExternalSystemIds.includes(es.id) ? "✓ " : ""}{es.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.board}>
        <div className={styles.boardCols}>
          {/* NEW Systems */}
          <div className={styles.boardCol}>
            <h4 className={clsx(styles.boardColTitle, styles.boardColTitleSuccess)}>NEW Systems</h4>
            {newSystems.map(system => (
              <SystemNode
                key={system.id}
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
            {newSystems.length === 0 && <p className={styles.boardColEmpty}>No new systems</p>}
          </div>

          {/* REUSED Systems */}
          <div className={styles.boardCol}>
            <h4 className={clsx(styles.boardColTitle, styles.boardColTitleInfo)}>REUSED from AS-IS</h4>
            {reusedSystems.map(system => (
              <SystemNode
                key={system.id}
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
            {reusedSystems.length === 0 && <p className={styles.boardColEmpty}>No reused systems</p>}
          </div>

          {/* EXTERNAL Systems */}
          <div className={styles.boardCol}>
            <h4 className={clsx(styles.boardColTitle, styles.boardColTitleWarning)}>EXTERNAL Systems</h4>
            {retainedExternalSystems.map(system => (
              <SystemNode
                key={system.id}
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
            {retainedExternalSystems.length === 0 && <p className={styles.boardColEmpty}>No external systems</p>}
          </div>
        </div>

        {selectedSourceSystem && (
          <div className={styles.integrationHint} role="status">
            <strong>Integration Mode:</strong> Click target system or click source again to cancel
          </div>
        )}
      </div>

      {integrations.length > 0 && (
        <div className={styles.stack}>
          <h4 className={styles.subHead}>Integrations ({integrations.length})</h4>
          <div className={styles.integrationGrid}>
            {integrations.map(integration => {
              const source = [...proposedSystems, ...retainedExternalSystems].find(s => s.id === integration.sourceSystemId);
              const target = [...proposedSystems, ...retainedExternalSystems].find(s => s.id === integration.targetSystemId);

              return (
                <div key={integration.id} className={styles.integrationRow}>
                  <div className={styles.integrationText}>
                    <strong>{source?.name}</strong>
                    <span className={styles.integrationArrow} aria-hidden="true">→</span>
                    <strong>{target?.name}</strong>
                    <span className={styles.integrationMethod}>{integration.method}</span>
                  </div>
                  <Button
                    iconOnly
                    label={`Remove integration ${source?.name || ''} to ${target?.name || ''}`}
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => removeIntegration(integration.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SystemNode({
  name,
  type,
  isSelected,
  onClick,
}: {
  name: string;
  type: "new" | "reused" | "external";
  isSelected: boolean;
  onClick: () => void;
}) {
  const nodeStyles = {
    new: isSelected ? styles.nodeNewSelected : styles.nodeNew,
    reused: isSelected ? styles.nodeReusedSelected : styles.nodeReused,
    external: isSelected ? styles.nodeExternalSelected : styles.nodeExternal,
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={clsx(styles.node, nodeStyles[type])}
    >
      {name}
    </div>
  );
}
