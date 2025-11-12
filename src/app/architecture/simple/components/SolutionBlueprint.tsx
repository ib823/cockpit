/**
 * Solution Blueprint
 * Technical architecture visualization - layers, integrations, security
 *
 * Shows:
 * - Architecture layers (Presentation, Application, Data)
 * - Integration patterns
 * - Security controls
 * - Deployment model
 * - All in simple, visual blocks
 */

"use client";

import { useState } from "react";
import { Plus, Layers, Shield, Network, Cloud, Database, Lock } from "lucide-react";

interface BlueprintItem {
  id: string;
  name: string;
  description?: string;
}

interface IntegrationPattern {
  id: string;
  name: string;
  type: "api" | "batch" | "event" | "sync";
}

export function SolutionBlueprint() {
  const [presentationLayer, setPresentationLayer] = useState<BlueprintItem[]>([]);
  const [applicationLayer, setApplicationLayer] = useState<BlueprintItem[]>([]);
  const [dataLayer, setDataLayer] = useState<BlueprintItem[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationPattern[]>([]);
  const [securityControls, setSecurityControls] = useState<BlueprintItem[]>([]);
  const [deploymentModel, setDeploymentModel] = useState("");

  return (
    <div
      style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "48px 32px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "48px", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: "var(--weight-semibold)",
            color: "#000",
            marginBottom: "12px",
          }}
        >
          Solution Blueprint
        </h2>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "16px",
            color: "var(--color-gray-1)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Design your technical architecture in simple layers
        </p>
      </div>

      {/* Architecture Layers */}
      <Section title="Architecture Layers" icon={<Layers className="w-5 h-5" />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Layer 1: Presentation */}
          <LayerBox
            title="Presentation Layer"
            subtitle="User interfaces, portals, mobile apps"
            items={presentationLayer}
            onAdd={(name) =>
              setPresentationLayer([...presentationLayer, { id: Date.now().toString(), name }])
            }
            color="blue"
            icon={<Cloud className="w-4 h-4" />}
          />

          {/* Layer 2: Application */}
          <LayerBox
            title="Application Layer"
            subtitle="Business logic, services, APIs"
            items={applicationLayer}
            onAdd={(name) =>
              setApplicationLayer([...applicationLayer, { id: Date.now().toString(), name }])
            }
            color="purple"
            icon={<Network className="w-4 h-4" />}
          />

          {/* Layer 3: Data */}
          <LayerBox
            title="Data Layer"
            subtitle="Databases, data warehouses, storage"
            items={dataLayer}
            onAdd={(name) => setDataLayer([...dataLayer, { id: Date.now().toString(), name }])}
            color="orange"
            icon={<Database className="w-4 h-4" />}
          />
        </div>
      </Section>

      {/* Integration Patterns */}
      <Section title="Integration Patterns" icon={<Network className="w-5 h-5" />}>
        <IntegrationGrid
          integrations={integrations}
          onAdd={(name, type) =>
            setIntegrations([...integrations, { id: Date.now().toString(), name, type }])
          }
        />
      </Section>

      {/* Security & Compliance */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: "32px" }}>
        <Section title="Security Controls" icon={<Shield className="w-5 h-5" />}>
          <BlockGrid
            items={securityControls}
            placeholder="Add security control..."
            color="red"
            onAdd={(name) =>
              setSecurityControls([...securityControls, { id: Date.now().toString(), name }])
            }
          />
        </Section>

        <Section title="Deployment Model" icon={<Cloud className="w-5 h-5" />}>
          <DeploymentSelector value={deploymentModel} onChange={setDeploymentModel} />
        </Section>
      </div>

      {/* Export Button */}
      <div style={{ marginTop: "48px", textAlign: "center" }}>
        <button
          style={{
            padding: "12px 32px",
            backgroundColor: "var(--color-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontFamily: "var(--font-text)",
            fontSize: "15px",
            fontWeight: "var(--weight-semibold)",
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0051D5")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-blue)")}
        >
          Export Blueprint
        </button>
      </div>
    </div>
  );
}

/**
 * Section Component
 */
interface SectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, subtitle, icon, children }: SectionProps) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {icon && <div style={{ color: "var(--color-blue)" }}>{icon}</div>}
        <div>
          <h3
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "18px",
              fontWeight: "var(--weight-semibold)",
              color: "#000",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "var(--color-gray-1)",
                marginTop: "2px",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * Layer Box - Shows architecture layer with items
 */
interface LayerBoxProps {
  title: string;
  subtitle: string;
  items: BlueprintItem[];
  onAdd: (name: string) => void;
  color: "blue" | "purple" | "orange";
  icon: React.ReactNode;
}

function LayerBox({ title, subtitle, items, onAdd, color, icon }: LayerBoxProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const handleAdd = () => {
    if (newItemName.trim()) {
      onAdd(newItemName.trim());
      setNewItemName("");
      setIsAdding(false);
    }
  };

  const colorStyles = {
    blue: { bg: "#EBF5FF", border: "#007AFF", text: "#005BBB" },
    purple: { bg: "#F3EBFF", border: "#AF52DE", text: "#8638C6" },
    orange: { bg: "#FFF3EB", border: "#FF9500", text: "#CC7700" },
  };

  const style = colorStyles[color];

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "var(--color-gray-6)",
        borderRadius: "12px",
        border: `2px solid ${style.border}`,
      }}
    >
      {/* Layer Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <div style={{ color: style.text }}>{icon}</div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "15px",
              fontWeight: "var(--weight-semibold)",
              color: style.text,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "12px",
              color: "var(--color-gray-1)",
              opacity: 0.7,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "8px 14px",
              backgroundColor: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: "var(--weight-medium)",
              color: style.text,
            }}
          >
            {item.name}
          </div>
        ))}

        {/* Add Button */}
        {isAdding ? (
          <input
            autoFocus
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setIsAdding(false);
            }}
            onBlur={handleAdd}
            placeholder="Component name..."
            style={{
              padding: "8px 14px",
              border: `2px solid ${style.border}`,
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              outline: "none",
              minWidth: "150px",
            }}
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              padding: "8px 14px",
              backgroundColor: "#fff",
              border: "1px dashed var(--color-gray-4)",
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-gray-1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Integration Grid
 */
interface IntegrationGridProps {
  integrations: IntegrationPattern[];
  onAdd: (name: string, type: "api" | "batch" | "event" | "sync") => void;
}

function IntegrationGrid({ integrations, onAdd }: IntegrationGridProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"api" | "batch" | "event" | "sync">("api");

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim(), newType);
      setNewName("");
      setIsAdding(false);
    }
  };

  const typeColors = {
    api: { bg: "#EBF5FF", border: "#007AFF", text: "#005BBB", label: "REST API" },
    batch: { bg: "#F3EBFF", border: "#AF52DE", text: "#8638C6", label: "Batch" },
    event: { bg: "#EBFFF0", border: "#34C759", text: "#248A3D", label: "Event" },
    sync: { bg: "#FFF3EB", border: "#FF9500", text: "#CC7700", label: "Real-time" },
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        minHeight: "100px",
        padding: "20px",
        backgroundColor: "var(--color-gray-6)",
        borderRadius: "8px",
      }}
    >
      {integrations.map((integration) => {
        const style = typeColors[integration.type];
        return (
          <div
            key={integration.id}
            style={{
              padding: "10px 16px",
              backgroundColor: style.bg,
              border: `2px solid ${style.border}`,
              borderRadius: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                fontWeight: "var(--weight-semibold)",
                color: style.text,
              }}
            >
              {integration.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "11px",
                color: style.text,
                opacity: 0.7,
              }}
            >
              {style.label}
            </div>
          </div>
        );
      })}

      {/* Add New */}
      {isAdding ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "10px",
            backgroundColor: "#fff",
            border: "2px solid var(--color-blue)",
            borderRadius: "6px",
            minWidth: "200px",
          }}
        >
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setIsAdding(false);
            }}
            placeholder="Integration name..."
            style={{
              padding: "6px 10px",
              border: "1px solid var(--color-gray-4)",
              borderRadius: "4px",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as any)}
            style={{
              padding: "6px 10px",
              border: "1px solid var(--color-gray-4)",
              borderRadius: "4px",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              outline: "none",
            }}
          >
            <option value="api">REST API</option>
            <option value="batch">Batch</option>
            <option value="event">Event-driven</option>
            <option value="sync">Real-time Sync</option>
          </select>
          <button
            onClick={handleAdd}
            style={{
              padding: "6px 10px",
              backgroundColor: "var(--color-blue)",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: "var(--weight-semibold)",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            padding: "10px 16px",
            backgroundColor: "#fff",
            border: "2px dashed var(--color-gray-4)",
            borderRadius: "6px",
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            fontWeight: "var(--weight-medium)",
            color: "var(--color-gray-1)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      )}
    </div>
  );
}

/**
 * Block Grid (reusable)
 */
interface BlockGridProps {
  items: BlueprintItem[];
  placeholder: string;
  color: "red" | "green";
  onAdd: (name: string) => void;
}

function BlockGrid({ items, placeholder, color, onAdd }: BlockGridProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const handleAdd = () => {
    if (newItemName.trim()) {
      onAdd(newItemName.trim());
      setNewItemName("");
      setIsAdding(false);
    }
  };

  const colorStyles = {
    red: { bg: "#FFEBEB", border: "#FF3B30", text: "#CC2E24" },
    green: { bg: "#EBFFF0", border: "#34C759", text: "#248A3D" },
  };

  const style = colorStyles[color];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        minHeight: "80px",
        padding: "16px",
        backgroundColor: "var(--color-gray-6)",
        borderRadius: "8px",
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            padding: "10px 16px",
            backgroundColor: style.bg,
            border: `2px solid ${style.border}`,
            borderRadius: "6px",
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            fontWeight: "var(--weight-medium)",
            color: style.text,
          }}
        >
          {item.name}
        </div>
      ))}

      {isAdding ? (
        <input
          autoFocus
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") setIsAdding(false);
          }}
          onBlur={handleAdd}
          placeholder={placeholder}
          style={{
            padding: "10px 16px",
            border: `2px solid ${style.border}`,
            borderRadius: "6px",
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            outline: "none",
            minWidth: "200px",
          }}
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            padding: "10px 16px",
            backgroundColor: "#fff",
            border: "2px dashed var(--color-gray-4)",
            borderRadius: "6px",
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            fontWeight: "var(--weight-medium)",
            color: "var(--color-gray-1)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      )}
    </div>
  );
}

/**
 * Deployment Selector
 */
interface DeploymentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

function DeploymentSelector({ value, onChange }: DeploymentSelectorProps) {
  const options = [
    { value: "cloud", label: "Cloud (AWS/Azure/GCP)", icon: "☁️" },
    { value: "onprem", label: "On-Premise", icon: "🏢" },
    { value: "hybrid", label: "Hybrid Cloud", icon: "🔀" },
    { value: "saas", label: "SaaS", icon: "🌐" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          style={{
            padding: "16px",
            backgroundColor: value === option.value ? "#EBF5FF" : "#fff",
            border: `2px solid ${value === option.value ? "var(--color-blue)" : "var(--color-gray-4)"}`,
            borderRadius: "8px",
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            fontWeight: "var(--weight-medium)",
            color: value === option.value ? "var(--color-blue)" : "#000",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            transition: "all 150ms ease",
          }}
        >
          <span style={{ fontSize: "24px" }}>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
