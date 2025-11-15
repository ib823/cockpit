/**
 * New Project Modal
 *
 * Apple-inspired minimal modal for creating new projects
 * "Focus and simplicity... that's been one of my mantras." - Steve Jobs
 *
 * Refactored to use BaseModal with Apple HIG quality
 */

"use client";

import { useState, useRef } from "react";
import { Upload, FolderPlus } from "lucide-react";
import { format } from "date-fns";
import { HolidayAwareDatePicker } from "@/components/ui/HolidayAwareDatePicker";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Project"
      subtitle="Create a new project with optional company logos"
      icon={<FolderPlus className="w-5 h-5" />}
      size="medium"
      preventClose={isCreating}
      preventEscapeClose={isCreating}
      footer={
        <>
          <ModalButton onClick={onClose} disabled={isCreating}>
            Cancel
          </ModalButton>
          <ModalButton
            onClick={() => {
              const form = document.querySelector('form');
              if (form) {
                form.requestSubmit();
              }
            }}
            variant="primary"
            disabled={isCreating || !projectName.trim()}
          >
            {isCreating ? "Creating..." : "Create Project"}
          </ModalButton>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Project Name */}
          <div>
            <label
              htmlFor="project-name"
              style={{
                display: "block",
                marginBottom: "8px",
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#1D1D1F",
              }}
            >
              Project Name <span style={{ color: "#FF3B30" }}>*</span>
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
                backgroundColor: "#F5F5F7",
                border: "2px solid transparent",
                borderRadius: "8px",
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                color: "#1D1D1F",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#007AFF";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.backgroundColor = "#F5F5F7";
              }}
            />
          </div>

          {/* Start Date */}
          <div>
            <HolidayAwareDatePicker
              label="Start Date"
              value={startDate}
              onChange={(value) => setStartDate(value)}
              region="ABMY"
              disabled={isCreating}
              required={true}
              size="large"
            />
          </div>

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
        </div>
      </form>
    </BaseModal>
  );
}
