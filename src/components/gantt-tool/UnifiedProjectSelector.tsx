/**
 * Unified Project Selector - Single Component
 * Combines dropdown + editable title in ONE component
 * Apple HIG inspired: Direct manipulation, minimal chrome
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check, Folder, Calendar, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { GanttProject } from "@/types/gantt-tool";

interface UnifiedProjectSelectorProps {
  currentProject: GanttProject;
  projects: GanttProject[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onUpdateProjectName: (newName: string) => void;
  onDeleteProject?: (projectId: string) => void;
  isLoading?: boolean;
}

export function UnifiedProjectSelector({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateProjectName,
  onDeleteProject,
  isLoading = false,
}: UnifiedProjectSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentProject.name);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  // Update edited name when project changes
  useEffect(() => {
    setEditedName(currentProject.name);
  }, [currentProject.name]);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== currentProject.name) {
      onUpdateProjectName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
      {/* Unified Component: Dropdown Button + Editable Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Dropdown Chevron Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            backgroundColor: isDropdownOpen ? "var(--color-gray-5)" : "transparent",
            border: "none",
            borderRadius: "6px",
            cursor: isLoading ? "wait" : "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !isDropdownOpen) {
              e.currentTarget.style.backgroundColor = "var(--color-gray-5)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDropdownOpen) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
          title="Switch project"
        >
          <ChevronDown
            className="w-4 h-4"
            style={{
              transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              opacity: 0.5,
            }}
          />
        </button>

        {/* Editable Project Name */}
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName();
              if (e.key === "Escape") {
                setEditedName(currentProject.name);
                setIsEditingName(false);
              }
            }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "17px",
              fontWeight: 600,
              color: "#000",
              border: "none",
              outline: "2px solid var(--color-blue)",
              borderRadius: "4px",
              padding: "4px 8px",
              backgroundColor: "#fff",
              minWidth: "200px",
            }}
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-display)",
              fontSize: "17px",
              fontWeight: 600,
              color: "#000",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "4px",
              padding: "4px 8px",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Click to edit project name"
          >
            <span style={{ maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentProject.name}
            </span>
            <Edit2 className="w-3.5 h-3.5" style={{ opacity: 0.3 }} />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
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
                setIsDropdownOpen(false);
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
                const isSelected = currentProject.id === project.id;

                return (
                  <div
                    key={project.id}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      backgroundColor: isSelected ? "var(--color-blue-light)" : "transparent",
                      borderRadius: "8px",
                      transition: "all 0.15s ease",
                      marginBottom: "4px",
                      position: "relative",
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
                    {/* Clickable area for selecting project */}
                    <div
                      onClick={() => {
                        if (!isSelected) {
                          onSelectProject(project.id);
                        }
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: isSelected ? "default" : "pointer",
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
                          <span>Updated {format(new Date(project.updatedAt), "dd-MMM-yy")}</span>
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
                    </div>

                    {/* Delete button - only show if not selected and callback provided */}
                    {!isSelected && onDeleteProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone.`)) {
                            onDeleteProject(project.id);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: "transparent",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                      </button>
                    )}
                  </div>
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
