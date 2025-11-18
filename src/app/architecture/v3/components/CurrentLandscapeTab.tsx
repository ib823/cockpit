/**
 * Current Landscape Tab - AS-IS Architecture
 * TOGAF Phase B - Current State Documentation
 *
 * Purpose: Document what EXISTS TODAY
 * - Current applications/systems
 * - Current integrations
 * - External system dependencies
 * - Capability gaps and pain points
 */

"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowRight, Database, Cloud, Server } from "lucide-react";
import type { CurrentLandscapeData, CurrentSystem, Integration, ExternalSystem, BusinessEntity } from "../types";
import styles from "./current-landscape-tab.module.css";

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
  entities,
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

  const loadSystemTemplate = (templateName: string, systems: any[]) => {
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

  const loadExternalTemplate = (templateName: string, externals: any[]) => {
    const newExternals = externals.map((ext) => ({
      id: Date.now().toString() + Math.random(),
      ...ext,
    }));
    onChange({ ...data, externalSystems: [...data.externalSystems, ...newExternals] });
    setShowExternalTemplates(false);
  };

  const hasData = data.systems.length > 0 || data.externalSystems.length > 0;

  return (
    <div className={styles.container}>
      {/* Info Banner */}
      <div className={styles.infoBanner}>
        <h4 className={styles.infoBannerTitle}>
          Current Business Landscape (AS-IS Architecture)
        </h4>
        <p className={styles.infoBannerText}>
          Document your <strong>current state</strong> - what applications and systems exist TODAY. This will be
          compared against your proposed solution to identify gaps and migration paths.
        </p>
      </div>

      {/* Current Systems */}
      <Section title="Current Applications & Systems" subtitle="What systems exist today (AS-IS)">
        {/* Template Loader */}
        <div className={styles.templateLoader}>
          <button
            onClick={() => setShowSystemTemplates(!showSystemTemplates)}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            <Plus className="w-4 h-4" />
            {showSystemTemplates ? "Hide" : "Load"} Common System Templates
          </button>

          {showSystemTemplates && (
            <div
              style={{
                marginTop: "16px",
                padding: "24px",
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h4 className={styles.sectionTitle}>
                Select Current System Category
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                {Object.entries(TOGAF_CURRENT_SYSTEMS_TEMPLATES).map(([templateName, systems]) => (
                  <button
                    key={templateName}
                    onClick={() => loadSystemTemplate(templateName, systems)}
                    className={styles.templateButton}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "15px",
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
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      {systems.length} systems
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Systems Grid */}
        <div className={styles.systemsGrid}>
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
      </Section>

      {/* External Systems */}
      <Section title="External System Dependencies" subtitle="Third-party and partner systems">
        {/* Template Loader */}
        <div className={styles.templateLoader}>
          <button
            onClick={() => setShowExternalTemplates(!showExternalTemplates)}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            <Plus className="w-4 h-4" />
            {showExternalTemplates ? "Hide" : "Load"} External System Templates
          </button>

          {showExternalTemplates && (
            <div
              style={{
                marginTop: "16px",
                padding: "24px",
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h4 className={styles.sectionTitle}>
                Select External System Category
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                {Object.entries(TOGAF_EXTERNAL_SYSTEMS_TEMPLATES).map(([templateName, externals]) => (
                  <button
                    key={templateName}
                    onClick={() => loadExternalTemplate(templateName, externals)}
                    className={styles.templateButton}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "15px",
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
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      {externals.length} systems
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* External Systems Grid */}
        <div className={styles.systemsGrid}>
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
      </Section>

      {/* Generate Button */}
      {hasData && (
        <div style={{ textAlign: "right", marginTop: "32px" }}>
          <button
            onClick={onGenerate}
            className={`${styles.button} ${styles.buttonPrimary}`}
            style={{ padding: "14px 32px" }}
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
  const statusClass = status === "active" ? styles.statusActive : status === "retiring" ? styles.statusRetiring : styles.statusKeep;

  return (
    <div className={styles.systemCard}>
      <button
        onClick={onRemove}
        className={styles.iconButton}
        style={{ position: "absolute", top: "10px", right: "10px" }}
        aria-label={`Remove current system ${system.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Status Badge */}
      <div className={`${styles.statusBadge} ${statusClass}`}>
        {status.toUpperCase()}
      </div>

      <input
        type="text"
        value={system.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="System Name (e.g., SAP ECC)"
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
        }}
      />
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          type="text"
          value={system.vendor || ""}
          onChange={(e) => onUpdate({ vendor: e.target.value })}
          placeholder="Vendor"
          className={styles.input}
          style={{ flex: 1, fontSize: "13px" }}
        />
        <input
          type="text"
          value={system.version || ""}
          onChange={(e) => onUpdate({ version: e.target.value })}
          placeholder="Version"
          className={styles.input}
          style={{ flex: 1, fontSize: "13px" }}
        />
      </div>
      <input
        type="text"
        value={system.modules.join(", ")}
        onChange={(e) => onUpdate({ modules: e.target.value.split(",").map((m) => m.trim()).filter((m) => m) })}
        placeholder="Modules (comma-separated)"
        className={styles.input}
        style={{ fontSize: "13px", marginBottom: "12px" }}
      />
      <select
        value={status}
        onChange={(e) => onUpdate({ status: e.target.value as "active" | "retiring" | "keep" })}
        className={styles.select}
        style={{ fontSize: "13px" }}
      >
        <option value="active">Active</option>
        <option value="keep">Keep (TO-BE)</option>
        <option value="retiring">Retiring</option>
      </select>
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
    <div
      className={styles.systemCard}
      style={{
        border: "1px solid #FFC107",
        backgroundColor: "#FFF8E1",
      }}
    >
      <button
        onClick={onRemove}
        className={styles.iconButton}
        style={{ position: "absolute", top: "10px", right: "10px" }}
        aria-label={`Remove external system ${external.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>
      <Cloud className="w-5 h-5" style={{ color: "#F57F17", marginBottom: "8px" }} aria-hidden="true" />
      <input
        type="text"
        value={external.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="External System Name"
        className={styles.input}
        style={{
          padding: "8px 0",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          borderBottom: "2px solid #FFC107",
          borderRadius: 0,
          fontWeight: 600,
          fontSize: "16px",
          marginBottom: "12px",
          backgroundColor: "transparent",
        }}
      />
      <input
        type="text"
        value={external.type}
        onChange={(e) => onUpdate({ type: e.target.value })}
        placeholder="Type (Banking, Partner, etc.)"
        className={styles.input}
        style={{ fontSize: "13px", marginBottom: "8px", border: "1px solid #FFD54F" }}
      />
      <input
        type="text"
        value={external.purpose}
        onChange={(e) => onUpdate({ purpose: e.target.value })}
        placeholder="Purpose"
        className={styles.input}
        style={{ fontSize: "13px", marginBottom: "8px", border: "1px solid #FFD54F" }}
      />
      <input
        type="text"
        value={external.interface || ""}
        onChange={(e) => onUpdate({ interface: e.target.value })}
        placeholder="Interface (API, EDI, SFTP, etc.)"
        className={styles.input}
        style={{ fontSize: "13px", border: "1px solid #FFD54F" }}
      />
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${styles.buttonSecondary}`}
      style={{
        minHeight: "200px",
        border: "2px dashed #ccc",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#2563A5";
        e.currentTarget.style.backgroundColor = "#f0f7ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#ccc";
        e.currentTarget.style.backgroundColor = "#fafafa";
      }}
    >
      <Plus className="w-6 h-6" style={{ color: "#999" }} />
      <span style={{ fontFamily: "var(--font-text)", fontSize: "14px", color: "#666" }}>
        {label}
      </span>
    </button>
  );
}
