/**
 * Project Selector Component
 *
 * Apple HIG-inspired project selection interface
 * Philosophy: "Simplicity is the ultimate sophistication" - Steve Jobs
 *
 * Design Principles:
 * - Zero learning curve: Obvious what it does without instructions
 * - Beautiful minimalism: Only essential elements visible
 * - Delightful interactions: Smooth animations and feedback
 * - Focus on content: Projects are the hero, UI fades away
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check, Folder, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { GanttProject } from "@/types/gantt-tool";

interface ProjectSelectorProps {
  currentProject: GanttProject | null;
  projects: GanttProject[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  isLoading?: boolean;
}

export function ProjectSelector({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  isLoading = false,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Sort projects by most recently updated
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Current Project Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          backgroundColor: isOpen ? "var(--color-gray-5)" : "transparent",
          border: "none",
          borderRadius: "8px",
          fontFamily: "var(--font-display)",
          fontSize: "17px",
          fontWeight: 600,
          color: "#000",
          cursor: isLoading ? "wait" : "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = "var(--color-gray-5)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <Folder className="w-5 h-5" style={{ color: "var(--color-blue)" }} />
        <span>Projects</span>
        <ChevronDown
          className="w-4 h-4"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: 0.5,
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "0",
            minWidth: "320px",
            maxWidth: "400px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
            border: "1px solid var(--color-gray-4)",
            overflow: "hidden",
            zIndex: 1000,
            animation: "slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Create New Project Button */}
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid var(--color-gray-4)",
            }}
          >
            <button
              onClick={() => {
                onCreateProject();
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "var(--color-blue)",
                border: "none",
                borderRadius: "8px",
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#ffffff",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-blue-dark)";
                e.currentTarget.style.transform = "scale(1.01)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-blue)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>

          {/* Projects List */}
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              padding: "8px",
            }}
          >
            {sortedProjects.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  color: "var(--color-gray-2)",
                }}
              >
                No projects yet. Create your first project above.
              </div>
            ) : (
              sortedProjects.map((project) => {
                const isSelected = currentProject?.id === project.id;

                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      if (!isSelected) {
                        onSelectProject(project.id);
                      }
                      setIsOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      backgroundColor: isSelected ? "var(--color-blue-light)" : "transparent",
                      border: "none",
                      borderRadius: "8px",
                      cursor: isSelected ? "default" : "pointer",
                      transition: "all 0.15s ease",
                      marginBottom: "4px",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "var(--color-gray-5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {/* Checkmark for selected project */}
                    <div style={{ width: "20px", display: "flex", alignItems: "center" }}>
                      {isSelected && (
                        <Check className="w-5 h-5" style={{ color: "var(--color-blue)" }} />
                      )}
                    </div>

                    {/* Project Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "15px",
                          fontWeight: isSelected ? 600 : 500,
                          color: "#000",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "2px",
                        }}
                      >
                        {project.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontFamily: "var(--font-text)",
                          fontSize: "13px",
                          color: "var(--color-gray-2)",
                        }}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Updated {format(new Date(project.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>

                    {/* Phase count badge */}
                    <div
                      style={{
                        padding: "4px 8px",
                        backgroundColor: isSelected ? "var(--color-blue)" : "var(--color-gray-5)",
                        borderRadius: "12px",
                        fontFamily: "var(--font-text)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isSelected ? "#ffffff" : "var(--color-gray-2)",
                      }}
                    >
                      {project.phases.length} {project.phases.length === 1 ? "phase" : "phases"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
