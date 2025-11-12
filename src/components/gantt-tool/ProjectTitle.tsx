/**
 * ProjectTitle Component
 * Editable project title with Apple-inspired inline editing
 *
 * Features:
 * - Click to edit
 * - Enter to save, Esc to cancel
 * - Auto-select on edit
 * - Truncation with tooltip for long names
 * - Smooth animations
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Edit2 } from "lucide-react";

interface ProjectTitleProps {
  title: string;
  onSave: (newTitle: string) => Promise<void>;
  maxLength?: number;
  editable?: boolean;
}

export function ProjectTitle({
  title,
  onSave,
  maxLength = 100,
  editable = true,
}: ProjectTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when title prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title);
    }
  }, [title, isEditing]);

  // Focus and select on edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!editable) return;
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();

    // Validation
    if (!trimmed) {
      setError("Project name cannot be empty");
      return;
    }

    if (trimmed === title) {
      // No change
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(trimmed);

      // Success animation
      setIsEditing(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  // Display mode
  if (!isEditing) {
    return (
      <div className="flex items-center justify-center gap-2 group">
        <button
          onClick={handleStartEdit}
          disabled={!editable}
          className="relative"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-small)",
            fontWeight: "var(--weight-semibold)",
            color: "#000",
            background: "transparent",
            border: "none",
            cursor: editable ? "pointer" : "default",
            padding: "8px 16px",
            borderRadius: "6px",
            transition: "background-color 200ms ease",
            maxWidth: "600px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (editable) {
              e.currentTarget.style.backgroundColor = "var(--color-gray-6)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title={title.length > 40 ? title : undefined}
          aria-label={`Project title: ${title}. Click to edit.`}
        >
          {title}

          {editable && (
            <Edit2
              className="inline-block ml-2 opacity-0 group-hover:opacity-40 transition-opacity duration-200"
              style={{ width: "14px", height: "14px" }}
            />
          )}
        </button>

        {/* Saved indicator */}
        {showSaved && (
          <div
            className="flex items-center gap-1 text-green-600 animate-fade-in"
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-text)",
            }}
          >
            <Check className="w-4 h-4" />
            <span>Saved</span>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          maxLength={maxLength}
          disabled={isSaving}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-small)",
            fontWeight: "var(--weight-semibold)",
            color: "#000",
            padding: "8px 16px",
            border: "2px solid var(--color-blue)",
            borderRadius: "6px",
            outline: "none",
            minWidth: "300px",
            maxWidth: "600px",
            backgroundColor: "#fff",
            transition: "border-color 200ms ease",
          }}
          aria-label="Edit project title"
        />

        {isSaving && (
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-gray-1)",
              fontFamily: "var(--font-text)",
            }}
          >
            Saving...
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-red)",
            fontFamily: "var(--font-text)",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          fontSize: "11px",
          color: "var(--color-gray-1)",
          fontFamily: "var(--font-text)",
          opacity: 0.6,
        }}
      >
        Press Enter to save, Esc to cancel
      </div>
    </div>
  );
}
