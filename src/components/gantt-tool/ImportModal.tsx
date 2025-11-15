/**
 * Gantt Tool - Import Modal
 *
 * Modal for importing project data from Excel templates.
 * Allows users to download template and upload filled data.
 *
 * Refactored to use AppleMinimalistModal with Apple HIG standards
 */

"use client";

import { useState, useCallback } from "react";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Info,
  Copy,
  X,
} from "lucide-react";
import { generateImportTemplate } from "@/lib/gantt-tool/import-template-generator";
import { parseImportFile, type ImportResult } from "@/lib/gantt-tool/import-parser";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { ExcelTemplateImport } from "./ExcelTemplateImport";
import { AppleMinimalistModal, ModalButton } from "@/components/ui/AppleMinimalistModal";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "upload" | "paste";

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const importProject = useGanttToolStoreV2((state) => state.importProject);

  const [activeTab, setActiveTab] = useState<TabType>("paste");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"select" | "preview">("select");

  const handleDownloadTemplate = async () => {
    await generateImportTemplate();
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setStep("select");
    }
  }, []);

  const handleParseFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await parseImportFile(selectedFile);
      setImportResult(result);
      if (result.success) {
        setStep("preview");
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [
          {
            sheet: "File",
            row: 0,
            column: "",
            message: error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
        warnings: [],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (importResult?.success && importResult.project) {
      importProject(importResult.project);
      onClose();
    }
  };

  const footer = activeTab === "upload" ? (
    <>
      <ModalButton onClick={onClose} variant="secondary">
        Cancel
      </ModalButton>
      {step === "preview" && (
        <>
          <ModalButton
            onClick={() => {
              setStep("select");
              setImportResult(null);
            }}
            variant="secondary"
          >
            Back
          </ModalButton>
          <ModalButton onClick={handleConfirmImport} variant="primary">
            <CheckCircle className="w-4 h-4 mr-2 inline" />
            Confirm Import
          </ModalButton>
        </>
      )}
    </>
  ) : undefined;

  return (
    <AppleMinimalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Project from Excel"
      subtitle="Import your existing project planning data"
      icon={<Upload className="w-5 h-5" />}
      size="large"
      footer={footer}
    >
      {/* Tabs */}
      <div
        style={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          marginBottom: "24px",
          marginLeft: "-32px",
          marginRight: "-32px",
          marginTop: "-32px",
        }}
      >
        <div style={{ display: "flex", gap: "4px", paddingLeft: "32px" }}>
          <button
            onClick={() => setActiveTab("paste")}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 500,
              position: "relative",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: activeTab === "paste" ? "#007AFF" : "#86868B",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "paste") e.currentTarget.style.color = "#1D1D1F";
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "paste") e.currentTarget.style.color = "#86868B";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Copy className="w-4 h-4" />
              <span>Copy & Paste</span>
            </div>
            {activeTab === "paste" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  backgroundColor: "#007AFF",
                }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 500,
              position: "relative",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: activeTab === "upload" ? "#007AFF" : "#86868B",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "upload") e.currentTarget.style.color = "#1D1D1F";
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "upload") e.currentTarget.style.color = "#86868B";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </div>
            {activeTab === "upload" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  backgroundColor: "#007AFF",
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "paste" && <ExcelTemplateImport onClose={onClose} />}

        {activeTab === "upload" && (
          <div>
              {step === "select" && (
                <div className="space-y-6">
                  {/* Step 1: Download Template */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Download Template</h3>
                        <p className="text-sm text-gray-700 mb-3">
                          Download our pre-formatted Excel template with examples and instructions.
                        </p>
                        <button
                          onClick={handleDownloadTemplate}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download Template
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Fill Template */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Fill in Your Data</h3>
                        <p className="text-sm text-gray-700 mb-2">
                          Open the template and replace the example data with your project
                          information:
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1 ml-4">
                          <li>• Project Info (name, start date, description)</li>
                          <li>• Phases (project phases with dates)</li>
                          <li>• Tasks (detailed tasks within phases)</li>
                          <li>• Resources (team members and org structure)</li>
                          <li>• Milestones (key project milestones)</li>
                          <li>• Holidays (optional company/regional holidays)</li>
                        </ul>
                        <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Important:</strong> Use YYYY-MM-DD format for all dates (e.g.,
                            2025-01-15). Phase names in Tasks sheet must exactly match Phase names
                            in Phases sheet.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Upload File */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Upload Filled Template</h3>
                        <p className="text-sm text-gray-700 mb-3">
                          Select your filled Excel file to import the project data.
                        </p>

                        {/* File Input */}
                        <div className="space-y-3">
                          <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer">
                            <div className="text-center">
                              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <span className="text-sm text-gray-600">
                                Click to select Excel file or drag and drop
                              </span>
                              <p className="text-xs text-gray-500 mt-1">Accepts .xlsx files</p>
                            </div>
                            <input
                              type="file"
                              accept=".xlsx"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>

                          {selectedFile && (
                            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {selectedFile.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedFile(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {selectedFile && (
                            <button
                              onClick={handleParseFile}
                              disabled={isProcessing}
                              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Parse and Validate
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Errors */}
                  {importResult && !importResult.success && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900">Validation Errors</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Please fix the following errors and try again:
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {importResult.errors.map((error, idx) => (
                          <div key={idx} className="text-sm text-red-800 bg-red-100 p-2 rounded">
                            <strong>{error.sheet}</strong>
                            {error.row > 0 &&
                              ` (Row ${error.row}${error.column ? `, Column ${error.column}` : ""})`}
                            : {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === "preview" && importResult?.success && importResult.project && (
                <div className="space-y-4">
                  {/* Success Message */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">File parsed successfully!</span>
                    </div>
                  </div>

                  {/* Preview Summary */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Import Preview</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Project Name</div>
                        <div className="text-lg font-bold text-gray-900">
                          {importResult.project.name}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Start Date</div>
                          <div className="text-gray-900">{importResult.project.startDate}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Description</div>
                          <div className="text-gray-600 text-sm">
                            {importResult.project.description || "No description"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {importResult.project.phases.length}
                          </div>
                          <div className="text-xs text-blue-600">Phases</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-700">
                            {importResult.project.phases.reduce(
                              (sum, p) => sum + p.tasks.length,
                              0
                            )}
                          </div>
                          <div className="text-xs text-orange-600">Tasks</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-700">
                            {importResult.project.resources.length}
                          </div>
                          <div className="text-xs text-purple-600">Resources</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {importResult.project.milestones.length}
                          </div>
                          <div className="text-xs text-green-600">Milestones</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {importResult.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <h4 className="font-semibold text-yellow-900">Warnings</h4>
                      </div>
                      <ul className="space-y-1 ml-7">
                        {importResult.warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-yellow-800">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
      </div>
    </AppleMinimalistModal>
  );
}
