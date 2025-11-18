/**
 * Architecture V2 - Simplified 3-Tab Design
 * Based on user's Presentation2 mockup
 *
 * Features:
 * 1. Business Context tab
 * 2. Current Business Landscape tab
 * 3. Proposed Solution tab
 * Each tab has editable boxes + Generate button
 */

"use client";

import { useState } from "react";
import { Settings, Share2, User, ChevronDown } from "lucide-react";

type Tab = "business-context" | "current-landscape" | "proposed-solution";

interface SystemBox {
  id: string;
  name: string;
  description: string;
}

interface TabData {
  boxes: SystemBox[];
}

export default function ArchitectureV2Page() {
  const [activeTab, setActiveTab] = useState<Tab>("business-context");
  const [projectName, setProjectName] = useState("SAP Implementation Project");
  const [version, setVersion] = useState("v1.0");
  const [lastSaved, setLastSaved] = useState(new Date());

  // Tab data
  const [businessContext, setBusinessContext] = useState<TabData>({ boxes: [] });
  const [currentLandscape, setCurrentLandscape] = useState<TabData>({ boxes: [] });
  const [proposedSolution, setProposedSolution] = useState<TabData>({ boxes: [] });

  // Generated state
  const [isGenerated, setIsGenerated] = useState(false);

  const getCurrentTabData = () => {
    switch (activeTab) {
      case "business-context":
        return businessContext;
      case "current-landscape":
        return currentLandscape;
      case "proposed-solution":
        return proposedSolution;
    }
  };

  const setCurrentTabData = (data: TabData) => {
    switch (activeTab) {
      case "business-context":
        setBusinessContext(data);
        break;
      case "current-landscape":
        setCurrentLandscape(data);
        break;
      case "proposed-solution":
        setProposedSolution(data);
        break;
    }
  };

  const addBox = () => {
    const currentData = getCurrentTabData();
    const newBox: SystemBox = {
      id: Date.now().toString(),
      name: "",
      description: "",
    };
    setCurrentTabData({ ...currentData, boxes: [...currentData.boxes, newBox] });
    setIsGenerated(false);
  };

  const updateBox = (id: string, updates: Partial<SystemBox>) => {
    const currentData = getCurrentTabData();
    const updatedBoxes = currentData.boxes.map((box) =>
      box.id === id ? { ...box, ...updates } : box
    );
    setCurrentTabData({ ...currentData, boxes: updatedBoxes });
    setIsGenerated(false);
  };

  const removeBox = (id: string) => {
    const currentData = getCurrentTabData();
    const updatedBoxes = currentData.boxes.filter((box) => box.id !== id);
    setCurrentTabData({ ...currentData, boxes: updatedBoxes });
    setIsGenerated(false);
  };

  const handleGenerate = () => {
    setIsGenerated(true);
    setLastSaved(new Date());
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div
        style={{
          height: "64px",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          backgroundColor: "#fff",
        }}
      >
        {/* Left: Project Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: "var(--weight-medium)",
              cursor: "pointer",
            }}
          >
            📁 {projectName}
            <ChevronDown className="w-4 h-4" />
          </button>
          <div
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              color: "#666",
            }}
          >
            {version} • Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
            title="Settings"
          >
            <Settings className="w-4 h-4" style={{ color: "#666" }} />
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
            title="Share"
          >
            <Share2 className="w-4 h-4" style={{ color: "#666" }} />
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2px solid #e0e0e0",
              backgroundColor: "#f5f5f5",
              cursor: "pointer",
            }}
            title="User Profile"
          >
            <User className="w-4 h-4" style={{ color: "#666" }} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          height: "60px",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "0 32px",
          backgroundColor: "#fafafa",
        }}
      >
        <TabButton
          label="Business Context"
          isActive={activeTab === "business-context"}
          onClick={() => setActiveTab("business-context")}
        />
        <TabButton
          label="Current Business Landscape"
          isActive={activeTab === "current-landscape"}
          onClick={() => setActiveTab("current-landscape")}
        />
        <TabButton
          label="Proposed Solution"
          isActive={activeTab === "proposed-solution"}
          onClick={() => setActiveTab("proposed-solution")}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: "#fff" }}>
        {isGenerated ? (
          <GeneratedDiagram
            tabData={getCurrentTabData()}
            tabName={activeTab}
            onEdit={() => setIsGenerated(false)}
          />
        ) : (
          <EditableCanvas
            boxes={getCurrentTabData().boxes}
            onAddBox={addBox}
            onUpdateBox={updateBox}
            onRemoveBox={removeBox}
            onGenerate={handleGenerate}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Tab Button
 */
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 24px",
        backgroundColor: isActive ? "#2563A5" : "transparent",
        color: isActive ? "#fff" : "#333",
        border: "none",
        borderRadius: "6px",
        fontFamily: "var(--font-text)",
        fontSize: "14px",
        fontWeight: "var(--weight-semibold)",
        cursor: "pointer",
        transition: "all 200ms ease",
      }}
    >
      {label}
    </button>
  );
}

/**
 * Editable Canvas - Shows boxes to fill
 */
interface EditableCanvasProps {
  boxes: SystemBox[];
  onAddBox: () => void;
  onUpdateBox: (id: string, updates: Partial<SystemBox>) => void;
  onRemoveBox: (id: string) => void;
  onGenerate: () => void;
}

function EditableCanvas({
  boxes,
  onAddBox,
  onUpdateBox,
  onRemoveBox,
  onGenerate,
}: EditableCanvasProps) {
  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "48px 32px",
      }}
    >
      {/* Grid of Boxes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {boxes.map((box) => (
          <SystemBoxInput
            key={box.id}
            box={box}
            onUpdate={(updates) => onUpdateBox(box.id, updates)}
            onRemove={() => onRemoveBox(box.id)}
          />
        ))}

        {/* Add Box Button */}
        <button
          onClick={onAddBox}
          style={{
            minHeight: "200px",
            border: "2px dashed #ccc",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "all 200ms ease",
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
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: "2px solid #ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            +
          </div>
          <span
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              color: "#666",
            }}
          >
            Add Box
          </span>
        </button>
      </div>

      {/* Generate Button */}
      {boxes.length > 0 && (
        <div style={{ textAlign: "right" }}>
          <button
            onClick={onGenerate}
            style={{
              padding: "14px 32px",
              backgroundColor: "#2563A5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontFamily: "var(--font-text)",
              fontSize: "15px",
              fontWeight: "var(--weight-semibold)",
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e4a80")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563A5")}
          >
            Generate Diagram
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * System Box Input
 */
interface SystemBoxInputProps {
  box: SystemBox;
  onUpdate: (updates: Partial<SystemBox>) => void;
  onRemove: () => void;
}

function SystemBoxInput({ box, onUpdate, onRemove }: SystemBoxInputProps) {
  return (
    <div
      style={{
        minHeight: "200px",
        padding: "20px",
        backgroundColor: "#2563A5",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
      }}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.2)",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontSize: "14px",
        }}
        title="Remove"
      >
        ×
      </button>

      {/* Name Input */}
      <input
        type="text"
        value={box.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="System Name"
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "6px",
          color: "#fff",
          fontFamily: "var(--font-text)",
          fontSize: "16px",
          fontWeight: "var(--weight-semibold)",
          outline: "none",
        }}
      />

      {/* Description Input */}
      <textarea
        value={box.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description..."
        style={{
          width: "100%",
          flex: 1,
          padding: "10px",
          backgroundColor: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "6px",
          color: "#fff",
          fontFamily: "var(--font-text)",
          fontSize: "14px",
          outline: "none",
          resize: "none",
        }}
      />
    </div>
  );
}

/**
 * Generated Diagram - Shows the final output
 */
interface GeneratedDiagramProps {
  tabData: TabData;
  tabName: string;
  onEdit: () => void;
}

function GeneratedDiagram({ tabData, tabName, onEdit }: GeneratedDiagramProps) {
  const boxes = tabData.boxes;

  // Organize boxes: first 3 go to top row, next 6 to middle, rest to bottom
  const topRow = boxes.slice(0, 3);
  const middleRow = boxes.slice(3, 9);
  const bottomRow = boxes.slice(9);

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "48px 32px",
      }}
    >
      {/* Generated Label */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "32px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "24px",
            fontWeight: "var(--weight-semibold)",
            color: "#333",
            marginBottom: "8px",
          }}
        >
          Generated
        </h2>
        <button
          onClick={onEdit}
          style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#666",
            cursor: "pointer",
          }}
        >
          ← Back to Edit
        </button>
      </div>

      {/* Diagram Container */}
      <div
        style={{
          padding: "48px",
          border: "2px solid #333",
          borderRadius: "12px",
          backgroundColor: "#fff",
        }}
      >
        {/* Top Row - 3 Large Boxes */}
        {topRow.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${topRow.length}, 1fr)`,
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {topRow.map((box) => (
              <DiagramBox key={box.id} box={box} size="large" />
            ))}
          </div>
        )}

        {/* Middle Row - 6 Smaller Boxes */}
        {middleRow.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(6, middleRow.length)}, 1fr)`,
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {middleRow.map((box) => (
              <DiagramBox key={box.id} box={box} size="small" />
            ))}
          </div>
        )}

        {/* Bottom Row - Wide Box */}
        {bottomRow.length > 0 && (
          <div>
            {bottomRow.map((box) => (
              <DiagramBox key={box.id} box={box} size="wide" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Diagram Box - Rendered box in generated view
 */
interface DiagramBoxProps {
  box: SystemBox;
  size: "large" | "small" | "wide";
}

function DiagramBox({ box, size }: DiagramBoxProps) {
  const heights = {
    large: "150px",
    small: "100px",
    wide: "120px",
  };

  return (
    <div
      style={{
        height: heights[size],
        padding: "20px",
        backgroundColor: "#2563A5",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: "#fff",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-text)",
          fontSize: size === "small" ? "14px" : "16px",
          fontWeight: "var(--weight-semibold)",
          marginBottom: "8px",
        }}
      >
        {box.name || "Unnamed"}
      </div>
      {box.description && (
        <div
          style={{
            fontFamily: "var(--font-text)",
            fontSize: size === "small" ? "11px" : "12px",
            opacity: 0.9,
            lineHeight: "1.4",
          }}
        >
          {box.description}
        </div>
      )}
    </div>
  );
}
