/**
 * Current Landscape Tab - AS-IS Architecture
 * TOGAF Phase B - Current State Documentation
 *
 * Purpose: Document what EXISTS TODAY
 *
 * Rebuilt on the design system: Card/Banner/Button/Input/Select/StatusPill
 * plus the shared tabs.module.css. All state handling and the onChange data
 * shapes are unchanged.
 */

"use client";

// Explicit default import: tsconfig uses `jsx: "preserve"` with no automatic
// runtime, so the compiled JSX calls React.createElement by name. Next's own
// build injects it, which is why this only ever surfaced under the test
// transform — as `ReferenceError: React is not defined` on render.
import React, { useState } from "react";
import { Plus, Trash2, Cloud } from "lucide-react";
import type { CurrentLandscapeData, CurrentSystem, ExternalSystem, BusinessEntity } from "../types";
import { Card } from "@/components/ds/AppShell";
import { Banner } from "@/components/ds/Banner";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Select } from "@/components/ds/Select";
import { StatusPill } from "@/components/ds/Display";
import clsx from "clsx";
import styles from "./tabs.module.css";

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
    <div className={styles.stack}>
      {/* Info Banner */}
      <Banner tone="info" title="Current Business Landscape (AS-IS Architecture)">
        Document your <strong>current state</strong> - what applications and systems exist TODAY. This will be
        compared against your proposed solution to identify gaps and migration paths.
      </Banner>

      {/* Current Systems */}
      <Card label="Current applications and systems">
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Current Applications & Systems</h3>
          <p className={styles.sectionSubtitle}>What systems exist today (AS-IS)</p>
        </div>

        <div className={styles.stack}>
          <div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowSystemTemplates(!showSystemTemplates)}
              aria-expanded={showSystemTemplates}
            >
              {showSystemTemplates ? "Hide" : "Load"} Common System Templates
            </Button>

            {showSystemTemplates && (
              <div className={styles.templatePanel}>
                <h4 className={styles.templatePanelTitle}>Select Current System Category</h4>
                <div className={styles.templateGrid}>
                  {Object.entries(TOGAF_CURRENT_SYSTEMS_TEMPLATES).map(([templateName, systems]) => (
                    <button
                      key={templateName}
                      type="button"
                      onClick={() => loadSystemTemplate(templateName, systems)}
                      className={styles.templateBtn}
                    >
                      <span className={styles.templateBtnName}>{templateName}</span>
                      <span className={styles.templateBtnCount}>{systems.length} systems</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.cardGrid}>
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
      </Card>

      {/* External Systems */}
      <Card label="External system dependencies">
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>External System Dependencies</h3>
          <p className={styles.sectionSubtitle}>Third-party and partner systems</p>
        </div>

        <div className={styles.stack}>
          <div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowExternalTemplates(!showExternalTemplates)}
              aria-expanded={showExternalTemplates}
            >
              {showExternalTemplates ? "Hide" : "Load"} External System Templates
            </Button>

            {showExternalTemplates && (
              <div className={styles.templatePanel}>
                <h4 className={styles.templatePanelTitle}>Select External System Category</h4>
                <div className={styles.templateGrid}>
                  {Object.entries(TOGAF_EXTERNAL_SYSTEMS_TEMPLATES).map(([templateName, externals]) => (
                    <button
                      key={templateName}
                      type="button"
                      onClick={() => loadExternalTemplate(templateName, externals)}
                      className={styles.templateBtn}
                    >
                      <span className={styles.templateBtnName}>{templateName}</span>
                      <span className={styles.templateBtnCount}>{externals.length} systems</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.cardGrid}>
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
      </Card>

      {/* Generate Button */}
      {hasData && (
        <div className={styles.generateRow}>
          <Button variant="primary" size="lg" onClick={onGenerate}>
            Generate AS-IS Diagram
          </Button>
        </div>
      )}
    </div>
  );
}

const STATUS_TONE = {
  active: "info",
  retiring: "warning",
  keep: "success",
} as const;

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

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemCardHead}>
        <StatusPill tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "info"}>
          {status}
        </StatusPill>
        <Button
          iconOnly
          label={`Remove current system ${system.name || 'untitled'}`}
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={onRemove}
        />
      </div>

      <Input
        aria-label="System name"
        size="sm"
        value={system.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="System Name (e.g., SAP ECC)"
      />
      <div className={styles.itemCardRow}>
        <Input
          aria-label="System vendor"
          size="sm"
          value={system.vendor || ""}
          onChange={(e) => onUpdate({ vendor: e.target.value })}
          placeholder="Vendor"
        />
        <Input
          aria-label="System version"
          size="sm"
          value={system.version || ""}
          onChange={(e) => onUpdate({ version: e.target.value })}
          placeholder="Version"
        />
      </div>
      <Input
        aria-label="System modules"
        size="sm"
        value={system.modules.join(", ")}
        onChange={(e) => onUpdate({ modules: e.target.value.split(",").map((m) => m.trim()).filter((m) => m) })}
        placeholder="Modules (comma-separated)"
      />
      <Select
        aria-label="System status"
        size="sm"
        value={status}
        onChange={(e) => onUpdate({ status: e.target.value as "active" | "retiring" | "keep" })}
      >
        <option value="active">Active</option>
        <option value="keep">Keep (TO-BE)</option>
        <option value="retiring">Retiring</option>
      </Select>
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
    <div className={clsx(styles.itemCard, styles.itemCardWarning)}>
      <div className={styles.itemCardHead}>
        <Cloud size={18} className={styles.externalGlyph} aria-hidden="true" />
        <Button
          iconOnly
          label={`Remove external system ${external.name || 'untitled'}`}
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={onRemove}
        />
      </div>

      <Input
        aria-label="External system name"
        size="sm"
        value={external.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="External System Name"
      />
      <Input
        aria-label="External system type"
        size="sm"
        value={external.type}
        onChange={(e) => onUpdate({ type: e.target.value })}
        placeholder="Type (Banking, Partner, etc.)"
      />
      <Input
        aria-label="External system purpose"
        size="sm"
        value={external.purpose}
        onChange={(e) => onUpdate({ purpose: e.target.value })}
        placeholder="Purpose"
      />
      <Input
        aria-label="External system interface"
        size="sm"
        value={external.interface || ""}
        onChange={(e) => onUpdate({ interface: e.target.value })}
        placeholder="Interface (API, EDI, SFTP, etc.)"
      />
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className={styles.addTile}>
      <Plus size={24} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
