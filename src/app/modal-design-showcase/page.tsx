/**
 * MODAL DESIGN SHOWCASE
 *
 * Complete unified modal design system demonstration
 * Following Apple's Human Interface Guidelines
 *
 * Philosophy (Steve Jobs + Jony Ive):
 * 1. Ruthless Simplicity - Remove everything that doesn't serve the user's goal
 * 2. Obsessive Clarity - Every element has a purpose, every word matters
 * 3. Deep Craft - Pixel-perfect execution, smooth as silk
 * 4. User Empowerment - Make users feel smart, capable, in control
 * 5. Invisible Technology - The design fades away, the task remains
 *
 * Psychological Impact Goals:
 * - Make users feel SMART (helpful defaults, clear feedback, no jargon)
 * - Make users feel IN CONTROL (clear exits, undo options, transparency)
 * - Make users feel CONFIDENT (validation, confirmation, polish)
 * - Make users feel FOCUSED (minimalism, hierarchy, whitespace)
 *
 * @version 1.0.0
 * @status DESIGN REVIEW
 */

"use client";

import React, { useState } from "react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

export default function ModalDesignShowcase() {
  // Modal visibility states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    taskName: "Design Review Sprint",
    email: "user@example.com",
    budget: "50000",
    phaseColor: "#007AFF",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Helper to open modal
  const openModal = (modalId: string) => setActiveModal(modalId);
  const closeModal = () => {
    setActiveModal(null);
    setValidationErrors({});
  };

  // Form validation helper
  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {};

    if (field === "taskName" && value.length < 3) {
      errors.taskName = "Task name must be at least 3 characters";
    }
    if (field === "email" && !value.includes("@")) {
      errors.email = "Email must include @ symbol";
    }
    if (field === "budget" && (isNaN(Number(value)) || Number(value) <= 0)) {
      errors.budget = "Budget must be a positive number";
    }

    setValidationErrors(errors);
  };

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      closeModal();
    }, 1500);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header - Clean, no gradient */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderBottom: `1px solid rgba(0, 0, 0, 0.08)`,
      }}>
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 style={{
            fontSize: '32px',
            fontWeight: 600,
            color: 'rgba(0, 0, 0, 1)',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}>
            Modal Design System
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(0, 0, 0, 0.6)',
          }}>
            Unified modal patterns following Apple HIG
          </p>
        </div>
      </div>

      {/* Modal Categories */}
      <div className="max-w-7xl mx-auto px-8 py-12">

        {/* CATEGORY 1: CRUD Operations */}
        <Section
          title="1. CRUD Operations"
          description="Create, Read, Update, Delete - The foundation of data management"
        >
          <ModalCard
            title="Create New Task"
            description="Form modal with validation, smart defaults, and helpful guidance"
            onClick={() => openModal("create-task")}
            variant="primary"
          />
          <ModalCard
            title="Edit Task"
            description="Pre-filled form with impact warnings and change tracking"
            onClick={() => openModal("edit-task")}
            variant="primary"
          />
          <ModalCard
            title="Create New Phase"
            description="Sequential phase creation with color picker and date suggestions"
            onClick={() => openModal("create-phase")}
            variant="secondary"
          />
          <ModalCard
            title="Create New Project"
            description="Simple project initiation with optional metadata"
            onClick={() => openModal("create-project")}
            variant="secondary"
          />
        </Section>

        {/* CATEGORY 2: Confirmations & Warnings */}
        <Section
          title="2. Confirmations & Warnings"
          description="Critical decision points with clear consequences"
        >
          <ModalCard
            title="Delete Confirmation"
            description="Simple yes/no with clear consequences stated upfront"
            onClick={() => openModal("delete-simple")}
            variant="danger"
          />
          <ModalCard
            title="Delete with Impact"
            description="Comprehensive impact analysis before destructive action"
            onClick={() => openModal("delete-impact")}
            variant="danger"
          />
          <ModalCard
            title="Unsaved Changes"
            description="Prevent data loss with clear save/discard choice"
            onClick={() => openModal("unsaved-changes")}
            variant="warning"
          />
          <ModalCard
            title="Success Confirmation"
            description="Positive feedback with next steps suggested"
            onClick={() => openModal("success")}
            variant="success"
          />
        </Section>

        {/* CATEGORY 3: Information & Help */}
        <Section
          title="3. Information & Help"
          description="Contextual education without overwhelming the user"
        >
          <ModalCard
            title="Feature Introduction"
            description="Onboarding for new capabilities, dismissible"
            onClick={() => openModal("feature-intro")}
            variant="info"
          />
          <ModalCard
            title="Help & Documentation"
            description="Context-sensitive help with visual examples"
            onClick={() => openModal("help")}
            variant="info"
          />
          <ModalCard
            title="Security Education"
            description="Important security practices, non-intrusive"
            onClick={() => openModal("security")}
            variant="info"
          />
        </Section>

        {/* CATEGORY 4: Import/Export & File Operations */}
        <Section
          title="4. Import/Export & File Operations"
          description="Multi-stage workflows with clear progress indication"
        >
          <ModalCard
            title="Import Data Wizard"
            description="4-stage progressive wizard with validation at each step"
            onClick={() => openModal("import-wizard")}
            variant="primary"
          />
          <ModalCard
            title="Export Configuration"
            description="Tab-based settings for format, quality, and content options"
            onClick={() => openModal("export-config")}
            variant="secondary"
          />
          <ModalCard
            title="Conflict Resolution"
            description="Strategy selection for handling data conflicts"
            onClick={() => openModal("conflict")}
            variant="warning"
          />
        </Section>

        {/* CATEGORY 5: Complex Workflows */}
        <Section
          title="5. Complex Workflows & Dashboards"
          description="Feature-rich interfaces for power users"
        >
          <ModalCard
            title="Mission Control Dashboard"
            description="Executive overview with metrics, tabs, and analytics"
            onClick={() => openModal("mission-control")}
            variant="primary"
            large
          />
          <ModalCard
            title="Resource Planning"
            description="Hierarchical team structure with drag-drop organization"
            onClick={() => openModal("resource-planning")}
            variant="secondary"
            large
          />
          <ModalCard
            title="Budget Management"
            description="Financial configuration with alerts and contingency"
            onClick={() => openModal("budget")}
            variant="secondary"
          />
        </Section>

        {/* CATEGORY 6: Selection & Assignment */}
        <Section
          title="6. Selection & Assignment Interfaces"
          description="Matrix and grid-based selection patterns"
        >
          <ModalCard
            title="RACI Matrix Editor"
            description="Grid-based role assignment with validation rules"
            onClick={() => openModal("raci")}
            variant="secondary"
          />
          <ModalCard
            title="Resource Allocation"
            description="Assign resources with percentage allocation and notes"
            onClick={() => openModal("resource-allocation")}
            variant="secondary"
          />
          <ModalCard
            title="Share & Permissions"
            description="Team member selection with granular permission control"
            onClick={() => openModal("share")}
            variant="secondary"
          />
        </Section>

        {/* Design Tokens Reference */}
        <Section
          title="Design System Tokens"
          description="Visual language specifications"
        >
          <div className="col-span-full">
            <DesignTokensDisplay />
          </div>
        </Section>
      </div>

      {/* ============================================================================ */}
      {/* MODAL IMPLEMENTATIONS - Each represents a design pattern */}
      {/* ============================================================================ */}

      {/* 1. CREATE TASK - Complex form with validation */}
      <BaseModal
        isOpen={activeModal === "create-task"}
        onClose={closeModal}
        title="Create New Task"
        subtitle="Add a task to the current phase with dates and details"
        size="medium"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Create Task
            </ModalButton>
          </>
        }
      >
        <FormExample
          fields={[
            {
              id: "taskName",
              label: "Task Name",
              type: "text",
              value: formData.taskName,
              required: true,
              placeholder: "e.g., Design Review Sprint",
              error: validationErrors.taskName,
              helpText: "Clear, specific name describing the deliverable",
            },
            {
              id: "description",
              label: "Description",
              type: "textarea",
              value: "",
              placeholder: "What will be accomplished in this task?",
              helpText: "Brief context for team members (optional)",
            },
            {
              id: "startDate",
              label: "Start Date",
              type: "date",
              value: "2025-11-16",
              required: true,
            },
            {
              id: "endDate",
              label: "End Date",
              type: "date",
              value: "2025-11-23",
              required: true,
            },
            {
              id: "assignee",
              label: "Assignee",
              type: "select",
              value: "",
              options: [
                { value: "", label: "Unassigned" },
                { value: "1", label: "John Doe - Project Manager" },
                { value: "2", label: "Jane Smith - Designer" },
                { value: "3", label: "Bob Johnson - Developer" },
              ],
            },
          ]}
          onChange={(field, value) => {
            setFormData({ ...formData, [field]: value });
            validateField(field, value);
          }}
        />
        <WorkingDaysIndicator startDate="2025-11-16" endDate="2025-11-23" />
      </BaseModal>

      {/* 2. EDIT TASK - Pre-filled form with impact warning */}
      <BaseModal
        isOpen={activeModal === "edit-task"}
        onClose={closeModal}
        title="Edit Task"
        subtitle="Modify task details - changes may impact resources and timeline"
        size="medium"
        footer={
          <>
            <ModalButton onClick={() => openModal("delete-impact")} variant="destructive">
              Delete Task
            </ModalButton>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Save Changes
            </ModalButton>
          </>
        }
      >
        <ImpactWarning
          severity="medium"
          message="Changing dates will affect 3 resource allocations and downstream dependencies"
        />
        <FormExample
          fields={[
            {
              id: "taskName",
              label: "Task Name",
              type: "text",
              value: formData.taskName,
              required: true,
            },
            {
              id: "description",
              label: "Description",
              type: "textarea",
              value: "Comprehensive design review session covering all project deliverables",
            },
            {
              id: "startDate",
              label: "Start Date",
              type: "date",
              value: "2025-11-16",
              required: true,
            },
            {
              id: "endDate",
              label: "End Date",
              type: "date",
              value: "2025-11-23",
              required: true,
            },
          ]}
          onChange={(field, value) => {
            setFormData({ ...formData, [field]: value });
          }}
        />
        <WorkingDaysIndicator startDate="2025-11-16" endDate="2025-11-23" />
      </BaseModal>

      {/* 3. CREATE PHASE - Color picker + dates */}
      <BaseModal
        isOpen={activeModal === "create-phase"}
        onClose={closeModal}
        title="Create New Phase"
        subtitle="Define a major project phase with timeline and visual identity"
        size="medium"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Create Phase
            </ModalButton>
          </>
        }
      >
        <FormExample
          fields={[
            {
              id: "phaseName",
              label: "Phase Name",
              type: "text",
              value: "Phase 3",
              required: true,
              placeholder: "e.g., Discovery & Planning",
            },
            {
              id: "startDate",
              label: "Start Date",
              type: "date",
              value: "2025-12-01",
              required: true,
            },
            {
              id: "endDate",
              label: "End Date",
              type: "date",
              value: "2025-12-31",
              required: true,
            },
          ]}
          onChange={(field, value) => {
            setFormData({ ...formData, [field]: value });
          }}
        />
        <ColorPickerExample value={formData.phaseColor} />
        <WorkingDaysIndicator startDate="2025-12-01" endDate="2025-12-31" />
      </BaseModal>

      {/* 4. CREATE PROJECT - Simple form with file upload */}
      <BaseModal
        isOpen={activeModal === "create-project"}
        onClose={closeModal}
        title="Create New Project"
        subtitle="Start a new project with basic information"
        size="medium"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Create Project
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
              value: "",
              required: true,
              placeholder: "e.g., Q1 2025 Website Redesign",
            },
            {
              id: "startDate",
              label: "Start Date",
              type: "date",
              value: "2025-11-16",
              required: true,
            },
          ]}
          onChange={(field, value) => {
            setFormData({ ...formData, [field]: value });
          }}
        />
        <CompanyLogosUpload />
      </BaseModal>

      {/* 5. DELETE SIMPLE - Basic confirmation */}
      <BaseModal
        isOpen={activeModal === "delete-simple"}
        onClose={closeModal}
        title="Delete Task?"
        subtitle="This action cannot be undone"
        size="small"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="destructive">
              Delete Task
            </ModalButton>
          </>
        }
      >
        <p style={{ margin: 0, color: "var(--secondary-label-color)", fontSize: "15px", lineHeight: 1.5 }}>
          The task <strong>"Design Review Sprint"</strong> will be permanently removed from the project.
        </p>
      </BaseModal>

      {/* 6. DELETE WITH IMPACT - Comprehensive impact analysis */}
      <BaseModal
        isOpen={activeModal === "delete-impact"}
        onClose={closeModal}
        title="Delete Task Impact Analysis"
        subtitle="Review the consequences before proceeding"
        size="large"
        footer={
          <>
            <ModalButton onClick={() => { closeModal(); openModal("edit-task"); }} variant="secondary">
              Go Back
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="destructive">
              Delete Anyway
            </ModalButton>
          </>
        }
      >
        <ImpactAnalysisDisplay />
      </BaseModal>

      {/* 7. UNSAVED CHANGES WARNING */}
      <BaseModal
        isOpen={activeModal === "unsaved-changes"}
        onClose={closeModal}
        title="Unsaved Changes"
        subtitle="Your changes will be lost if you don't save them"
        size="small"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="destructive">
              Discard Changes
            </ModalButton>
            <ModalButton onClick={() => { closeModal(); }} variant="secondary">
              Keep Editing
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Save Changes
            </ModalButton>
          </>
        }
      >
        <p style={{ margin: 0, color: "var(--secondary-label-color)", fontSize: "15px", lineHeight: 1.5 }}>
          You have unsaved changes to <strong>"Design Review Sprint"</strong>. Would you like to save before closing?
        </p>
      </BaseModal>

      {/* 8. SUCCESS CONFIRMATION */}
      <BaseModal
        isOpen={activeModal === "success"}
        onClose={closeModal}
        title="Task Created Successfully"
        subtitle="Your task has been added to the project timeline"
        size="small"
        footer={
          <>
            <ModalButton onClick={() => { closeModal(); openModal("create-task"); }} variant="secondary">
              Create Another
            </ModalButton>
            <ModalButton onClick={closeModal} variant="primary">
              Done
            </ModalButton>
          </>
        }
      >
        <div style={{
          padding: "16px",
          backgroundColor: "#F0FDF4",
          border: "1px solid #86EFAC",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <p style={{ margin: 0, color: "#166534", fontSize: "14px", lineHeight: 1.5 }}>
            <strong>"Design Review Sprint"</strong> has been added to Phase 2: Implementation
          </p>
        </div>
      </BaseModal>

      {/* 9. FEATURE INTRODUCTION */}
      <BaseModal
        isOpen={activeModal === "feature-intro"}
        onClose={closeModal}
        title="New Feature: Resource Planning"
        subtitle="Build your team structure aligned with client organization"
        size="medium"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Maybe Later
            </ModalButton>
            <ModalButton onClick={() => { closeModal(); openModal("resource-planning"); }} variant="primary">
              Try It Now
            </ModalButton>
          </>
        }
      >
        <FeatureIntroContent />
      </BaseModal>

      {/* 10. HELP & DOCUMENTATION */}
      <BaseModal
        isOpen={activeModal === "help"}
        onClose={closeModal}
        title="Keyboard Shortcuts"
        subtitle="Work faster with these keyboard shortcuts"
        size="medium"
        footer={
          <ModalButton onClick={closeModal} variant="primary">
            Got It
          </ModalButton>
        }
      >
        <KeyboardShortcutsDisplay />
      </BaseModal>

      {/* 11. SECURITY EDUCATION */}
      <BaseModal
        isOpen={activeModal === "security"}
        onClose={closeModal}
        title="Security Best Practices"
        subtitle="Keep your account secure with these recommendations"
        size="medium"
        footer={
          <ModalButton onClick={closeModal} variant="primary">
            Understood
          </ModalButton>
        }
      >
        <SecurityEducationContent />
      </BaseModal>

      {/* 12. IMPORT WIZARD - Multi-stage */}
      <BaseModal
        isOpen={activeModal === "import-wizard"}
        onClose={closeModal}
        title="Import Data"
        subtitle="Step 1 of 4: Paste schedule data"
        size="large"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={() => { }} variant="primary">
              Next Step
            </ModalButton>
          </>
        }
      >
        <ImportWizardStage1 />
      </BaseModal>

      {/* 13. EXPORT CONFIGURATION */}
      <BaseModal
        isOpen={activeModal === "export-config"}
        onClose={closeModal}
        title="Export Configuration"
        subtitle="Choose format and quality settings for your export"
        size="large"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Export
            </ModalButton>
          </>
        }
      >
        <ExportConfigTabs />
      </BaseModal>

      {/* 14. CONFLICT RESOLUTION */}
      <BaseModal
        isOpen={activeModal === "conflict"}
        onClose={closeModal}
        title="Resolve Data Conflicts"
        subtitle="Choose how to handle conflicts between imported and existing data"
        size="large"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel Import
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Apply Strategy
            </ModalButton>
          </>
        }
      >
        <ConflictResolutionDisplay />
      </BaseModal>

      {/* 15. MISSION CONTROL DASHBOARD */}
      <BaseModal
        isOpen={activeModal === "mission-control"}
        onClose={closeModal}
        title="Mission Control"
        subtitle="Executive project overview and analytics"
        size="xlarge"
        footer={
          <ModalButton onClick={closeModal} variant="primary">
            Close Dashboard
          </ModalButton>
        }
      >
        <MissionControlDashboard />
      </BaseModal>

      {/* 16. RESOURCE PLANNING */}
      <BaseModal
        isOpen={activeModal === "resource-planning"}
        onClose={closeModal}
        title="Resource Planning"
        subtitle="Build your team structure aligned with client organization"
        size="xlarge"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Save Team Structure
            </ModalButton>
          </>
        }
      >
        <ResourcePlanningInterface />
      </BaseModal>

      {/* 17. BUDGET MANAGEMENT */}
      <BaseModal
        isOpen={activeModal === "budget"}
        onClose={closeModal}
        title="Budget Management"
        subtitle="Configure project budget, contingency, and alert thresholds"
        size="medium"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Save Budget
            </ModalButton>
          </>
        }
      >
        <BudgetManagementForm />
      </BaseModal>

      {/* 18. RACI MATRIX EDITOR */}
      <BaseModal
        isOpen={activeModal === "raci"}
        onClose={closeModal}
        title="RACI Matrix Editor"
        subtitle="Assign roles: Responsible, Accountable, Consulted, Informed"
        size="large"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Save Assignments
            </ModalButton>
          </>
        }
      >
        <RACIMatrixGrid />
      </BaseModal>

      {/* 19. RESOURCE ALLOCATION */}
      <BaseModal
        isOpen={activeModal === "resource-allocation"}
        onClose={closeModal}
        title="Allocate Resources"
        subtitle="Assign team members to this task with allocation percentage"
        size="medium"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Save Allocation
            </ModalButton>
          </>
        }
      >
        <ResourceAllocationForm />
      </BaseModal>

      {/* 20. SHARE & PERMISSIONS */}
      <BaseModal
        isOpen={activeModal === "share"}
        onClose={closeModal}
        title="Share Project"
        subtitle="Invite team members with specific permissions"
        size="medium"
        footer={
          <>
            <ModalButton onClick={closeModal} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSubmit} variant="primary">
              Send Invitations
            </ModalButton>
          </>
        }
      >
        <SharePermissionsForm />
      </BaseModal>

      {/* Success Overlay (appears after actions) */}
      {showSuccess && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: "32px 48px",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 600, color: "#1D1D1F" }}>
              Success!
            </div>
            <div style={{ fontSize: "14px", color: "#86868B", marginTop: "4px" }}>
              Your changes have been saved
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS - Reusable UI patterns
// ============================================================================

function Section({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

function ModalCard({ title, description, onClick, variant = "secondary", large = false }: {
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "warning" | "success" | "info";
  large?: boolean;
}) {
  // All cards look the same - color is not decoration
  return (
    <button
      onClick={onClick}
      style={{
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: '#FFFFFF',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 150ms cubic-bezier(0.0, 0.0, 0.2, 1)',
        gridColumn: large ? 'span 2' : 'auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#FFFFFF';
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
      }}
    >
      <h3 style={{
        fontSize: '15px',
        fontWeight: 600,
        color: 'rgba(0, 0, 0, 1)',
        marginBottom: '4px',
      }}>{title}</h3>
      <p style={{
        fontSize: '13px',
        color: 'rgba(0, 0, 0, 0.6)',
      }}>{description}</p>
    </button>
  );
}

function FormExample({ fields, onChange }: {
  fields: Array<{
    id: string;
    label: string;
    type: string;
    value?: string;
    required?: boolean;
    placeholder?: string;
    error?: string;
    helpText?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {fields.map((field) => (
        <div key={field.id}>
          <label
            htmlFor={field.id}
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#6B7280",
              marginBottom: "8px",
            }}
          >
            {field.label}
            {field.required && <span style={{ color: "#FF3B30", marginLeft: "4px" }}>*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              id={field.id}
              value={field.value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${field.error ? "#FF3B30" : "rgba(0, 0, 0, 0.1)"}`,
                borderRadius: "8px",
                fontSize: "15px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          ) : field.type === "select" ? (
            <select
              id={field.id}
              value={field.value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                fontSize: "15px",
                fontFamily: "inherit",
              }}
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.id}
              type={field.type}
              value={field.value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${field.error ? "#FF3B30" : "rgba(0, 0, 0, 0.1)"}`,
                borderRadius: "8px",
                fontSize: "15px",
                fontFamily: "inherit",
              }}
            />
          )}

          {field.error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "6px",
              fontSize: "13px",
              color: "#FF3B30",
            }}>
              {field.error}
            </div>
          )}

          {field.helpText && !field.error && (
            <div style={{
              fontSize: "12px",
              color: "#86868B",
              marginTop: "6px",
            }}>
              {field.helpText}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WorkingDaysIndicator({ startDate, endDate }: { startDate: string; endDate: string }) {
  // Simplified calculation - in real app would use actual working days calculation
  const days = Math.floor(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const workingDays = Math.floor(days * (5 / 7)); // Approximate

  return (
    <div style={{
      marginTop: "16px",
      padding: "12px 16px",
      backgroundColor: "#F5F5F7",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}>
      <span style={{ fontSize: "14px", color: "#1D1D1F" }}>
        <strong>{workingDays}</strong> working days <span style={{ color: "#86868B" }}>({days} calendar days)</span>
      </span>
    </div>
  );
}

function ImpactWarning({ severity, message }: { severity: "low" | "medium" | "high" | "critical"; message: string }) {
  // Simplified - no colored backgrounds, just clear text
  const severityLabel = {
    low: "Note",
    medium: "Warning",
    high: "Important",
    critical: "Critical",
  };

  return (
    <div style={{
      padding: "12px 16px",
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      border: `1px solid rgba(0, 0, 0, 0.08)`,
      borderRadius: "8px",
      marginBottom: "24px",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: 'rgba(0, 0, 0, 1)', marginBottom: "4px" }}>
        {severityLabel[severity]}
      </div>
      <div style={{ fontSize: "13px", color: 'rgba(0, 0, 0, 0.6)', lineHeight: 1.5 }}>
        {message}
      </div>
    </div>
  );
}

function ColorPickerExample({ value }: { value: string }) {
  const colors = [
    "#007AFF", "#34C759", "#FF9500", "#AF52DE", "#FF3B30",
    "#00C7BE", "#FFD60A", "#FF2D55", "#5E5CE6", "#32ADE6",
  ];

  return (
    <div style={{ marginTop: "16px" }}>
      <label style={{
        display: "block",
        fontSize: "13px",
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: "12px",
      }}>
        Phase Color
      </label>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "8px",
      }}>
        {colors.map((color) => (
          <button
            key={color}
            style={{
              width: "100%",
              aspectRatio: "1",
              backgroundColor: color,
              borderRadius: "8px",
              border: value === color ? "3px solid #1D1D1F" : "1px solid rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (value !== color) {
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CompanyLogosUpload() {
  const companies = [
    { name: "ABeam", color: "#007AFF" },
    { name: "Client", color: "#34C759" },
    { name: "SAP", color: "#FF9500" },
    { name: "Partner", color: "#AF52DE" },
    { name: "Vendor", color: "#8E8E93" },
  ];

  return (
    <div style={{ marginTop: "24px" }}>
      <label style={{
        display: "block",
        fontSize: "13px",
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: "12px",
      }}>
        Company Logos <span style={{ fontSize: "12px", fontWeight: 400, color: "#86868B" }}>(Optional)</span>
      </label>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "12px",
      }}>
        {companies.map((company) => (
          <div key={company.name} style={{ textAlign: "center" }}>
            <button
              style={{
                width: "100%",
                aspectRatio: "1",
                backgroundColor: "#F5F5F7",
                borderRadius: "12px",
                border: "2px dashed rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = company.color;
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.backgroundColor = "#F5F5F7";
              }}
            >
            </button>
            <div style={{ fontSize: "11px", color: "#86868B", marginTop: "6px" }}>
              {company.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactAnalysisDisplay() {
  const impacts = [
    {
      category: "Resource Allocations",
      severity: "high",
      items: [
        "3 team members currently allocated (120 hours total)",
        "$8,400 in committed costs will be lost",
        "Sarah Chen (Designer) - 60% allocation, 40 hours",
        "Mike Ross (Developer) - 80% allocation, 64 hours",
        "Emma Wilson (PM) - 25% allocation, 16 hours",
      ],
    },
    {
      category: "Dependencies",
      severity: "critical",
      items: [
        "2 downstream tasks depend on this task",
        '"Development Sprint 1" will become orphaned',
        '"QA Testing Phase" will lose its prerequisite',
        "Timeline impact: 5 working days at risk",
      ],
    },
    {
      category: "Budget Impact",
      severity: "medium",
      items: [
        "Total budget allocated: $8,400",
        "This represents 4.2% of phase budget",
        "Phase contingency will absorb costs",
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {impacts.map((impact) => (
        <div key={impact.category}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor:
                impact.severity === "critical" ? "#FF3B30" :
                  impact.severity === "high" ? "#FF9500" :
                    "#FFD60A",
            }} />
            <h4 style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#1D1D1F",
              margin: 0,
            }}>
              {impact.category}
            </h4>
          </div>
          <ul style={{
            margin: 0,
            padding: "0 0 0 24px",
            fontSize: "14px",
            color: "#6B7280",
            lineHeight: 1.7,
          }}>
            {impact.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FeatureIntroContent() {
  return (
    <div>
      <div style={{
        backgroundColor: "#F5F5F7",
        borderRadius: "12px",
        padding: "48px 24px",
        textAlign: "center",
        marginBottom: "24px",
      }}>
        <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
          Mockup of Resource Planning interface would appear here
        </p>
      </div>
      <ul style={{
        margin: 0,
        padding: "0 0 0 20px",
        fontSize: "14px",
        color: "#6B7280",
        lineHeight: 1.8,
      }}>
        <li>Align your team with client's organizational structure</li>
        <li>Define roles and reporting lines clearly</li>
        <li>Calculate costs in real-time as you build</li>
        <li>Export org charts for proposals</li>
      </ul>
    </div>
  );
}

function KeyboardShortcutsDisplay() {
  const shortcuts = [
    { keys: "Cmd + Enter", action: "Save & Close" },
    { keys: "Esc", action: "Cancel & Close" },
    { keys: "Cmd + K", action: "Open Command Palette" },
    { keys: "Cmd + S", action: "Quick Save" },
    { keys: "Cmd + Z", action: "Undo" },
    { keys: "Cmd + Shift + Z", action: "Redo" },
    { keys: "Tab", action: "Next Field" },
    { keys: "Shift + Tab", action: "Previous Field" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: "12px 24px",
      fontSize: "14px",
    }}>
      {shortcuts.map((shortcut, idx) => (
        <React.Fragment key={`shortcut-${idx}`}>
          <kbd style={{
            padding: "4px 8px",
            backgroundColor: "#F5F5F7",
            border: "1px solid #D1D1D6",
            borderRadius: "4px",
            fontSize: "13px",
            fontFamily: "monospace",
            color: "#1D1D1F",
            textAlign: "right",
          }}>
            {shortcut.keys}
          </kbd>
          <span style={{ color: "#6B7280" }}>
            {shortcut.action}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function SecurityEducationContent() {
  const practices = [
    {
      title: "Use Strong Passwords",
      description: "Combine uppercase, lowercase, numbers, and symbols. Minimum 12 characters.",
    },
    {
      title: "Enable Two-Factor Authentication",
      description: "Add an extra layer of security with authenticator apps or SMS codes.",
    },
    {
      title: "Review Account Activity",
      description: "Check your login history regularly for unauthorized access.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {practices.map((practice, idx) => (
        <div key={idx} style={{
          padding: "16px",
          backgroundColor: "#F5F5F7",
          borderRadius: "12px",
        }}>
          <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#1D1D1F", marginBottom: "4px" }}>
            {practice.title}
          </h4>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
            {practice.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function ImportWizardStage1() {
  return (
    <div>
      <div style={{
        padding: "16px",
        backgroundColor: "#F0F9FF",
        border: "1px solid #BAE6FD",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "13px", color: "#1E40AF", margin: 0, lineHeight: 1.5 }}>
              <strong>Paste your schedule data</strong> in TSV format (tab-separated).
              Columns: Phase Name, Task Name, Start Date, End Date, Deliverables.
            </p>
            <button style={{
              marginTop: "8px",
              fontSize: "13px",
              color: "#007AFF",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
            }}>
              Download Template
            </button>
          </div>
        </div>
      </div>

      <textarea
        placeholder="Paste TSV data here..."
        rows={10}
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          fontSize: "13px",
          fontFamily: "monospace",
          resize: "vertical",
        }}
      />

      {/* Progress Indicator */}
      <div style={{
        marginTop: "24px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        {[1, 2, 3, 4].map((step) => (
          <div key={step} style={{
            flex: 1,
            height: "4px",
            borderRadius: "2px",
            backgroundColor: step === 1 ? "#007AFF" : "#E5E5EA",
          }} />
        ))}
      </div>
      <div style={{
        marginTop: "8px",
        fontSize: "12px",
        color: "#86868B",
        textAlign: "center",
      }}>
        Step 1 of 4: Schedule Data
      </div>
    </div>
  );
}

function ExportConfigTabs() {
  const [activeTab, setActiveTab] = useState("format");

  const tabs = [
    { id: "format", label: "Format & Quality" },
    { id: "content", label: "Content Options" },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
        marginBottom: "24px",
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              color: activeTab === tab.id ? "#007AFF" : "#86868B",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #007AFF" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "format" && (
        <FormExample
          fields={[
            {
              id: "format",
              label: "Export Format",
              type: "select",
              value: "png",
              options: [
                { value: "png", label: "PNG Image" },
                { value: "pdf", label: "PDF Document" },
                { value: "svg", label: "SVG Vector" },
              ],
            },
            {
              id: "quality",
              label: "Quality",
              type: "select",
              value: "high",
              options: [
                { value: "low", label: "Low (Screen)" },
                { value: "medium", label: "Medium (Presentation)" },
                { value: "high", label: "High (Print)" },
              ],
            },
          ]}
          onChange={() => { }}
        />
      )}

      {activeTab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {["Show task names", "Show resource allocations", "Show dependencies", "Include timeline"].map((option) => (
            <label key={option} style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
            }}>
              <input type="checkbox" defaultChecked style={{ width: "18px", height: "18px" }} />
              <span style={{ fontSize: "14px", color: "#1D1D1F" }}>{option}</span>
            </label>
          ))}
        </div>
      )}

      {activeTab === "advanced" && (
        <FormExample
          fields={[
            {
              id: "padding",
              label: "Padding (px)",
              type: "text",
              value: "24",
            },
            {
              id: "background",
              label: "Background Color",
              type: "text",
              value: "#FFFFFF",
            },
          ]}
          onChange={() => { }}
        />
      )}
    </div>
  );
}

function ConflictResolutionDisplay() {
  return (
    <div>
      <div style={{
        padding: "16px",
        backgroundColor: "#FEF3C7",
        border: "1px solid #FCD34D",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#92400E", margin: "0 0 4px 0" }}>
              3 Conflicts Detected
            </p>
            <p style={{ fontSize: "13px", color: "#92400E", margin: 0, lineHeight: 1.5 }}>
              Imported data contains phases and tasks that conflict with existing data.
            </p>
          </div>
        </div>
      </div>

      <FormExample
        fields={[
          {
            id: "strategy",
            label: "Resolution Strategy",
            type: "select",
            value: "merge",
            options: [
              { value: "merge", label: "Smart Merge (keep both, rename conflicts)" },
              { value: "replace", label: "Total Refresh (replace all existing data)" },
              { value: "skip", label: "Skip Conflicts (keep existing, ignore imported)" },
            ],
            helpText: "Choose how to handle conflicts between imported and existing data",
          },
        ]}
        onChange={() => { }}
      />

      <div style={{ marginTop: "24px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F", marginBottom: "12px" }}>
          Conflicts Preview
        </h4>
        <div style={{
          border: "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          overflow: "hidden",
        }}>
          {["Phase: Implementation", "Task: Design Review", "Resource: Sarah Chen"].map((conflict, idx) => (
            <div key={idx} style={{
              padding: "12px 16px",
              borderBottom: idx < 2 ? "1px solid rgba(0, 0, 0, 0.05)" : "none",
              fontSize: "13px",
              color: "#6B7280",
            }}>
              {conflict}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MissionControlDashboard() {
  return (
    <div>
      {/* Health Score Card */}
      <div style={{
        padding: "24px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        color: "white",
        marginBottom: "24px",
      }}>
        <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
          Project Health Score
        </div>
        <div style={{ fontSize: "48px", fontWeight: 700, marginBottom: "8px" }}>
          87/100
        </div>
        <div style={{ fontSize: "13px", opacity: 0.8 }}>
          ✓ On Track • Budget: 78% • Schedule: 82% • Resources: 91%
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "24px",
      }}>
        {[
          { label: "Total Budget", value: "$248,500", change: "+12%" },
          { label: "Spent to Date", value: "$193,650", change: "78%" },
          { label: "Tasks Complete", value: "34/52", change: "65%" },
        ].map((metric, idx) => (
          <div key={idx} style={{
            padding: "16px",
            backgroundColor: "#F5F5F7",
            borderRadius: "10px",
          }}>
            <div style={{ fontSize: "12px", color: "#86868B", marginBottom: "8px" }}>
              {metric.label}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: "#1D1D1F", marginBottom: "4px" }}>
              {metric.value}
            </div>
            <div style={{ fontSize: "12px", color: "#34C759" }}>
              {metric.change}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div style={{
        padding: "16px",
        backgroundColor: "#FEF3C7",
        border: "1px solid #FCD34D",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#92400E" }}>
            2 Active Alerts
          </span>
        </div>
        <ul style={{ margin: 0, padding: "0 0 0 28px", fontSize: "13px", color: "#92400E", lineHeight: 1.7 }}>
          <li>Phase 2 approaching 90% budget threshold</li>
          <li>Resource allocation gap in December timeline</li>
        </ul>
      </div>
    </div>
  );
}

function ResourcePlanningInterface() {
  return (
    <div>
      <div style={{
        padding: "16px",
        backgroundColor: "#F0F9FF",
        border: "1px solid #BAE6FD",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <p style={{ fontSize: "13px", color: "#1E40AF", margin: 0 }}>
          Build your team structure aligned with the client's organization. Define roles, reporting lines, and calculate costs.
        </p>
      </div>

      {/* Hierarchical Tree Mockup */}
      <div style={{
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#FAFAFA",
      }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F", marginBottom: "8px" }}>
            Client Organization
          </div>
          <div style={{ paddingLeft: "16px", borderLeft: "2px solid #E5E5EA" }}>
            <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>
              └─ IT Division
            </div>
            <div style={{ paddingLeft: "16px", borderLeft: "2px solid #E5E5EA" }}>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>
                └─ Digital Transformation
              </div>
              <div style={{ paddingLeft: "16px" }}>
                <div style={{ fontSize: "13px", color: "#6B7280" }}>
                  └─ Project Team
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F", marginBottom: "8px" }}>
            Your Team Structure
          </div>
          <div style={{
            padding: "12px",
            backgroundColor: "white",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#6B7280",
          }}>
            <div>Project Manager - $850/day</div>
            <div style={{ paddingLeft: "16px", marginTop: "8px" }}>
              ├─ Lead Designer - $650/day
            </div>
            <div style={{ paddingLeft: "16px", marginTop: "4px" }}>
              ├─ Senior Developer - $700/day
            </div>
            <div style={{ paddingLeft: "16px", marginTop: "4px" }}>
              └─ QA Specialist - $550/day
            </div>
          </div>
        </div>

        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#F0FDF4",
          border: "1px solid #86EFAC",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#166534",
        }}>
          <strong>Total Daily Rate:</strong> $2,750 • <strong>Monthly (20 days):</strong> $55,000
        </div>
      </div>
    </div>
  );
}

function BudgetManagementForm() {
  return (
    <FormExample
      fields={[
        {
          id: "totalBudget",
          label: "Total Project Budget",
          type: "text",
          value: "250000",
          required: true,
          placeholder: "e.g., 250000",
        },
        {
          id: "currency",
          label: "Currency",
          type: "select",
          value: "USD",
          options: [
            { value: "USD", label: "US Dollar (USD)" },
            { value: "EUR", label: "Euro (EUR)" },
            { value: "GBP", label: "British Pound (GBP)" },
            { value: "CAD", label: "Canadian Dollar (CAD)" },
          ],
        },
        {
          id: "contingency",
          label: "Contingency (%)",
          type: "text",
          value: "10",
          helpText: "Reserve percentage for unexpected costs",
        },
        {
          id: "alertThreshold1",
          label: "Budget Alert - Warning (75%)",
          type: "text",
          value: "75",
          helpText: "Get notified when budget reaches this percentage",
        },
        {
          id: "alertThreshold2",
          label: "Budget Alert - Critical (90%)",
          type: "text",
          value: "90",
          helpText: "Critical alert for near-budget situations",
        },
      ]}
      onChange={() => { }}
    />
  );
}

function RACIMatrixGrid() {
  const tasks = ["Design Phase", "Development", "Testing", "Deployment"];
  const people = ["Sarah Chen", "Mike Ross", "Emma Wilson", "John Doe"];
  const roles = ["R", "A", "C", "I"];

  return (
    <div>
      <div style={{
        padding: "12px 16px",
        backgroundColor: "#F0F9FF",
        border: "1px solid #BAE6FD",
        borderRadius: "8px",
        marginBottom: "16px",
        fontSize: "13px",
        color: "#1E40AF",
      }}>
        <strong>RACI Legend:</strong> R = Responsible, A = Accountable, C = Consulted, I = Informed
      </div>

      <div style={{
        overflowX: "auto",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
        }}>
          <thead>
            <tr style={{ backgroundColor: "#F5F5F7" }}>
              <th style={{
                padding: "12px",
                textAlign: "left",
                fontWeight: 600,
                color: "#1D1D1F",
                borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              }}>
                Task / Person
              </th>
              {people.map((person) => (
                <th key={person} style={{
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                }}>
                  {person}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, taskIdx) => (
              <tr key={task} style={{
                borderBottom: taskIdx < tasks.length - 1 ? "1px solid rgba(0, 0, 0, 0.05)" : "none",
              }}>
                <td style={{ padding: "12px", color: "#6B7280" }}>
                  {task}
                </td>
                {people.map((person, personIdx) => (
                  <td key={person} style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{
                      display: "inline-flex",
                      gap: "4px",
                    }}>
                      {roles.map((role) => (
                        <button
                          key={role}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            backgroundColor: (taskIdx + personIdx) % 4 === roles.indexOf(role) ? "#007AFF" : "white",
                            color: (taskIdx + personIdx) % 4 === roles.indexOf(role) ? "white" : "#86868B",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if ((taskIdx + personIdx) % 4 !== roles.indexOf(role)) {
                              e.currentTarget.style.backgroundColor = "#F5F5F7";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if ((taskIdx + personIdx) % 4 !== roles.indexOf(role)) {
                              e.currentTarget.style.backgroundColor = "white";
                            }
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResourceAllocationForm() {
  return (
    <div>
      <FormExample
        fields={[
          {
            id: "resource",
            label: "Select Resource",
            type: "select",
            value: "",
            options: [
              { value: "", label: "Choose a team member..." },
              { value: "1", label: "Sarah Chen - Senior Designer" },
              { value: "2", label: "Mike Ross - Lead Developer" },
              { value: "3", label: "Emma Wilson - Project Manager" },
            ],
            required: true,
          },
          {
            id: "allocation",
            label: "Allocation Percentage",
            type: "text",
            value: "50",
            required: true,
            helpText: "Percentage of this person's time allocated to this task (0-100)",
          },
          {
            id: "notes",
            label: "Notes",
            type: "textarea",
            value: "",
            placeholder: "Any specific responsibilities or notes...",
          },
        ]}
        onChange={() => { }}
      />

      <div style={{
        marginTop: "24px",
        padding: "16px",
        backgroundColor: "#F5F5F7",
        borderRadius: "8px",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1D1D1F", marginBottom: "12px" }}>
          Current Allocations
        </div>
        <div style={{ fontSize: "13px", color: "#6B7280" }}>
          No resources allocated yet
        </div>
      </div>
    </div>
  );
}

function SharePermissionsForm() {
  return (
    <div>
      <FormExample
        fields={[
          {
            id: "email",
            label: "Email Address",
            type: "text",
            value: "",
            required: true,
            placeholder: "colleague@example.com",
          },
          {
            id: "role",
            label: "Permission Level",
            type: "select",
            value: "viewer",
            options: [
              { value: "viewer", label: "Viewer - Can view only" },
              { value: "editor", label: "Editor - Can edit tasks and phases" },
              { value: "admin", label: "Admin - Full project control" },
            ],
            helpText: "Choose what this person can do in the project",
          },
        ]}
        onChange={() => { }}
      />

      <div style={{
        marginTop: "24px",
        padding: "16px",
        backgroundColor: "#F5F5F7",
        borderRadius: "8px",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1D1D1F", marginBottom: "12px" }}>
          Shared With
        </div>
        <div style={{
          fontSize: "13px",
          color: "#6B7280",
          padding: "8px 0",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}>
          john@example.com - Editor
        </div>
        <div style={{
          fontSize: "13px",
          color: "#6B7280",
          padding: "8px 0",
        }}>
          sarah@example.com - Viewer
        </div>
      </div>
    </div>
  );
}

function DesignTokensDisplay() {
  return (
    <div style={{
      padding: "24px",
      backgroundColor: "white",
      border: "1px solid rgba(0, 0, 0, 0.1)",
      borderRadius: "12px",
    }}>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1D1D1F", marginBottom: "24px" }}>
        Visual Language Tokens
      </h3>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "24px",
      }}>
        {/* Typography */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Typography
          </h4>
          <div style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>Title</div>
          <div style={{ fontSize: "15px", marginBottom: "4px" }}>Subtitle</div>
          <div style={{ fontSize: "17px", marginBottom: "4px" }}>Body</div>
          <div style={{ fontSize: "13px", color: "#86868B" }}>Caption</div>
        </div>

        {/* Spacing */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Spacing (8pt Grid)
          </h4>
          {[4, 8, 16, 24, 32].map((px) => (
            <div key={px} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <div style={{ width: `${px}px`, height: "16px", backgroundColor: "#007AFF", borderRadius: "2px" }} />
              <span style={{ fontSize: "13px", color: "#6B7280" }}>{px}px</span>
            </div>
          ))}
        </div>

        {/* Border Radius */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Border Radius
          </h4>
          {[4, 6, 8, 10, 12, 16].map((radius) => (
            <div key={radius} style={{
              width: "48px",
              height: "32px",
              backgroundColor: "#007AFF",
              borderRadius: `${radius}px`,
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "11px",
              fontWeight: 600,
            }}>
              {radius}px
            </div>
          ))}
        </div>

        {/* Colors */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            System Colors
          </h4>
          {[
            { name: "Blue", color: "#007AFF" },
            { name: "Green", color: "#34C759" },
            { name: "Orange", color: "#FF9500" },
            { name: "Red", color: "#FF3B30" },
            { name: "Purple", color: "#AF52DE" },
            { name: "Gray", color: "#8E8E93" },
          ].map((item) => (
            <div key={item.name} style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}>
              <div style={{
                width: "24px",
                height: "24px",
                backgroundColor: item.color,
                borderRadius: "6px",
                border: "1px solid rgba(0, 0, 0, 0.1)",
              }} />
              <span style={{ fontSize: "13px", color: "#6B7280" }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
