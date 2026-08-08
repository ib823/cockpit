/**
 * Business Context Tab
 * Capture: Entities, Actors, Capabilities, Pain Points
 *
 * Rebuilt on the design system: Card/Button/Input/Textarea/DataTable/
 * EmptyState plus the shared tabs.module.css. All state handling and the
 * onChange data shapes are unchanged.
 */

"use client";

// Explicit default import: tsconfig uses `jsx: "preserve"` with no automatic
// runtime, so the compiled JSX calls React.createElement by name.
import React, { useState } from "react";
import { Plus, Trash2, LayoutGrid, List, ChevronDown } from "lucide-react";
import type { BusinessContextData, BusinessEntity, Actor, Capability } from "../types";
import { Card } from "@/components/ds/AppShell";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Textarea } from "@/components/ds/Textarea";
import { DataTable } from "@/components/ds/DataTable";
import { EmptyState } from "@/components/ds/Feedback";
import clsx from "clsx";
import styles from "./tabs.module.css";

type ViewMode = "card" | "list";

interface BusinessContextTabProps {
  data: BusinessContextData;
  onChange: (data: BusinessContextData) => void;
  onGenerate: () => void;
}

// Simple Accordion Component defined locally
const Accordion = ({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = `accordion-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={styles.accordion}>
      <button
        type="button"
        className={styles.accordionTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span>
          <span className={styles.accordionTitle}>{title}</span>
          <span className={styles.accordionSubtitle}>{subtitle}</span>
        </span>
        <ChevronDown
          size={18}
          className={clsx(styles.accordionChevron, isOpen && styles.accordionChevronOpen)}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className={styles.accordionBody} id={contentId} role="region">
          {children}
        </div>
      )}
    </div>
  );
};


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
    <div className={styles.stack}>
      {/* Pain Points is the primary, always-visible section */}
      <Card label="Pain points and motivation">
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Pain Points & Motivation</h3>
          <p className={styles.sectionSubtitle}>Start here: Why does your business need to transform?</p>
        </div>
        <Textarea
          aria-label="Pain points and motivation"
          value={data.painPoints}
          onChange={(e) => onChange({ ...data, painPoints: e.target.value })}
          placeholder="Describe current challenges, business pain points, and the primary motivation for change..."
          rows={5}
        />
      </Card>

      {/* Collapsible Accordion for other sections */}
      <Accordion title="Business Entities" subtitle="Companies, divisions, subsidiaries (TOGAF organizational view)">
        <EntitiesSection
          entities={data.entities}
          viewMode={viewMode}
          onUpdate={updateEntity}
          onRemove={removeEntity}
          onAdd={addEntity}
          onChange={(entities) => onChange({ ...data, entities })}
        />
      </Accordion>

      <Accordion title="Key Actors & Activities" subtitle="Stakeholders and what they do (TOGAF ADM-aligned)">
        <ActorsSection
          actors={data.actors}
          viewMode={viewMode}
          onUpdate={updateActor}
          onRemove={removeActor}
          onAdd={addActor}
          onChange={(actors) => onChange({ ...data, actors })}
        />
      </Accordion>

      <Accordion title="Required Capabilities" subtitle="What the business needs to be able to do (TOGAF-aligned)">
        <CapabilitiesSection
          capabilities={data.capabilities}
          onUpdate={updateCapability}
          onRemove={removeCapability}
          onAdd={addCapability}
          onChange={(caps) => onChange({ ...data, capabilities: caps })}
        />
      </Accordion>

      {/* View Toggle for sections inside accordions */}
      <div className={styles.viewToggleRow}>
        <span className={styles.viewToggleLabel} id="view-mode-label">View mode for details:</span>
        <div
          role="radiogroup"
          aria-labelledby="view-mode-label"
          className={styles.segmented}
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === "card"}
            onClick={() => setViewMode("card")}
            className={clsx(styles.segmentedBtn, viewMode === "card" && styles.segmentedBtnActive)}
          >
            <LayoutGrid size={14} aria-hidden="true" />
            Card View
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={clsx(styles.segmentedBtn, viewMode === "list" && styles.segmentedBtnActive)}
          >
            <List size={14} aria-hidden="true" />
            List View
          </button>
        </div>
      </div>

      {/* Generate Button */}
      {hasData && (
        <div className={clsx(styles.generateRow, styles.generateRowCentered)}>
          <Button variant="primary" size="lg" onClick={onGenerate}>
            Generate Diagram
          </Button>
        </div>
      )}
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
    <div className={styles.itemCard}>
      <div className={styles.itemCardHead}>
        <Input
          aria-label="Entity name"
          size="sm"
          value={entity.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Entity Name"
          className={styles.grow}
        />
        <Button
          iconOnly
          label={`Remove entity ${entity.name || 'untitled'}`}
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={onRemove}
        />
      </div>
      <Input
        aria-label="Entity location"
        size="sm"
        value={entity.location || ""}
        onChange={(e) => onUpdate({ location: e.target.value })}
        placeholder="Location (optional)"
      />
      <Textarea
        aria-label="Entity description"
        value={entity.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description (optional)"
        rows={3}
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
    <div className={styles.itemCard}>
      <div className={styles.itemCardHead}>
        <Input
          aria-label="Actor name"
          size="sm"
          value={actor.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Actor Name (e.g., CFO)"
          className={styles.grow}
        />
        <Button
          iconOnly
          label={`Remove actor ${actor.name || 'untitled'}`}
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={onRemove}
        />
      </div>
      <div className={styles.itemCardRow}>
        <Input
          aria-label="Actor role"
          size="sm"
          value={actor.role}
          onChange={(e) => onUpdate({ role: e.target.value })}
          placeholder="Role"
        />
        <Input
          aria-label="Actor department"
          size="sm"
          value={actor.department}
          onChange={(e) => onUpdate({ department: e.target.value })}
          placeholder="Department"
        />
      </div>
      <Textarea
        aria-label="Actor key activities"
        value={actor.activities.join("\n")}
        onChange={(e) =>
          onUpdate({ activities: e.target.value.split("\n").filter((a) => a.trim()) })
        }
        placeholder="Key activities (one per line)"
        rows={4}
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
    <div className={styles.stack}>
      {/* Template Selector */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowTemplates(!showTemplates)}
          aria-expanded={showTemplates}
        >
          {showTemplates ? "Hide" : "Load"} TOGAF Templates
        </Button>

        {showTemplates && (
          <div className={styles.templatePanel}>
            <h4 className={styles.templatePanelTitle}>Select a TOGAF Capability Domain</h4>
            <div className={styles.templateGrid}>
              {Object.entries(TOGAF_CAPABILITY_TEMPLATES).map(([category, caps]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => loadTemplate(category, caps)}
                  className={styles.templateBtn}
                >
                  <span className={styles.templateBtnName}>{category}</span>
                  <span className={styles.templateBtnCount}>{caps.length} capabilities</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Capabilities Display */}
      <div className={styles.pillRow}>
        {capabilities.map((cap) => (
          <CapabilityTag
            key={cap.id}
            capability={cap}
            onUpdate={(updates) => onUpdate(cap.id, updates)}
            onRemove={() => onRemove(cap.id)}
          />
        ))}
        <button type="button" onClick={onAdd} className={styles.addPill}>
          <Plus size={12} aria-hidden="true" />
          <span>Add Custom Capability</span>
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
      <input
        autoFocus
        type="text"
        aria-label="Capability name"
        value={capability.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setIsEditing(false);
          if (e.key === "Escape") setIsEditing(false);
        }}
        className={styles.capPillInput}
      />
    );
  }

  // Category-specific tone. The ds palette has five tones; nearby domains
  // share one, and the category name stays in the tooltip either way.
  const categoryTone: Record<string, string> = {
    "Finance & Accounting": styles.capPillInfo,
    "Human Capital Management": styles.capPillSuccess,
    "Supply Chain Management": styles.capPillWarning,
    "Customer Management": styles.capPillAccent,
    "Product & Service Management": styles.capPillInfo,
    "IT Service Management": styles.capPillAccent,
    "Risk & Compliance": styles.capPillDanger,
    "Strategy & Governance": "",
  };

  const toneClass = categoryTone[capability.category || ""] || "";

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx(styles.capPill, toneClass)}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsEditing(true); }}
      title={capability.category ? `Category: ${capability.category}` : "Click to edit"}
    >
      <span className={styles.capPillDot} aria-hidden="true" />
      <span>{capability.name || "Click to edit"}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={styles.capPillRemove}
        aria-label={`Remove capability ${capability.name || 'untitled'}`}
      >
        <Trash2 size={12} aria-hidden="true" />
      </button>
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
    <div className={styles.stack}>
      {/* Template Selector */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowTemplates(!showTemplates)}
          aria-expanded={showTemplates}
        >
          {showTemplates ? "Hide" : "Load"} TOGAF Entity Templates
        </Button>

        {showTemplates && (
          <div className={styles.templatePanel}>
            <h4 className={styles.templatePanelTitle}>Select an Organization Type</h4>
            <div className={styles.templateGrid}>
              {Object.entries(TOGAF_ENTITY_TEMPLATES).map(([templateName, entityTemplates]) => (
                <button
                  key={templateName}
                  type="button"
                  onClick={() => loadTemplate(templateName, entityTemplates)}
                  className={styles.templateBtn}
                >
                  <span className={styles.templateBtnName}>{templateName}</span>
                  <span className={styles.templateBtnCount}>{entityTemplates.length} entities</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View */}
      {viewMode === "card" ? (
        <div className={styles.cardGrid}>
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
    <div className={styles.stack}>
      {/* Template Selector */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowTemplates(!showTemplates)}
          aria-expanded={showTemplates}
        >
          {showTemplates ? "Hide" : "Load"} TOGAF Stakeholder Templates
        </Button>

        {showTemplates && (
          <div className={styles.templatePanel}>
            <h4 className={styles.templatePanelTitle}>Select a Stakeholder Group (TOGAF ADM)</h4>
            <div className={styles.templateGrid}>
              {Object.entries(TOGAF_ACTOR_TEMPLATES).map(([templateName, actorTemplates]) => (
                <button
                  key={templateName}
                  type="button"
                  onClick={() => loadTemplate(templateName, actorTemplates)}
                  className={styles.templateBtn}
                >
                  <span className={styles.templateBtnName}>{templateName}</span>
                  <span className={styles.templateBtnCount}>{actorTemplates.length} stakeholders</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View */}
      {viewMode === "card" ? (
        <div className={clsx(styles.cardGrid, styles.cardGridWide)}>
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
    <DataTable
      caption="Business entities"
      columns={[
        {
          key: "name",
          header: "Name",
          render: (entity: BusinessEntity) => (
            <Input
              aria-label={`Name of entity ${entity.name || 'untitled'}`}
              size="sm"
              value={entity.name}
              onChange={(e) => onUpdate(entity.id, { name: e.target.value })}
              placeholder="Entity name"
            />
          ),
        },
        {
          key: "location",
          header: "Location",
          render: (entity: BusinessEntity) => (
            <Input
              aria-label={`Location of entity ${entity.name || 'untitled'}`}
              size="sm"
              value={entity.location || ""}
              onChange={(e) => onUpdate(entity.id, { location: e.target.value })}
              placeholder="Location"
            />
          ),
        },
        {
          key: "description",
          header: "Description",
          render: (entity: BusinessEntity) => (
            <Input
              aria-label={`Description of entity ${entity.name || 'untitled'}`}
              size="sm"
              value={entity.description || ""}
              onChange={(e) => onUpdate(entity.id, { description: e.target.value })}
              placeholder="Description"
            />
          ),
        },
        {
          key: "actions",
          header: "Actions",
          width: "60px",
          render: (entity: BusinessEntity) => (
            <div className={styles.rowActions}>
              <Button
                iconOnly
                label={`Remove entity ${entity.name || 'untitled'}`}
                variant="ghost"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => onRemove(entity.id)}
              />
            </div>
          ),
        },
      ]}
      rows={entities}
      rowKey={(entity) => entity.id}
      emptyState={
        <EmptyState
          kind="first-run"
          title="No entities yet"
          body="Add an entity or load a TOGAF entity template to get started."
        />
      }
      footer={
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={onAdd}>
          Add Entity
        </Button>
      }
    />
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
    <DataTable
      caption="Key actors and activities"
      columns={[
        {
          key: "name",
          header: "Name",
          render: (actor: Actor) => (
            <Input
              aria-label={`Name of actor ${actor.name || 'untitled'}`}
              size="sm"
              value={actor.name}
              onChange={(e) => onUpdate(actor.id, { name: e.target.value })}
              placeholder="Actor name"
            />
          ),
        },
        {
          key: "role",
          header: "Role",
          render: (actor: Actor) => (
            <Input
              aria-label={`Role of actor ${actor.name || 'untitled'}`}
              size="sm"
              value={actor.role}
              onChange={(e) => onUpdate(actor.id, { role: e.target.value })}
              placeholder="Role"
            />
          ),
        },
        {
          key: "department",
          header: "Department",
          render: (actor: Actor) => (
            <Input
              aria-label={`Department of actor ${actor.name || 'untitled'}`}
              size="sm"
              value={actor.department}
              onChange={(e) => onUpdate(actor.id, { department: e.target.value })}
              placeholder="Department"
            />
          ),
        },
        {
          key: "activities",
          header: "Activities",
          render: (actor: Actor) => (
            <Input
              aria-label={`Activities of actor ${actor.name || 'untitled'}`}
              size="sm"
              value={actor.activities.join(", ")}
              onChange={(e) =>
                onUpdate(actor.id, {
                  activities: e.target.value.split(",").map((a) => a.trim()).filter((a) => a),
                })
              }
              placeholder="Activities (comma-separated)"
            />
          ),
        },
        {
          key: "actions",
          header: "Actions",
          width: "60px",
          render: (actor: Actor) => (
            <div className={styles.rowActions}>
              <Button
                iconOnly
                label={`Remove actor ${actor.name || 'untitled'}`}
                variant="ghost"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => onRemove(actor.id)}
              />
            </div>
          ),
        },
      ]}
      rows={actors}
      rowKey={(actor) => actor.id}
      emptyState={
        <EmptyState
          kind="first-run"
          title="No actors yet"
          body="Add an actor or load a TOGAF stakeholder template to get started."
        />
      }
      footer={
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={onAdd}>
          Add Actor
        </Button>
      }
    />
  );
}
