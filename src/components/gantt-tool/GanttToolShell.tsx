/**
 * Gantt Tool - Main Shell Component
 *
 * Main container that orchestrates all sub-components.
 * Handles project initialization and overall layout.
 */

'use client';

import { useEffect, useState } from 'react';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { GanttToolbar } from './GanttToolbar';
import { GanttCanvas } from './GanttCanvas';
import { GanttSidePanel } from './GanttSidePanel';
import { QuickResourcePanel } from './QuickResourcePanel';
import { MissionControlModal } from './MissionControlModal';
import { ImportModalV2 } from './ImportModalV2';
import { format } from 'date-fns';
import { Calendar, Plus, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { GhostLoader } from '@/components/common';
import { Modal, Form, Input, DatePicker, App } from 'antd';
import dayjs from 'dayjs';

export function GanttToolShell() {
  const { modal } = App.useApp();
  const {
    currentProject,
    projects,
    createProject,
    loadProject,
    fetchProjects,
    openSidePanel,
    manuallyUnloaded,
    undo,
    redo,
    isSyncing,
    syncError,
    isLoading,
  } = useGanttToolStoreV2();

  const [showImportModal, setShowImportModal] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showQuickResourcePanel, setShowQuickResourcePanel] = useState(false);
  const [showWelcomeCreateModal, setShowWelcomeCreateModal] = useState(false);
  const [welcomeCreateForm] = Form.useForm();

  // PERMANENT FIX: Force cleanup of modal side effects (overflow, focus traps, masks)
  const forceModalCleanup = () => {
    // Remove overflow hidden from body (Ant Design modal side effect)
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
    if (document.body.style.paddingRight) {
      document.body.style.paddingRight = '';
    }

    // Remove any lingering modal masks/backdrops
    const masks = document.querySelectorAll('.ant-modal-mask, .ant-modal-wrap');
    masks.forEach(mask => {
      if (mask.parentNode) {
        mask.parentNode.removeChild(mask);
      }
    });

    // Restore pointer events
    document.body.style.pointerEvents = '';

    // Force focus to be released from any modal elements
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  };

  // Cleanup on unmount and whenever modals close
  useEffect(() => {
    return () => {
      forceModalCleanup();
    };
  }, []);

  // Cleanup whenever modal states change to false
  useEffect(() => {
    if (!showWelcomeCreateModal && !showImportModal) {
      // Small delay to let modal animation complete, then force cleanup
      const timer = setTimeout(forceModalCleanup, 300);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeCreateModal, showImportModal]);

  // Handler for creating project from welcome screen
  const handleWelcomeCreateProject = async (values: { projectName: string; startDate: any }) => {
    // Check for duplicate name
    const isDuplicate = projects.some(p => p.name.toLowerCase() === values.projectName.toLowerCase());
    if (isDuplicate) {
      modal.error({
        title: 'Duplicate Project Name',
        content: `A project named "${values.projectName}" already exists. Please choose a different name.`,
      });
      return;
    }

    try {
      const startDate = values.startDate.format('YYYY-MM-DD');
      await createProject(values.projectName, startDate);

      // Close modal and cleanup
      setShowWelcomeCreateModal(false);
      welcomeCreateForm.resetFields();

      // Force cleanup to prevent modal side effects
      setTimeout(() => forceModalCleanup(), 100);
    } catch (error) {
      console.error('Failed to create project:', error);
      modal.error({
        title: 'Failed to Create Project',
        content: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const { undo } = useGanttToolStoreV2.getState();
        undo();
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const { redo } = useGanttToolStoreV2.getState();
        redo();
      }
      // Ctrl+Y or Cmd+Y for redo (alternative)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        const { redo } = useGanttToolStoreV2.getState();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies - get functions from store directly

  // Fetch projects from database on mount
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // DISABLED: Auto-load removed to let users see the project list
  // Users can now:
  // 1. See all their projects on the welcome screen
  // 2. Choose which project to load
  // 3. Switch between projects using the toolbar dropdown

  // Loading State - Show while fetching projects
  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <GhostLoader />
          <p className="mt-4 text-gray-600 text-lg">Loading your projects...</p>
        </div>
      </div>
    );
  }

  // Welcome Screen - Show when no current project
  if (!currentProject) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '70vh', padding: '2rem' }}>
        <div className="max-w-4xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Gantt Chart Tool
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create professional project timelines with phases, tasks, milestones, and holidays.
              Export to PNG, PDF, or Excel. All your projects are securely saved to the cloud.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <FeatureCard
              icon="📊"
              title="Visual Timeline"
              description="Drag-and-drop phases and tasks to create stunning timelines"
            />
            <FeatureCard
              icon="📤"
              title="Import Projects"
              description="Import existing plans from Excel templates"
            />
            <FeatureCard
              icon="🎯"
              title="Milestones & Holidays"
              description="Mark important dates and account for holidays"
            />
            <FeatureCard
              icon="📥"
              title="Export Anywhere"
              description="Export to PNG, PDF, Excel, or JSON format"
            />
          </div>

          {/* Existing Projects (if any) */}
          {projects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Your Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {[...projects]
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 6)
                  .map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        loadProject(project.id);
                      }}
                      className="text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {project.phases.length} phases • {project.phases.reduce((sum, p) => sum + p.tasks.length, 0)} tasks
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Updated {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
              </div>
              {projects.length > 6 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  And {projects.length - 6} more projects...
                </p>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setShowWelcomeCreateModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Create New Project
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Upload className="w-5 h-5" />
                Import from Excel
              </button>
            </div>

            {/* Quick Start Guide */}
            <div className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">?</span>
                Getting Started
              </h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">1.</span>
                  <span>Click <strong>"Create New Project"</strong> to start a blank timeline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">2.</span>
                  <span>Add phases to define major project sections (e.g., "Planning", "Execution")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">3.</span>
                  <span>Add tasks within each phase to break down the work</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">4.</span>
                  <span>Drag bars to adjust dates, assign resources, and track progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">5.</span>
                  <span>Export to PNG, PDF, or Excel when ready to share</span>
                </li>
              </ol>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              All changes are automatically saved • Secure cloud storage
            </p>
          </div>
        </div>

        {/* Import Modal V2 */}
        {showImportModal && <ImportModalV2 onClose={() => setShowImportModal(false)} />}

        {/* Create Project Modal */}
        <Modal
          title="Create New Project"
          open={showWelcomeCreateModal}
          onOk={() => welcomeCreateForm.submit()}
          onCancel={() => {
            setShowWelcomeCreateModal(false);
            welcomeCreateForm.resetFields();
          }}
          afterClose={() => {
            // Force cleanup after modal animation completes
            forceModalCleanup();
          }}
          destroyOnHidden={true}
          okText="Create"
        >
          <Form form={welcomeCreateForm} layout="vertical" onFinish={handleWelcomeCreateProject}>
            <Form.Item
              name="projectName"
              label="Project Name"
              rules={[{ required: true, message: 'Please enter project name' }]}
            >
              <Input placeholder="Enterprise CRM Implementation" size="large" />
            </Form.Item>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true, message: 'Please select start date' }]}
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  // Main Gantt Tool Interface
  return (
    <div className="flex flex-col" style={{ minHeight: '70vh' }}>
      {/* Toolbar */}
      <GanttToolbar
        showContextPanel={showContextPanel}
        onToggleContextPanel={() => setShowContextPanel(!showContextPanel)}
        showQuickResourcePanel={showQuickResourcePanel}
        onToggleQuickResourcePanel={() => setShowQuickResourcePanel(!showQuickResourcePanel)}
      />

      {/* Sync Error Banner */}
      {syncError && (
        <div className="bg-red-50 border-b-2 border-red-200 px-6 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900">Sync Error</p>
                <p className="text-sm text-red-700">{syncError}</p>
              </div>
            </div>
            <button
              onClick={() => {
                // Clear sync error in store
                const store = useGanttToolStoreV2.getState();
                store.saveProject(); // Retry save
              }}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Syncing Indicator */}
      {isSyncing && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving changes...</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Content: Gantt Canvas */}
        <div className="flex-1 overflow-auto">
          {currentProject ? (
            <GanttCanvas />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select or create a project to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Resource Panel - Jobs/Ive: Only visible when summoned */}
        <QuickResourcePanel
          isOpen={showQuickResourcePanel}
          onClose={() => setShowQuickResourcePanel(false)}
        />

        {/* Side Panel (Add/Edit Forms) */}
        <GanttSidePanel />
      </div>

      {/* Mission Control - Full-screen command center for deep analysis */}
      <MissionControlModal
        isOpen={showContextPanel}
        onClose={() => setShowContextPanel(false)}
      />
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
