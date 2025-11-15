/**
 * Test Page for Org Chart Drag & Drop
 * Quick access to test the new drag-and-drop functionality
 */

"use client";

import { useState } from "react";
import { OrgChartBuilderV2 } from "@/components/gantt-tool/OrgChartBuilderV2";

export default function TestOrgChartDnDPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f5f5f7",
      padding: "32px",
    }}>
      <div style={{
        maxWidth: "800px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "48px",
          fontWeight: 700,
          color: "#1d1d1f",
          marginBottom: "16px",
        }}>
          Org Chart with Drag & Drop
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#86868b",
          marginBottom: "32px",
          lineHeight: 1.6,
        }}>
          Test the new drag-and-drop functionality inspired by Steve Jobs and Jony Ive design principles
        </p>

        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          marginBottom: "32px",
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#1d1d1f",
            marginBottom: "16px",
          }}>
            How to Use
          </h2>
          <ul style={{
            textAlign: "left",
            fontSize: "16px",
            color: "#333",
            lineHeight: 1.8,
            listStyle: "none",
            padding: 0,
          }}>
            <li style={{ marginBottom: "12px" }}>
              <strong>Drag Cards:</strong> Click and hold anywhere on the card to drag
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Drop on Top:</strong> Makes the dragged card the MANAGER of the target card
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Drop on Bottom:</strong> Makes the dragged card a DIRECT REPORT of the target card
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Drop on Left/Right:</strong> Makes the dragged card a PEER (same level) of the target card
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Zoom:</strong> Use ⌘+ / ⌘- to zoom in/out, or click the zoom buttons in header
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Pan:</strong> In manual mode, click and drag the canvas to pan around
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Auto-Fit:</strong> Charts with ≤6 nodes auto-fit to viewport, larger charts use scrollable mode
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Edit:</strong> Click on the card title to edit role name
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Designation:</strong> Click the colored badge to change designation level
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Hover + Buttons:</strong> Hover over a card to see + buttons on all 4 edges for quick adding
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Delete:</strong> Select a card with no children to see the delete button
            </li>
          </ul>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: "16px 32px",
            fontSize: "18px",
            fontWeight: 600,
            backgroundColor: "#007AFF",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,122,255,0.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,122,255,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,122,255,0.3)";
          }}
        >
          Open Org Chart Builder
        </button>

        <div style={{
          marginTop: "48px",
          padding: "24px",
          backgroundColor: "#E3F2FD",
          borderRadius: "12px",
          border: "2px solid #2196F3",
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#1565C0",
            marginBottom: "12px",
          }}>
            Design Principles Applied
          </h3>
          <ul style={{
            textAlign: "left",
            fontSize: "14px",
            color: "#1565C0",
            lineHeight: 1.6,
            listStyle: "none",
            padding: 0,
          }}>
            <li>✓ Apple spring curve animations (cubic-bezier(0.34, 1.56, 0.64, 1))</li>
            <li>✓ Smart auto-zoom with hybrid mode (auto-fit + scrollable)</li>
            <li>✓ Intelligent bounds calculation (no more truncated cards)</li>
            <li>✓ Smooth panning and zoom controls with keyboard shortcuts</li>
            <li>✓ 60fps smooth transitions</li>
            <li>✓ Visual feedback during drag</li>
            <li>✓ Prevents circular reporting structures</li>
            <li>✓ Accessibility support (keyboard navigation)</li>
          </ul>
        </div>
      </div>

      {/* Org Chart Modal */}
      {isOpen && <OrgChartBuilderV2 onClose={() => setIsOpen(false)} />}
    </div>
  );
}
