/**
 * Business Context Tab
 * Capture: Entities, Actors, Capabilities, Pain Points
 */

"use client";

import React, { useState } from "react";
import { Plus, Trash2, LayoutGrid, List, ChevronDown } from "lucide-react";
import type { BusinessContextData, BusinessEntity, Actor, Capability } from "../types";
import clsx from "clsx";

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
    <div className="border border-subtle rounded-xl overflow-hidden bg-primary mb-4 transition-default shadow-sm hover:shadow-md">
      <button
        className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary transition-default focus-visible:ring-inset"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="display-small mb-1">{title}</h3>
          <p className="detail text-secondary">{subtitle}</p>
        </div>
        <ChevronDown
          className={clsx("w-5 h-5 text-secondary transition-default", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div
          className="p-6 border-t border-subtle bg-secondary/30"
          id={contentId}
          role="region"
        >
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
    <div className="space-y-6">
      {/* Pain Points is now the primary, always-visible section */}
      <Section title="Pain Points & Motivation" subtitle="Start here: Why does your business need to transform?">
        <textarea
          value={data.painPoints}
          onChange={(e) => onChange({ ...data, painPoints: e.target.value })}
          placeholder="Describe current challenges, business pain points, and the primary motivation for change..."
          className="w-full min-h-[120px] p-4 rounded-xl border border-strong bg-primary body text-[15px] focus:border-blue focus:ring-2 focus:ring-blue-light outline-none transition-default"
        />
      </Section>

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
      <div className="flex items-center justify-between py-4 border-t border-subtle">
        <span className="body text-sm text-secondary" id="view-mode-label">View mode for details:</span>
        <div
          role="radiogroup"
          aria-labelledby="view-mode-label"
          className="flex items-center bg-secondary rounded-lg p-1 gap-1"
        >
          <button
            role="radio"
            aria-checked={viewMode === "card"}
            onClick={() => setViewMode("card")}
            className={clsx(
              "flex items-center gap-2 py-1.5 px-4 rounded-md body text-sm font-semibold cursor-pointer transition-default",
              viewMode === "card" ? "bg-primary text-blue shadow-sm" : "bg-transparent text-secondary hover:text-primary"
            )}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Card View
          </button>
          <button
            role="radio"
            aria-checked={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={clsx(
              "flex items-center gap-2 py-1.5 px-4 rounded-md body text-sm font-semibold cursor-pointer transition-default",
              viewMode === "list" ? "bg-primary text-blue shadow-sm" : "bg-transparent text-secondary hover:text-primary"
            )}
          >
            <List className="w-4 h-4" aria-hidden="true" />
            List View
          </button>
        </div>
      </div>

      {/* Generate Button */}
      {hasData && (
        <div className="flex justify-center pt-8">
          <button
            onClick={onGenerate}
            className="py-3 px-10 bg-blue color-white rounded-xl display-small font-bold shadow-lg hover:bg-blue-dark hover:scale-[1.02] active:scale-[0.98] transition-default cursor-pointer"
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
    <div className="mb-8">
      <h3 className="display-small mb-1">{title}</h3>
      {subtitle && (
        <p className="detail text-secondary mb-4">{subtitle}</p>
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
    <div className="relative p-6 bg-primary border border-strong rounded-xl shadow-sm hover:shadow-md transition-default group">
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-red-light hover:text-red transition-default opacity-0 group-hover:opacity-100"
        aria-label={`Remove entity ${entity.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>
      <input
        type="text"
        value={entity.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Entity Name"
        className="w-full mb-4 pb-2 border-b-2 border-subtle bg-transparent body-semibold text-lg outline-none focus:border-blue transition-default"
      />
      <input
        type="text"
        value={entity.location || ""}
        onChange={(e) => onUpdate({ location: e.target.value })}
        placeholder="Location (optional)"
        className="w-full mb-3 p-2 rounded-md border border-subtle bg-secondary/50 body text-sm focus:border-blue outline-none transition-default"
      />
      <textarea
        value={entity.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description (optional)"
        className="w-full min-h-[80px] p-2 rounded-md border border-subtle bg-secondary/50 body text-sm focus:border-blue outline-none transition-default resize-none"
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
    <div className="relative p-6 bg-primary border border-strong rounded-xl shadow-sm hover:shadow-md transition-default group">
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-red-light hover:text-red transition-default opacity-0 group-hover:opacity-100"
        aria-label={`Remove actor ${actor.name || 'untitled'}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>
      <input
        type="text"
        value={actor.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Actor Name (e.g., CFO)"
        className="w-full mb-4 pb-2 border-b-2 border-subtle bg-transparent body-semibold text-lg outline-none focus:border-blue transition-default"
      />
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={actor.role}
          onChange={(e) => onUpdate({ role: e.target.value })}
          placeholder="Role"
          className="flex-1 p-2 rounded-md border border-subtle bg-secondary/50 body text-sm focus:border-blue outline-none transition-default"
        />
        <input
          type="text"
          value={actor.department}
          onChange={(e) => onUpdate({ department: e.target.value })}
          placeholder="Department"
          className="flex-1 p-2 rounded-md border border-subtle bg-secondary/50 body text-sm focus:border-blue outline-none transition-default"
        />
      </div>
      <textarea
        value={actor.activities.join("\n")}
        onChange={(e) =>
          onUpdate({ activities: e.target.value.split("\n").filter((a) => a.trim()) })
        }
        placeholder="Key activities (one per line)"
        className="w-full min-h-[100px] p-2 rounded-md border border-subtle bg-secondary/50 body text-sm focus:border-blue outline-none transition-default resize-none"
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
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="template-loader">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-blue text-blue rounded-md body-semibold hover:bg-blue-light transition-default cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {showTemplates ? "Hide" : "Load"} TOGAF Templates
        </button>

        {showTemplates && (
          <div className="mt-4 p-6 bg-secondary rounded-xl border border-strong shadow-sm animate-fade-in">
            <h4 className="body-semibold text-primary mb-4">Select a TOGAF Capability Domain</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(TOGAF_CAPABILITY_TEMPLATES).map(([category, caps]) => (
                <button
                  key={category}
                  onClick={() => loadTemplate(category, caps)}
                  className="flex flex-col p-4 text-left bg-primary border border-subtle rounded-lg hover:border-blue hover:bg-blue-light transition-default cursor-pointer"
                >
                  <div className="body-semibold mb-1">{category}</div>
                  <div className="detail text-secondary">{caps.length} capabilities</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Capabilities Display */}
      <div className="flex flex-wrap gap-2">
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
          className="inline-flex items-center gap-2 py-2 px-4 rounded-full border-2 border-dashed border-strong bg-transparent text-secondary hover:border-blue hover:text-blue transition-default cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="detail font-semibold">Add Custom Capability</span>
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
      <div className="flex items-center">
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
          className="py-1.5 px-3 rounded-full border-2 border-blue bg-primary body text-xs outline-none min-w-[120px]"
        />
      </div>
    );
  }

  // Get category specific styling
  const categoryStyles: Record<string, string> = {
    "Finance & Accounting": "bg-blue-light text-blue border-blue/20",
    "Human Capital Management": "bg-green-light text-green border-green/20",
    "Supply Chain Management": "bg-orange-light text-orange border-orange/20",
    "Customer Management": "bg-pink-light text-pink border-pink/20",
    "Product & Service Management": "bg-purple-light text-purple border-purple/20",
    "IT Service Management": "bg-indigo-light text-indigo border-indigo/20",
    "Risk & Compliance": "bg-red-light text-red border-red/20",
    "Strategy & Governance": "bg-gray-6 text-gray-1 border-gray-4",
  };

  const currentStyle = categoryStyles[capability.category || ""] || "bg-secondary text-primary border-strong";

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border body text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-default group",
        currentStyle
      )}
      onClick={() => setIsEditing(true)}
      title={capability.category ? `Category: ${capability.category}` : "Click to edit"}
    >
      <div className={clsx("w-1.5 h-1.5 rounded-full", currentStyle.split(' ')[1].replace('text', 'bg'))} />
      <span>{capability.name || "Click to edit"}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/5 transition-default"
        aria-label={`Remove capability ${capability.name || 'untitled'}`}
      >
        <Trash2 className="w-3 h-3" aria-hidden="true" />
      </button>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-8 min-h-[180px] border-2 border-dashed border-strong bg-secondary/30 rounded-xl hover:bg-blue-light hover:border-blue transition-default cursor-pointer group"
    >
      <Plus className="w-8 h-8 text-secondary group-hover:text-blue mb-2 transition-default" />
      <span className="body-semibold text-secondary group-hover:text-blue transition-default">{label}</span>
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
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="template-loader">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-blue text-blue rounded-md body-semibold hover:bg-blue-light transition-default cursor-pointer"
          aria-expanded={showTemplates}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {showTemplates ? "Hide" : "Load"} TOGAF Entity Templates
        </button>

        {showTemplates && (
          <div className="mt-4 p-6 bg-secondary rounded-xl border border-strong shadow-sm animate-fade-in">
            <h4 className="body-semibold text-primary mb-4">Select an Organization Type</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(TOGAF_ENTITY_TEMPLATES).map(([templateName, entityTemplates]) => (
                <button
                  key={templateName}
                  onClick={() => loadTemplate(templateName, entityTemplates)}
                  className="flex flex-col p-4 text-left bg-primary border border-subtle rounded-lg hover:border-blue hover:bg-blue-light transition-default cursor-pointer"
                >
                  <div className="body-semibold mb-1">{templateName}</div>
                  <div className="detail text-secondary">{entityTemplates.length} entities</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="template-loader">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-blue text-blue rounded-md body-semibold hover:bg-blue-light transition-default cursor-pointer"
          aria-expanded={showTemplates}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {showTemplates ? "Hide" : "Load"} TOGAF Stakeholder Templates
        </button>

        {showTemplates && (
          <div className="mt-4 p-6 bg-secondary rounded-xl border border-strong shadow-sm animate-fade-in">
            <h4 className="body-semibold text-primary mb-4">Select a Stakeholder Group (TOGAF ADM)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(TOGAF_ACTOR_TEMPLATES).map(([templateName, actorTemplates]) => (
                <button
                  key={templateName}
                  onClick={() => loadTemplate(templateName, actorTemplates)}
                  className="flex flex-col p-4 text-left bg-primary border border-subtle rounded-lg hover:border-blue hover:bg-blue-light transition-default cursor-pointer"
                >
                  <div className="body-semibold mb-1">{templateName}</div>
                  <div className="detail text-secondary">{actorTemplates.length} stakeholders</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    <div className="border border-strong rounded-xl bg-primary overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1.5fr_3fr_44px] gap-4 p-4 bg-secondary border-b border-strong body-semibold text-xs text-secondary uppercase tracking-wider">
        <div>Name</div>
        <div>Location</div>
        <div>Description</div>
        <div></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-subtle">
        {entities.map((entity) => (
          <div key={entity.id} className="grid grid-cols-[2fr_1.5fr_3fr_44px] gap-4 p-4 hover:bg-secondary/30 transition-default items-center">
            <input
              type="text"
              value={entity.name}
              onChange={(e) => onUpdate(entity.id, { name: e.target.value })}
              placeholder="Entity name"
              className="p-2 rounded-md border border-subtle bg-transparent body text-sm focus:border-blue outline-none transition-default"
            />
            <input
              type="text"
              value={entity.location || ""}
              onChange={(e) => onUpdate(entity.id, { location: e.target.value })}
              placeholder="Location"
              className="p-2 rounded-md border border-subtle bg-transparent body text-sm focus:border-blue outline-none transition-default"
            />
            <input
              type="text"
              value={entity.description || ""}
              onChange={(e) => onUpdate(entity.id, { description: e.target.value })}
              placeholder="Description"
              className="p-2 rounded-md border border-subtle bg-transparent body text-sm focus:border-blue outline-none transition-default"
            />
            <button
              onClick={() => onRemove(entity.id)}
              className="p-2 rounded-full text-secondary hover:bg-red-light hover:text-red transition-default"
              aria-label={`Remove entity ${entity.name || 'untitled'}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Row */}
      <div className="p-4 bg-secondary/20 border-t border-subtle">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-blue text-blue rounded-md body-semibold hover:bg-blue-light transition-default cursor-pointer"
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
    <div className="border border-strong rounded-xl bg-primary overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1.5fr_1.5fr_3fr_44px] gap-4 p-4 bg-secondary border-b border-strong body-semibold text-xs text-secondary uppercase tracking-wider">
        <div>Name</div>
        <div>Role</div>
        <div>Department</div>
        <div>Activities</div>
        <div></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-subtle">
        {actors.map((actor) => (
          <div key={actor.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_3fr_44px] gap-4 p-4 hover:bg-secondary/30 transition-default items-center">
            <input
              type="text"
              value={actor.name}
              onChange={(e) => onUpdate(actor.id, { name: e.target.value })}
              placeholder="Actor name"
              className="p-2 rounded-md border border-subtle bg-transparent body text-sm focus:border-blue outline-none transition-default"
            />
            <input
              type="text"
              value={actor.role}
              onChange={(e) => onUpdate(actor.id, { role: e.target.value })}
              placeholder="Role"
              className="p-2 rounded-md border border-subtle bg-transparent body text-sm focus:border-blue outline-none transition-default"
            />
            <input
              type="text"
              value={actor.department}
              onChange={(e) => onUpdate(actor.id, { department: e.target.value })}
              placeholder="Department"
              className="p-2 rounded-md border border-subtle bg-transparent body text-sm focus:border-blue outline-none transition-default"
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
              className="p-2 rounded-md border border-subtle bg-transparent body text-sm focus:border-blue outline-none transition-default"
            />
            <button
              onClick={() => onRemove(actor.id)}
              className="p-2 rounded-full text-secondary hover:bg-red-light hover:text-red transition-default"
              aria-label={`Remove actor ${actor.name || 'untitled'}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Row */}
      <div className="p-4 bg-secondary/20 border-t border-subtle">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 py-2 px-4 bg-primary border-2 border-blue text-blue rounded-md body-semibold hover:bg-blue-light transition-default cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Actor
        </button>
      </div>
    </div>
  );
}
