"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { usePresalesStore } from "@/stores/presales-store";
import { exportToExcel, type ExportData } from "@/lib/export/excel-exporter";
import { showSuccess, showError } from "@/lib/toast";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
}

export function ExportButton({
  variant = "secondary",
  size = "sm",
  className,
  fullWidth,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { phases, getProjectCost } = useTimelineStore();
  const { chips, decisions } = usePresalesStore();

  const handleExport = async () => {
    if (phases.length === 0) {
      showError("No timeline data to export. Generate a timeline first.");
      return;
    }

    setIsExporting(true);

    try {
      const totalCost = getProjectCost();
      const totalDuration = phases.reduce((sum, phase) => sum + phase.workingDays, 0);

      const exportData: ExportData = {
        projectName: `SAP Implementation ${new Date().getFullYear()}`,
        chips,
        phases,
        decisions,
        totalCost,
        totalDuration,
        metadata: {
          generatedAt: new Date(),
          generatedBy: "Keystone",
          version: "1.0.0",
        },
      };

      await exportToExcel(exportData);

      showSuccess(
        `Excel file downloaded successfully! Contains ${phases.length} phases and ${chips.length} requirements.`
      );
    } catch (error) {
      console.error("[ExportButton] Export failed:", error);
      showError("Failed to export to Excel. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting || phases.length === 0}
      leftIcon={
        isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )
      }
      className={cn(fullWidth && "w-full", className)}
    >
      {isExporting ? "Exporting..." : "Export to Excel"}
    </Button>
  );
}

/**
 * Compact icon-only export button
 */
export function ExportIconButton({ className }: { className?: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const { phases, getProjectCost } = useTimelineStore();
  const { chips, decisions } = usePresalesStore();

  const handleExport = async () => {
    if (phases.length === 0) {
      showError("No timeline data to export");
      return;
    }

    setIsExporting(true);

    try {
      const totalCost = getProjectCost();
      const totalDuration = phases.reduce((sum, phase) => sum + phase.workingDays, 0);

      const exportData: ExportData = {
        projectName: `SAP Implementation ${new Date().getFullYear()}`,
        chips,
        phases,
        decisions,
        totalCost,
        totalDuration,
        metadata: {
          generatedAt: new Date(),
          generatedBy: "Keystone",
          version: "1.0.0",
        },
      };

      await exportToExcel(exportData);
      showSuccess("Excel exported!");
    } catch (error) {
      console.error("[ExportIconButton] Export failed:", error);
      showError("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || phases.length === 0}
      className={cn(
        "p-2 rounded-lg transition-colors",
        "hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center",
        className
      )}
      aria-label="Export to Excel"
      title="Export to Excel"
    >
      {isExporting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <FileDown className="w-5 h-5" />
      )}
    </button>
  );
}
