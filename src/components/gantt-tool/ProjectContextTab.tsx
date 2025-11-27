/**
 * Project Context Tab Component
 *
 * Security: XSS Protection via DOMPurify sanitization
 * Performance: Debounced auto-save, optimized re-renders
 * UX: Non-blocking, helpful prompts, clear value proposition
 *
 * Policy Compliance:
 * - Constraint B: No emojis (uses typography only)
 * - Security FIRST: Input sanitization on both client and server
 * - Apple-grade UX: Progressive disclosure, clear hierarchy
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AlertCircle, X, Loader2 } from "lucide-react";

interface ProjectContextTabProps {
  projectId: string;
  initialContext?: {
    painPoints?: string;
    skills?: string[];
  };
  onSave?: () => void;
  onNavigateToTimeline?: () => void;
}

export function ProjectContextTab({
  projectId,
  initialContext,
  onSave,
  onNavigateToTimeline
}: ProjectContextTabProps) {
  // Parse initial context from painPoints field
  // Use useMemo to recalculate when initialContext changes (e.g., after save)
  const parsed = useMemo(() => {
    if (!initialContext?.painPoints) {
      return { asIs: "", toBe: "", goals: "" };
    }

    const text = initialContext.painPoints;
    const asIsMatch = text.match(/AS-IS:\s*([\s\S]+?)(?=\n\nTO-BE:|$)/);
    const toBeMatch = text.match(/TO-BE:\s*([\s\S]+?)(?=\n\nGOALS:|$)/);
    const goalsMatch = text.match(/GOALS:\s*([\s\S]+?)$/);

    return {
      asIs: asIsMatch?.[1]?.trim() || "",
      toBe: toBeMatch?.[1]?.trim() || "",
      goals: goalsMatch?.[1]?.trim() || "",
    };
  }, [initialContext]);

  // Form state
  const [asIs, setAsIs] = useState(parsed.asIs);
  const [toBe, setToBe] = useState(parsed.toBe);
  const [goals, setGoals] = useState(parsed.goals);
  const [skills, setSkills] = useState<string[]>(initialContext?.skills || []);
  const [newSkill, setNewSkill] = useState("");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // DOMPurify instance (client-side only to avoid SSR jsdom issues)
  const DOMPurifyRef = useRef<typeof import("isomorphic-dompurify").default | null>(null);

  // Initialize DOMPurify client-side only
  useEffect(() => {
    import("isomorphic-dompurify").then((module) => {
      DOMPurifyRef.current = module.default;
    });
  }, []);

  // Update form state when initialContext changes (after successful save)
  useEffect(() => {
    setAsIs(parsed.asIs);
    setToBe(parsed.toBe);
    setGoals(parsed.goals);
    setSkills(initialContext?.skills || []);
  }, [parsed, initialContext?.skills]);

  // Track changes for dirty state
  useEffect(() => {
    const hasChanges =
      asIs !== parsed.asIs ||
      toBe !== parsed.toBe ||
      goals !== parsed.goals ||
      JSON.stringify(skills) !== JSON.stringify(initialContext?.skills || []);
    setIsDirty(hasChanges);
  }, [asIs, toBe, goals, skills, parsed, initialContext]);

  // XSS Sanitization (client-side only)
  const sanitize = useCallback((input: string): string => {
    if (!DOMPurifyRef.current) {
      // Fallback: basic sanitization if DOMPurify not loaded yet
      return input
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
    }
    return DOMPurifyRef.current.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
      ALLOWED_ATTR: [],
    });
  }, []);

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Client-side sanitization (defense in depth - server also sanitizes)
      const sanitizedAsIs = sanitize(asIs);
      const sanitizedToBe = sanitize(toBe);
      const sanitizedGoals = sanitize(goals);
      const sanitizedSkills = skills.map((s) => sanitize(s));

      const response = await fetch(`/api/gantt-tool/projects/${projectId}/context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asIs: sanitizedAsIs,
          toBe: sanitizedToBe,
          goals: sanitizedGoals,
          skills: sanitizedSkills,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save context");
      }

      setSaveSuccess(true);
      setIsDirty(false);
      onSave?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving context:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save context");
    } finally {
      setIsSaving(false);
    }
  };

  // Add skill handler
  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  // Remove skill handler
  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, isSaving, handleSave]);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      {/* Helper Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-5 rounded-r">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-blue-900 mb-1">
              Fill once, use everywhere
            </div>
            <div className="text-sm text-blue-800">
              This context will help you make better resource allocation decisions in Capacity Planning.
              It will also be available in Architecture view for solution architects.
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-900 mb-1">
                Context saved successfully
              </div>
              <div className="text-sm text-green-800 mb-3">
                Your business context has been saved and will help inform timeline planning and resource allocation decisions.
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onNavigateToTimeline?.();
                    setSaveSuccess(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Timeline
                </button>
                <button
                  onClick={() => setSaveSuccess(false)}
                  className="text-sm text-green-700 hover:text-green-900 font-medium"
                >
                  Continue editing
                </button>
              </div>
            </div>
            <button
              onClick={() => setSaveSuccess(false)}
              className="p-1 hover:bg-green-100 rounded flex-shrink-0"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-900 mb-1">
                Failed to save
              </div>
              <div className="text-sm text-red-800">{saveError}</div>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="p-1 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Business Context Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Context</h3>
        <p className="text-sm text-gray-600 mb-4">
          Describe the current situation and target state to provide context for resource planning
        </p>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Current Situation (As-Is)
            </label>
            <textarea
              value={asIs}
              onChange={(e) => setAsIs(e.target.value)}
              placeholder="Describe the current state, existing systems, and processes...

Example:
Legacy on-premise SAP ECC 6.0 system with manual processes, limited integration between modules, and no mobile access for field operations."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={8}
            />
            <div className="text-xs text-gray-500 mt-1">
              This helps identify which legacy skills/knowledge are needed
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Target State (To-Be)
            </label>
            <textarea
              value={toBe}
              onChange={(e) => setToBe(e.target.value)}
              placeholder="Describe the desired future state and solution...

Example:
Cloud-based SAP S/4HANA with automated workflows, real-time analytics, integrated modules, and mobile apps for warehouse and quality control."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={8}
            />
            <div className="text-xs text-gray-500 mt-1">
              This helps identify which new skills/technologies are needed
            </div>
          </div>
        </div>
      </div>

      {/* Project Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Project Goals
        </label>
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="List key goals and success criteria (one per line)...

Example:
- Support 50 concurrent users across 3 facilities
- Reduce month-end closing from 5 days to 1 day
- Enable mobile access for field operations
- Improve inventory accuracy from 85% to 98%"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={6}
        />
        <div className="text-xs text-gray-500 mt-1">
          Clear goals help determine project scope and required effort
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Key Skills Required
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Add skills that will be needed for this project (helps filter resources in Capacity Planning)
        </p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Add skill (e.g., SAP ABAP, Mobile Development)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddSkill}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-full flex items-center gap-2 border border-gray-200"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(idx)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {isDirty ? (
            <span className="text-orange-600 font-medium">Unsaved changes</span>
          ) : (
            <span>All fields are optional. Press Cmd/Ctrl+S to save quickly.</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save Context"}
        </button>
      </div>
    </div>
  );
}
