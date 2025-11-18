/**
 * NewProjectModal - Apple Minimalist Design System
 *
 * Features:
 * - AppleMinimalistModal integration with unified UX
 * - Project creation with smart defaults
 * - Optional company logo uploads
 *
 * Migration: Converted from AppleMinimalistModal to AppleMinimalistModal (2025-11-15)
 */

"use client";

import { useState, useRef } from "react";
import { Upload, FolderPlus } from "lucide-react";
import { format } from "date-fns";
import { AppleMinimalistModal } from "@/components/ui/AppleMinimalistModal";

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
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Company presets that users can upload logos for
  const COMPANY_PRESETS = [
    { name: "ABeam Consulting", key: "abeam", color: "#007AFF" },
    { name: "Client", key: "client", color: "#34C759" },
    { name: "SAP", key: "sap", color: "#FF9500" },
    { name: "Partner", key: "partner", color: "#AF52DE" },
    { name: "Vendor", key: "vendor", color: "#8E8E93" },
  ];

  // Handle logo upload for a specific company
  const handleLogoUpload = (companyKey: string, companyName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, SVG, etc.)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setCompanyLogos(prev => ({
        ...prev,
        [companyName]: base64Url
      }));
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateProject(projectName.trim(), startDate, companyLogos);
      // Reset form
      setProjectName("");
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setCompanyLogos({});
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Form fields for AppleMinimalistModal
  const fields: FormField[] = [
    {
      id: "projectName",
      type: "text",
      label: "Project Name",
      placeholder: "e.g., Q1 2025 Roadmap",
      required: true,
      disabled: isCreating,
    },
    {
      id: "startDate",
      type: "date",
      label: "Start Date",
      required: true,
      disabled: isCreating,      region: "ABMY", // Default region
      milestones: [], // New project, no milestones yet
    },
  ];

  // Custom content for company logos
  const companyLogosContent = (
    <>
      {/* Company Logos (Optional) */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "12px",
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#1D1D1F",
              }}
            >
              Company Logos{" "}
              <span style={{ color: "#86868B", fontWeight: 400, fontSize: "13px" }}>
                (Optional)
              </span>
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "12px",
              }}
            >
              {COMPANY_PRESETS.map((company) => (
                <div
                  key={company.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {/* Hidden file input */}
                  <input
                    ref={(el) => {
                      fileInputRefs.current[company.key] = el;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload(company.key, company.name)}
                    style={{ display: "none" }}
                    disabled={isCreating}
                  />

                  {/* Logo preview/upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[company.key]?.click()}
                    disabled={isCreating}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      backgroundColor: companyLogos[company.name] ? "#FFFFFF" : "#F5F5F7",
                      border: `2px solid ${
                        companyLogos[company.name] ? company.color : "rgba(0, 0, 0, 0.08)"
                      }`,
                      cursor: isCreating ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
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
                          padding: "8px",
                        }}
                      />
                    ) : (
                      <Upload className="w-5 h-5" style={{ color: "#86868B" }} />
                    )}
                  </button>

                  {/* Company name */}
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "var(--font-text)",
                      color: "#86868B",
                      textAlign: "center",
                      lineHeight: "1.3",
                      maxWidth: "64px",
                    }}
                  >
                    {company.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
    </>
  );

  return (
    <AppleMinimalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Project"
      subtitle="Create a new project with optional company logos"
      icon={<FolderPlus className="w-5 h-5" />}
      size="medium"
      formLayout="vertical"
      fields={fields}
      formValues={{ projectName, startDate }}
      onFieldChange={(fieldId, value) => {
        if (fieldId === "projectName") setProjectName(value);
        if (fieldId === "startDate") setStartDate(value);
      }}
      primaryAction={{
        label: isCreating ? "Creating..." : "Create Project",
        onClick: () => { void handleSubmit(new Event('submit') as any); },
        loading: isCreating,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
      }}
      preventClose={isCreating}
    >
      {companyLogosContent}
    </AppleMinimalistModal>
  );
}
