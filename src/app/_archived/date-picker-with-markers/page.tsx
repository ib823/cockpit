/**
 * Date Picker with Markers Showcase
 *
 * Demonstrates the EnhancedDatePickerWithMarkers component
 * with holidays (from @/data/holidays) and custom milestones.
 *
 * Visual Indicators:
 * - Red dot: Public holidays
 * - Blue dot: Milestones
 * - Purple: Holiday + Milestone
 * - Amber: Weekends
 */

"use client";

import { useState } from "react";
import { AppleMinimalistModal, type FormField } from "@/components/ui/AppleMinimalistModal";
import type { Milestone } from "@/components/ui/EnhancedDatePickerWithMarkers";

// Sample milestones for 2025
const SAMPLE_MILESTONES: Milestone[] = [
  {
    date: "2025-01-15",
    name: "Project Kickoff",
    color: "primary",
  },
  {
    date: "2025-02-14",
    name: "Design Review",
    color: "primary",
  },
  {
    date: "2025-03-01",
    name: "Dev Sprint Starts",
    color: "primary",
  },
  {
    date: "2025-03-15",
    name: "Beta Release",
    color: "success",
  },
  {
    date: "2025-04-01",
    name: "Public Launch",
    color: "success",
  },
  {
    date: "2025-05-10",
    name: "First Maintenance Release",
    color: "primary",
  },
];

interface ModalShowcase {
  title: string;
  description: string;
  fields: FormField[];
}

export default function DatePickerMarkersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModal, setSelectedModal] = useState<ModalShowcase | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const modals: ModalShowcase[] = [
    {
      title: "Schedule Project Phase",
      description: "Select start and end dates for your project phase with holiday awareness",
      fields: [
        {
          id: "phaseName",
          type: "text",
          label: "Phase Name",
          placeholder: "e.g., Design, Development",
          required: true,
        },
        {
          id: "phaseStart",
          type: "date",
          label: "Start Date",
          required: true,
          useEnhancedPicker: true,
          milestones: SAMPLE_MILESTONES,
          region: "ABMY",
          helperText: "Red dots are public holidays, blue dots are milestones",
        },
        {
          id: "phaseEnd",
          type: "date",
          label: "End Date",
          required: true,
          useEnhancedPicker: true,
          milestones: SAMPLE_MILESTONES,
          region: "ABMY",
        },
      ],
    },
    {
      title: "Schedule Task",
      description: "Create a task with dates that avoid holidays and align with milestones",
      fields: [
        {
          id: "taskName",
          type: "text",
          label: "Task Name",
          placeholder: "e.g., Wireframes, Database Setup",
          required: true,
        },
        {
          id: "taskStart",
          type: "date",
          label: "Start Date",
          required: true,
          useEnhancedPicker: true,
          milestones: SAMPLE_MILESTONES,
          region: "ABMY",
        },
        {
          id: "taskEnd",
          type: "date",
          label: "End Date",
          required: true,
          useEnhancedPicker: true,
          milestones: SAMPLE_MILESTONES,
          region: "ABMY",
        },
        {
          id: "taskDescription",
          type: "textarea",
          label: "Description",
          placeholder: "What needs to be done?",
        },
      ],
    },
    {
      title: "Request Time Off",
      description: "Request time off avoiding important milestones",
      fields: [
        {
          id: "requestor",
          type: "text",
          label: "Your Name",
          required: true,
        },
        {
          id: "offStart",
          type: "date",
          label: "Start Date",
          required: true,
          useEnhancedPicker: true,
          milestones: SAMPLE_MILESTONES,
          region: "ABMY",
        },
        {
          id: "offEnd",
          type: "date",
          label: "End Date",
          required: true,
          useEnhancedPicker: true,
          milestones: SAMPLE_MILESTONES,
          region: "ABMY",
        },
        {
          id: "reason",
          type: "textarea",
          label: "Reason",
          placeholder: "Why are you requesting time off?",
        },
      ],
    },
  ];

  const handleOpenModal = (modal: ModalShowcase) => {
    setSelectedModal(modal);
    setValues({});
    setIsOpen(true);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

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
            Date Picker with Holiday & Milestone Markers
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
            Beautiful calendar with visual markers for holidays and important milestones. Click
            any date field to see the enhanced calendar.
          </p>

          {/* Legend */}
          <div
            style={{
              display: "inline-grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "20px",
              marginTop: "40px",
            }}
          >
            {[
              { color: "#FF3B30", label: "Public Holiday", bg: "#FFF5F5" },
              { color: "#007AFF", label: "Milestone", bg: "#F0F7FF" },
              { color: "#FF9500", label: "Weekend", bg: "#FFF8F0" },
              { color: "#6B21A8", label: "Holiday + Milestone", bg: "#E8D5FF" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "16px",
                  backgroundColor: item.bg,
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: item.color,
                    margin: "0 auto 8px",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    color: "#1D1D1F",
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Showcase Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "64px",
          }}
        >
          {modals.map((modal, idx) => (
            <div
              key={idx}
              style={{
                padding: "24px",
                backgroundColor: "#F5F5F7",
                borderRadius: "12px",
                border: "1px solid #D1D1D6",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  margin: "0 0 8px 0",
                }}
              >
                {modal.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "#86868B",
                  margin: "0 0 16px 0",
                }}
              >
                {modal.description}
              </p>
              <button
                onClick={() => handleOpenModal(modal)}
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
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#0051D5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#007AFF";
                }}
              >
                Open Modal
              </button>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div
          style={{
            padding: "40px",
            backgroundColor: "#F5F5F7",
            borderRadius: "12px",
            border: "1px solid #D1D1D6",
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
            Calendar Features
          </h2>

          <div style={{ display: "grid", gap: "16px" }}>
            {[
              {
                title: "Holiday Awareness",
                description:
                  "Automatically shows public holidays (Malaysia, Singapore, Vietnam) with red indicators and background highlighting.",
              },
              {
                title: "Custom Milestones",
                description:
                  "Display important project milestones with blue indicators. Easily see when key dates align with your schedule.",
              },
              {
                title: "Smart Date Selection",
                description:
                  "Hover over dates to see holiday names and milestone details. Navigate through months with prev/next buttons.",
              },
              {
                title: "Combined Indicators",
                description:
                  "When a date is both a holiday and a milestone, both markers appear. Purple background shows the combination.",
              },
              {
                title: "Weekend Highlighting",
                description:
                  "Weekends are shown with amber background so you can easily identify working days at a glance.",
              },
              {
                title: "Easy Integration",
                description:
                  "Simply set useEnhancedPicker: true in your FormField configuration and pass milestones array.",
              },
            ].map((feature) => (
              <div key={feature.title}>
                <h3
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1D1D1F",
                    margin: "0 0 6px 0",
                  }}
                >
                  ✓ {feature.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    color: "#555555",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div
          style={{
            marginTop: "40px",
            padding: "24px",
            backgroundColor: "#E8F5FF",
            borderRadius: "12px",
            border: "1px solid #B3E5FC",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 600,
              color: "#0277BD",
              margin: "0 0 8px 0",
            }}
          >
            💡 Pro Tips
          </h3>
          <ul
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              color: "#01579B",
              margin: 0,
              paddingLeft: "20px",
              lineHeight: 1.8,
            }}
          >
            <li>Click on any date field above to open the calendar</li>
            <li>Hover over dates with markers to see their names</li>
            <li>Use month navigation arrows to browse through dates</li>
            <li>Combine with other form fields to create powerful scheduling UIs</li>
            <li>Milestones are fully customizable - pass any dates you want</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      {selectedModal && (
        <AppleMinimalistModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={selectedModal.title}
          subtitle={selectedModal.description}
          size="medium"
          fields={selectedModal.fields}
          formValues={values}
          onFieldChange={handleFieldChange}
          primaryAction={{
            label: "Save",
            onClick: () => {
              console.log("Saved:", values);
              setIsOpen(false);
            },
          }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => setIsOpen(false),
          }}
        />
      )}
    </div>
  );
}
