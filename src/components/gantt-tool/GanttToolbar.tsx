/**
 * Gantt Tool - Revolutionary Toolbar Component
 *
 * Steve Jobs principle: 5 essential items. Everything else is contextual.
 * 1. Project Name (editable inline)
 * 2. Add Phase (hero action)
 * 3. Team (opens context panel)
 * 4. Share (export & collaboration)
 * 5. Settings (everything else)
 */

"use client";

import React from "react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import {
  Plus,
  Users,
  Share2,
  Settings,
  ChevronDown,
  Check,
  X,
  FileImage,
  FileText,
  Download,
  Undo2,
  Redo2,
  BarChart3,
  Network,
  AlertTriangle,
} from "lucide-react";
import {
  FileImageOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  PlusOutlined,
  UploadOutlined,
  HomeOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FlagOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  CrownOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Input, Modal, Form, DatePicker, Tooltip, Badge, App } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { exportToPNG, exportToPDF, exportToExcel } from "@/lib/gantt-tool/export-utils";
import { ResourceManagementModal } from "./ResourceManagementModal";
import { ImportModal } from "./ImportModal";
import { ImportModalV2 } from "./ImportModalV2";
import { ProposalGenerationModal } from "./ProposalGenerationModal";
import { TemplateLibraryModal } from "./TemplateLibraryModal";
import { DuplicateCleanupModal } from "./DuplicateCleanupModal";
import { LogoLibraryModal } from "./LogoLibraryModal";
import ExportConfigModal from "./ExportConfigModal";
import type { MenuProps } from "antd";
import dayjs from "dayjs";
import { colorValues, getColoredShadow, spacing } from "@/lib/design-system";

interface GanttToolbarProps {
  showContextPanel?: boolean;
  onToggleContextPanel?: () => void;
  showQuickResourcePanel?: boolean;
  onToggleQuickResourcePanel?: () => void;
}

export function GanttToolbar({
  showContextPanel = true,
  onToggleContextPanel,
  showQuickResourcePanel = false,
  onToggleQuickResourcePanel,
}: GanttToolbarProps = {}) {
  const router = useRouter();
  const { modal } = App.useApp();
  const { data: session } = useSession();
  const {
    currentProject,
    projects,
    createProject,
    loadProject,
    unloadCurrentProject,
    deleteProject,
    openSidePanel,
    setZoomLevel,
    undo,
    redo,
    canUndo,
    canRedo,
    toggleTitles,
    setBarDurationDisplay,
  } = useGanttToolStoreV2();

  // Helper function to update project name
  const updateProjectName = async (newName: string) => {
    if (!currentProject) return;

    // Update via API
    const response = await fetch(`/api/gantt-tool/projects/${currentProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (response.ok) {
      // Reload the project to get updated data
      const store = useGanttToolStoreV2.getState();
      store.fetchProject(currentProject.id);
    } else if (response.status === 409) {
      // Duplicate name error
      const error = await response.json();
      modal.error({
        title: "Duplicate Project Name",
        content: error.error,
      });
      // Revert the name
      setEditedProjectName(currentProject.name);
    } else {
      // Other error
      modal.error({
        title: "Error",
        content: "Failed to update project name. Please try again.",
      });
    }
  };

  // Helper function to export project
  const exportProject = (format: string) => {
    if (!currentProject) return;
    const dataStr = JSON.stringify(currentProject, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentProject.name}.json`;
    link.click();
  };

  // Helper function to select which logo to display
  const handleSelectDisplayLogo = async (companyName: string) => {
    const store = useGanttToolStoreV2.getState();
    await store.selectDisplayLogo(companyName);
  };

  // Get the logo to display (selected or first available)
  const getDisplayLogo = () => {
    if (!currentProject || !currentProject.orgChartPro?.companyLogos) return null;

    const logos = currentProject.orgChartPro.companyLogos;
    const selected = currentProject.orgChartPro.selectedLogoCompanyName;

    // Return selected logo if it exists
    if (selected && logos[selected]) {
      return { companyName: selected, logoUrl: logos[selected] };
    }

    // Otherwise return first logo
    const firstCompanyName = Object.keys(logos)[0];
    if (firstCompanyName) {
      return { companyName: firstCompanyName, logoUrl: logos[firstCompanyName] };
    }

    return null;
  };

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showDuplicateCleanup, setShowDuplicateCleanup] = useState(false);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState("");
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [createProjectForm] = Form.useForm();

  // Handlers
  const handleCreateNewProject = () => {
    setShowCreateProjectModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateProjectSubmit = async (values: { projectName: string; startDate: any }) => {
    // Check for duplicate name
    const isDuplicate = projects.some(
      (p) => p.name.toLowerCase() === values.projectName.toLowerCase()
    );
    if (isDuplicate) {
      modal.error({
        title: "Duplicate Project Name",
        content: `A project named "${values.projectName}" already exists. Please choose a different name.`,
      });
      return;
    }

    const startDate = values.startDate.format("YYYY-MM-DD");
    await createProject(values.projectName, startDate);
    setShowCreateProjectModal(false);
    createProjectForm.resetFields();
  };

  const handleExportPNG = async () => {
    if (!currentProject) return;
    await exportToPNG(currentProject);
  };

  const handleExportPDF = async () => {
    if (!currentProject) return;
    await exportToPDF(currentProject);
  };

  const handleExportExcel = async () => {
    if (!currentProject) return;
    await exportToExcel(currentProject);
  };

  const handleExportJSON = () => {
    exportProject("json");
  };

  const handleStartEditingProjectName = () => {
    setEditedProjectName(currentProject?.name || "");
    setIsEditingProjectName(true);
  };

  const handleSaveProjectName = () => {
    if (editedProjectName.trim() && editedProjectName !== currentProject?.name) {
      // Check for duplicate name
      const isDuplicate = projects.some(
        (p) =>
          p.id !== currentProject?.id &&
          p.name.toLowerCase() === editedProjectName.trim().toLowerCase()
      );

      if (isDuplicate) {
        modal.error({
          title: "Duplicate Project Name",
          content: `A project named "${editedProjectName}" already exists. Please choose a different name.`,
        });
        return;
      }

      updateProjectName(editedProjectName.trim());
    }
    setIsEditingProjectName(false);
  };

  const handleCancelEditProjectName = () => {
    setIsEditingProjectName(false);
    setEditedProjectName("");
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveProjectName();
    } else if (e.key === "Escape") {
      handleCancelEditProjectName();
    }
  };

  // Share/Export Menu - Smart defaults with Proposal Generation as hero
  const shareMenuItems: MenuProps["items"] = [
    {
      key: "proposal",
      label: (
        <div className="py-1">
          <div className="font-semibold text-purple-600 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Generate Proposal
          </div>
          <div className="text-xs text-gray-500 mt-0.5">AI-powered client proposal</div>
        </div>
      ),
      onClick: () => setShowProposalModal(true),
      style: { backgroundColor: "#faf5ff" },
    },
    { type: "divider" },
    {
      key: "export-optimized",
      label: (
        <div className="py-1">
          <div className="font-semibold text-blue-600 flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            Optimized Export
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Professional snapshots for presentations
          </div>
        </div>
      ),
      onClick: () => setShowExportConfigModal(true),
      style: { backgroundColor: "#f0f7ff" },
    },
    { type: "divider" },
    {
      key: "export-group",
      type: "group",
      label: "Quick Export",
    },
    {
      key: "png",
      label: "Export as PNG",
      icon: <FileImageOutlined style={{ color: "#52c41a" }} />,
      onClick: handleExportPNG,
    },
    {
      key: "pdf",
      label: "Export as PDF",
      icon: <FilePdfOutlined style={{ color: "#ff4d4f" }} />,
      onClick: handleExportPDF,
    },
    {
      key: "excel",
      label: "Export to Excel",
      icon: <FileExcelOutlined style={{ color: "#1890ff" }} />,
      onClick: handleExportExcel,
    },
    { type: "divider" },
    {
      key: "json",
      label: "Export Project (JSON)",
      icon: <FileTextOutlined />,
      onClick: handleExportJSON,
    },
  ];

  // Settings Menu - Everything else lives here
  const settingsMenuItems: MenuProps["items"] = [
    {
      key: "project-group",
      type: "group",
      label: "Project",
    },
    {
      key: "new",
      label: "New Project",
      icon: <PlusOutlined />,
      onClick: handleCreateNewProject,
    },
    {
      key: "cleanup-duplicates",
      label: (
        <div className="py-1">
          <div className="font-semibold text-orange-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Remove Duplicates
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Clean up duplicate phases</div>
        </div>
      ),
      onClick: () => setShowDuplicateCleanup(true),
      style: { backgroundColor: "#fff7ed" },
    },
    {
      key: "templates",
      label: (
        <div className="py-1">
          <div className="font-semibold text-purple-600 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Template Library
          </div>
          <div className="text-xs text-gray-500 mt-0.5">50+ pre-built templates</div>
        </div>
      ),
      onClick: () => setShowTemplateLibrary(true),
      style: { backgroundColor: "#faf5ff" },
    },
    {
      key: "import",
      label: "Import from Excel",
      icon: <UploadOutlined />,
      onClick: () => setShowImportModal(true),
    },
    {
      key: "manage-logo",
      label: (
        <div className="py-1">
          <div className="font-semibold text-blue-600 flex items-center gap-2">
            <PictureOutlined />
            Manage Logo
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Upload or select company logo</div>
        </div>
      ),
      onClick: () => setShowLogoModal(true),
      style: { backgroundColor: "#f0f7ff" },
    },
    {
      key: "switch",
      label: (
        <div className="flex items-center justify-between">
          <span>Switch Project</span>
          <ChevronDown className="w-3 h-3 ml-2" />
        </div>
      ),
      children: projects.map((project, index) => ({
        key: `project-${index}-${project.id}`,
        label: (
          <div className="py-1 flex items-center justify-between gap-3">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="flex-1" onClick={() => loadProject(project.id)}>
              <div className="font-medium text-sm">
                {project.name}
                {project.id === currentProject?.id && <span className="ml-2 text-blue-500">●</span>}
              </div>
              <div className="text-xs text-gray-500">
                {project.phases.length} phases ·{" "}
                {project.phases.reduce((sum, p) => sum + p.tasks.length, 0)} tasks
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                modal.confirm({
                  title: "Delete Project",
                  content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
                  okText: "Delete",
                  okType: "danger",
                  cancelText: "Cancel",
                  onOk: () => {
                    deleteProject(project.id);
                    if (currentProject?.id === project.id) {
                      unloadCurrentProject();
                    }
                  },
                });
              }}
              className="p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        ),
      })),
    },
    {
      key: "org-chart",
      label: (
        <div className="py-1">
          <div className="font-semibold text-blue-600 flex items-center gap-2">
            <Network className="w-4 h-4" />
            Organization Chart
          </div>
          <div className="text-xs text-gray-500 mt-0.5">View team structure & hierarchy</div>
        </div>
      ),
      onClick: () => router.push("/organization-chart"),
      style: { backgroundColor: "#f0f7ff" },
    },
    {
      key: "home",
      label: "Back to Home",
      icon: <HomeOutlined />,
      onClick: () => unloadCurrentProject(),
    },
    { type: "divider" },
    {
      key: "add-group",
      type: "group",
      label: "Add Items",
    },
    {
      key: "add-task",
      label: "Add Task",
      icon: <PlusOutlined />,
      onClick: () => openSidePanel("add", "task"),
    },
    {
      key: "add-milestone",
      label: "Add Milestone",
      icon: <FlagOutlined />,
      onClick: () => openSidePanel("add", "milestone"),
    },
    {
      key: "add-holiday",
      label: "Add Holiday",
      icon: <CalendarOutlined />,
      onClick: () => openSidePanel("add", "holiday"),
    },
  ];

  // User Menu - Account, Dashboard, Logout
  const isAdmin = session?.user?.role === "ADMIN";
  const userMenuItems: MenuProps["items"] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "account",
      label: "Account Settings",
      icon: <SettingOutlined />,
      onClick: () => router.push("/account"),
    },
    ...(isAdmin
      ? [
          {
            key: "admin",
            label: "Admin Dashboard",
            icon: <CrownOutlined />,
            onClick: () => router.push("/admin"),
          },
        ]
      : []),
    { type: "divider" as const },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: () => signOut({ callbackUrl: "/login" }),
      danger: true,
    },
  ];

  // No project loaded state - Minimal
  if (!currentProject) {
    return (
      <>
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gantt Tool</h1>
                <p className="text-xs text-gray-500">Professional Proposal Development</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowImportModal(true)}
                size="large"
                className="flex items-center gap-2"
              >
                <UploadOutlined />
                <span>Import</span>
              </Button>
              <Button
                type="primary"
                onClick={handleCreateNewProject}
                size="large"
                className="shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <PlusOutlined />
                <span>New Project</span>
              </Button>
            </div>
          </div>
        </div>

        {showImportModal && <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />}

        <Modal
          title="Create New Project"
          open={showCreateProjectModal}
          onOk={() => createProjectForm.submit()}
          onCancel={() => {
            setShowCreateProjectModal(false);
            createProjectForm.resetFields();
          }}
          okText="Create"
        >
          <Form form={createProjectForm} layout="vertical" onFinish={handleCreateProjectSubmit}>
            <Form.Item
              name="projectName"
              label="Project Name"
              rules={[{ required: true, message: "Please enter project name" }]}
            >
              <Input placeholder="Enterprise CRM Implementation" size="large" />
            </Form.Item>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true, message: "Please select start date" }]}
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: "100%" }} size="large" />
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  }

  const viewSettings = currentProject.viewSettings;

  // Calculate project metrics for display
  const totalPhases = currentProject.phases.length;
  const totalTasks = currentProject.phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalResources = currentProject.resources?.length || 0;

  return (
    <div
      className="bg-white border-b border-gray-200 shadow-sm"
      style={{ width: "100%", maxWidth: "100vw", overflow: "hidden" }}
    >
      <div className="px-6 py-3" style={{ maxWidth: "100%" }}>
        <div className="flex items-center justify-between" style={{ width: "100%" }}>
          {/* Left: Project Name (Editable) + Quick Stats */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Project Name with Logo - Clickable to select */}
            <div className="flex items-center gap-3">
              {/* Logo - Clickable to select from available logos */}
              <Dropdown
                menu={{
                  items: currentProject.orgChartPro?.companyLogos
                    ? Object.entries(currentProject.orgChartPro.companyLogos).map(([companyName, logoUrl]) => ({
                        key: companyName,
                        label: (
                          <div className="flex items-center gap-2 py-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logoUrl as string}
                              alt={companyName}
                              className="w-6 h-6 object-contain"
                            />
                            <span>{companyName}</span>
                            {currentProject.orgChartPro?.selectedLogoCompanyName === companyName && (
                              <Check className="w-4 h-4 ml-2 text-blue-500" />
                            )}
                          </div>
                        ),
                        onClick: () => handleSelectDisplayLogo(companyName),
                      }))
                    : [],
                }}
                trigger={["click"]}
              >
                <button
                  className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex items-center justify-center shadow-sm overflow-hidden hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  title="Click to select logo"
                >
                  {(() => {
                    const displayLogo = getDisplayLogo();
                    if (displayLogo) {
                      return (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={displayLogo.logoUrl}
                          alt={displayLogo.companyName}
                          className="w-10 h-10 object-contain p-1"
                        />
                      );
                    }
                    return (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">
                        {currentProject.name.charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                </button>
              </Dropdown>

              {/* Project Name - Revolutionary inline editing */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isEditingProjectName ? (
                  <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border-2 border-blue-500">
                    <Input
                      value={editedProjectName}
                      onChange={(e) => setEditedProjectName(e.target.value)}
                      onKeyDown={handleProjectNameKeyDown}
                      onBlur={handleSaveProjectName}
                      variant="borderless"
                      className="font-semibold text-lg"
                      style={{ width: 300 }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveProjectName}
                      className="p-1 hover:bg-green-100 rounded transition-colors"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={handleCancelEditProjectName}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "current",
                          label: (
                            <div className="font-semibold text-blue-600 flex items-center gap-2">
                              <Check className="w-4 h-4 flex-shrink-0" />
                              <span>{currentProject.name}</span>
                            </div>
                          ),
                          disabled: true,
                        },
                        {
                          type: "divider",
                        },
                        {
                          key: "rename",
                          label: "Rename Project",
                          onClick: handleStartEditingProjectName,
                        },
                        projects.length > 1
                          ? {
                              type: "divider",
                            }
                          : null,
                        projects.length > 1
                          ? {
                              key: "switch-header",
                              label: <div className="font-semibold text-gray-500">Switch to:</div>,
                              disabled: true,
                            }
                          : null,
                        ...projects
                          .filter((p) => p.id !== currentProject.id)
                          .sort(
                            (a, b) =>
                              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                          )
                          .map((project) => ({
                            key: project.id,
                            label: (
                              <div>
                                <div className="font-medium">{project.name}</div>
                                <div className="text-xs text-gray-500">
                                  {project.phases.length} phases · Updated{" "}
                                  {new Date(project.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            ),
                            onClick: () => loadProject(project.id),
                          })),
                        {
                          type: "divider",
                        },
                        {
                          key: "view-all",
                          label: "View All Projects",
                          onClick: unloadCurrentProject,
                        },
                      ].filter(Boolean) as MenuProps["items"],
                    }}
                    trigger={["click"]}
                  >
                    <Tooltip
                      title={currentProject.name.length > 50 ? currentProject.name : null}
                      placement="bottom"
                    >
                      <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-all group">
                        <h1 className="text-base lg:text-lg font-bold text-gray-900 truncate">
                          {currentProject.name}
                        </h1>
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      </button>
                    </Tooltip>
                  </Dropdown>
                )}
              </div>
            </div>

            {/* Quick Stats - Hide on smaller screens to prevent overlap */}
            <div className="hidden 2xl:flex items-center gap-3 text-xs text-gray-500 border-l border-gray-200 pl-4">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-blue-600">{totalPhases}</span> phases
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-purple-600">{totalTasks}</span> tasks
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-green-600">{totalResources}</span> resources
              </span>
            </div>

            {/* Undo/Redo - Hide on medium screens, show on large */}
            <div className="hidden xl:flex items-center gap-1 border-l border-gray-200 pl-4">
              <Tooltip title="Undo (⌘Z)">
                <button
                  onClick={undo}
                  disabled={!canUndo()}
                  className={`p-2 rounded-lg transition-all ${
                    canUndo()
                      ? "hover:bg-gray-100 text-gray-700"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip title="Redo (⌘⇧Z)">
                <button
                  onClick={redo}
                  disabled={!canRedo()}
                  className={`p-2 rounded-lg transition-all ${
                    canRedo()
                      ? "hover:bg-gray-100 text-gray-700"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Right: The Revolutionary 5 Actions - Text labels on desktop, icons on mobile */}
          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
            {/* 1. Add Phase - Hero Action */}
            <Button
              type="primary"
              size="large"
              onClick={() => openSidePanel("add", "phase")}
              className="font-semibold"
              style={{
                backgroundColor: colorValues.primary[600],
                borderColor: colorValues.primary[600],
                color: "#ffffff",
                boxShadow: getColoredShadow(colorValues.primary[600], "md"),
                paddingLeft: spacing[4],
                paddingRight: spacing[4],
              }}
            >
              {/* Desktop: Text only, Mobile: Icon only */}
              <span className="hidden sm:inline">Add Phase</span>
              <Plus className="w-4 h-4 inline sm:hidden" />
            </Button>

            {/* 2. Context Panel Toggle - Hide on small screens */}
            {onToggleContextPanel && (
              <Tooltip title={showContextPanel ? "Hide Context Panel" : "Show Context Panel"}>
                <Button
                  type={showContextPanel ? "primary" : "default"}
                  size="large"
                  onClick={onToggleContextPanel}
                  className="hidden md:inline-flex"
                >
                  {/* Desktop: Text, Hidden on mobile */}
                  <span>Metrics</span>
                </Button>
              </Tooltip>
            )}

            {/* 3A. Quick Assign Panel Toggle - Hide on small screens */}
            {onToggleQuickResourcePanel && (
              <Tooltip
                title={
                  showQuickResourcePanel ? "Hide Quick Assign Panel" : "Show Quick Assign Panel"
                }
              >
                <Button
                  type={showQuickResourcePanel ? "primary" : "default"}
                  size="large"
                  onClick={onToggleQuickResourcePanel}
                  className="hidden lg:inline-flex"
                  style={
                    showQuickResourcePanel
                      ? {
                          backgroundColor: colorValues.accent[600],
                          borderColor: colorValues.accent[600],
                          boxShadow: getColoredShadow(colorValues.accent[600], "sm"),
                        }
                      : undefined
                  }
                >
                  {/* Desktop: Text only */}
                  <span>Quick Assign</span>
                </Button>
              </Tooltip>
            )}

            {/* 3B. Team Management */}
            <Tooltip title="Manage Team & Resources">
              <Badge count={totalResources} showZero={false} size="small">
                <Button
                  onClick={() => setShowResourceModal(true)}
                  size="large"
                >
                  {/* Desktop: Text only, Mobile: Icon only */}
                  <span className="hidden lg:inline">Team</span>
                  <Users className="w-4 h-4 inline lg:hidden" />
                </Button>
              </Badge>
            </Tooltip>

            {/* 4. Share - Export & Collaboration */}
            <Dropdown menu={{ items: shareMenuItems }} trigger={["click"]} placement="bottomRight">
              <Button size="large">
                {/* Desktop: Text only, Mobile: Icon only */}
                <span className="hidden lg:inline">Share</span>
                <Share2 className="w-4 h-4 inline lg:hidden" />
              </Button>
            </Dropdown>

            {/* 5. Settings */}
            <Dropdown
              menu={{ items: settingsMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button size="large">
                {/* Desktop: Text only, Mobile: Icon only */}
                <span className="hidden lg:inline">Settings</span>
                <Settings className="w-4 h-4 inline lg:hidden" />
              </Button>
            </Dropdown>

            {/* 6. User Menu */}
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
              <Button size="large">
                {/* Desktop: Text only, Mobile: Icon only */}
                <span className="hidden lg:inline truncate max-w-[120px]">
                  {session?.user?.name || session?.user?.email || "User"}
                </span>
                <UserOutlined className="inline lg:hidden" />
              </Button>
            </Dropdown>
          </div>
        </div>

        {/* View Mode Indicator - Subtle, below main toolbar */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {/* Zoom Level Controls */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Zoom:</span>
              <button
                onClick={() => setZoomLevel("week")}
                className={`px-2 py-1 rounded ${
                  viewSettings.zoomLevel === "week"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setZoomLevel("month")}
                className={`px-2 py-1 rounded ${
                  viewSettings.zoomLevel === "month"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setZoomLevel("quarter")}
                className={`px-2 py-1 rounded ${
                  viewSettings.zoomLevel === "quarter"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                Quarter
              </button>
              <Dropdown
                menu={{
                  items: [
                    { key: "day", label: "Day View", onClick: () => setZoomLevel("day") },
                    {
                      key: "half-year",
                      label: "Half-Year View",
                      onClick: () => setZoomLevel("half-year"),
                    },
                    { key: "year", label: "Year View", onClick: () => setZoomLevel("year") },
                  ],
                }}
                trigger={["click"]}
              >
                <button className="px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1">
                  More <ChevronDown className="w-3 h-3" />
                </button>
              </Dropdown>
            </div>

            {/* Title Column Toggle - Button text shows strikethrough when titles are hidden */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <Tooltip title="Toggle phase/task title visibility">
                <button
                  onClick={toggleTitles}
                  className={`px-2 py-1 rounded transition-all ${
                    (viewSettings.showTitles ?? true)
                      ? "bg-green-100 text-green-700 font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span className={(viewSettings.showTitles ?? true) ? "" : "line-through"}>
                     Titles
                  </span>
                </button>
              </Tooltip>
            </div>

            {/* Bar Duration Display Controls */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <span className="text-gray-400">Bars:</span>
              <Tooltip title="Show working days only">
                <button
                  onClick={() => setBarDurationDisplay("wd")}
                  className={`px-2 py-1 rounded text-xs ${
                    (viewSettings.barDurationDisplay ?? "all") === "wd"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  WD
                </button>
              </Tooltip>
              <Tooltip title="Show calendar days only">
                <button
                  onClick={() => setBarDurationDisplay("cd")}
                  className={`px-2 py-1 rounded text-xs ${
                    (viewSettings.barDurationDisplay ?? "all") === "cd"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  CD
                </button>
              </Tooltip>
              <Tooltip title="Show resource assignments only">
                <button
                  onClick={() => setBarDurationDisplay("resource")}
                  className={`px-2 py-1 rounded text-xs ${
                    (viewSettings.barDurationDisplay ?? "all") === "resource"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Resource
                </button>
              </Tooltip>
              <Tooltip title="Show start and end dates only">
                <button
                  onClick={() => setBarDurationDisplay("dates")}
                  className={`px-2 py-1 rounded text-xs ${
                    (viewSettings.barDurationDisplay ?? "all") === "dates"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Dates
                </button>
              </Tooltip>
              <Tooltip title="Show all information (WD, CD, resources, dates)">
                <button
                  onClick={() => setBarDurationDisplay("all")}
                  className={`px-2 py-1 rounded text-xs ${
                    (viewSettings.barDurationDisplay ?? "all") === "all"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  All
                </button>
              </Tooltip>
              <Tooltip title="Clean bars with no badges (minimal presentation)">
                <button
                  onClick={() => setBarDurationDisplay("clean")}
                  className={`px-2 py-1 rounded text-xs ${
                    (viewSettings.barDurationDisplay ?? "all") === "clean"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Clean
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">⌘Z</kbd> to
            undo
          </div>
        </div>
      </div>

      {/* Modals */}
      {showResourceModal && <ResourceManagementModal onClose={() => setShowResourceModal(false)} />}

      {showImportModal && <ImportModalV2 isOpen={showImportModal} onClose={() => setShowImportModal(false)} />}

      {showProposalModal && (
        <ProposalGenerationModal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
        />
      )}

      {showTemplateLibrary && (
        <TemplateLibraryModal
          isOpen={showTemplateLibrary}
          onClose={() => setShowTemplateLibrary(false)}
        />
      )}

      {showDuplicateCleanup && (
        <DuplicateCleanupModal
          isOpen={showDuplicateCleanup}
          onClose={() => setShowDuplicateCleanup(false)}
        />
      )}

      {showLogoModal && (
        <LogoLibraryModal
          isOpen={showLogoModal}
          onClose={() => setShowLogoModal(false)}
        />
      )}

      {showExportConfigModal && currentProject && (
        <ExportConfigModal
          isOpen={showExportConfigModal}
          onClose={() => setShowExportConfigModal(false)}
          project={currentProject}
        />
      )}

      <Modal
        title="Create New Project"
        open={showCreateProjectModal}
        onOk={() => createProjectForm.submit()}
        onCancel={() => {
          setShowCreateProjectModal(false);
          createProjectForm.resetFields();
        }}
        okText="Create"
      >
        <Form form={createProjectForm} layout="vertical" onFinish={handleCreateProjectSubmit}>
          <Form.Item
            name="projectName"
            label="Project Name"
            rules={[{ required: true, message: "Please enter project name" }]}
          >
            <Input placeholder="Enterprise CRM Implementation" size="large" />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select start date" }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: "100%" }} size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// Missing Calendar import
function Calendar({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
