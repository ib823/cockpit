/**
 * Current Landscape Tab - AS-IS Architecture
 * TOGAF Phase B - Current State Documentation
 *
 * Purpose: Document what EXISTS TODAY
 */

"use client";

import { useState } from "react";
import { Plus, Trash2, Cloud } from "lucide-react";
import type { CurrentLandscapeData, CurrentSystem, ExternalSystem, BusinessEntity } from "../types";
import clsx from "clsx";

interface CurrentLandscapeTabProps {
  data: CurrentLandscapeData;
  entities: BusinessEntity[];
  onChange: (data: CurrentLandscapeData) => void;
  onGenerate: () => void;
}

/**
 * TOGAF-Aligned Current System Templates (AS-IS)
 */
const TOGAF_CURRENT_SYSTEMS_TEMPLATES = {
  "Legacy ERP Systems": [
    { name: "SAP ECC 6.0", vendor: "SAP", version: "ECC 6.0", modules: ["FI", "CO", "MM", "SD"], status: "retiring" as const },
    { name: "Oracle E-Business Suite", vendor: "Oracle", version: "R12", modules: ["Financials", "SCM", "HR"], status: "retiring" as const },
    { name: "Microsoft Dynamics AX", vendor: "Microsoft", version: "2012", modules: ["Finance", "Operations"], status: "retiring" as const },
    { name: "Infor LN", vendor: "Infor", version: "10.7", modules: ["Manufacturing", "Distribution"], status: "retiring" as const },
  ],
  "Point Solutions": [
    { name: "Legacy CRM", vendor: "Custom Built", version: "v2.0", modules: ["Sales", "Customer Service"], status: "retiring" as const },
    { name: "Excel-based Planning", vendor: "Microsoft", version: "Excel 2016", modules: ["Budget Planning", "Forecasting"], status: "retiring" as const },
    { name: "Legacy WMS", vendor: "Custom Built", version: "v1.5", modules: ["Warehouse Management"], status: "retiring" as const },
    { name: "Standalone HR System", vendor: "ADP", version: "v5.0", modules: ["Payroll", "Time & Attendance"], status: "keep" as const },
  ],
  "Modern Cloud Systems": [
    { name: "Salesforce", vendor: "Salesforce", version: "Lightning", modules: ["Sales Cloud", "Service Cloud"], status: "keep" as const },
    { name: "Workday HCM", vendor: "Workday", version: "2024", modules: ["HR", "Talent", "Payroll"], status: "keep" as const },
    { name: "Concur", vendor: "SAP", version: "Cloud", modules: ["Travel", "Expense"], status: "keep" as const },
    { name: "Coupa", vendor: "Coupa", version: "Cloud", modules: ["Procurement", "Invoicing"], status: "keep" as const },
  ],
  "Databases & Middleware": [
    { name: "Oracle Database", vendor: "Oracle", version: "12c", modules: ["Core Database"], status: "keep" as const },
    { name: "SQL Server", vendor: "Microsoft", version: "2019", modules: ["Data Warehouse"], status: "keep" as const },
    { name: "MuleSoft ESB", vendor: "MuleSoft", version: "4.x", modules: ["Integration"], status: "keep" as const },
    { name: "Legacy ETL Tool", vendor: "Informatica", version: "9.x", modules: ["Data Integration"], status: "retiring" as const },
  ],
};

const TOGAF_EXTERNAL_SYSTEMS_TEMPLATES = {
  "Banking & Payment": [
    { name: "Bank Payment Gateway", type: "Banking", purpose: "Process payments and transfers", interface: "SWIFT/ISO 20022" },
    { name: "Credit Card Processor", type: "Financial Services", purpose: "Credit card transactions", interface: "REST API" },
    { name: "Treasury System", type: "Banking", purpose: "Cash management", interface: "SFTP" },
  ],
  "Government & Regulatory": [
    { name: "Tax Authority Portal", type: "Government", purpose: "Tax filing and reporting", interface: "Web Portal" },
    { name: "Customs System", type: "Government", purpose: "Import/export declarations", interface: "EDI" },
    { name: "Regulatory Reporting", type: "Government", purpose: "Compliance reporting", interface: "SFTP" },
  ],
  "Supply Chain Partners": [
    { name: "Logistics Provider EDI", type: "Partner", purpose: "Shipping and tracking", interface: "EDI X12" },
    { name: "Supplier Portal", type: "Partner", purpose: "Purchase orders and invoices", interface: "Web Portal" },
    { name: "Distributor System", type: "Partner", purpose: "Order fulfillment", interface: "REST API" },
  ],
  "E-Commerce & Digital": [
    { name: "Payment Gateway", type: "Payment Provider", purpose: "Online payments", interface: "REST API" },
    { name: "E-Commerce Platform", type: "Digital", purpose: "Online storefront", interface: "API Integration" },
    { name: "Marketing Automation", type: "Marketing", purpose: "Campaign management", interface: "REST API" },
  ],
};

export function CurrentLandscapeTab({
  data,
  onChange,
  onGenerate,
}: CurrentLandscapeTabProps) {
  const [showSystemTemplates, setShowSystemTemplates] = useState(false);
  const [showExternalTemplates, setShowExternalTemplates] = useState(false);

  const addSystem = () => {
    const newSystem: CurrentSystem = {
      id: Date.now().toString(),
      name: "",
      vendor: "",
      version: "",
      modules: [],
      status: "active",
    };
    onChange({ ...data, systems: [...data.systems, newSystem] });
  };

  const updateSystem = (id: string, updates: Partial<CurrentSystem>) => {
    onChange({
      ...data,
      systems: data.systems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const removeSystem = (id: string) => {
    onChange({ ...data, systems: data.systems.filter((s) => s.id !== id) });
  };

  const loadSystemTemplate = (templateName: string, systems: Omit<CurrentSystem, "id">[]) => {
    const newSystems = systems.map((sys) => ({
      id: Date.now().toString() + Math.random(),
      ...sys,
    }));
    onChange({ ...data, systems: [...data.systems, ...newSystems] });
    setShowSystemTemplates(false);
  };

  const addExternalSystem = () => {
    const newExternal: ExternalSystem = {
      id: Date.now().toString(),
      name: "",
      type: "",
      purpose: "",
      interface: "",
    };
    onChange({ ...data, externalSystems: [...data.externalSystems, newExternal] });
  };

  const updateExternalSystem = (id: string, updates: Partial<ExternalSystem>) => {
    onChange({
      ...data,
      externalSystems: data.externalSystems.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  };

  const removeExternalSystem = (id: string) => {
    onChange({ ...data, externalSystems: data.externalSystems.filter((e) => e.id !== id) });
  };

  const loadExternalTemplate = (templateName: string, externals: Omit<ExternalSystem, "id">[]) => {
    const newExternals = externals.map((ext) => ({
      id: Date.now().toString() + Math.random(),
      ...ext,
    }));
    onChange({ ...data, externalSystems: [...data.externalSystems, ...newExternals] });
    setShowExternalTemplates(false);
  };

  const hasData = data.systems.length > 0 || data.externalSystems.length > 0;

  return (
    <div className="space-y-10">
      {/* Info Banner */}
      <div className="p-6 bg-blue-light border border-blue/20 rounded-xl">
        <h4 className="body-semibold text-blue mb-2">
          Current Business Landscape (AS-IS Architecture)
        </h4>
        <p className="body text-sm text-secondary">
          Document your <strong>current state</strong> - what applications and systems exist TODAY. This will be
          compared against your proposed solution to identify gaps and migration paths.
        </p>
      </div>

      {/* Current Systems */}
      <Section title="Current Applications & Systems" subtitle="What systems exist today (AS-IS)">
        <div className="space-y-6">
          <button
            onClick={() => setShowSystemTemplates(!showSystemTemplates)}
            className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-blue text-blue rounded-md body-semibold hover:bg-blue-light transition-default cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {showSystemTemplates ? "Hide" : "Load"} Common System Templates
          </button>

          {showSystemTemplates && (
            <div className="p-6 bg-secondary rounded-xl border border-strong animate-fade-in">
              <h4 className="body-semibold mb-4 text-primary">Select Current System Category</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(TOGAF_CURRENT_SYSTEMS_TEMPLATES).map(([templateName, systems]) => (
                  <button
                    key={templateName}
                    onClick={() => loadSystemTemplate(templateName, systems)}
                    className="flex flex-col p-4 text-left bg-primary border border-subtle rounded-lg hover:border-blue hover:bg-blue-light transition-default cursor-pointer"
                  >
                    <div className="body-semibold mb-1">{templateName}</div>
                    <div className="detail text-secondary">{systems.length} systems</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.systems.map((system) => (
              <SystemCard
                key={system.id}
                system={system}
                onUpdate={(updates) => updateSystem(system.id, updates)}
                onRemove={() => removeSystem(system.id)}
              />
            ))}
            <AddButton onClick={addSystem} label="Add Current System" />
          </div>
        </div>
      </Section>

      {/* External Systems */}
      <Section title="External System Dependencies" subtitle="Third-party and partner systems">
        <div className="space-y-6">
          <button
            onClick={() => setShowExternalTemplates(!showExternalTemplates)}
            className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-blue text-blue rounded-md body-semibold hover:bg-blue-light transition-default cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {showExternalTemplates ? "Hide" : "Load"} External System Templates
          </button>

          {showExternalTemplates && (
            <div className="p-6 bg-secondary rounded-xl border border-strong animate-fade-in">
              <h4 className="body-semibold mb-4 text-primary">Select External System Category</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(TOGAF_EXTERNAL_SYSTEMS_TEMPLATES).map(([templateName, externals]) => (
                  <button
                    key={templateName}
                    onClick={() => loadExternalTemplate(templateName, externals)}
                    className="flex flex-col p-4 text-left bg-primary border border-subtle rounded-lg hover:border-blue hover:bg-blue-light transition-default cursor-pointer"
                  >
                    <div className="body-semibold mb-1">{templateName}</div>
                    <div className="detail text-secondary">{externals.length} systems</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.externalSystems.map((external) => (
              <ExternalSystemCard
                key={external.id}
                external={external}
                onUpdate={(updates) => updateExternalSystem(external.id, updates)}
                onRemove={() => removeExternalSystem(external.id)}
              />
            ))}
            <AddButton onClick={addExternalSystem} label="Add External System" />
          </div>
        </div>
      </Section>

      {/* Generate Button */}
      {hasData && (
        <div className="flex justify-end pt-8 border-t border-subtle">
          <button
            onClick={onGenerate}
            className="py-3 px-8 bg-blue color-white rounded-xl display-small font-bold shadow-lg hover:bg-blue-dark hover:scale-[1.02] active:scale-[0.98] transition-default cursor-pointer"
          >
            Generate AS-IS Diagram
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

function SystemCard({
  system,
  onUpdate,
  onRemove,
}: {
  system: CurrentSystem;
  onUpdate: (updates: Partial<CurrentSystem>) => void;
  onRemove: () => void;
}) {
  const status = system.status || "active";
  const statusColors = {
    active: "bg-blue text-white",
    retiring: "bg-orange text-white",
    keep: "bg-green text-white",
  };

  return (
    <div className="relative p-6 bg-primary border border-strong rounded-xl shadow-sm hover:shadow-md transition-default group">
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-red-light hover:text-red transition-default opacity-0 group-hover:opacity-100"
        aria-label={`Remove current system ${system.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Status Badge */}
      <div className={clsx("absolute top-4 left-6 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", statusColors[status as keyof typeof statusColors])}>
        {status}
      </div>

      <div className="mt-6 space-y-4">
        <input
          type="text"
          value={system.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="System Name (e.g., SAP ECC)"
          className="w-full pb-2 border-b-2 border-subtle bg-transparent body-semibold text-lg outline-none focus:border-blue transition-default"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={system.vendor || ""}
            onChange={(e) => onUpdate({ vendor: e.target.value })}
            placeholder="Vendor"
            className="flex-1 p-2 rounded-md border border-subtle bg-secondary/50 body text-xs focus:border-blue outline-none transition-default"
          />
          <input
            type="text"
            value={system.version || ""}
            onChange={(e) => onUpdate({ version: e.target.value })}
            placeholder="Version"
            className="flex-1 p-2 rounded-md border border-subtle bg-secondary/50 body text-xs focus:border-blue outline-none transition-default"
          />
        </div>
        <input
          type="text"
          value={system.modules.join(", ")}
          onChange={(e) => onUpdate({ modules: e.target.value.split(",").map((m) => m.trim()).filter((m) => m) })}
          placeholder="Modules (comma-separated)"
          className="w-full p-2 rounded-md border border-subtle bg-secondary/50 body text-xs focus:border-blue outline-none transition-default"
        />
        <select
          value={status}
          onChange={(e) => onUpdate({ status: e.target.value as "active" | "retiring" | "keep" })}
          className="w-full p-2 rounded-md border border-subtle bg-secondary body text-xs outline-none focus:border-blue transition-default cursor-pointer"
        >
          <option value="active">Active</option>
          <option value="keep">Keep (TO-BE)</option>
          <option value="retiring">Retiring</option>
        </select>
      </div>
    </div>
  );
}

function ExternalSystemCard({
  external,
  onUpdate,
  onRemove,
}: {
  external: ExternalSystem;
  onUpdate: (updates: Partial<ExternalSystem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative p-6 bg-orange-light/30 border border-orange/30 rounded-xl shadow-sm hover:shadow-md transition-default group">
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 p-2 rounded-full text-orange/60 hover:bg-orange/10 hover:text-orange transition-default opacity-0 group-hover:opacity-100"
        aria-label={`Remove external system ${external.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>
      
      <Cloud className="w-5 h-5 text-orange mb-4" aria-hidden="true" />
      
      <div className="space-y-3">
        <input
          type="text"
          value={external.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="External System Name"
          className="w-full pb-2 border-b-2 border-orange/20 bg-transparent body-semibold text-lg outline-none focus:border-orange transition-default"
        />
        <input
          type="text"
          value={external.type}
          onChange={(e) => onUpdate({ type: e.target.value })}
          placeholder="Type (Banking, Partner, etc.)"
          className="w-full p-2 rounded-md border border-orange/20 bg-primary/50 body text-xs focus:border-orange outline-none transition-default"
        />
        <input
          type="text"
          value={external.purpose}
          onChange={(e) => onUpdate({ purpose: e.target.value })}
          placeholder="Purpose"
          className="w-full p-2 rounded-md border border-orange/20 bg-primary/50 body text-xs focus:border-orange outline-none transition-default"
        />
        <input
          type="text"
          value={external.interface || ""}
          onChange={(e) => onUpdate({ interface: e.target.value })}
          placeholder="Interface (API, EDI, SFTP, etc.)"
          className="w-full p-2 rounded-md border border-orange/20 bg-primary/50 body text-xs focus:border-orange outline-none transition-default"
        />
      </div>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-8 min-h-[200px] border-2 border-dashed border-strong bg-secondary/30 rounded-xl hover:bg-blue-light hover:border-blue transition-default cursor-pointer group"
    >
      <Plus className="w-8 h-8 text-secondary group-hover:text-blue mb-2 transition-default" />
      <span className="body text-sm font-semibold text-secondary group-hover:text-blue transition-default">{label}</span>
    </button>
  );
}
