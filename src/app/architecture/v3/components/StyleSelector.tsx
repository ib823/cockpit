/**
 * Style Selector Modal
 * Let users choose visual style, actor display, and layout before generating
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { DiagramSettings, VisualStyle, ActorDisplay, LayoutMode } from "../types";
import { useModalFocusTrap } from "../hooks/useFocusTrap";

interface StyleSelectorProps {
  currentSettings: DiagramSettings;
  onGenerate: (settings: DiagramSettings) => void;
  onClose: () => void;
}

export function StyleSelector({ currentSettings, onGenerate, onClose }: StyleSelectorProps) {
  const [settings, setSettings] = useState<DiagramSettings>(currentSettings);
  const modalRef = useModalFocusTrap(true, onClose);

  const handleGenerate = () => {
    onGenerate(settings);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-selector-title"
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <h2
            id="style-selector-title"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 600,
              color: "#000",
            }}
          >
            Choose Your Visual Style
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#f5f5f5",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close style selector"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Visual Style */}
        <Section title="1. Visual Style" subtitle="How should boxes and cards look?">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <StyleOption
              name="Clean & Modern"
              description="Subtle shadows, rounded corners, professional"
              value="clean"
              selected={settings.visualStyle === "clean"}
              onSelect={() => setSettings({ ...settings, visualStyle: "clean" })}
              preview={
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    textAlign: "center",
                    fontSize: "12px",
                  }}
                >
                  Clean Style
                </div>
              }
            />
            <StyleOption
              name="Bold & Flat"
              description="High contrast, bold colors, presentation-ready"
              value="bold"
              selected={settings.visualStyle === "bold"}
              onSelect={() => setSettings({ ...settings, visualStyle: "bold" })}
              preview={
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#2563A5",
                    borderRadius: "4px",
                    border: "3px solid #1e4a80",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  Bold Style
                </div>
              }
            />
            <StyleOption
              name="Premium & Gradient"
              description="Glossy gradients, polished, enterprise-grade"
              value="gradient"
              selected={settings.visualStyle === "gradient"}
              onSelect={() => setSettings({ ...settings, visualStyle: "gradient" })}
              preview={
                <div
                  style={{
                    padding: "16px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  Gradient
                </div>
              }
            />
          </div>
        </Section>

        {/* Actor Display */}
        <Section title="2. Actor Display" subtitle="How to show stakeholders?">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <OptionCard
              title="Detailed Cards"
              description="Full cards with role, department, and activities"
              selected={settings.actorDisplay === "cards"}
              onClick={() => setSettings({ ...settings, actorDisplay: "cards" })}
            />
            <OptionCard
              title="Simple Tags"
              description="Compact tags showing just name and role"
              selected={settings.actorDisplay === "tags"}
              onClick={() => setSettings({ ...settings, actorDisplay: "tags" })}
            />
          </div>
        </Section>

        {/* Layout Mode */}
        <Section title="3. Layout Mode" subtitle="How to organize current landscape?">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <OptionCard
              title="Swim Lanes"
              description="Separate section for each business entity"
              selected={settings.layoutMode === "swim-lanes"}
              onClick={() => setSettings({ ...settings, layoutMode: "swim-lanes" })}
            />
            <OptionCard
              title="Grouped Grid"
              description="All systems in one grid, tagged by entity"
              selected={settings.layoutMode === "grouped"}
              onClick={() => setSettings({ ...settings, layoutMode: "grouped" })}
            />
          </div>
        </Section>

        {/* Additional Options */}
        <Section title="4. Additional Options">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Checkbox
              label="Show legend"
              checked={settings.showLegend}
              onChange={(checked) => setSettings({ ...settings, showLegend: checked })}
            />
            <Checkbox
              label="Show icons"
              checked={settings.showIcons}
              onChange={(checked) => setSettings({ ...settings, showIcons: checked })}
            />
          </div>
        </Section>

        {/* Actions */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              backgroundColor: "#fff",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            style={{
              padding: "12px 32px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: "#2563A5",
              color: "#fff",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Generate Diagram
          </button>
        </div>
      </div>
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
    <div style={{ marginBottom: "32px" }}>
      <h3
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "16px",
          fontWeight: 600,
          color: "#000",
          marginBottom: "4px",
        }}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#666",
            marginBottom: "16px",
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

function StyleOption({
  name,
  description,
  value,
  selected,
  onSelect,
  preview,
}: {
  name: string;
  description: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  preview: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: "16px",
        border: `2px solid ${selected ? "#2563A5" : "#e0e0e0"}`,
        borderRadius: "8px",
        backgroundColor: selected ? "#f0f7ff" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 200ms ease",
      }}
    >
      <div style={{ marginBottom: "12px" }}>{preview}</div>
      <div
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "14px",
          fontWeight: 600,
          color: "#000",
          marginBottom: "4px",
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "12px",
          color: "#666",
          lineHeight: "1.4",
        }}
      >
        {description}
      </div>
    </button>
  );
}

function OptionCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "20px",
        border: `2px solid ${selected ? "#2563A5" : "#e0e0e0"}`,
        borderRadius: "8px",
        backgroundColor: selected ? "#f0f7ff" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 200ms ease",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "15px",
          fontWeight: 600,
          color: "#000",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "13px",
          color: "#666",
          lineHeight: "1.4",
        }}
      >
        {description}
      </div>
    </button>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        fontFamily: "var(--font-text)",
        fontSize: "14px",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "18px", height: "18px", cursor: "pointer" }}
      />
      {label}
    </label>
  );
}
