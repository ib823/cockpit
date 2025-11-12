/**
 * Business Landscape Canvas
 * Visual representation of business context, AS-IS state, TO-BE vision
 *
 * Shows:
 * - Motivation & business context
 * - Current landscape (AS-IS)
 * - Future vision (TO-BE)
 * - Actors, systems, integrations, entities
 * - All in simple, beautiful blocks
 */

"use client";

import { useState } from "react";
import { Plus, Edit2, Users, Building2, Database, ArrowRight, Zap } from "lucide-react";

interface LandscapeItem {
  id: string;
  name: string;
  type?: string;
  description?: string;
}

export function BusinessLandscapeCanvas() {
  const [motivation, setMotivation] = useState("");
  const [actors, setActors] = useState<LandscapeItem[]>([]);
  const [externalSystems, setExternalSystems] = useState<LandscapeItem[]>([]);
  const [asIsModules, setAsIsModules] = useState<LandscapeItem[]>([]);
  const [toBeModules, setToBeModules] = useState<LandscapeItem[]>([]);
  const [entities, setEntities] = useState<LandscapeItem[]>([]);

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
          Business Landscape
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
          Visualize your business context, current state, and future vision in one simple diagram
        </p>
      </div>

      {/* Section 1: Motivation & Context */}
      <Section title="Why We're Transforming" icon={<Zap className="w-5 h-5" />}>
        <MotivationBox value={motivation} onChange={setMotivation} />
      </Section>

      {/* Section 2: Stakeholders & External Systems */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: "32px" }}>
        <Section title="Key Stakeholders" icon={<Users className="w-5 h-5" />}>
          <BlockGrid
            items={actors}
            placeholder="Add stakeholder..."
            color="blue"
            onAdd={(name) => setActors([...actors, { id: Date.now().toString(), name }])}
          />
        </Section>

        <Section title="External Systems" icon={<Building2 className="w-5 h-5" />}>
          <BlockGrid
            items={externalSystems}
            placeholder="Add external system..."
            color="purple"
            onAdd={(name) =>
              setExternalSystems([...externalSystems, { id: Date.now().toString(), name }])
            }
          />
        </Section>
      </div>

      {/* Section 3: AS-IS vs TO-BE (Side by Side) */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: "32px" }}>
        <Section
          title="Current State (AS-IS)"
          subtitle="What we have today"
          icon={<Database className="w-5 h-5" />}
        >
          <BlockGrid
            items={asIsModules}
            placeholder="Add current system..."
            color="gray"
            onAdd={(name) => setAsIsModules([...asIsModules, { id: Date.now().toString(), name }])}
          />
        </Section>

        <Section
          title="Future Vision (TO-BE)"
          subtitle="Where we're heading"
          icon={<Zap className="w-5 h-5" />}
        >
          <BlockGrid
            items={toBeModules}
            placeholder="Add future system..."
            color="green"
            onAdd={(name) => setToBeModules([...toBeModules, { id: Date.now().toString(), name }])}
          />
        </Section>
      </div>

      {/* Transformation Arrow (Visual Connector) */}
      {asIsModules.length > 0 && toBeModules.length > 0 && (
        <div
          style={{
            textAlign: "center",
            margin: "24px 0",
            padding: "16px",
            backgroundColor: "var(--color-gray-6)",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-gray-1)",
            }}
          >
            <span>Digital Transformation Journey</span>
            <ArrowRight className="w-5 h-5" style={{ color: "var(--color-blue)" }} />
            <span style={{ color: "var(--color-green)" }}>Cloud-First Future</span>
          </div>
        </div>
      )}

      {/* Section 4: Key Entities & Data */}
      <Section title="Key Business Entities" icon={<Database className="w-5 h-5" />}>
        <BlockGrid
          items={entities}
          placeholder="Add entity (Products, Orders, Customers...)..."
          color="orange"
          onAdd={(name) => setEntities([...entities, { id: Date.now().toString(), name }])}
        />
      </Section>

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
          Export Diagram
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
 * Motivation Box
 */
interface MotivationBoxProps {
  value: string;
  onChange: (value: string) => void;
}

function MotivationBox({ value, onChange }: MotivationBoxProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Describe your motivation for transformation... (e.g., 'Reduce manual processes, improve customer experience, enable real-time analytics, modernize legacy systems...')"
      style={{
        width: "100%",
        minHeight: "100px",
        padding: "16px",
        border: "1px solid var(--color-gray-4)",
        borderRadius: "8px",
        fontFamily: "var(--font-text)",
        fontSize: "14px",
        lineHeight: "1.6",
        resize: "vertical",
        outline: "none",
        transition: "border-color 200ms ease",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-blue)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-gray-4)")}
    />
  );
}

/**
 * Block Grid - Shows items as blocks
 */
interface BlockGridProps {
  items: LandscapeItem[];
  placeholder: string;
  color: "blue" | "purple" | "gray" | "green" | "orange";
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
    blue: { bg: "#EBF5FF", border: "#007AFF", text: "#005BBB" },
    purple: { bg: "#F3EBFF", border: "#AF52DE", text: "#8638C6" },
    gray: { bg: "#F5F5F7", border: "#8E8E93", text: "#636366" },
    green: { bg: "#EBFFF0", border: "#34C759", text: "#248A3D" },
    orange: { bg: "#FFF3EB", border: "#FF9500", text: "#CC7700" },
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
      {/* Existing Items */}
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
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {item.name}
        </div>
      ))}

      {/* Add New Item */}
      {isAdding ? (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
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
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = style.border;
            e.currentTarget.style.color = style.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-gray-4)";
            e.currentTarget.style.color = "var(--color-gray-1)";
          }}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      )}
    </div>
  );
}
