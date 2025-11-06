/**
 * Template Gallery Component
 *
 * Modal dialog for browsing and selecting project templates
 */

'use client';

import { useState, useMemo } from 'react';
import { Modal, Input, Tabs } from 'antd';
import { Search, X, Sparkles, TrendingUp } from 'lucide-react';
import type { ProjectTemplate, TemplateCategory } from '@/lib/templates/template-types';
import { TEMPLATE_CATEGORIES, filterTemplatesByCategory, searchTemplates } from '@/lib/templates/template-types';
import { TEMPLATES, getFeaturedTemplates } from '@/lib/templates/template-data';
import { TemplateCard } from './TemplateCard';
import { colorValues, spacing } from '@/lib/design-system';

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

export function TemplateGallery({ open, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all' | 'featured'>('featured');

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    let templates = TEMPLATES;

    // Apply category filter
    if (selectedCategory === 'featured') {
      templates = getFeaturedTemplates();
    } else if (selectedCategory !== 'all') {
      templates = filterTemplatesByCategory(templates, selectedCategory);
    }

    // Apply search
    if (searchQuery.trim()) {
      templates = searchTemplates(templates, searchQuery);
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  const handleSelectTemplate = (template: ProjectTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  // Create tabs for categories
  const tabItems = [
    {
      key: 'featured',
      label: (
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="w-4 h-4" />
          <span>Featured</span>
        </div>
      ),
    },
    {
      key: 'all',
      label: (
        <div className="flex items-center gap-2 px-2">
          <TrendingUp className="w-4 h-4" />
          <span>All Templates</span>
        </div>
      ),
    },
    ...Object.values(TEMPLATE_CATEGORIES).map((category) => ({
      key: category.id,
      label: (
        <div className="flex items-center gap-2 px-2">
          <span>{category.name}</span>
          <span className="text-xs text-gray-400">
            ({TEMPLATES.filter((t) => t.category === category.id).length})
          </span>
        </div>
      ),
    })),
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: '1400px', top: 20 }}
      title={null}
      closeIcon={null}
    >
      <div className="flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Project Templates</h2>
              <p className="text-sm text-gray-600 mt-1">
                Start your project quickly with professional templates
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search Bar */}
          <Input
            size="large"
            placeholder="Search templates by name, description, or tags..."
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{
              borderRadius: '12px',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
            }}
          />
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <Tabs
            activeKey={selectedCategory}
            onChange={(key) => setSelectedCategory(key as any)}
            items={tabItems}
            size="large"
          />
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: colorValues.gray[100] }}
              >
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
              <p className="text-sm text-gray-600 text-center max-w-md">
                {searchQuery
                  ? `No templates match "${searchQuery}". Try a different search term.`
                  : 'No templates available in this category.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredTemplates.length}</span>{' '}
                {filteredTemplates.length === 1 ? 'template' : 'templates'}
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleSelectTemplate}
                    featured={selectedCategory === 'featured'}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Can't find what you need?{' '}
              <button
                onClick={() => {
                  const blankTemplate = TEMPLATES.find((t) => t.id === 'blank');
                  if (blankTemplate) handleSelectTemplate(blankTemplate);
                }}
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                Start from scratch
              </button>
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
