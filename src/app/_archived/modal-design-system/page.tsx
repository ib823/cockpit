/**
 * Modal Design System Showcase
 *
 * Apple-grade minimalist modal design with all variations.
 * Shows all sizes, layouts, and component types for you to choose
 * the design pattern that works best for your project.
 *
 * Principles Demonstrated:
 * 1. Deep Simplicity - One component, infinite variations
 * 2. Whitespace - Every pixel has purpose
 * 3. Typography - Hierarchy through size and weight
 * 4. Micro-interactions - Subtle, never distracting
 * 5. Accessibility - Keyboard-first, screen-reader friendly
 */

"use client";

import { useState } from "react";
import { AppleMinimalistModal, type FormField } from "@/components/ui/AppleMinimalistModal";

// ============================================================================
// DEMO DATA
// ============================================================================

const PHASE_FORM_FIELDS: FormField[] = [
  {
    id: "phase-name",
    type: "text",
    label: "Phase Name",
    placeholder: "e.g., Design, Development, Testing",
    required: true,
    helperText: "Keep it clear and concise",
  },
  {
    id: "phase-description",
    type: "textarea",
    label: "Description",
    placeholder: "What is the purpose of this phase?",
    helperText: "Optional, but helps with clarity",
  },
  {
    id: "phase-start",
    type: "date",
    label: "Start Date",
    required: true,
  },
  {
    id: "phase-end",
    type: "date",
    label: "End Date",
    required: true,
  },
  {
    id: "phase-color",
    type: "color",
    label: "Phase Color",
    helperText: "Visual identifier for the phase",
  },
];

const TASK_FORM_FIELDS: FormField[] = [
  {
    id: "task-name",
    type: "text",
    label: "Task Name",
    placeholder: "e.g., Wireframes, Database Setup",
    required: true,
  },
  {
    id: "task-phase",
    type: "select",
    label: "Phase",
    required: true,
    options: [
      { label: "Discovery", value: "discovery" },
      { label: "Design", value: "design" },
      { label: "Development", value: "development" },
      { label: "Testing", value: "testing" },
      { label: "Deployment", value: "deployment" },
    ],
  },
  {
    id: "task-start",
    type: "date",
    label: "Start Date",
    required: true,
  },
  {
    id: "task-end",
    type: "date",
    label: "End Date",
    required: true,
  },
  {
    id: "task-description",
    type: "textarea",
    label: "Description",
    placeholder: "Describe the task and its deliverables",
  },
];

const RESOURCE_FORM_FIELDS: FormField[] = [
  {
    id: "resource-name",
    type: "text",
    label: "Resource Name",
    placeholder: "John Doe",
    required: true,
  },
  {
    id: "resource-role",
    type: "select",
    label: "Role",
    required: true,
    options: [
      { label: "Developer", value: "developer" },
      { label: "Designer", value: "designer" },
      { label: "Project Manager", value: "pm" },
      { label: "QA Engineer", value: "qa" },
    ],
  },
  {
    id: "resource-allocation",
    type: "select",
    label: "Allocation %",
    options: [
      { label: "25%", value: "25" },
      { label: "50%", value: "50" },
      { label: "75%", value: "75" },
      { label: "100%", value: "100" },
    ],
  },
  {
    id: "resource-cost",
    type: "text",
    label: "Cost per Day",
    placeholder: "$500",
  },
];

const IMPORT_FORM_FIELDS: FormField[] = [
  {
    id: "import-file",
    type: "file",
    label: "Project File",
    accept: ".xlsx,.xls,.csv,.json",
    required: true,
    helperText: "Supported formats: Excel, CSV, JSON",
  },
  {
    id: "import-mapping",
    type: "select",
    label: "Mapping Template",
    options: [
      { label: "Microsoft Project", value: "msp" },
      { label: "Asana", value: "asana" },
      { label: "Monday.com", value: "monday" },
      { label: "Jira", value: "jira" },
      { label: "Custom", value: "custom" },
    ],
  },
];

// ============================================================================
// MODAL SHOWCASE COMPONENT
// ============================================================================

interface ModalShowcaseProps {
  title: string;
  description: string;
  fields: FormField[];
  size?: "small" | "medium" | "large" | "xlarge";
  layout?: "vertical" | "grid";
}

function ModalShowcase({
  title,
  description,
  fields,
  size = "medium",
  layout = "vertical",
}: ModalShowcaseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#F5F5F7",
        borderRadius: "12px",
        border: "1px solid #D1D1D6",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "17px",
            fontWeight: 600,
            color: "#1D1D1F",
            margin: 0,
            marginBottom: "6px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#86868B",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#007AFF",
              backgroundColor: "rgba(0, 122, 255, 0.1)",
              padding: "4px 12px",
              borderRadius: "4px",
            }}
          >
            Size: {size}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#34C759",
              backgroundColor: "rgba(52, 199, 89, 0.1)",
              padding: "4px 12px",
              borderRadius: "4px",
            }}
          >
            Layout: {layout}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#FF9500",
              backgroundColor: "rgba(255, 149, 0, 0.1)",
              padding: "4px 12px",
              borderRadius: "4px",
            }}
          >
            Fields: {fields.length}
          </span>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: "10px 20px",
          fontFamily: "var(--font-text)",
          fontSize: "14px",
          fontWeight: 600,
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#007AFF",
          color: "#FFFFFF",
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
        Preview Modal
      </button>

      {/* Modal */}
      <AppleMinimalistModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        subtitle={description}
        size={size}
        fields={fields}
        formLayout={layout}
        formValues={values}
        onFieldChange={handleFieldChange}
        primaryAction={{
          label: "Save",
          onClick: () => {
            console.log("Form values:", values);
            setIsOpen(false);
          },
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setIsOpen(false),
        }}
      />
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ModalDesignSystemPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        padding: "64px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Hero Section */}
        <div style={{ marginBottom: "64px", textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "48px",
              fontWeight: 700,
              color: "#1D1D1F",
              margin: "0 0 16px 0",
              lineHeight: 1.2,
            }}
          >
            Modal Design System
          </h1>
          <p
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "18px",
              color: "#86868B",
              margin: "0 0 32px 0",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            Apple-grade minimalist design with complete component library. All variations
            shown below—choose the pattern that resonates most with your design philosophy.
          </p>

          {/* Key Principles */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "24px",
              marginTop: "40px",
            }}
          >
            {[
              { title: "Deep Simplicity", desc: "One component, infinite uses" },
              { title: "Whitespace", desc: "Every pixel purposeful" },
              { title: "Typography", desc: "Hierarchy through design" },
              { title: "Accessibility", desc: "Keyboard-first approach" },
            ].map((principle) => (
              <div
                key={principle.title}
                style={{
                  padding: "20px",
                  backgroundColor: "#F5F5F7",
                  borderRadius: "12px",
                  border: "1px solid #D1D1D6",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1D1D1F",
                    margin: "0 0 6px 0",
                  }}
                >
                  {principle.title}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "12px",
                    color: "#86868B",
                    margin: 0,
                  }}
                >
                  {principle.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Small Modal */}
        <div style={{ marginBottom: "64px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 700,
              color: "#1D1D1F",
              margin: "0 0 32px 0",
            }}
          >
            Small Modal (480px)
          </h2>
          <div style={{ display: "grid", gap: "20px" }}>
            <ModalShowcase
              title="Quick Action"
              description="Minimal form for fast interactions"
              size="small"
              layout="vertical"
              fields={[
                {
                  id: "quick-name",
                  type: "text",
                  label: "Name",
                  required: true,
                },
                {
                  id: "quick-confirm",
                  type: "text",
                  label: "Confirmation Code",
                  required: true,
                },
              ]}
            />
          </div>
        </div>

        {/* Section: Medium Modal */}
        <div style={{ marginBottom: "64px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 700,
              color: "#1D1D1F",
              margin: "0 0 32px 0",
            }}
          >
            Medium Modal (640px) - Most Common
          </h2>
          <div style={{ display: "grid", gap: "20px" }}>
            <ModalShowcase
              title="Create Phase"
              description="Add a new phase to your project timeline"
              size="medium"
              layout="vertical"
              fields={PHASE_FORM_FIELDS}
            />
            <ModalShowcase
              title="Create Task"
              description="Add a new task within a phase"
              size="medium"
              layout="vertical"
              fields={TASK_FORM_FIELDS}
            />
            <ModalShowcase
              title="Allocate Resource"
              description="Assign a resource to a task"
              size="medium"
              layout="grid"
              fields={RESOURCE_FORM_FIELDS}
            />
          </div>
        </div>

        {/* Section: Large Modal */}
        <div style={{ marginBottom: "64px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 700,
              color: "#1D1D1F",
              margin: "0 0 32px 0",
            }}
          >
            Large Modal (880px) - Complex Forms
          </h2>
          <div style={{ display: "grid", gap: "20px" }}>
            <ModalShowcase
              title="Import Project"
              description="Upload and map your existing project data"
              size="large"
              layout="grid"
              fields={IMPORT_FORM_FIELDS}
            />
          </div>
        </div>

        {/* Section: Design Notes */}
        <div
          style={{
            padding: "40px",
            backgroundColor: "#F5F5F7",
            borderRadius: "12px",
            border: "1px solid #D1D1D6",
            marginBottom: "40px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 700,
              color: "#1D1D1F",
              margin: "0 0 20px 0",
            }}
          >
            Design Philosophy & Implementation Notes
          </h2>

          <div style={{ display: "grid", gap: "20px" }}>
            {[
              {
                title: "1. The 8pt Grid System",
                content:
                  "All spacing, padding, and sizes follow an 8pt grid. This ensures perfect alignment and visual harmony across all modals. (320px = 40×8pt, 480px = 60×8pt, etc.)",
              },
              {
                title: "2. Typography Creates Hierarchy",
                content:
                  "Instead of arbitrary font sizes, we use meaningful sizes that create natural visual hierarchy: Display (headers), Text (body), and Mono (values).",
              },
              {
                title: "3. Color with Purpose",
                content:
                  "Blue (#007AFF) for primary actions, Red (#FF3B30) for destructive, Gray (#86868B) for secondary. Each color has a role.",
              },
              {
                title: "4. Whitespace is Essential",
                content:
                  "Every modal has generous breathing room. Forms are never cramped. Content can stretch comfortably within the bounds of good design.",
              },
              {
                title: "5. One Action, One Color",
                content:
                  "Users never wonder what to click. Primary action gets blue, secondary gets outline, destructive gets red. Clarity through color.",
              },
              {
                title: "6. Form Inputs with Clarity",
                content:
                  "Labels float above inputs. Errors appear inline with icons. Helper text guides users. Focus states are subtle but clear.",
              },
              {
                title: "7. Micro-interactions Matter",
                content:
                  "Smooth 0.15s transitions on hover and focus. Loading states include spinners. Animations use Apple's spring physics.",
              },
              {
                title: "8. Accessibility is Built-in",
                content:
                  "Keyboard navigation works perfectly. Screen readers understand structure. Focus traps prevent accidental page interactions.",
              },
            ].map((note) => (
              <div key={note.title}>
                <h3
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1D1D1F",
                    margin: "0 0 8px 0",
                  }}
                >
                  {note.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    color: "#555555",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Component Types */}
        <div
          style={{
            padding: "40px",
            backgroundColor: "#F5F5F7",
            borderRadius: "12px",
            border: "1px solid #D1D1D6",
            marginBottom: "40px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 700,
              color: "#1D1D1F",
              margin: "0 0 20px 0",
            }}
          >
            Available Form Components
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {[
              {
                component: "Text Input",
                use: "Names, titles, simple strings",
              },
              {
                component: "Textarea",
                use: "Descriptions, longer content",
              },
              {
                component: "Date Picker",
                use: "Dates with native browser picker",
              },
              {
                component: "Select/Dropdown",
                use: "Choose from predefined options",
              },
              {
                component: "File Upload",
                use: "Import files with drag & drop UI",
              },
              {
                component: "Color Picker",
                use: "Choose and display colors",
              },
            ].map((item) => (
              <div
                key={item.component}
                style={{
                  padding: "16px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  border: "1px solid #D1D1D6",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1D1D1F",
                    margin: "0 0 6px 0",
                  }}
                >
                  {item.component}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    color: "#86868B",
                    margin: 0,
                  }}
                >
                  {item.use}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: "40px" }}>
          <p
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              color: "#86868B",
              margin: 0,
            }}
          >
            Choose your preferred modal size and layout. Every design shown here follows
            Apple's Human Interface Guidelines and Steve Jobs/Jony Ive's philosophy of
            ruthless simplicity.
          </p>
        </div>
      </div>
    </div>
  );
}
