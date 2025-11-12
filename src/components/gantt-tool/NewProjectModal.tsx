/**
 * New Project Modal
 *
 * Apple-inspired minimal modal for creating new projects
 * "Focus and simplicity... that's been one of my mantras." - Steve Jobs
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, startDate: string) => Promise<void>;
}

export function NewProjectModal({ isOpen, onClose, onCreateProject }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateProject(projectName.trim(), startDate);
      // Reset form
      setProjectName("");
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
          zIndex: 9998,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "480px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          zIndex: 9999,
          overflow: "hidden",
          animation: "scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 24px 16px",
            borderBottom: "1px solid var(--color-gray-4)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 700,
              color: "#000",
            }}
          >
            New Project
          </h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              backgroundColor: "var(--color-gray-5)",
              border: "none",
              borderRadius: "8px",
              cursor: isCreating ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              opacity: isCreating ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isCreating) {
                e.currentTarget.style.backgroundColor = "var(--color-gray-4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-gray-5)";
            }}
          >
            <X className="w-5 h-5" style={{ color: "var(--color-gray-1)" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "24px" }}>
            {/* Project Name */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="project-name"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontFamily: "var(--font-text)",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#000",
                }}
              >
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Q1 2025 Roadmap"
                autoFocus
                required
                disabled={isCreating}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "var(--color-gray-6)",
                  border: "2px solid transparent",
                  borderRadius: "10px",
                  fontFamily: "var(--font-text)",
                  fontSize: "17px",
                  color: "#000",
                  outline: "none",
                  transition: "all 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-blue)";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.backgroundColor = "var(--color-gray-6)";
                }}
              />
            </div>

            {/* Start Date */}
            <div>
              <label
                htmlFor="start-date"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontFamily: "var(--font-text)",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#000",
                }}
              >
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={isCreating}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "var(--color-gray-6)",
                  border: "2px solid transparent",
                  borderRadius: "10px",
                  fontFamily: "var(--font-text)",
                  fontSize: "17px",
                  color: "#000",
                  outline: "none",
                  transition: "all 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-blue)";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.backgroundColor = "var(--color-gray-6)";
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              padding: "16px 24px 24px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              style={{
                flex: 1,
                padding: "12px 24px",
                backgroundColor: "var(--color-gray-5)",
                border: "none",
                borderRadius: "10px",
                fontFamily: "var(--font-text)",
                fontSize: "17px",
                fontWeight: 600,
                color: "#000",
                cursor: isCreating ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                opacity: isCreating ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  e.currentTarget.style.backgroundColor = "var(--color-gray-4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-gray-5)";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !projectName.trim()}
              style={{
                flex: 1,
                padding: "12px 24px",
                backgroundColor:
                  isCreating || !projectName.trim() ? "var(--color-gray-4)" : "var(--color-blue)",
                border: "none",
                borderRadius: "10px",
                fontFamily: "var(--font-text)",
                fontSize: "17px",
                fontWeight: 600,
                color: "#ffffff",
                cursor: isCreating || !projectName.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isCreating && projectName.trim()) {
                  e.currentTarget.style.backgroundColor = "var(--color-blue-dark)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  isCreating || !projectName.trim() ? "var(--color-gray-4)" : "var(--color-blue)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isCreating ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}
