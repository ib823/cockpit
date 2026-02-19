/**
 * NewProjectModal - Showcase Pattern
 *
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 * Source Pattern: /app/modal-design-showcase + AddTaskModal.tsx
 *
 * Features:
 * - Declarative form using FormExample for standard fields
 * - Custom logo upload grid (unique functionality)
 * - Mobile-responsive grid (5 cols → 3 cols → 2 cols)
 * - Holiday-aware date picker
 * - Keyboard shortcuts (Cmd+Enter)
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Upload } from "lucide-react";
import { format } from "date-fns";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample } from "@/lib/design-system/showcase-helpers";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, startDate: string, companyLogos?: Record<string, string>) => Promise<void>;
}

export function NewProjectModal({ isOpen, onClose, onCreateProject }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isCreating, setIsCreating] = useState(false);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Mobile breakpoint detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProjectName("");
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setCompanyLogos({});
      setValidationErrors({});
    }
  }, [isOpen]);

  // Company presets
  const COMPANY_PRESETS = [
    { name: "Partner Consulting", key: "partner", color: COLORS.blue },
    { name: "Client", key: "client", color: COLORS.status.success },
    { name: "SAP", key: "sap", color: "#FF9500" }, // Orange
    { name: "Partner", key: "partner", color: "#AF52DE" }, // Purple
    { name: "Vendor", key: "vendor", color: COLORS.text.secondary },
  ];

  const handleLogoUpload = (companyKey: string, companyName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, SVG, etc.)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setCompanyLogos(prev => ({ ...prev, [companyName]: base64Url }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!projectName.trim()) {
      errors.projectName = "Project name is required";
    }

    if (!startDate) {
      errors.startDate = "Start date is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsCreating(true);
    try {
      await onCreateProject(projectName.trim(), startDate, companyLogos);
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, projectName, startDate]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Project"
      subtitle="Create a new project with optional company logos"
      size="medium"
      preventClose={isCreating}
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary" disabled={isCreating}>
            Cancel
          </ModalButton>
          <ModalButton onClick={handleSubmit} variant="primary" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Project"}
          </ModalButton>
        </>
      }
    >
      <FormExample
        fields={[
          {
            id: "projectName",
            label: "Project Name",
            type: "text",
            value: projectName,
            required: true,
            placeholder: "e.g., SAP S/4HANA Implementation",
            error: validationErrors.projectName,
            helpText: "Clear, descriptive name for your project",
          },
          {
            id: "startDate",
            label: "Start Date",
            type: "date",
            value: startDate,
            required: true,
            error: validationErrors.startDate,
          },
        ]}
        onChange={(field, value) => {
          if (field === "projectName") setProjectName(value);
          else if (field === "startDate") setStartDate(value);
          const newErrors = { ...validationErrors };
          delete newErrors[field];
          setValidationErrors(newErrors);
        }}
        holidays={[]}
      />

      {/* Company Logos - Custom upload grid (unique functionality) */}
      <div style={{ marginTop: SPACING[4] }}>
        <label
          style={{
            display: "block",
            marginBottom: SPACING[3],
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: TYPOGRAPHY.fontSize.caption,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.secondary,
          }}
        >
          Company Logos{" "}
          <span style={{ color: COLORS.text.tertiary, fontWeight: TYPOGRAPHY.fontWeight.regular }}>
            (Optional)
          </span>
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
            gap: SPACING[3],
          }}
        >
          {COMPANY_PRESETS.map((company) => (
            <div
              key={company.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: SPACING[1],
              }}
            >
              <input
                ref={(el) => { fileInputRefs.current[company.key] = el; }}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload(company.key, company.name)}
                style={{ display: "none" }}
                disabled={isCreating}
              />

              <button
                type="button"
                onClick={() => fileInputRefs.current[company.key]?.click()}
                disabled={isCreating}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: RADIUS.default,
                  backgroundColor: companyLogos[company.name] ? COLORS.bg.primary : COLORS.bg.subtle,
                  border: `2px solid ${companyLogos[company.name] ? company.color : COLORS.border.default}`,
                  cursor: isCreating ? "not-allowed" : "pointer",
                  transition: `all ${TRANSITIONS.duration.fast}`,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isCreating) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {companyLogos[company.name] ? (
                  <img
                    src={companyLogos[company.name]}
                    alt={company.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: SPACING[2],
                    }}
                  />
                ) : (
                  <Upload style={{ width: '20px', height: '20px', color: COLORS.text.tertiary }} />
                )}
              </button>

              <span
                style={{
                  fontSize: '11px',
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  color: COLORS.text.tertiary,
                  textAlign: 'center',
                  lineHeight: '1.3',
                  maxWidth: '64px',
                }}
              >
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
}
