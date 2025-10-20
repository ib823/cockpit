/**
 * Template Library Modal
 *
 * Steve Jobs: "Innovation distinguishes between a leader and a follower."
 *
 * Browse and import from 50+ pre-built project templates.
 * Revolutionary one-click project creation.
 */

'use client';

import { useState, useMemo } from 'react';
import { Modal, Tabs, Input, Badge, Tag } from 'antd';
import { Search, Star, Calendar, CheckCircle, BookOpen, Rocket, TrendingUp, Building } from 'lucide-react';
import { PROJECT_TEMPLATES, getTemplatesByCategory, type ProjectTemplate } from '@/lib/gantt-tool/project-templates';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { format } from 'date-fns';
import type { GanttProject } from '@/types/gantt-tool';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateLibraryModal({ isOpen, onClose }: Props) {
  const { createProjectFromTemplate } = useGanttToolStoreV2();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = PROJECT_TEMPLATES;

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = getTemplatesByCategory(selectedCategory as ProjectTemplate['category']);
    }

    // Filter by search query
    if (searchQuery) {
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  const handleImportTemplate = async (template: ProjectTemplate) => {
    // Create a copy of the template with updated name and dates
    const projectCopy = {
      ...template,
      name: `${template.name} - ${format(new Date(), 'MMM dd, yyyy')}`,
      startDate: new Date().toISOString().split('T')[0],
    } as unknown as GanttProject;

    await createProjectFromTemplate(projectCopy);
    onClose();
  };

  const categoryTabs = [
    { key: 'all', label: '🌟 All Templates', icon: <Rocket className="w-4 h-4" /> },
    { key: 'sap-activate', label: '⚡ SAP Activate', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'greenfield', label: '🌱 Greenfield', icon: <Rocket className="w-4 h-4" /> },
    { key: 'brownfield', label: '🔄 Brownfield', icon: <Building className="w-4 h-4" /> },
    { key: 'migration', label: '🎯 Migration', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'rapid', label: '⚡ Rapid Deploy', icon: <Rocket className="w-4 h-4" /> },
    { key: 'industry', label: '🏢 Industry', icon: <Building className="w-4 h-4" /> },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      afterClose={() => {
        // PERMANENT FIX: Force cleanup of modal side effects
        if (document.body.style.overflow === 'hidden') {
          document.body.style.overflow = '';
        }
        if (document.body.style.paddingRight) {
          document.body.style.paddingRight = '';
        }
        document.body.style.pointerEvents = '';
      }}
      destroyOnHidden={true}
      width={1200}
      footer={null}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 m-0">Template Library</h2>
            <p className="text-sm text-gray-600 m-0">50+ pre-built project templates to get started instantly</p>
          </div>
        </div>
      }
    >
      {/* Search Bar */}
      <div className="mb-4">
        <Input
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          placeholder="Search templates by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="large"
          allowClear
        />
      </div>

      {/* Category Tabs */}
      <Tabs
        activeKey={selectedCategory}
        onChange={setSelectedCategory}
        items={categoryTabs.map(cat => ({
          key: cat.key,
          label: cat.label,
        }))}
      />

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No templates found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        count={
                          <div className="flex items-center gap-0.5 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                            {[...Array(template.popularity)].map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 fill-current" />
                            ))}
                          </div>
                        }
                      />
                      <Tag className="text-xs">{template.duration}</Tag>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Description */}
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>

              {/* Template Metrics */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{template.phases.length} phases</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{template.phases.reduce((sum, p) => sum + p.tasks.length, 0)} tasks</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.slice(0, 3).map((tag, idx) => (
                  <Tag key={idx} className="text-[10px] m-0">{tag}</Tag>
                ))}
                {template.tags.length > 3 && (
                  <Tag className="text-[10px] m-0">+{template.tags.length - 3}</Tag>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImportTemplate(template);
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                Use This Template
              </button>
            </div>
          ))
        )}
      </div>

      {/* Template Preview Panel */}
      {selectedTemplate && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Template Preview</h4>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Phases Preview */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Phases ({selectedTemplate.phases.length}):</p>
            {selectedTemplate.phases.map((phase, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: phase.color }}
                />
                <span className="font-medium">{phase.name}</span>
                <span className="text-gray-500">({phase.tasks.length} tasks)</span>
              </div>
            ))}
          </div>

          {/* Milestones Preview */}
          {selectedTemplate.milestones.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700">Milestones ({selectedTemplate.milestones.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.milestones.map((milestone, idx) => (
                  <Tag key={idx} className="text-xs">
                    {milestone.icon} {milestone.name}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-4 text-center text-xs text-gray-500">
        💡 Tip: All templates are fully customizable after import. Dates will be adjusted to start from today.
      </div>
    </Modal>
  );
}
