/**
 * Proposed Solution Tab - TO-BE Architecture
 * TOGAF Phase E/F - Target State & Migration Planning
 */

"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, CheckCircle, Clock, Sparkles, Package, HelpCircle } from "lucide-react";
import type { ProposedSolutionData, Phase, ProposedSystem, ProposedIntegration, CurrentSystem, ExternalSystem } from "../types";
import { ReuseSystemModal } from "./ReuseSystemModal";
import { PhaseTimeline } from "./PhaseTimeline";
import clsx from "clsx";

interface ProposedSolutionTabProps {
  data: ProposedSolutionData;
  currentSystems: CurrentSystem[];
  externalSystems: ExternalSystem[];
  onChange: (data: ProposedSolutionData) => void;
  onGenerate: () => void;
}

// Status Legend Popover Component
const StatusLegendPopover = () => (
  <div className="absolute top-full left-0 bg-primary border border-strong rounded-lg p-3 shadow-lg z-50 min-w-[200px] mt-1 animate-fade-in">
    <div className="body-semibold text-xs mb-2">Status Legend</div>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green" />
        <span className="detail">In Scope - Current Phase</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-orange" />
        <span className="detail">Future Phase</span>
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

  const systemsToKeep = currentSystems.filter((s) => s.status === "keep");
  const hasData = data.phases.length > 0 && data.systems.length > 0;

  return (
    <div className="space-y-10">
      {/* Info Banner */}
      <div className="p-6 bg-blue-light border border-blue/20 rounded-xl">
        <h4 className="body-semibold text-blue mb-2">
          Proposed Solution (TO-BE Architecture + Migration Roadmap)
        </h4>
        <p className="body text-sm text-secondary">
          Design your <strong>future state</strong> - what systems you&apos;ll implement and when. Define phases, select new
          systems, and reuse systems marked as &quot;KEEP&quot; from your AS-IS architecture.
        </p>
      </div>

      {/* Phase Management */}
      <Section title="Implementation Phases" subtitle="Define your migration roadmap">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowPhaseTemplates(!showPhaseTemplates)}
            className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-blue text-blue rounded-md body-semibold hover:bg-blue-light transition-default cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Load Standard Phases
          </button>
          <button
            onClick={addPhase}
            className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-green text-green rounded-md body-semibold hover:bg-green-light transition-default cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Custom Phase
          </button>
        </div>

        {showPhaseTemplates && (
          <div className="p-6 bg-blue-light/30 rounded-xl border border-blue/20 mb-6 animate-fade-in">
            <h4 className="body-semibold text-primary mb-1">Standard 4-Phase Migration Roadmap</h4>
            <p className="detail text-secondary mb-4">TOGAF-aligned implementation phases for enterprise transformations</p>
            <button
              onClick={loadPhaseTemplates}
              className="py-2.5 px-6 bg-blue text-white rounded-md body-semibold hover:bg-blue-dark transition-default cursor-pointer"
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
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="display-small">Details for: {selectedPhase.name}</h3>
            <div className="relative">
              <HelpCircle
                className="w-5 h-5 text-secondary cursor-help"
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

          <div className="pt-4 space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="body-semibold text-lg text-primary">Systems in {selectedPhase.name}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPhaseForSystem(selectedPhase.id);
                      setShowSystemTemplates(true);
                    }}
                    className="inline-flex items-center gap-2 py-1.5 px-3 bg-primary border border-subtle rounded-md body text-xs font-semibold hover:bg-secondary transition-default cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue" />
                    Add New System
                  </button>
                  {systemsToKeep.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedPhaseForReuse(selectedPhase.id);
                        setIsReuseModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 py-1.5 px-3 bg-primary border border-green/30 text-green rounded-md body text-xs font-semibold hover:bg-green-light transition-default cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Reuse from AS-IS ({systemsToKeep.length})
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.systems.filter(s => s.phaseId === selectedPhase.id).map((system) => (
                  <SystemCard
                    key={system.id}
                    system={system}
                    onUpdate={(updates) => updateSystem(system.id, updates)}
                    onRemove={() => removeSystem(system.id)}
                  />
                ))}
                {data.systems.filter(s => s.phaseId === selectedPhase.id).length === 0 && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-subtle rounded-xl bg-secondary/20">
                    <p className="body text-secondary">No systems assigned to this phase yet.</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}

      {/* System Templates Modal - Keep fixed for now as it's a major UI element, but tokenized */}
      {showSystemTemplates && selectedPhaseForSystem && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[1060]">
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
            setShowSystemTemplates(false);
            setSelectedPhaseForSystem(null);
          }} />
          <div className="relative w-full max-w-4xl max-h-[80vh] bg-primary border border-strong rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in">
            <div className="p-6 border-b border-subtle flex justify-between items-center">
              <h3 className="display-small">Select Future System Template</h3>
              <button onClick={() => setShowSystemTemplates(false)} className="p-2 hover:bg-secondary rounded-full transition-default">
                <Trash2 className="w-5 h-5 text-secondary" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-secondary/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(TOGAF_FUTURE_SYSTEMS_TEMPLATES).map(([templateName, systems]) => (
                  <button
                    key={templateName}
                    onClick={() => loadSystemTemplate(templateName, systems, selectedPhaseForSystem)}
                    className="flex flex-col p-5 text-left bg-primary border border-subtle rounded-xl hover:border-blue hover:shadow-md transition-default cursor-pointer group"
                  >
                    <div className="body-semibold mb-1 group-hover:text-blue">{templateName}</div>
                    <div className="detail text-secondary">{systems.length} systems</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-subtle flex justify-end gap-3 bg-primary">
              <button
                onClick={() => {
                  addSystem(selectedPhaseForSystem);
                  setShowSystemTemplates(false);
                  setSelectedPhaseForSystem(null);
                }}
                className="py-2 px-5 bg-primary border border-strong rounded-md body-semibold text-sm hover:bg-secondary transition-default cursor-pointer"
              >
                Add Blank System
              </button>
              <button
                onClick={() => {
                  setShowSystemTemplates(false);
                  setSelectedPhaseForSystem(null);
                }}
                className="py-2 px-5 bg-blue text-white rounded-md body-semibold text-sm hover:bg-blue-dark transition-default cursor-pointer"
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
        <div className="flex justify-end pt-8 border-t border-subtle">
          <button
            onClick={onGenerate}
            className="py-3.5 px-10 bg-purple-600 color-white rounded-xl display-small font-bold shadow-lg hover:bg-purple-700 hover:scale-[1.02] active:scale-[0.98] transition-default cursor-pointer"
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
    <div>
      <h3 className="display-small mb-1">{title}</h3>
      {subtitle && <p className="detail text-secondary mb-6">{subtitle}</p>}
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
    "in-scope": "border-green bg-green-light/10 text-green",
    future: "border-orange bg-orange-light/10 text-orange",
  };

  const Icon = phase.scope === "in-scope" ? CheckCircle : Clock;

  return (
    <div className={clsx("relative p-6 border-2 rounded-2xl shadow-sm transition-default", scopeColors[phase.scope])}>
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-default"
        aria-label={`Remove phase ${phase.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-current text-white body-semibold text-lg ring-4 ring-current/10">
          {phaseNumber}
        </div>
        <input
          type="text"
          value={phase.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Phase Name (e.g., Phase 1: Foundation)"
          className="flex-1 pb-2 border-b-2 border-current/20 bg-transparent body-semibold text-lg outline-none focus:border-current transition-default"
        />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-current/10 text-[10px] font-bold uppercase tracking-wider">
          <Icon className="w-3.5 h-3.5" />
          {phase.scope}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <label className="detail font-semibold block ml-1 uppercase tracking-wider opacity-70">Timeline</label>
          <input
            type="text"
            value={phase.timeline || ""}
            onChange={(e) => onUpdate({ timeline: e.target.value })}
            placeholder="e.g., Q1-Q2 2025"
            className="w-full p-2.5 rounded-lg border border-current/20 bg-white/50 body text-sm outline-none focus:border-current transition-default"
          />
        </div>
        <div className="space-y-1">
          <label className="detail font-semibold block ml-1 uppercase tracking-wider opacity-70">Scope</label>
          <select
            value={phase.scope}
            onChange={(e) => onUpdate({ scope: e.target.value as "in-scope" | "future" })}
            className="w-full p-2.5 rounded-lg border border-current/20 bg-white/50 body text-sm outline-none focus:border-current transition-default cursor-pointer"
          >
            <option value="in-scope">In Scope</option>
            <option value="future">Future Scope</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="detail font-semibold block ml-1 uppercase tracking-wider opacity-70">Description</label>
        <textarea
          value={phase.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Phase description and objectives"
          className="w-full min-h-[80px] p-2.5 rounded-lg border border-current/20 bg-white/50 body text-sm outline-none focus:border-current transition-default resize-none"
        />
      </div>
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
  const typeColors = system.isNew 
    ? "border-green bg-green-light/10 text-green" 
    : "border-blue bg-blue-light/10 text-blue";

  return (
    <div className={clsx("relative p-6 border-2 rounded-xl shadow-sm transition-default group", typeColors)}>
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/5 transition-default"
        aria-label={`Remove system ${system.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="absolute top-4 left-6 px-2 py-0.5 rounded bg-current text-white text-[9px] font-bold tracking-widest uppercase shadow-sm">
        {system.isNew ? "NEW" : "REUSED"}
      </div>

      <div className="mt-6 space-y-4">
        <input
          type="text"
          value={system.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="System Name (e.g., SAP S/4HANA)"
          disabled={!system.isNew}
          className="w-full pb-2 border-b-2 border-current/20 bg-transparent body-semibold text-lg outline-none focus:border-current transition-default disabled:opacity-70"
        />
        <input
          type="text"
          value={system.vendor || ""}
          onChange={(e) => onUpdate({ vendor: e.target.value })}
          placeholder="Vendor"
          disabled={!system.isNew}
          className="w-full p-2 rounded-md border border-current/20 bg-white/50 body text-xs outline-none focus:border-current transition-default disabled:opacity-70"
        />
        <input
          type="text"
          value={system.modules.join(", ")}
          onChange={(e) => onUpdate({ modules: e.target.value.split(",").map((m) => m.trim()).filter((m) => m) })}
          placeholder="Modules (comma-separated)"
          disabled={!system.isNew}
          className="w-full p-2 rounded-md border border-current/20 bg-white/50 body text-xs outline-none focus:border-current transition-default disabled:opacity-70"
        />
        {!system.isNew && (
          <div className="p-2 rounded bg-blue text-white body-semibold text-[10px] text-center tracking-tight">
            Reused from AS-IS Landscape
          </div>
        )}
      </div>
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
    <div className="space-y-8 animate-fade-in">
      <div className="p-4 bg-blue-light border border-blue/20 rounded-xl">
        <strong className="body-semibold text-blue text-sm block mb-2">How to build your TO-BE architecture:</strong>
        <ol className="list-decimal list-inside space-y-1 detail text-secondary">
          <li>Review all systems (NEW and REUSED from AS-IS)</li>
          <li>Select external systems to retain in TO-BE</li>
          <li>Click a system to start drawing an integration</li>
          <li>Click another system to complete the integration</li>
        </ol>
      </div>

      {externalSystems.length > 0 && (
        <div>
          <h4 className="body-semibold text-primary mb-4">External Systems (Retain in TO-BE)</h4>
          <div className="flex flex-wrap gap-2">
            {externalSystems.map(es => (
              <button
                key={es.id}
                onClick={() => toggleExternalSystem(es.id)}
                className={clsx(
                  "py-2 px-4 rounded-full border body-semibold text-xs transition-default cursor-pointer",
                  retainedExternalSystemIds.includes(es.id)
                    ? "bg-orange-light/30 border-orange text-orange shadow-sm"
                    : "bg-primary border-subtle text-secondary hover:border-orange hover:bg-orange-light/10"
                )}
              >
                {retainedExternalSystemIds.includes(es.id) ? "✓ " : ""}{es.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-secondary/30 border border-strong rounded-2xl p-8 min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* NEW Systems */}
          <div className="space-y-4">
            <h4 className="detail font-bold text-green uppercase tracking-[0.1em] text-center">NEW Systems</h4>
            <div className="flex flex-col gap-3">
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
              {newSystems.length === 0 && <p className="text-center py-4 detail text-secondary italic">No new systems</p>}
            </div>
          </div>

          {/* REUSED Systems */}
          <div className="space-y-4">
            <h4 className="detail font-bold text-blue uppercase tracking-[0.1em] text-center">REUSED from AS-IS</h4>
            <div className="flex flex-col gap-3">
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
              {reusedSystems.length === 0 && <p className="text-center py-4 detail text-secondary italic">No reused systems</p>}
            </div>
          </div>

          {/* EXTERNAL Systems */}
          <div className="space-y-4">
            <h4 className="detail font-bold text-orange uppercase tracking-[0.1em] text-center">EXTERNAL Systems</h4>
            <div className="flex flex-col gap-3">
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
              {retainedExternalSystems.length === 0 && <p className="text-center py-4 detail text-secondary italic">No external systems</p>}
            </div>
          </div>
        </div>

        {selectedSourceSystem && (
          <div className="mt-8 p-3 bg-blue-light border border-blue/20 rounded-lg text-blue body-semibold text-xs text-center animate-pulse">
            <strong>Integration Mode:</strong> Click target system or click source again to cancel
          </div>
        )}
      </div>

      {integrations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-subtle">
          <h4 className="body-semibold text-primary">Integrations ({integrations.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integrations.map(integration => {
              const source = [...proposedSystems, ...retainedExternalSystems].find(s => s.id === integration.sourceSystemId);
              const target = [...proposedSystems, ...retainedExternalSystems].find(s => s.id === integration.targetSystemId);

              return (
                <div key={integration.id} className="flex items-center justify-between p-4 bg-primary border border-subtle rounded-xl shadow-sm hover:shadow-md transition-default">
                  <div className="body text-sm truncate pr-4">
                    <span className="font-semibold">{source?.name}</span>
                    <span className="mx-2 text-secondary">→</span>
                    <span className="font-semibold">{target?.name}</span>
                    <span className="ml-3 detail text-secondary bg-secondary px-2 py-0.5 rounded">{integration.method}</span>
                  </div>
                  <button onClick={() => removeIntegration(integration.id)} className="p-2 text-secondary hover:text-red hover:bg-red-light rounded-full transition-default">
                    <Trash2 size={16} />
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
    new: isSelected ? "bg-green text-white border-green" : "bg-green-light/20 text-green border-green/30",
    reused: isSelected ? "bg-blue text-white border-blue" : "bg-blue-light/20 text-blue border-blue/30",
    external: isSelected ? "bg-orange text-white border-orange" : "bg-orange-light/20 text-orange border-orange/30",
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={clsx(
        "p-4 border-2 rounded-xl text-center body-semibold text-xs shadow-sm cursor-pointer transition-default hover:scale-[1.02] active:scale-[0.98]",
        nodeStyles[type]
      )}
    >
      {name}
    </div>
  );
}
