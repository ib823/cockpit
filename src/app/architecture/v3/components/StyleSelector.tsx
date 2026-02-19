/**
 * Style Selector Modal
 * Let users choose visual style, actor display, and layout before generating
 */

"use client";

import { useState } from "react";
import type { DiagramSettings } from "../types";
import { Modal, ModalButton } from "@/ui/components/Modal";
import clsx from "clsx";

interface StyleSelectorProps {
  currentSettings: DiagramSettings;
  onGenerate: (settings: DiagramSettings) => void;
  onClose: () => void;
}

export function StyleSelector({ currentSettings, onGenerate, onClose }: StyleSelectorProps) {
  const [settings, setSettings] = useState<DiagramSettings>(currentSettings);

  const handleGenerate = () => {
    onGenerate(settings);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Choose Your Visual Style"
      size="lg"
      footer={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton variant="primary" onClick={handleGenerate}>
            Generate Diagram
          </ModalButton>
        </>
      }
    >
      <div className="space-y-8">
        {/* Visual Style */}
        <Section title="1. Visual Style" subtitle="How should boxes and cards look?">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StyleOption
              name="Clean & Modern"
              description="Subtle shadows, rounded corners, professional"
              selected={settings.visualStyle === "clean"}
              onSelect={() => setSettings({ ...settings, visualStyle: "clean" })}
              preview={
                <div className="p-4 bg-primary rounded-md shadow-sm border border-subtle text-center text-[11px]">
                  Clean Style
                </div>
              }
            />
            <StyleOption
              name="Bold & Flat"
              description="High contrast, bold colors, presentation-ready"
              selected={settings.visualStyle === "bold"}
              onSelect={() => setSettings({ ...settings, visualStyle: "bold" })}
              preview={
                <div className="p-4 bg-blue rounded-sm border-2 border-blue-dark text-center text-[11px] color-white font-semibold">
                  Bold Style
                </div>
              }
            />
            <StyleOption
              name="Premium & Gradient"
              description="Glossy gradients, polished, enterprise-grade"
              selected={settings.visualStyle === "gradient"}
              onSelect={() => setSettings({ ...settings, visualStyle: "gradient" })}
              preview={
                <div className="p-4 bg-gradient-to-br from-blue to-indigo rounded-md text-center text-[11px] color-white font-semibold">
                  Gradient
                </div>
              }
            />
          </div>
        </Section>

        {/* Actor Display */}
        <Section title="2. Actor Display" subtitle="How to show stakeholders?">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-3">
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
      </div>
    </Modal>
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
      <h3 className="body-semibold mb-1">{title}</h3>
      {subtitle && (
        <p className="detail text-secondary mb-4">
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
  selected,
  onSelect,
  preview,
}: {
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  preview: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        "flex flex-col p-4 border-2 rounded-xl text-left transition-default cursor-pointer",
        selected ? "border-blue bg-blue-light" : "border-subtle bg-primary hover:bg-secondary"
      )}
    >
      <div className="mb-3 w-full">{preview}</div>
      <div className="body-semibold text-sm mb-1">{name}</div>
      <div className="detail text-secondary line-height-tight">
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
      className={clsx(
        "p-5 border-2 rounded-xl text-left transition-default cursor-pointer",
        selected ? "border-blue bg-blue-light" : "border-subtle bg-primary hover:bg-secondary"
      )}
    >
      <div className="body-semibold mb-1">{title}</div>
      <div className="detail text-secondary">
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
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-strong text-blue focus:ring-blue cursor-pointer transition-default"
      />
      <span className="body text-sm group-hover:text-primary transition-default">{label}</span>
    </label>
  );
}
