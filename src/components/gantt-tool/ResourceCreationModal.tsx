"use client";

import { useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";

interface ResourceCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resource: CreatedResource) => void;
  projectId: string;
}

export interface CreatedResource {
  id: string;
  name: string;
  designation: string;
  chargeRatePerHour: number;
  regionCode: string;
  category: string;
}

const DESIGNATIONS = [
  { value: "principal", label: "Principal" },
  { value: "director", label: "Director" },
  { value: "senior_manager", label: "Senior Manager" },
  { value: "manager", label: "Manager" },
  { value: "senior_consultant", label: "Senior Consultant" },
  { value: "consultant", label: "Consultant" },
  { value: "analyst", label: "Analyst" },
  { value: "subcontractor", label: "Subcontractor" },
];

const CATEGORIES = [
  { value: "leadership", label: "Leadership" },
  { value: "pm", label: "Project Management" },
  { value: "functional", label: "Functional" },
  { value: "technical", label: "Technical" },
  { value: "change", label: "Change Management" },
  { value: "qa", label: "Quality Assurance" },
  { value: "basis", label: "Basis" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

const REGIONS = [
  { value: "ABMY", label: "Malaysia" },
  { value: "ABSG", label: "Singapore" },
  { value: "ABTH", label: "Thailand" },
  { value: "ABVN", label: "Vietnam" },
  { value: "ABID", label: "Indonesia" },
  { value: "ABPH", label: "Philippines" },
];

export function ResourceCreationModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
}: ResourceCreationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    designation: "manager",
    category: "functional",
    regionCode: "ABMY",
    chargeRatePerHour: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/gantt-tool/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: formData.name.trim(),
          designation: formData.designation,
          category: formData.category,
          description: formData.description.trim() || `${formData.name} - ${formData.designation}`,
          assignmentLevel: "phase",
          isBillable: true,
          chargeRatePerHour: parseFloat(formData.chargeRatePerHour) || null,
          regionCode: formData.regionCode,
          currency: "MYR",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create resource");
      }

      onSuccess({
        id: result.data.id,
        name: result.data.name,
        designation: result.data.designation,
        chargeRatePerHour: result.data.chargeRatePerHour || 0,
        regionCode: result.data.regionCode || "ABMY",
        category: result.data.category,
      });

      // Reset form
      setFormData({
        name: "",
        designation: "manager",
        category: "functional",
        regionCode: "ABMY",
        chargeRatePerHour: "",
        description: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim().length > 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Resource"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="resourceName" className="block text-sm font-medium text-gray-700 mb-1">
            Resource Name <span className="text-red-500">*</span>
          </label>
          <input
            id="resourceName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Project Manager, FI Consultant"
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
            Designation <span className="text-red-500">*</span>
          </label>
          <select
            id="designation"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {DESIGNATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Region <span className="text-red-500">*</span>
          </label>
          <select
            id="region"
            value={formData.regionCode}
            onChange={(e) => setFormData({ ...formData, regionCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="chargeRate" className="block text-sm font-medium text-gray-700 mb-1">
            Charge Rate (per hour in MYR)
          </label>
          <input
            id="chargeRate"
            type="number"
            min="0"
            step="0.01"
            value={formData.chargeRatePerHour}
            onChange={(e) => setFormData({ ...formData, chargeRatePerHour: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 150.00"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Brief description of role..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Resource"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
