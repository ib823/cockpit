/**
 * ResourceEditModal - Apple-Quality Resource Editor
 *
 * Design Principles:
 * - Direct manipulation: Inline editing feels natural
 * - Progressive disclosure: Basic info first, advanced options collapsible
 * - Accessible: Full keyboard support, ARIA labels
 * - Responsive: Adapts to mobile/tablet/desktop
 */

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import type {
  Resource,
  ResourceFormData,
  ResourceCategory,
  ResourceDesignation,
} from "@/types/gantt-tool";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_DESIGNATIONS,
  ASSIGNMENT_LEVELS,
} from "@/types/gantt-tool";
// Note: Company logos are now sourced directly from project.orgChartPro.companyLogos
import { nanoid } from "nanoid";
import { useRateLookupCache, type RateInfo } from "@/hooks/useRateLookupCache";

// Design Tokens
const TOKENS = {
  colors: {
    bg: { primary: "#FFFFFF", secondary: "#F5F5F7", overlay: "rgba(0, 0, 0, 0.5)" },
    text: { primary: "#1D1D1F", secondary: "#86868B", inverse: "#FFFFFF" },
    border: { default: "#E5E5EA", focus: "#007AFF" },
    accent: { blue: "#007AFF", red: "#FF3B30", green: "#34C759" },
  },
  typography: {
    family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    size: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20 },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },
  spring: { type: "spring", stiffness: 300, damping: 30 },
} as const;

interface ResourceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: string | null;
  defaultManagerId?: string | null;
  mode: "add" | "edit";
  onOpenLogoLibrary?: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  chargeRatePerHour?: string;
  general?: string;
}

export function ResourceEditModal({
  isOpen,
  onClose,
  resourceId,
  defaultManagerId,
  mode,
  onOpenLogoLibrary,
}: ResourceEditModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const {
    currentProject,
    addResource,
    updateResource,
    getResourceById,
  } = useGanttToolStoreV2();

  const resources = currentProject?.resources || [];
  const existingResource = resourceId ? getResourceById(resourceId) : undefined;

  // Only show companies that have logos uploaded in the Logo Library
  const projectLogos = currentProject?.orgChartPro?.companyLogos || {};
  const subCompanies = currentProject?.orgChartPro?.subCompanies || [];
  const parentCompanyNames = Object.keys(projectLogos);
  const subCompanyNames = subCompanies.map(sc => sc.name);
  // Combine parent companies and sub-companies for dropdown
  const allCompanyNames = [...parentCompanyNames, ...subCompanyNames];
  const hasUploadedLogos = allCompanyNames.length > 0;

  // Form state
  const [formData, setFormData] = useState<ResourceFormData>({
    name: "",
    category: "functional",
    designation: "consultant",
    description: "",
    assignmentLevel: "both",
    isBillable: true,
    chargeRatePerHour: 0,
    currency: "MYR",
    managerResourceId: defaultManagerId || null,
    email: "",
    department: "",
    location: "",
    projectRole: "",
    companyName: "",
    regionCode: "ABMY",
    utilizationTarget: 80,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);

  // Rate lookup - auto-calculate based on designation + region
  const { getRateForResource } = useRateLookupCache();
  const [isRateOverridden, setIsRateOverridden] = useState(false);

  // Get the auto-calculated rate based on current designation and region
  const autoCalculatedRate = useMemo((): RateInfo => {
    return getRateForResource(formData.designation, formData.regionCode);
  }, [formData.designation, formData.regionCode, getRateForResource]);

  // Auto-update rate when designation or region changes (unless manually overridden)
  useEffect(() => {
    if (!isRateOverridden && formData.isBillable) {
      setFormData(prev => ({
        ...prev,
        chargeRatePerHour: autoCalculatedRate.standardRatePerHour,
        currency: autoCalculatedRate.currency,
      }));
    }
  }, [autoCalculatedRate, isRateOverridden, formData.isBillable]);

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && existingResource) {
      // Check if existing rate differs from standard rate (means it was overridden)
      const standardRate = getRateForResource(existingResource.designation, existingResource.regionCode);
      const wasOverridden = existingResource.chargeRatePerHour !== standardRate.standardRatePerHour;
      setIsRateOverridden(wasOverridden);

      setFormData({
        name: existingResource.name,
        category: existingResource.category,
        designation: existingResource.designation,
        description: existingResource.description || "",
        assignmentLevel: existingResource.assignmentLevel || "both",
        isBillable: existingResource.isBillable,
        chargeRatePerHour: existingResource.chargeRatePerHour || 0,
        currency: existingResource.currency || "MYR",
        managerResourceId: existingResource.managerResourceId || null,
        email: existingResource.email || "",
        department: existingResource.department || "",
        location: existingResource.location || "",
        projectRole: existingResource.projectRole || "",
        companyName: existingResource.companyName || "",
        regionCode: existingResource.regionCode || "ABMY",
        utilizationTarget: existingResource.utilizationTarget || 80,
      });
    } else if (mode === "add") {
      setIsRateOverridden(false); // New resources use standard rate
      setFormData({
        name: "",
        category: "functional",
        designation: "consultant",
        description: "",
        assignmentLevel: "both",
        isBillable: true,
        chargeRatePerHour: 0,
        currency: "MYR",
        managerResourceId: defaultManagerId || null,
        email: "",
        department: "",
        location: "",
        projectRole: "",
        companyName: "",
        regionCode: "ABMY",
        utilizationTarget: 80,
      });
    }
    setErrors({});
  }, [mode, existingResource, defaultManagerId, isOpen, getRateForResource]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter available managers (exclude self and descendants)
  const availableManagers = useMemo(() => {
    if (mode === "add") return resources;

    const getDescendants = (id: string): Set<string> => {
      const descendants = new Set<string>();
      const queue = resources.filter(r => r.managerResourceId === id);
      while (queue.length > 0) {
        const current = queue.pop()!;
        descendants.add(current.id);
        queue.push(...resources.filter(r => r.managerResourceId === current.id));
      }
      return descendants;
    };

    const descendants = resourceId ? getDescendants(resourceId) : new Set<string>();
    return resources.filter(r => r.id !== resourceId && !descendants.has(r.id));
  }, [resources, resourceId, mode]);

  // Form field update helper
  const updateField = useCallback(<K extends keyof ResourceFormData>(
    field: K,
    value: ResourceFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.isBillable && formData.chargeRatePerHour < 0) {
      newErrors.chargeRatePerHour = "Rate cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === "edit" && resourceId) {
        await updateResource(resourceId, {
          ...formData,
          managerResourceId: formData.managerResourceId || null,
        });
      } else {
        await addResource({
          ...formData,
          managerResourceId: formData.managerResourceId || null,
        });
      }
      onClose();
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : "Failed to save" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  const categoryOptions = Object.entries(RESOURCE_CATEGORIES) as [ResourceCategory, typeof RESOURCE_CATEGORIES[ResourceCategory]][];
  const designationOptions = Object.entries(RESOURCE_DESIGNATIONS) as [ResourceDesignation, string][];

  // Client resources are placeholders - only show role name and reports to
  const isClientResource = formData.category === "client";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: TOKENS.colors.bg.overlay,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: 20,
        }}
        onClick={onClose}
        onKeyDown={handleKeyDown}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={TOKENS.spring}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 520,
            maxHeight: "90vh",
            backgroundColor: TOKENS.colors.bg.primary,
            borderRadius: 16,
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${TOKENS.colors.border.default}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.xl,
                fontWeight: TOKENS.typography.weight.bold,
                color: TOKENS.colors.text.primary,
                margin: 0,
              }}
            >
              {mode === "edit" ? "Edit Resource" : "Add Resource"}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                backgroundColor: TOKENS.colors.bg.secondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 24,
            }}
          >
            {/* General Error */}
            {errors.general && (
              <div
                style={{
                  padding: "12px 16px",
                  marginBottom: 16,
                  borderRadius: 8,
                  backgroundColor: "#FEE2E2",
                  border: "1px solid #FCA5A5",
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  color: TOKENS.colors.accent.red,
                }}
              >
                {errors.general}
              </div>
            )}

            {/* Name */}
            <FieldGroup label="Role Name" required error={errors.name}>
              <input
                ref={firstInputRef}
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Senior Consultant"
                style={inputStyle(!!errors.name)}
              />
            </FieldGroup>

            {/* Category & Designation in Grid */}
            <div style={{ display: "grid", gridTemplateColumns: isClientResource ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <FieldGroup label="Category">
                <select
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value as ResourceCategory)}
                  style={selectStyle()}
                >
                  {categoryOptions.map(([key, val]) => (
                    <option key={key} value={key}>[{val.abbr}] {val.label}</option>
                  ))}
                </select>
              </FieldGroup>

              {!isClientResource && (
                <FieldGroup label="Designation">
                  <select
                    value={formData.designation}
                    onChange={(e) => updateField("designation", e.target.value as ResourceDesignation)}
                    style={selectStyle()}
                  >
                    {designationOptions.map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </FieldGroup>
              )}
            </div>

            {/* Client resource info banner */}
            {isClientResource && (
              <div
                style={{
                  padding: "12px 16px",
                  marginBottom: 20,
                  borderRadius: 8,
                  backgroundColor: "rgba(5, 150, 105, 0.08)",
                  border: "1px solid rgba(5, 150, 105, 0.2)",
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  color: "#059669",
                }}
              >
                Client resource is a placeholder to represent counterparts on the client side. Only role name and reporting structure are required.
              </div>
            )}

            {/* Manager - Searchable Dropdown */}
            <FieldGroup label="Reports To">
              <div style={{ position: "relative" }}>
                {/* Selected Manager Display / Search Input */}
                <div
                  style={{
                    ...inputStyle(false),
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    padding: 0,
                    paddingLeft: 12,
                    overflow: "hidden",
                  }}
                  onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                >
                  {showManagerDropdown ? (
                    <input
                      type="text"
                      value={managerSearch}
                      onChange={(e) => setManagerSearch(e.target.value)}
                      placeholder="Search managers..."
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                        backgroundColor: "transparent",
                        padding: "10px 0",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        flex: 1,
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                        color: formData.managerResourceId ? TOKENS.colors.text.primary : TOKENS.colors.text.secondary,
                        padding: "10px 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {formData.managerResourceId
                        ? (() => {
                            const manager = resources.find(r => r.id === formData.managerResourceId);
                            return manager ? `${manager.name} (${RESOURCE_DESIGNATIONS[manager.designation]})` : "None (Root Level)";
                          })()
                        : "None (Root Level)"}
                    </span>
                  )}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    style={{
                      marginRight: 12,
                      transform: showManagerDropdown ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 150ms ease",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M2 4l4 4 4-4" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Dropdown */}
                {showManagerDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      maxHeight: 200,
                      overflow: "auto",
                      backgroundColor: TOKENS.colors.bg.primary,
                      border: `1px solid ${TOKENS.colors.border.default}`,
                      borderRadius: 8,
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                      zIndex: 100,
                    }}
                  >
                    {/* None Option */}
                    <div
                      onClick={() => {
                        updateField("managerResourceId", null);
                        setShowManagerDropdown(false);
                        setManagerSearch("");
                      }}
                      style={{
                        padding: "10px 12px",
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                        color: !formData.managerResourceId ? TOKENS.colors.accent.blue : TOKENS.colors.text.primary,
                        backgroundColor: !formData.managerResourceId ? "rgba(0, 122, 255, 0.08)" : "transparent",
                        cursor: "pointer",
                        borderBottom: `1px solid ${TOKENS.colors.border.default}`,
                      }}
                      onMouseEnter={(e) => {
                        if (formData.managerResourceId) e.currentTarget.style.backgroundColor = TOKENS.colors.bg.secondary;
                      }}
                      onMouseLeave={(e) => {
                        if (formData.managerResourceId) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      None (Root Level)
                    </div>

                    {/* Filtered Managers */}
                    {availableManagers
                      .filter(r =>
                        managerSearch === "" ||
                        r.name.toLowerCase().includes(managerSearch.toLowerCase()) ||
                        RESOURCE_DESIGNATIONS[r.designation]?.toLowerCase().includes(managerSearch.toLowerCase())
                      )
                      .map((r) => {
                        const isSelected = formData.managerResourceId === r.id;
                        const category = RESOURCE_CATEGORIES[r.category] || RESOURCE_CATEGORIES.other;
                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              updateField("managerResourceId", r.id);
                              setShowManagerDropdown(false);
                              setManagerSearch("");
                            }}
                            style={{
                              padding: "10px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              fontFamily: TOKENS.typography.family,
                              fontSize: TOKENS.typography.size.sm,
                              color: isSelected ? TOKENS.colors.accent.blue : TOKENS.colors.text.primary,
                              backgroundColor: isSelected ? "rgba(0, 122, 255, 0.08)" : "transparent",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = TOKENS.colors.bg.secondary;
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: category.color,
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: TOKENS.typography.weight.medium }}>{r.name}</div>
                              <div style={{ fontSize: TOKENS.typography.size.xs, color: TOKENS.colors.text.secondary }}>
                                {RESOURCE_DESIGNATIONS[r.designation]}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {availableManagers.filter(r =>
                      managerSearch === "" ||
                      r.name.toLowerCase().includes(managerSearch.toLowerCase())
                    ).length === 0 && managerSearch !== "" && (
                      <div
                        style={{
                          padding: "16px 12px",
                          textAlign: "center",
                          fontFamily: TOKENS.typography.family,
                          fontSize: TOKENS.typography.size.sm,
                          color: TOKENS.colors.text.secondary,
                        }}
                      >
                        No matching managers found
                      </div>
                    )}
                  </div>
                )}

                {/* Click outside to close */}
                {showManagerDropdown && (
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 99,
                    }}
                    onClick={() => {
                      setShowManagerDropdown(false);
                      setManagerSearch("");
                    }}
                  />
                )}
              </div>
            </FieldGroup>

            {/* Non-client fields - hidden for client resources */}
            {!isClientResource && (
              <>
            {/* Company - Only shows companies with uploaded logos */}
            <FieldGroup label="Company">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {hasUploadedLogos ? (
                  <>
                    {/* Dropdown shows parent companies and sub-companies */}
                    <select
                      value={allCompanyNames.includes(formData.companyName || "") ? formData.companyName : ""}
                      onChange={(e) => updateField("companyName", e.target.value || "")}
                      style={selectStyle()}
                    >
                      <option value="">No Company</option>
                      {/* Parent companies */}
                      {parentCompanyNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      {/* Sub-companies with indicator */}
                      {subCompanies.map((sc) => (
                        <option key={sc.id} value={sc.name}>● {sc.name}</option>
                      ))}
                    </select>

                    {/* Preview selected logo with indicator if sub-company */}
                    {formData.companyName && (() => {
                      const selectedSubCompany = subCompanies.find(sc => sc.name === formData.companyName);
                      const logoKey = selectedSubCompany ? selectedSubCompany.parentCompany : formData.companyName;
                      const logo = projectLogos[logoKey];

                      if (!logo) return null;

                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            borderRadius: 8,
                            backgroundColor: TOKENS.colors.bg.secondary,
                          }}
                        >
                          <div style={{ position: "relative" }}>
                            <img
                              src={logo}
                              alt={formData.companyName}
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: "contain",
                                borderRadius: 4,
                              }}
                            />
                            {selectedSubCompany && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: -2,
                                  right: -2,
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  backgroundColor: selectedSubCompany.indicatorColor,
                                  border: "2px solid white",
                                }}
                              />
                            )}
                          </div>
                          <span
                            style={{
                              fontFamily: TOKENS.typography.family,
                              fontSize: TOKENS.typography.size.sm,
                              color: TOKENS.colors.text.primary,
                            }}
                          >
                            {formData.companyName}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Link to add more companies */}
                    {onOpenLogoLibrary && (
                      <button
                        type="button"
                        onClick={onOpenLogoLibrary}
                        style={{
                          padding: 0,
                          border: "none",
                          backgroundColor: "transparent",
                          fontFamily: TOKENS.typography.family,
                          fontSize: TOKENS.typography.size.xs,
                          color: TOKENS.colors.accent.blue,
                          cursor: "pointer",
                          textAlign: "left",
                          textDecoration: "underline",
                        }}
                      >
                        Add new company
                      </button>
                    )}
                  </>
                ) : (
                  /* No logos uploaded - show prompt to upload */
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: 8,
                      border: `1px dashed ${TOKENS.colors.border.default}`,
                      backgroundColor: TOKENS.colors.bg.secondary,
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                        color: TOKENS.colors.text.secondary,
                        margin: "0 0 12px",
                      }}
                    >
                      No companies configured yet
                    </p>
                    {onOpenLogoLibrary ? (
                      <button
                        type="button"
                        onClick={onOpenLogoLibrary}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 6,
                          border: "none",
                          backgroundColor: TOKENS.colors.accent.blue,
                          fontFamily: TOKENS.typography.family,
                          fontSize: TOKENS.typography.size.sm,
                          fontWeight: TOKENS.typography.weight.semibold,
                          color: TOKENS.colors.text.inverse,
                          cursor: "pointer",
                        }}
                      >
                        Upload Company Logo
                      </button>
                    ) : (
                      <p
                        style={{
                          fontFamily: TOKENS.typography.family,
                          fontSize: TOKENS.typography.size.xs,
                          color: TOKENS.colors.text.secondary,
                          margin: 0,
                        }}
                      >
                        Go to Logo Library to add companies
                      </p>
                    )}
                  </div>
                )}
              </div>
            </FieldGroup>

            {/* Description */}
            <FieldGroup label="Description">
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Role description and responsibilities..."
                rows={3}
                style={{
                  ...inputStyle(false),
                  resize: "vertical",
                  minHeight: 80,
                }}
              />
            </FieldGroup>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                width: "100%",
                padding: "12px 16px",
                marginBottom: 16,
                borderRadius: 8,
                border: `1px solid ${TOKENS.colors.border.default}`,
                backgroundColor: TOKENS.colors.bg.secondary,
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.medium,
                color: TOKENS.colors.text.primary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Advanced Options</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                style={{
                  transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                }}
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke={TOKENS.colors.text.secondary}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>

            {/* Advanced Options */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ padding: "0 0 20px" }}>
                    {/* Email */}
                    <FieldGroup label="Email" error={errors.email}>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="email@example.com"
                        style={inputStyle(!!errors.email)}
                      />
                    </FieldGroup>

                    {/* Department & Location Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <FieldGroup label="Department">
                        <input
                          type="text"
                          value={formData.department || ""}
                          onChange={(e) => updateField("department", e.target.value)}
                          placeholder="e.g., Engineering"
                          style={inputStyle(false)}
                        />
                      </FieldGroup>
                      <FieldGroup label="Location">
                        <input
                          type="text"
                          value={formData.location || ""}
                          onChange={(e) => updateField("location", e.target.value)}
                          placeholder="e.g., Remote"
                          style={inputStyle(false)}
                        />
                      </FieldGroup>
                    </div>

                    {/* Billing Section */}
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: TOKENS.colors.bg.secondary,
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <label
                          style={{
                            fontFamily: TOKENS.typography.family,
                            fontSize: TOKENS.typography.size.sm,
                            fontWeight: TOKENS.typography.weight.semibold,
                            color: TOKENS.colors.text.primary,
                          }}
                        >
                          Billable Resource
                        </label>
                        <ToggleSwitch
                          checked={formData.isBillable}
                          onChange={(checked) => updateField("isBillable", checked)}
                        />
                      </div>

                      {formData.isBillable && (
                        <div>
                          {/* Auto-calculated rate display */}
                          <div
                            style={{
                              padding: "12px 16px",
                              marginBottom: 12,
                              borderRadius: 10,
                              backgroundColor: isRateOverridden
                                ? "rgba(255, 149, 0, 0.08)"
                                : "rgba(52, 199, 89, 0.08)",
                              border: `1px solid ${isRateOverridden ? "rgba(255, 149, 0, 0.2)" : "rgba(52, 199, 89, 0.2)"}`,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: TOKENS.typography.family,
                                  fontSize: TOKENS.typography.size.xs,
                                  fontWeight: TOKENS.typography.weight.semibold,
                                  color: isRateOverridden ? "#FF9500" : "#34C759",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {isRateOverridden ? "Custom Rate" : "Standard Rate"}
                              </span>
                              {isRateOverridden && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsRateOverridden(false);
                                    setFormData(prev => ({
                                      ...prev,
                                      chargeRatePerHour: autoCalculatedRate.standardRatePerHour,
                                      currency: autoCalculatedRate.currency,
                                    }));
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: TOKENS.typography.size.xs,
                                    fontWeight: TOKENS.typography.weight.medium,
                                    color: TOKENS.colors.accent.blue,
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    borderRadius: 4,
                                  }}
                                >
                                  Reset to Standard
                                </button>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: TOKENS.typography.family,
                                  fontSize: TOKENS.typography.size.xl,
                                  fontWeight: TOKENS.typography.weight.bold,
                                  color: TOKENS.colors.text.primary,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {formData.currency} {formData.chargeRatePerHour.toLocaleString()}
                              </span>
                              <span
                                style={{
                                  fontFamily: TOKENS.typography.family,
                                  fontSize: TOKENS.typography.size.sm,
                                  color: TOKENS.colors.text.secondary,
                                }}
                              >
                                /hour
                              </span>
                              <span
                                style={{
                                  fontFamily: TOKENS.typography.family,
                                  fontSize: TOKENS.typography.size.sm,
                                  color: TOKENS.colors.text.secondary,
                                  marginLeft: "auto",
                                }}
                              >
                                {formData.currency} {(formData.chargeRatePerHour * 8).toLocaleString()}/day
                              </span>
                            </div>
                            {!isRateOverridden && (
                              <div
                                style={{
                                  marginTop: 8,
                                  fontFamily: TOKENS.typography.family,
                                  fontSize: TOKENS.typography.size.xs,
                                  color: TOKENS.colors.text.secondary,
                                }}
                              >
                                Based on {RESOURCE_DESIGNATIONS[formData.designation]} in {formData.regionCode}
                              </div>
                            )}
                          </div>

                          {/* Override controls */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <FieldGroup label="Hourly Rate" error={errors.chargeRatePerHour} compact>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.chargeRatePerHour}
                                onChange={(e) => {
                                  const newRate = parseFloat(e.target.value) || 0;
                                  updateField("chargeRatePerHour", newRate);
                                  // Mark as overridden if different from standard
                                  if (newRate !== autoCalculatedRate.standardRatePerHour) {
                                    setIsRateOverridden(true);
                                  }
                                }}
                                style={inputStyle(!!errors.chargeRatePerHour)}
                              />
                            </FieldGroup>
                            <FieldGroup label="Currency" compact>
                              <select
                                value={formData.currency}
                                onChange={(e) => {
                                  updateField("currency", e.target.value);
                                  setIsRateOverridden(true);
                                }}
                                style={selectStyle()}
                              >
                                <option value="MYR">MYR</option>
                                <option value="USD">USD</option>
                                <option value="SGD">SGD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                              </select>
                            </FieldGroup>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assignment Level */}
                    <FieldGroup label="Assignment Level">
                      <select
                        value={formData.assignmentLevel}
                        onChange={(e) => updateField("assignmentLevel", e.target.value as "phase" | "task" | "both")}
                        style={selectStyle()}
                      >
                        {Object.entries(ASSIGNMENT_LEVELS).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </FieldGroup>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${TOKENS.colors.border.default}`,
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: `1px solid ${TOKENS.colors.border.default}`,
                backgroundColor: "transparent",
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.md,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                backgroundColor: isSubmitting ? TOKENS.colors.text.secondary : TOKENS.colors.accent.blue,
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.md,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.inverse,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Add Resource"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper Components
interface FieldGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  compact?: boolean;
  children: React.ReactNode;
}

function FieldGroup({ label, required, error, compact, children }: FieldGroupProps) {
  return (
    <div style={{ marginBottom: compact ? 12 : 20 }}>
      <label
        style={{
          display: "block",
          fontFamily: TOKENS.typography.family,
          fontSize: TOKENS.typography.size.sm,
          fontWeight: TOKENS.typography.weight.medium,
          color: TOKENS.colors.text.primary,
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: TOKENS.colors.accent.red }}> *</span>}
      </label>
      {children}
      {error && (
        <p
          style={{
            fontFamily: TOKENS.typography.family,
            fontSize: TOKENS.typography.size.xs,
            color: TOKENS.colors.accent.red,
            margin: "4px 0 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        border: "none",
        backgroundColor: checked ? TOKENS.colors.accent.green : TOKENS.colors.border.default,
        padding: 2,
        cursor: "pointer",
        transition: "background-color 200ms ease",
        display: "flex",
        alignItems: "center",
      }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        }}
      />
    </button>
  );
}

// Style helpers
function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${hasError ? TOKENS.colors.accent.red : TOKENS.colors.border.default}`,
    backgroundColor: TOKENS.colors.bg.primary,
    fontFamily: TOKENS.typography.family,
    fontSize: TOKENS.typography.size.md,
    color: TOKENS.colors.text.primary,
    outline: "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${TOKENS.colors.border.default}`,
    backgroundColor: TOKENS.colors.bg.primary,
    fontFamily: TOKENS.typography.family,
    fontSize: TOKENS.typography.size.md,
    color: TOKENS.colors.text.primary,
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%2386868B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: 36,
  };
}

export default ResourceEditModal;
