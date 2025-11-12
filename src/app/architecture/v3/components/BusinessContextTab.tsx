/**
 * Business Context Tab
 * Capture: Entities, Actors, Capabilities, Pain Points
 */

"use client";

import { useState } from "react";
import { Plus, Trash2, LayoutGrid, List } from "lucide-react";
import type { BusinessContextData, BusinessEntity, Actor, Capability } from "../types";
import styles from "./business-context-tab.module.css";

type ViewMode = "card" | "list";

interface BusinessContextTabProps {
  data: BusinessContextData;
  onChange: (data: BusinessContextData) => void;
  onGenerate: () => void;
}

export function BusinessContextTab({ data, onChange, onGenerate }: BusinessContextTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const addEntity = () => {
    const newEntity: BusinessEntity = {
      id: Date.now().toString(),
      name: "",
      location: "",
      description: "",
    };
    onChange({ ...data, entities: [...data.entities, newEntity] });
  };

  const updateEntity = (id: string, updates: Partial<BusinessEntity>) => {
    onChange({
      ...data,
      entities: data.entities.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  };

  const removeEntity = (id: string) => {
    onChange({ ...data, entities: data.entities.filter((e) => e.id !== id) });
  };

  const addActor = () => {
    const newActor: Actor = {
      id: Date.now().toString(),
      name: "",
      role: "",
      department: "",
      activities: [""],
    };
    onChange({ ...data, actors: [...data.actors, newActor] });
  };

  const updateActor = (id: string, updates: Partial<Actor>) => {
    onChange({
      ...data,
      actors: data.actors.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const removeActor = (id: string) => {
    onChange({ ...data, actors: data.actors.filter((a) => a.id !== id) });
  };

  const addCapability = () => {
    const newCap: Capability = {
      id: Date.now().toString(),
      name: "",
      category: "",
    };
    onChange({ ...data, capabilities: [...data.capabilities, newCap] });
  };

  const updateCapability = (id: string, updates: Partial<Capability>) => {
    onChange({
      ...data,
      capabilities: data.capabilities.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const removeCapability = (id: string) => {
    onChange({ ...data, capabilities: data.capabilities.filter((c) => c.id !== id) });
  };

  const hasData = data.entities.length > 0 || data.actors.length > 0 || data.painPoints.trim();

  return (
    <div className={styles.container}>
      {/* View Toggle */}
      <div className={styles.viewToggleContainer}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            padding: "4px",
            gap: "4px",
          }}
        >
          <button
            onClick={() => setViewMode("card")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: viewMode === "card" ? "#fff" : "transparent",
              color: viewMode === "card" ? "#2563A5" : "#666",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: viewMode === "card" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
            }}
          >
            <LayoutGrid className="w-4 h-4" />
            Card View
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: viewMode === "list" ? "#fff" : "transparent",
              color: viewMode === "list" ? "#2563A5" : "#666",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: viewMode === "list" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
            }}
          >
            <List className="w-4 h-4" />
            List View
          </button>
        </div>
      </div>

      {/* Entities */}
      <Section title="Business Entities" subtitle="Companies, divisions, subsidiaries (TOGAF organizational view)">
        <EntitiesSection
          entities={data.entities}
          viewMode={viewMode}
          onUpdate={updateEntity}
          onRemove={removeEntity}
          onAdd={addEntity}
          onChange={(entities) => onChange({ ...data, entities })}
        />
      </Section>

      {/* Actors */}
      <Section title="Key Actors & Activities" subtitle="Stakeholders and what they do (TOGAF ADM-aligned)">
        <ActorsSection
          actors={data.actors}
          viewMode={viewMode}
          onUpdate={updateActor}
          onRemove={removeActor}
          onAdd={addActor}
          onChange={(actors) => onChange({ ...data, actors })}
        />
      </Section>

      {/* Capabilities */}
      <Section title="Required Capabilities" subtitle="What the business needs (TOGAF-aligned)">
        <CapabilitiesSection
          capabilities={data.capabilities}
          onUpdate={updateCapability}
          onRemove={removeCapability}
          onAdd={addCapability}
          onChange={(caps) => onChange({ ...data, capabilities: caps })}
        />
      </Section>

      {/* Pain Points */}
      <Section title="Pain Points & Motivation" subtitle="Why transform?">
        <textarea
          value={data.painPoints}
          onChange={(e) => onChange({ ...data, painPoints: e.target.value })}
          placeholder="Describe current challenges, pain points, and motivation for change..."
          className={styles.textarea}
        />
      </Section>

      {/* Generate Button */}
      {hasData && (
        <div className={styles.generateButtonContainer}>
          <button
            onClick={onGenerate}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.generateButton}`}
          >
            Generate Diagram
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
        <p className={styles.sectionDescription}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

function EntityCard({
  entity,
  onUpdate,
  onRemove,
}: {
  entity: BusinessEntity;
  onUpdate: (updates: Partial<BusinessEntity>) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.card}>
      <button
        onClick={onRemove}
        className={styles.iconButton}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
        }}
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <input
        type="text"
        value={entity.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Entity Name"
        className={styles.input}
        style={{
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          borderBottom: "2px solid #e0e0e0",
          borderRadius: 0,
          fontWeight: 600,
          fontSize: "16px",
          marginBottom: "12px",
        }}
      />
      <input
        type="text"
        value={entity.location || ""}
        onChange={(e) => onUpdate({ location: e.target.value })}
        placeholder="Location (optional)"
        className={`${styles.input} ${styles.inputSmall}`}
        style={{ marginBottom: "8px" }}
      />
      <textarea
        value={entity.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description (optional)"
        className={styles.textarea}
        style={{
          minHeight: "60px",
          resize: "none",
        }}
      />
    </div>
  );
}

function ActorCard({
  actor,
  onUpdate,
  onRemove,
}: {
  actor: Actor;
  onUpdate: (updates: Partial<Actor>) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.card}>
      <button
        onClick={onRemove}
        className={styles.iconButton}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
        }}
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <input
        type="text"
        value={actor.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Actor Name (e.g., CFO)"
        className={styles.input}
        style={{
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
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
          value={actor.role}
          onChange={(e) => onUpdate({ role: e.target.value })}
          placeholder="Role"
          className={`${styles.input} ${styles.inputSmall}`}
          style={{ flex: 1 }}
        />
        <input
          type="text"
          value={actor.department}
          onChange={(e) => onUpdate({ department: e.target.value })}
          placeholder="Department"
          className={`${styles.input} ${styles.inputSmall}`}
          style={{ flex: 1 }}
        />
      </div>
      <textarea
        value={actor.activities.join("\n")}
        onChange={(e) =>
          onUpdate({ activities: e.target.value.split("\n").filter((a) => a.trim()) })
        }
        placeholder="Key activities (one per line)"
        className={styles.textarea}
        style={{
          minHeight: "80px",
          resize: "none",
        }}
      />
    </div>
  );
}

/**
 * TOGAF-Aligned Business Entity Templates
 */
const TOGAF_ENTITY_TEMPLATES = {
  "Global Enterprise (Multi-national)": [
    { name: "Global Headquarters", location: "Primary location", description: "Corporate HQ and global oversight" },
    { name: "North America Region", location: "USA/Canada", description: "North American operations" },
    { name: "EMEA Region", location: "Europe/Middle East/Africa", description: "EMEA operations" },
    { name: "APAC Region", location: "Asia Pacific", description: "Asia Pacific operations" },
    { name: "LATAM Region", location: "Latin America", description: "Latin America operations" },
  ],
  "Manufacturing Company": [
    { name: "Corporate Office", location: "HQ Location", description: "Executive leadership and corporate functions" },
    { name: "Manufacturing Plant 1", location: "Location A", description: "Primary production facility" },
    { name: "Manufacturing Plant 2", location: "Location B", description: "Secondary production facility" },
    { name: "Distribution Center", location: "Central location", description: "Logistics and distribution hub" },
    { name: "R&D Center", location: "Innovation hub", description: "Research and product development" },
  ],
  "Retail Organization": [
    { name: "Corporate Headquarters", location: "HQ", description: "Central management and support" },
    { name: "Regional Office - East", location: "Eastern region", description: "Eastern region management" },
    { name: "Regional Office - West", location: "Western region", description: "Western region management" },
    { name: "Flagship Store", location: "Prime location", description: "Primary retail location" },
    { name: "E-commerce Division", location: "Digital", description: "Online sales and digital commerce" },
  ],
  "Financial Services": [
    { name: "Corporate Center", location: "Financial district", description: "Executive and corporate functions" },
    { name: "Retail Banking Division", location: "Multiple branches", description: "Consumer banking services" },
    { name: "Investment Banking Division", location: "Financial hub", description: "Corporate and investment banking" },
    { name: "Wealth Management", location: "Premium locations", description: "Private wealth services" },
    { name: "Operations Center", location: "Back-office location", description: "Shared services and operations" },
  ],
};

/**
 * TOGAF ADM-Aligned Actor/Stakeholder Templates
 */
const TOGAF_ACTOR_TEMPLATES = {
  "C-Suite & Executive Leadership": [
    { name: "Chief Executive Officer (CEO)", role: "Executive Leadership", department: "Office of CEO", activities: ["Strategic direction", "Board governance", "Stakeholder management"] },
    { name: "Chief Financial Officer (CFO)", role: "Executive Leadership", department: "Finance", activities: ["Financial strategy", "Risk management", "Investor relations"] },
    { name: "Chief Operating Officer (COO)", role: "Executive Leadership", department: "Operations", activities: ["Operational excellence", "Process optimization", "Performance management"] },
    { name: "Chief Information Officer (CIO)", role: "Executive Leadership", department: "IT", activities: ["IT strategy", "Digital transformation", "Technology governance"] },
    { name: "Chief Technology Officer (CTO)", role: "Executive Leadership", department: "Technology", activities: ["Technology innovation", "Platform architecture", "R&D leadership"] },
    { name: "Chief Data Officer (CDO)", role: "Executive Leadership", department: "Data & Analytics", activities: ["Data strategy", "Analytics governance", "Data monetization"] },
  ],
  "Enterprise Architecture Team": [
    { name: "Chief Architect", role: "EA Leadership", department: "Enterprise Architecture", activities: ["Architecture governance", "Strategic roadmap", "Standards definition"] },
    { name: "Business Architect", role: "Business Architecture", department: "Enterprise Architecture", activities: ["Capability modeling", "Value streams", "Business process design"] },
    { name: "Solution Architect", role: "Solution Architecture", department: "Enterprise Architecture", activities: ["Solution design", "Integration architecture", "Technology selection"] },
    { name: "Data Architect", role: "Data Architecture", department: "Enterprise Architecture", activities: ["Data modeling", "MDM strategy", "Data integration"] },
    { name: "Security Architect", role: "Security Architecture", department: "Enterprise Architecture", activities: ["Security design", "Risk assessment", "Compliance architecture"] },
  ],
  "Business Function Leads": [
    { name: "VP of Finance", role: "Finance Leader", department: "Finance", activities: ["Financial planning", "Budget management", "Financial controls"] },
    { name: "VP of Operations", role: "Operations Leader", department: "Operations", activities: ["Operations strategy", "Process improvement", "Supply chain oversight"] },
    { name: "VP of Sales", role: "Sales Leader", department: "Sales", activities: ["Revenue generation", "Sales strategy", "Customer acquisition"] },
    { name: "VP of Marketing", role: "Marketing Leader", department: "Marketing", activities: ["Brand strategy", "Market positioning", "Customer engagement"] },
    { name: "VP of Human Resources", role: "HR Leader", department: "Human Resources", activities: ["Talent strategy", "Organizational development", "Culture transformation"] },
    { name: "VP of Supply Chain", role: "Supply Chain Leader", department: "Supply Chain", activities: ["Supply chain strategy", "Vendor management", "Logistics optimization"] },
  ],
  "IT & Digital Teams": [
    { name: "IT Director", role: "IT Management", department: "Information Technology", activities: ["IT service delivery", "Infrastructure management", "IT operations"] },
    { name: "Application Development Manager", role: "Development Lead", department: "IT Development", activities: ["Application delivery", "Development standards", "Technical debt management"] },
    { name: "Infrastructure Manager", role: "Infrastructure Lead", department: "IT Infrastructure", activities: ["Infrastructure strategy", "Cloud migration", "System reliability"] },
    { name: "Cybersecurity Manager", role: "Security Lead", department: "IT Security", activities: ["Security operations", "Threat management", "Compliance monitoring"] },
    { name: "Data & Analytics Manager", role: "Analytics Lead", department: "Data & Analytics", activities: ["Analytics delivery", "BI solutions", "Data quality"] },
  ],
  "Project & Change Management": [
    { name: "Program Director", role: "Program Leadership", department: "PMO", activities: ["Program governance", "Portfolio management", "Strategic initiatives"] },
    { name: "Project Manager", role: "Project Management", department: "PMO", activities: ["Project delivery", "Schedule management", "Stakeholder coordination"] },
    { name: "Change Manager", role: "Change Management", department: "Organizational Change", activities: ["Change strategy", "Stakeholder engagement", "Training delivery"] },
    { name: "Business Analyst", role: "Business Analysis", department: "PMO", activities: ["Requirements gathering", "Process mapping", "Gap analysis"] },
  ],
  "External Stakeholders": [
    { name: "System Integrator Lead", role: "SI Partner", department: "External", activities: ["Implementation delivery", "Technical consulting", "Knowledge transfer"] },
    { name: "Vendor Account Manager", role: "Software Vendor", department: "External", activities: ["Product roadmap", "Support services", "License management"] },
    { name: "Auditor", role: "External Audit", department: "External", activities: ["Compliance audit", "Control testing", "Audit reporting"] },
    { name: "Regulator Representative", role: "Regulatory Body", department: "External", activities: ["Regulatory guidance", "Compliance monitoring", "Policy updates"] },
  ],
};

/**
 * TOGAF-Aligned Business Capability Templates
 */
const TOGAF_CAPABILITY_TEMPLATES = {
  "Finance & Accounting": [
    "Financial Planning & Analysis",
    "Accounts Payable Management",
    "Accounts Receivable Management",
    "General Ledger Management",
    "Financial Reporting & Compliance",
    "Treasury Management",
    "Tax Management",
    "Fixed Asset Management",
  ],
  "Human Capital Management": [
    "Workforce Planning",
    "Talent Acquisition & Recruitment",
    "Employee Onboarding",
    "Learning & Development",
    "Performance Management",
    "Compensation & Benefits Administration",
    "Workforce Analytics",
    "Employee Relations",
  ],
  "Supply Chain Management": [
    "Demand Planning",
    "Procurement & Sourcing",
    "Supplier Relationship Management",
    "Inventory Management",
    "Warehouse Management",
    "Order Fulfillment",
    "Logistics & Transportation",
    "Supply Chain Analytics",
  ],
  "Customer Management": [
    "Customer Relationship Management",
    "Lead & Opportunity Management",
    "Quote & Proposal Management",
    "Order Management",
    "Customer Service & Support",
    "Customer Analytics",
    "Marketing Campaign Management",
    "Channel Partner Management",
  ],
  "Product & Service Management": [
    "Product Development & Innovation",
    "Product Portfolio Management",
    "Product Lifecycle Management",
    "Pricing & Profitability Management",
    "Quality Management",
    "Product Data Management",
  ],
  "IT Service Management": [
    "IT Service Desk",
    "Incident & Problem Management",
    "Change & Release Management",
    "IT Asset Management",
    "Service Level Management",
    "IT Security Management",
    "Infrastructure & Operations",
    "Application Portfolio Management",
  ],
  "Risk & Compliance": [
    "Enterprise Risk Management",
    "Regulatory Compliance",
    "Internal Audit",
    "Data Privacy & Protection",
    "Business Continuity Management",
    "Fraud Detection & Prevention",
  ],
  "Strategy & Governance": [
    "Strategic Planning",
    "Portfolio & Program Management",
    "Enterprise Architecture",
    "Business Process Management",
    "Data Governance",
    "Organizational Change Management",
  ],
};

function CapabilitiesSection({
  capabilities,
  onUpdate,
  onRemove,
  onAdd,
  onChange,
}: {
  capabilities: Capability[];
  onUpdate: (id: string, updates: Partial<Capability>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onChange: (capabilities: Capability[]) => void;
}) {
  const [showTemplates, setShowTemplates] = useState(false);

  const loadTemplate = (categoryName: string, capabilityNames: string[]) => {
    const newCapabilities = capabilityNames.map((name) => ({
      id: Date.now().toString() + Math.random(),
      name,
      category: categoryName,
    }));
    onChange([...capabilities, ...newCapabilities]);
    setShowTemplates(false);
  };

  return (
    <div>
      {/* Template Selector */}
      <div className={styles.templateLoader}>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{
            borderColor: "#2563A5",
            color: "#2563A5",
          }}
        >
          <Plus className="w-4 h-4" />
          {showTemplates ? "Hide" : "Load"} TOGAF Templates
        </button>

        {showTemplates && (
          <div
            style={{
              marginTop: "16px",
              padding: "24px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
            }}
          >
            <h4
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "16px",
              }}
            >
              Select a TOGAF Capability Domain
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {Object.entries(TOGAF_CAPABILITY_TEMPLATES).map(([category, caps]) => (
                <button
                  key={category}
                  onClick={() => loadTemplate(category, caps)}
                  className={styles.templateButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2563A5";
                    e.currentTarget.style.backgroundColor = "#f0f7ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={{
                    padding: "16px",
                    textAlign: "left",
                  }}
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
                    {category}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    {caps.length} capabilities
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Capabilities Display */}
      <div className={styles.capabilitiesGrid}>
        {capabilities.map((cap) => (
          <CapabilityTag
            key={cap.id}
            capability={cap}
            onUpdate={(updates) => onUpdate(cap.id, updates)}
            onRemove={() => onRemove(cap.id)}
          />
        ))}
        <button
          onClick={onAdd}
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{
            border: "2px dashed #ccc",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Custom Capability
        </button>
      </div>
    </div>
  );
}

function CapabilityTag({
  capability,
  onUpdate,
  onRemove,
}: {
  capability: Capability;
  onUpdate: (updates: Partial<Capability>) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        <input
          autoFocus
          type="text"
          value={capability.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setIsEditing(false);
            if (e.key === "Escape") setIsEditing(false);
          }}
          className={styles.input}
          style={{
            border: "2px solid #2563A5",
          }}
        />
      </div>
    );
  }

  // Get category class
  const getCategoryClass = (category?: string) => {
    const categoryMap: Record<string, string> = {
      "Finance & Accounting": styles.capabilityFinance,
      "Human Capital Management": styles.capabilityHR,
      "Supply Chain Management": styles.capabilitySupplyChain,
      "Customer Management": styles.capabilityCustomer,
      "Product & Service Management": styles.capabilityProduct,
      "IT Service Management": styles.capabilityIT,
      "Risk & Compliance": styles.capabilityRisk,
      "Strategy & Governance": styles.capabilityStrategy,
    };

    return categoryMap[category || ""] || styles.capabilityDefault;
  };

  const categoryClass = getCategoryClass(capability.category);

  return (
    <div
      className={`${styles.capabilityTag} ${categoryClass}`}
      onClick={() => setIsEditing(true)}
      title={capability.category ? `Category: ${capability.category}` : "Click to edit"}
    >
      <span>
        {capability.name || "Click to edit"}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={styles.removeCapabilityButton}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${styles.buttonSecondary}`}
      style={{
        minHeight: "150px",
        border: "2px dashed #ccc",
        backgroundColor: "#fafafa",
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
      <span style={{ color: "#666" }}>
        {label}
      </span>
    </button>
  );
}

/**
 * Entities Section with Templates
 */
function EntitiesSection({
  entities,
  viewMode,
  onUpdate,
  onRemove,
  onAdd,
  onChange,
}: {
  entities: BusinessEntity[];
  viewMode: ViewMode;
  onUpdate: (id: string, updates: Partial<BusinessEntity>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onChange: (entities: BusinessEntity[]) => void;
}) {
  const [showTemplates, setShowTemplates] = useState(false);

  const loadTemplate = (templateName: string, entityTemplates: Array<{ name: string; location: string; description: string }>) => {
    const newEntities = entityTemplates.map((template) => ({
      id: Date.now().toString() + Math.random(),
      ...template,
    }));
    onChange([...entities, ...newEntities]);
    setShowTemplates(false);
  };

  return (
    <div>
      {/* Template Selector */}
      <div className={styles.templateLoader}>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{
            borderColor: "#2563A5",
            color: "#2563A5",
          }}
        >
          <Plus className="w-4 h-4" />
          {showTemplates ? "Hide" : "Load"} TOGAF Entity Templates
        </button>

        {showTemplates && (
          <div
            style={{
              marginTop: "16px",
              padding: "24px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
            }}
          >
            <h4
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "16px",
              }}
            >
              Select an Organization Type
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {Object.entries(TOGAF_ENTITY_TEMPLATES).map(([templateName, entityTemplates]) => (
                <button
                  key={templateName}
                  onClick={() => loadTemplate(templateName, entityTemplates)}
                  className={styles.templateButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2563A5";
                    e.currentTarget.style.backgroundColor = "#f0f7ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={{
                    padding: "16px",
                    textAlign: "left",
                  }}
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
                    {entityTemplates.length} entities
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View */}
      {viewMode === "card" ? (
        <div className={styles.cardsGrid}>
          {entities.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              onUpdate={(updates) => onUpdate(entity.id, updates)}
              onRemove={() => onRemove(entity.id)}
            />
          ))}
          <AddButton onClick={onAdd} label="Add Entity" />
        </div>
      ) : (
        <EntitiesListView
          entities={entities}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onAdd={onAdd}
        />
      )}
    </div>
  );
}

/**
 * Actors Section with Templates
 */
function ActorsSection({
  actors,
  viewMode,
  onUpdate,
  onRemove,
  onAdd,
  onChange,
}: {
  actors: Actor[];
  viewMode: ViewMode;
  onUpdate: (id: string, updates: Partial<Actor>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onChange: (actors: Actor[]) => void;
}) {
  const [showTemplates, setShowTemplates] = useState(false);

  const loadTemplate = (templateName: string, actorTemplates: Array<{ name: string; role: string; department: string; activities: string[] }>) => {
    const newActors = actorTemplates.map((template) => ({
      id: Date.now().toString() + Math.random(),
      ...template,
    }));
    onChange([...actors, ...newActors]);
    setShowTemplates(false);
  };

  return (
    <div>
      {/* Template Selector */}
      <div className={styles.templateLoader}>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{
            borderColor: "#2563A5",
            color: "#2563A5",
          }}
        >
          <Plus className="w-4 h-4" />
          {showTemplates ? "Hide" : "Load"} TOGAF Stakeholder Templates
        </button>

        {showTemplates && (
          <div
            style={{
              marginTop: "16px",
              padding: "24px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
            }}
          >
            <h4
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "16px",
              }}
            >
              Select a Stakeholder Group (TOGAF ADM)
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {Object.entries(TOGAF_ACTOR_TEMPLATES).map(([templateName, actorTemplates]) => (
                <button
                  key={templateName}
                  onClick={() => loadTemplate(templateName, actorTemplates)}
                  className={styles.templateButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2563A5";
                    e.currentTarget.style.backgroundColor = "#f0f7ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={{
                    padding: "16px",
                    textAlign: "left",
                  }}
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
                    {actorTemplates.length} stakeholders
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View */}
      {viewMode === "card" ? (
        <div
          className={styles.cardsGrid}
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          }}
        >
          {actors.map((actor) => (
            <ActorCard
              key={actor.id}
              actor={actor}
              onUpdate={(updates) => onUpdate(actor.id, updates)}
              onRemove={() => onRemove(actor.id)}
            />
          ))}
          <AddButton onClick={onAdd} label="Add Actor" />
        </div>
      ) : (
        <ActorsListView
          actors={actors}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onAdd={onAdd}
        />
      )}
    </div>
  );
}

/**
 * List View Components
 */

function EntitiesListView({
  entities,
  onUpdate,
  onRemove,
  onAdd,
}: {
  entities: BusinessEntity[];
  onUpdate: (id: string, updates: Partial<BusinessEntity>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className={styles.listView}>
      {/* Header */}
      <div
        className={styles.listHeader}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 3fr 40px",
          gap: "16px",
          padding: "12px 16px",
        }}
      >
        <div>Name</div>
        <div>Location</div>
        <div>Description</div>
        <div></div>
      </div>

      {/* Rows */}
      {entities.map((entity, index) => (
        <div
          key={entity.id}
          className={styles.listRow}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 3fr 40px",
            gap: "16px",
            padding: "12px 16px",
            backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
            borderBottom: index < entities.length - 1 ? "1px solid #e0e0e0" : "none",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={entity.name}
            onChange={(e) => onUpdate(entity.id, { name: e.target.value })}
            placeholder="Entity name"
            className={styles.input}
          />
          <input
            type="text"
            value={entity.location || ""}
            onChange={(e) => onUpdate(entity.id, { location: e.target.value })}
            placeholder="Location"
            className={styles.input}
          />
          <input
            type="text"
            value={entity.description || ""}
            onChange={(e) => onUpdate(entity.id, { description: e.target.value })}
            placeholder="Description"
            className={styles.input}
          />
          <button
            onClick={() => onRemove(entity.id)}
            className={styles.iconButton}
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add Row */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f9f9f9",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <button
          onClick={onAdd}
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{
            borderColor: "#2563A5",
            color: "#2563A5",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Entity
        </button>
      </div>
    </div>
  );
}

function ActorsListView({
  actors,
  onUpdate,
  onRemove,
  onAdd,
}: {
  actors: Actor[];
  onUpdate: (id: string, updates: Partial<Actor>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className={styles.listView}>
      {/* Header */}
      <div
        className={styles.listHeader}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1.5fr 3fr 40px",
          gap: "16px",
          padding: "12px 16px",
        }}
      >
        <div>Name</div>
        <div>Role</div>
        <div>Department</div>
        <div>Activities</div>
        <div></div>
      </div>

      {/* Rows */}
      {actors.map((actor, index) => (
        <div
          key={actor.id}
          className={styles.listRow}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 1.5fr 3fr 40px",
            gap: "16px",
            padding: "12px 16px",
            backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
            borderBottom: index < actors.length - 1 ? "1px solid #e0e0e0" : "none",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={actor.name}
            onChange={(e) => onUpdate(actor.id, { name: e.target.value })}
            placeholder="Actor name"
            className={styles.input}
          />
          <input
            type="text"
            value={actor.role}
            onChange={(e) => onUpdate(actor.id, { role: e.target.value })}
            placeholder="Role"
            className={styles.input}
          />
          <input
            type="text"
            value={actor.department}
            onChange={(e) => onUpdate(actor.id, { department: e.target.value })}
            placeholder="Department"
            className={styles.input}
          />
          <input
            type="text"
            value={actor.activities.join(", ")}
            onChange={(e) =>
              onUpdate(actor.id, {
                activities: e.target.value.split(",").map((a) => a.trim()).filter((a) => a),
              })
            }
            placeholder="Activities (comma-separated)"
            className={styles.input}
          />
          <button
            onClick={() => onRemove(actor.id)}
            className={styles.iconButton}
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add Row */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f9f9f9",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <button
          onClick={onAdd}
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{
            borderColor: "#2563A5",
            color: "#2563A5",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Actor
        </button>
      </div>
    </div>
  );
}
