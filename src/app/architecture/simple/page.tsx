/**
 * Architecture - Simplified 3-Feature Experience
 * Apple-inspired, extreme UX focus, irresistible design
 *
 * Features:
 * 1. Business Landscape Canvas - Visual business context (AS-IS + TO-BE)
 * 2. Solution Blueprint - Detailed architecture design (TBD)
 * 3. Transformation Roadmap - Implementation path (TBD)
 */

"use client";

import { useState } from "react";
import { BusinessLandscapeCanvas } from "./components/BusinessLandscapeCanvas";
import { SolutionBlueprint } from "./components/SolutionBlueprint";
import { TransformationRoadmap } from "./components/TransformationRoadmap";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Feature = "landscape" | "blueprint" | "roadmap";

export default function SimplifiedArchitecturePage() {
  const [activeFeature, setActiveFeature] = useState<Feature>("landscape");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div
        style={{
          height: "64px",
          borderBottom: "1px solid var(--color-gray-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
        }}
      >
        <div className="flex items-center gap-6">
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-text)",
              fontSize: "var(--text-body)",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-blue)",
              textDecoration: "none",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-medium)",
            fontWeight: "var(--weight-semibold)",
            color: "#000",
          }}
        >
          Architecture Studio
        </h1>

        <div style={{ width: "100px" }} />
      </div>

      {/* Feature Tabs */}
      <div
        style={{
          height: "56px",
          borderBottom: "1px solid var(--color-gray-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          padding: "0 32px",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <FeatureTab
          label="Business Landscape"
          subtitle="Context & Vision"
          isActive={activeFeature === "landscape"}
          onClick={() => setActiveFeature("landscape")}
        />
        <FeatureTab
          label="Solution Blueprint"
          subtitle="Technical Design"
          isActive={activeFeature === "blueprint"}
          onClick={() => setActiveFeature("blueprint")}
        />
        <FeatureTab
          label="Transformation Roadmap"
          subtitle="Implementation Plan"
          isActive={activeFeature === "roadmap"}
          onClick={() => setActiveFeature("roadmap")}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeFeature === "landscape" && <BusinessLandscapeCanvas />}
        {activeFeature === "blueprint" && <SolutionBlueprint />}
        {activeFeature === "roadmap" && <TransformationRoadmap />}
      </div>
    </div>
  );
}

/**
 * Feature Tab Component
 */
interface FeatureTabProps {
  label: string;
  subtitle: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function FeatureTab({ label, subtitle, isActive, onClick, disabled }: FeatureTabProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        maxWidth: "280px",
        height: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
        backgroundColor: isActive ? "#fff" : "transparent",
        border: "none",
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 200ms ease",
        boxShadow: isActive ? "var(--shadow-sm)" : "none",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "14px",
          fontWeight: isActive ? "var(--weight-semibold)" : "var(--weight-medium)",
          color: isActive ? "#000" : "var(--color-gray-1)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "11px",
          color: "var(--color-gray-1)",
          opacity: 0.6,
        }}
      >
        {subtitle}
      </div>
    </button>
  );
}

