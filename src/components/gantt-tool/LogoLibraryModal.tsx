/**
 * Logo Library Modal
 *
 * Allows users to upload and manage company logos for multi-stakeholder projects.
 * Apple-level UX: Simple, clear, beautiful.
 *
 * Features:
 * - Default logos (PartnerCo, SAP) - always available
 * - Custom logo uploads (up to 3)
 * - Drag-and-drop file upload
 * - Image preview and validation
 * - Persistent storage in project
 *
 * Refactored to use AppleMinimalistModal with Apple HIG quality
 * Note: AppleMinimalistModal provides its own FocusTrap, so we removed the duplicate
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { getAllCompanyLogos, DEFAULT_COMPANY_LOGOS } from "@/lib/default-company-logos";
import {
  processLogoFile,
  validateCompanyName,
  sanitizeCompanyName,
  formatFileSize,
  getDataUrlSize,
} from "@/lib/logo-upload-utils";

interface LogoLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogoEntry {
  id: string;
  companyName: string;
  logoUrl: string;
  isDefault: boolean;
  fileSize?: number;
}

const MAX_CUSTOM_LOGOS = 3;

export function LogoLibraryModal({ isOpen, onClose }: LogoLibraryModalProps) {
  const { currentProject, uploadProjectLogo, deleteProjectLogo, updateProjectLogos } =
    useGanttToolStoreV2();

  // State - Track ALL logos (defaults + customs) together
  const [allLogos, setAllLogos] = useState<LogoEntry[]>([]);
  const [deletedDefaultLogos, setDeletedDefaultLogos] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState<string | null>(null);
  const [companyNameInputs, setCompanyNameInputs] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Compute custom logos from all logos
  const customLogos = allLogos.filter(l => !l.isDefault);

  // Initialize ALL logos (defaults + customs) from project
  useEffect(() => {
    if (!isOpen || !currentProject) return;

    const projectLogos = currentProject.orgChartPro?.companyLogos || {};
    const defaultKeys = Object.keys(DEFAULT_COMPANY_LOGOS);

    const logos: LogoEntry[] = [];
    const deleted = new Set<string>();

    // Add defaults (check if they exist in project, if not they were deleted)
    Object.entries(DEFAULT_COMPANY_LOGOS).forEach(([companyName, logoUrl]) => {
      if (projectLogos[companyName]) {
        // Default logo exists in project
        logos.push({
          id: `default-${companyName}`,
          companyName,
          logoUrl: projectLogos[companyName], // Use project version (may be updated)
          isDefault: true,
        });
      } else {
        // Default logo was deleted
        deleted.add(companyName);
      }
    });

    // Add customs
    Object.entries(projectLogos).forEach(([companyName, logoUrl]) => {
      if (!defaultKeys.includes(companyName)) {
        logos.push({
          id: `custom-${companyName}`,
          companyName,
          logoUrl,
          isDefault: false,
          fileSize: getDataUrlSize(logoUrl),
        });
      }
    });

    setAllLogos(logos);
    setDeletedDefaultLogos(deleted);

    // Initialize company name inputs
    const inputs: Record<string, string> = {};
    logos.forEach((logo) => {
      inputs[logo.id] = logo.companyName;
    });
    setCompanyNameInputs(inputs);
  }, [isOpen, currentProject]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      const customCount = allLogos.filter(l => !l.isDefault).length;

      if (customCount >= MAX_CUSTOM_LOGOS) {
        setError(`Maximum ${MAX_CUSTOM_LOGOS} custom logos allowed`);
        return;
      }

      const filesArray = Array.from(files);
      const availableSlots = MAX_CUSTOM_LOGOS - customCount;

      if (filesArray.length > availableSlots) {
        setError(`Only ${availableSlots} slot${availableSlots === 1 ? "" : "s"} available`);
        return;
      }

      setIsUploading(true);
      setError(null);

      for (const file of filesArray) {
        try {
          // Process file
          const result = await processLogoFile(file);

          if (!result.success) {
            setError(result.error || "Failed to process logo");
            continue;
          }

          // Generate temporary ID
          const tempId = `custom-temp-${Date.now()}-${Math.random()}`;

          // Add to all logos
          setAllLogos((prev) => [
            ...prev,
            {
              id: tempId,
              companyName: "", // User will enter company name
              logoUrl: result.dataUrl!,
              isDefault: false,
              fileSize: getDataUrlSize(result.dataUrl!),
            },
          ]);

          // Set editing mode for this logo
          setEditingCompanyName(tempId);
          setCompanyNameInputs((prev) => ({ ...prev, [tempId]: "" }));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to upload logo");
        }
      }

      setIsUploading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [allLogos]
  );

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  // Handle delete logo with dependency check
  const handleDeleteLogo = useCallback((logoId: string, companyName: string, isDefault: boolean) => {
    // Check if logo is used by any resources in org chart
    const orgChartNodes = currentProject?.orgChartPro?.nodes || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usedByResources = orgChartNodes.filter((node: any) => node.companyName === companyName);

    if (usedByResources.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resourceNames = usedByResources.map((r: any) => r.name || 'Unnamed').join(', ');
      const message = `Warning: This logo is currently assigned to ${usedByResources.length} resource${usedByResources.length > 1 ? 's' : ''}: ${resourceNames}.\n\nIf you delete this logo:\n• These resources will lose their company assignment\n• The logo will no longer appear in the org chart\n• You will need to reassign companies to these resources\n\nAre you sure you want to delete "${companyName}"?`;

      if (!confirm(message)) {
        return;
      }
    }

    // Remove from allLogos
    setAllLogos((prev) => prev.filter((logo) => logo.id !== logoId));

    // Track deleted default logos
    if (isDefault) {
      setDeletedDefaultLogos((prev) => new Set(prev).add(companyName));
    }

    setCompanyNameInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[logoId];
      return newInputs;
    });

    if (editingCompanyName === logoId) {
      setEditingCompanyName(null);
    }
  }, [editingCompanyName, currentProject]);

  // Handle company name change
  const handleCompanyNameChange = useCallback((logoId: string, value: string) => {
    setCompanyNameInputs((prev) => ({ ...prev, [logoId]: value }));
  }, []);

  // Handle company name save
  const handleSaveCompanyName = useCallback((logoId: string) => {
    const companyName = sanitizeCompanyName(companyNameInputs[logoId] || "");
    const validation = validateCompanyName(companyName);

    if (!validation.valid) {
      setError(validation.error || "Invalid company name");
      return;
    }

    // Check for duplicates against ALL logos (defaults + customs)
    const isDuplicate = allLogos.some(
      (logo) => logo.id !== logoId && logo.companyName.toLowerCase() === companyName.toLowerCase()
    );

    if (isDuplicate) {
      setError(`Company "${companyName}" already exists. Please choose a unique name.`);
      return;
    }

    // Update logo
    setAllLogos((prev) =>
      prev.map((logo) => (logo.id === logoId ? { ...logo, companyName } : logo))
    );

    setEditingCompanyName(null);
    setError(null);
  }, [companyNameInputs, allLogos]);

  // Handle save all changes
  const handleSave = useCallback(async () => {
    setError(null);
    setIsSaving(true);

    try {
      // Validate all custom logos have company names
      const customsOnly = allLogos.filter(l => !l.isDefault);
      const invalidLogos = customsOnly.filter((logo) => !logo.companyName.trim());
      if (invalidLogos.length > 0) {
        setError("Please enter company names for all custom logos");
        setIsSaving(false);
        return;
      }

      // Build logos object - include ALL logos (defaults + customs)
      const logos: Record<string, string> = {};

      // Add ALL logos to preserve both defaults and customs
      allLogos.forEach((logo) => {
        if (logo.companyName.trim()) { // Only add logos with valid names
          logos[logo.companyName] = logo.logoUrl;
        }
      });

      // Update store (will auto-save to database)
      await updateProjectLogos(logos);

      setSuccess("Logos saved successfully!");
      setIsSaving(false);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save logos");
      setIsSaving(false);
    }
  }, [allLogos, updateProjectLogos, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Render default logos (now deletable)
  const renderDefaultLogos = () => {
    const defaultLogos = allLogos.filter((l) => l.isDefault);

    if (defaultLogos.length === 0) {
      return null; // All defaults were deleted
    }

    return (
      <div>
        <h3
          style={{
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: "15px",
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.primary,
            marginBottom: SPACING[4],
          }}
        >
          Default Logos ({defaultLogos.length})
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: SPACING[4],
          }}
        >
          {defaultLogos.map((logo) => (
            <div
              key={logo.id}
              style={{
                border: "2px solid #34C759",
                borderRadius: "12px",
                padding: SPACING[4],
                backgroundColor: "#F5F5F7",
                position: "relative",
                transition: "all 0.15s ease",
              }}
            >
              {/* Delete button - now available for default logos */}
              <button
                onClick={() => handleDeleteLogo(logo.id, logo.companyName, true)}
                aria-label="Delete default logo"
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  padding: "6px",
                  backgroundColor: "#FF3B30",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.9,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Trash2 style={{ width: "12px", height: "12px", color: "#FFFFFF" }} />
              </button>

              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: RADIUS.default,
                  overflow: "hidden",
                  padding: SPACING[3],
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.logoUrl}
                  alt={logo.companyName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: "13px",
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.primary,
                  textAlign: "center",
                }}
              >
                {logo.companyName}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render custom logos
  const renderCustomLogos = () => {
    const emptySlots = MAX_CUSTOM_LOGOS - customLogos.length;

    return (
      <div>
        <h3
          style={{
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: "15px",
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.primary,
            marginBottom: SPACING[2],
          }}
        >
          Custom Logos{" "}
          <span style={{ color: COLORS.text.tertiary, fontWeight: 400 }}>
            ({customLogos.length} of {MAX_CUSTOM_LOGOS} slots used)
          </span>
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: SPACING[4],
          }}
        >
          {/* Existing custom logos */}
          {customLogos.map((logo) => (
            <div
              key={logo.id}
              style={{
                border: "2px solid #007AFF",
                borderRadius: "12px",
                padding: SPACING[4],
                backgroundColor: "#FFFFFF",
                position: "relative",
                transition: "all 0.15s ease",
              }}
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteLogo(logo.id, logo.companyName, false)}
                aria-label="Delete custom logo"
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  padding: "6px",
                  backgroundColor: "#FF3B30",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.9,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Trash2 size={14} color="#FFFFFF" />
              </button>

              {/* Logo preview */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F5F5F7",
                  borderRadius: RADIUS.default,
                  overflow: "hidden",
                  padding: SPACING[3],
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.logoUrl}
                  alt={logo.companyName || "Uploaded logo"}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* Company name input */}
              {editingCompanyName === logo.id || !logo.companyName ? (
                <div>
                  <input
                    type="text"
                    value={companyNameInputs[logo.id] || ""}
                    onChange={(e) => handleCompanyNameChange(logo.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveCompanyName(logo.id);
                      } else if (e.key === "Escape") {
                        setEditingCompanyName(null);
                      }
                    }}
                    placeholder="Company name"
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.caption,
                      border: "2px solid #007AFF",
                      borderRadius: "6px",
                      outline: "none",
                      marginBottom: SPACING[2],
                    }}
                  />
                  <button
                    onClick={() => handleSaveCompanyName(logo.id)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.caption,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: "#FFFFFF",
                      backgroundColor: "#007AFF",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0051D5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#007AFF";
                    }}
                  >
                    Save Name
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingCompanyName(logo.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditingCompanyName(logo.id); }}
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                    fontSize: "13px",
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: COLORS.text.primary,
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "6px",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                    marginBottom: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F5F5F7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {logo.companyName}
                </div>
              )}

              {/* File size */}
              {logo.fileSize && (
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                    fontSize: "11px",
                    color: COLORS.text.tertiary,
                    textAlign: "center",
                  }}
                >
                  {formatFileSize(logo.fileSize)}
                </div>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              style={{
                border: "2px dashed #D1D1D6",
                borderRadius: "12px",
                padding: SPACING[4],
                backgroundColor: "#F5F5F7",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: "1",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#007AFF";
                e.currentTarget.style.backgroundColor = "#F0F9FF";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#D1D1D6";
                e.currentTarget.style.backgroundColor = "#F5F5F7";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Upload size={40} color="#007AFF" style={{ marginBottom: "12px" }} />
              <div
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: "13px",
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: "#007AFF",
                }}
              >
                Upload Logo
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Manage Company Logos"
      subtitle="Upload and organize logos for your project stakeholders"
      size="xlarge"
      preventClose={isSaving}
      preventEscapeClose={isSaving}
      footer={
        <>
          <ModalButton onClick={handleCancel} disabled={isSaving}>
            Cancel
          </ModalButton>
          <ModalButton onClick={handleSave} variant="primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </ModalButton>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING[6] }}>
        {/* Error message */}
        {error && (
          <div
            style={{
              padding: SPACING[4],
              backgroundColor: "#FFF2F0",
              border: "1px solid #FFCCC7",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: SPACING[3],
            }}
          >
            <AlertCircle size={20} color="#FF3B30" />
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.body,
                fontWeight: 500,
                color: "#FF3B30",
              }}
            >
              {error}
            </span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div
            style={{
              padding: SPACING[4],
              backgroundColor: "#F0FFF4",
              border: "1px solid #B7EB8F",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: SPACING[3],
            }}
          >
            <CheckCircle size={20} color="#34C759" />
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.body,
                fontWeight: 500,
                color: "#34C759",
              }}
            >
              {success}
            </span>
          </div>
        )}

        {/* Default logos */}
        {renderDefaultLogos()}

        {/* Custom logos */}
        {renderCustomLogos()}

        {/* Upload zone */}
        <div
          role="button"
          tabIndex={0}
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          style={{
            border: `2px dashed ${isDragging ? "#007AFF" : "#D1D1D6"}`,
            borderRadius: "12px",
            padding: "40px 32px",
            backgroundColor: isDragging ? "#F0F9FF" : "#F5F5F7",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Upload
            size={48}
            color={isDragging ? "#007AFF" : "#86868B"}
            style={{ marginBottom: SPACING[4] }}
          />
          <div
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: "16px",
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: isDragging ? "#007AFF" : "#1D1D1F",
              marginBottom: SPACING[2],
            }}
          >
            {isDragging ? "Drop files here" : "Drag & Drop Files Here"}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.body,
              color: COLORS.text.tertiary,
              marginBottom: "12px",
            }}
          >
            or click to browse
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.text.tertiary,
            }}
          >
            Supported: PNG, JPG, SVG • Max size: 2MB per file
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            multiple
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
        </div>

        {isUploading && (
          <div
            style={{
              padding: SPACING[4],
              backgroundColor: "#F0F9FF",
              borderRadius: "12px",
              textAlign: "center",
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.body,
              fontWeight: 500,
              color: "#007AFF",
            }}
          >
            Processing logo...
          </div>
        )}
      </div>
    </BaseModal>
  );
}
