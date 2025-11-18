/**
 * Org Structure Import Component
 *
 * Allows importing org structure from CSV/Excel files
 * Expected format: Name, Email, Category, Designation, Manager Email, Department, Location, Project Role
 */

"use client";

import { useState, useCallback } from "react";
import { Modal, Upload, Button, Typography, Alert, Table, App, Select } from "antd";
import {
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd";
import * as XLSX from "xlsx";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import type { ResourceCategory, ResourceDesignation } from "@/types/gantt-tool";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";

const { Title, Text, Paragraph } = Typography;

interface ParsedResource {
  name: string;
  email?: string;
  category: ResourceCategory;
  designation: ResourceDesignation;
  managerEmail?: string;
  department?: string;
  location?: string;
  projectRole?: string;
  status: "valid" | "warning" | "error";
  issues: string[];
}

interface OrgStructureImportProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function OrgStructureImport({
  visible,
  onClose,
  onImportComplete,
}: OrgStructureImportProps) {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [parsedData, setParsedData] = useState<ParsedResource[]>([]);
  const [importing, setImporting] = useState(false);

  const currentProject = useGanttToolStore((state) => state.currentProject);
  const addResource = useGanttToolStore((state) => state.addResource);
  const assignManager = useGanttToolStore((state) => (state as any).assignManager);

  const parseFile = useCallback(async (file: File) => {
    return new Promise<ParsedResource[]>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            reject(new Error("File must contain headers and at least one row of data"));
            return;
          }

          const headers = jsonData[0] as string[];
          const nameIndex = headers.findIndex((h) => h.toLowerCase().includes("name"));
          const emailIndex = headers.findIndex(
            (h) => h.toLowerCase().includes("email") && !h.toLowerCase().includes("manager")
          );
          const categoryIndex = headers.findIndex((h) => h.toLowerCase().includes("category"));
          const designationIndex = headers.findIndex(
            (h) => h.toLowerCase().includes("designation") || h.toLowerCase().includes("level")
          );
          const managerEmailIndex = headers.findIndex((h) => h.toLowerCase().includes("manager"));
          const departmentIndex = headers.findIndex((h) => h.toLowerCase().includes("department"));
          const locationIndex = headers.findIndex((h) => h.toLowerCase().includes("location"));
          const projectRoleIndex = headers.findIndex(
            (h) => h.toLowerCase().includes("project") && h.toLowerCase().includes("role")
          );

          const parsed: ParsedResource[] = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (!row || row.length === 0 || !row[nameIndex]) continue;

            const name = String(row[nameIndex] || "").trim();
            if (!name) continue;

            const email = row[emailIndex] ? String(row[emailIndex]).trim() : undefined;
            const categoryStr = row[categoryIndex]
              ? String(row[categoryIndex]).trim().toLowerCase()
              : "functional";
            const designationStr = row[designationIndex]
              ? String(row[designationIndex]).trim().toLowerCase()
              : "consultant";
            const managerEmail = row[managerEmailIndex]
              ? String(row[managerEmailIndex]).trim()
              : undefined;
            const department = row[departmentIndex]
              ? String(row[departmentIndex]).trim()
              : undefined;
            const location = row[locationIndex] ? String(row[locationIndex]).trim() : undefined;
            const projectRole = row[projectRoleIndex]
              ? String(row[projectRoleIndex]).trim()
              : undefined;

            // Map category
            let category: ResourceCategory = "functional";
            const categoryLower = categoryStr.toLowerCase();
            if (categoryLower.includes("tech")) category = "technical";
            else if (categoryLower.includes("basis")) category = "basis";
            else if (categoryLower.includes("security") || categoryLower.includes("grc"))
              category = "security";
            else if (categoryLower.includes("pm") || categoryLower.includes("project"))
              category = "pm";
            else if (categoryLower.includes("change") || categoryLower.includes("ocm"))
              category = "change";
            else if (categoryLower.includes("qa") || categoryLower.includes("test"))
              category = "qa";
            else if (categoryLower.includes("other")) category = "other";

            // Map designation
            let designation: ResourceDesignation = "consultant";
            const designationLower = designationStr.toLowerCase();
            if (designationLower.includes("principal")) designation = "principal";
            else if (designationLower.includes("senior") && designationLower.includes("manager"))
              designation = "senior_manager";
            else if (designationLower.includes("manager")) designation = "manager";
            else if (designationLower.includes("senior")) designation = "senior_consultant";
            else if (designationLower.includes("analyst")) designation = "analyst";
            else if (
              designationLower.includes("subcontractor") ||
              designationLower.includes("contractor")
            )
              designation = "subcontractor";

            const issues: string[] = [];
            let status: "valid" | "warning" | "error" = "valid";

            if (!email) {
              issues.push("No email provided");
              status = "warning";
            }

            if (managerEmail && !email) {
              issues.push("Manager email specified but resource has no email");
              status = "warning";
            }

            parsed.push({
              name,
              email,
              category,
              designation,
              managerEmail,
              department,
              location,
              projectRole,
              status,
              issues,
            });
          }

          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  }, []);

  const handleUpload = useCallback(
    async ({ file }: any) => {
      try {
        const parsed = await parseFile(file as File);
        setParsedData(parsed);
        message.success(`Successfully parsed ${parsed.length} resources from file`);
      } catch (error) {
        message.error(
          `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
      return false; // Prevent auto-upload
    },
    [parseFile, message]
  );

  const handleImport = useCallback(async () => {
    if (!currentProject) return;
    setImporting(true);

    try {
      // Create a map of email to resource ID
      const emailToIdMap = new Map<string, string>();

      // First pass: create all resources
      for (const parsed of parsedData) {
        const resourceId = await addResource({
          name: parsed.name,
          category: parsed.category,
          designation: parsed.designation,
          description: `Imported from file`,
          email: parsed.email,
          department: parsed.department,
          location: parsed.location,
          projectRole: parsed.projectRole,
        } as any);

        // addResource may not return an ID, so we generate one if needed
        if (parsed.email && resourceId) {
          emailToIdMap.set(parsed.email.toLowerCase(), resourceId as string);
        }
      }

      // Second pass: assign managers
      let managerAssignCount = 0;
      for (const parsed of parsedData) {
        if (parsed.managerEmail && parsed.email) {
          const resourceId = emailToIdMap.get(parsed.email.toLowerCase());
          const managerId = emailToIdMap.get(parsed.managerEmail.toLowerCase());

          if (resourceId && managerId) {
            try {
              assignManager(resourceId, managerId);
              managerAssignCount++;
            } catch (error) {
              console.error("Failed to assign manager:", error);
            }
          }
        }
      }

      message.success(
        `Successfully imported ${parsedData.length} resources with ${managerAssignCount} manager relationships`
      );

      // Reset and close
      setParsedData([]);
      setFileList([]);
      onImportComplete();
      onClose();
    } catch (error) {
      message.error(
        `Failed to import: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setImporting(false);
    }
  }, [parsedData, currentProject, addResource, assignManager, onImportComplete, onClose, message]);

  const columns = [
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: string) => {
        if (status === "valid")
          return <CheckCircleOutlined className="text-lg" style={{ color: "#52c41a" }} />;
        if (status === "warning")
          return <InfoCircleOutlined className="text-lg" style={{ color: "#faad14" }} />;
        return <CloseCircleOutlined className="text-lg" style={{ color: "#ff4d4f" }} />;
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat: ResourceCategory) => RESOURCE_CATEGORIES[cat].label,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      render: (des: ResourceDesignation) => RESOURCE_DESIGNATIONS[des],
    },
    {
      title: "Manager Email",
      dataIndex: "managerEmail",
      key: "managerEmail",
      render: (email?: string) => email || <Text type="secondary">None</Text>,
    },
    {
      title: "Issues",
      dataIndex: "issues",
      key: "issues",
      render: (issues: string[]) =>
        issues.length > 0 ? issues.join(", ") : <Text type="secondary">None</Text>,
    },
  ];

  return (
    <Modal
      title={<Title level={4}>Import Organization Structure</Title>}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="import"
          type="primary"
          onClick={handleImport}
          disabled={parsedData.length === 0}
          loading={importing}
        >
          Import {parsedData.length} Resources
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* Instructions */}
        <Alert
          message="File Format"
          description={
            <div>
              <Paragraph>
                Upload a CSV or Excel file with the following columns (headers are
                case-insensitive):
              </Paragraph>
              <ul className="list-disc list-inside text-sm">
                <li>
                  <strong>Name</strong> (required): Resource name
                </li>
                <li>
                  <strong>Email</strong>: Resource email address
                </li>
                <li>
                  <strong>Category</strong>: functional, technical, basis, security, pm, change, qa,
                  other
                </li>
                <li>
                  <strong>Designation</strong>: principal, senior_manager, manager,
                  senior_consultant, consultant, analyst, subcontractor
                </li>
                <li>
                  <strong>Manager Email</strong>: Email of the manager (must match another
                  resource's email)
                </li>
                <li>
                  <strong>Department</strong>: Department name
                </li>
                <li>
                  <strong>Location</strong>: Location or site
                </li>
                <li>
                  <strong>Project Role</strong>: Role in this project
                </li>
              </ul>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
        />

        {/* Upload */}
        <Upload
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          beforeUpload={handleUpload}
          accept=".csv,.xlsx,.xls"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} size="large">
            Select File
          </Button>
        </Upload>

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <div>
            <Title level={5}>Preview ({parsedData.length} resources)</Title>
            <Table
              columns={columns}
              dataSource={parsedData.map((r, i) => ({ ...r, key: i }))}
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ y: 400 }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
