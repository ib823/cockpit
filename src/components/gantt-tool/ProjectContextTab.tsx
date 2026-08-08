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
 * - Design system: ds Cards, Fields, Buttons and Banners; tokens only
 */

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ds/AppShell";
import { Banner } from "@/components/ds/Banner";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Textarea } from "@/components/ds/Textarea";
import { Chip } from "@/components/ds/Display";
import { logger } from "@/lib/logger";
import styles from "./ProjectContextTab.module.css";

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
      logger.error("Error saving context:", { error });
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
    <div className={styles.root}>
      {/* Helper banner */}
      <Banner tone="info" title="Fill once, use everywhere">
        This context will help you make better resource allocation decisions in
        Capacity Planning. It will also be available in Architecture view for
        solution architects.
      </Banner>

      {/* Save result announcements (Banner carries role=status / role=alert) */}
      {saveSuccess && (
        <Banner
          tone="success"
          title="Context saved successfully"
          onDismiss={() => setSaveSuccess(false)}
          actions={
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onNavigateToTimeline?.();
                  setSaveSuccess(false);
                }}
              >
                Go to Timeline
              </Button>
              <Button variant="tertiary" size="sm" onClick={() => setSaveSuccess(false)}>
                Continue editing
              </Button>
            </>
          }
        >
          Your business context has been saved and will help inform timeline
          planning and resource allocation decisions.
        </Banner>
      )}

      {saveError && (
        <Banner tone="danger" title="Failed to save" onDismiss={() => setSaveError(null)}>
          {saveError}
        </Banner>
      )}

      {/* Business context */}
      <Card label="Business context">
        <h2 className={styles.cardTitle}>Business Context</h2>
        <p className={styles.cardDescription}>
          Describe the current situation and target state to provide context for
          resource planning
        </p>

        <div className={styles.fieldGrid}>
          <Textarea
            label="Current Situation (As-Is)"
            value={asIs}
            onChange={(e) => setAsIs(e.target.value)}
            rows={8}
            placeholder={
              "Describe the current state, existing systems, and processes...\n\nExample:\nLegacy on-premise SAP ECC 6.0 system with manual processes, limited integration between modules, and no mobile access for field operations."
            }
            helper="This helps identify which legacy skills/knowledge are needed"
          />
          <Textarea
            label="Target State (To-Be)"
            value={toBe}
            onChange={(e) => setToBe(e.target.value)}
            rows={8}
            placeholder={
              "Describe the desired future state and solution...\n\nExample:\nCloud-based SAP S/4HANA with automated workflows, real-time analytics, integrated modules, and mobile apps for warehouse and quality control."
            }
            helper="This helps identify which new skills/technologies are needed"
          />
        </div>

        <Textarea
          className={styles.goalsField}
          label="Project Goals"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          rows={6}
          placeholder={
            "List key goals and success criteria (one per line)...\n\nExample:\n- Support 50 concurrent users across 3 facilities\n- Reduce month-end closing from 5 days to 1 day\n- Enable mobile access for field operations\n- Improve inventory accuracy from 85% to 98%"
          }
          helper="Clear goals help determine project scope and required effort"
        />
      </Card>

      {/* Skills */}
      <Card label="Key skills required">
        <h2 className={styles.cardTitle}>Key Skills Required</h2>
        <p className={styles.cardDescription}>
          Add skills that will be needed for this project (helps filter resources
          in Capacity Planning)
        </p>

        <div className={styles.skillRow}>
          <Input
            className={styles.skillField}
            label="Add a skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Add skill (e.g., SAP ABAP, Mobile Development)"
          />
          <Button variant="secondary" onClick={handleAddSkill}>
            Add
          </Button>
        </div>

        {skills.length > 0 && (
          <ul className={styles.skillList} aria-label="Required skills">
            {skills.map((skill, idx) => (
              <li key={idx}>
                <Chip onRemove={() => handleRemoveSkill(idx)} removeLabel={skill}>
                  {skill}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Footer actions */}
      <div className={styles.footer}>
        <p className={styles.footerHint} role="status">
          {isDirty ? (
            <span className={styles.footerHintDirty}>Unsaved changes</span>
          ) : (
            <span>All fields are optional. Press Cmd/Ctrl+S to save quickly.</span>
          )}
        </p>
        <div className={styles.footerActions}>
          <Button variant="tertiary" onClick={() => onNavigateToTimeline?.()}>
            Back to timeline
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            loading={isSaving}
            loadingLabel="Saving…"
          >
            Save Context
          </Button>
        </div>
      </div>
    </div>
  );
}
