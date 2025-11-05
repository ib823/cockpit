'use client';

import { useEffect, useState, useMemo } from 'react';
import { Command } from 'cmdk';
import Fuse from 'fuse.js';
import {
  Search,
  User,
  Users,
  Calendar,
  Target,
  Zap,
  ChevronRight,
  Hash
} from 'lucide-react';
import type { Resource, Phase, Task } from '@/types/gantt-tool';

interface SearchResult {
  type: 'resource' | 'team' | 'phase' | 'task' | 'action';
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  data?: any;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  phases: Phase[];
  onSelectResource?: (resourceId: string) => void;
  onSelectPhase?: (phaseId: string) => void;
  onSelectTask?: (phaseId: string, taskId: string) => void;
  onJumpToLevel?: (level: number) => void;
  onToggleFilters?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  resources,
  phases,
  onSelectResource,
  onSelectPhase,
  onSelectTask,
  onJumpToLevel,
  onToggleFilters,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build searchable items
  const searchableItems = useMemo(() => {
    const items: SearchResult[] = [];

    // Add resources
    resources.forEach(resource => {
      items.push({
        type: 'resource',
        id: resource.id,
        title: resource.name,
        subtitle: resource.category || 'Team Member',
        icon: User,
        data: resource,
      });
    });

    // Group resources by category for team search
    const categoryGroups = resources.reduce((acc, resource) => {
      const category = resource.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(resource);
      return acc;
    }, {} as Record<string, Resource[]>);

    Object.entries(categoryGroups).forEach(([category, teamResources]) => {
      items.push({
        type: 'team',
        id: `team-${category}`,
        title: `${category} Team`,
        subtitle: `${teamResources.length} members`,
        icon: Users,
        data: { category, resources: teamResources },
      });
    });

    // Add phases
    phases.forEach(phase => {
      items.push({
        type: 'phase',
        id: phase.id,
        title: phase.name,
        subtitle: `Phase · ${phase.tasks?.length || 0} tasks`,
        icon: Calendar,
        data: phase,
      });

      // Add tasks
      phase.tasks?.forEach(task => {
        items.push({
          type: 'task',
          id: task.id,
          title: task.name,
          subtitle: `${phase.name} → Task`,
          icon: Target,
          data: { phase, task },
        });
      });
    });

    // Add quick actions
    items.push(
      {
        type: 'action',
        id: 'jump-level-1',
        title: 'Jump to Leadership Level',
        subtitle: 'Navigate to Level 1',
        icon: Zap,
        data: { level: 1 },
      },
      {
        type: 'action',
        id: 'jump-level-2',
        title: 'Jump to Project Management',
        subtitle: 'Navigate to Level 2',
        icon: Zap,
        data: { level: 2 },
      },
      {
        type: 'action',
        id: 'jump-level-3',
        title: 'Jump to Delivery Level',
        subtitle: 'Navigate to Level 3',
        icon: Zap,
        data: { level: 3 },
      },
      {
        type: 'action',
        id: 'jump-level-4',
        title: 'Jump to Support Level',
        subtitle: 'Navigate to Level 4',
        icon: Zap,
        data: { level: 4 },
      },
      {
        type: 'action',
        id: 'toggle-filters',
        title: 'Toggle Filters Panel',
        subtitle: 'Show/hide filter options',
        icon: Hash,
        data: { action: 'toggle-filters' },
      }
    );

    return items;
  }, [resources, phases]);

  // Fuzzy search with Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(searchableItems, {
      keys: ['title', 'subtitle', 'data.name', 'data.category'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [searchableItems]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (!search.trim()) {
      // Show recent/suggested items when no search
      return searchableItems.slice(0, 8);
    }

    return fuse.search(search).map(result => result.item);
  }, [search, fuse, searchableItems]);

  // Handle selection
  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'resource':
        onSelectResource?.(result.id);
        break;
      case 'team':
        // Select first resource in team
        if (result.data.resources?.length > 0) {
          onSelectResource?.(result.data.resources[0].id);
        }
        break;
      case 'phase':
        onSelectPhase?.(result.id);
        break;
      case 'task':
        onSelectTask?.(result.data.phase.id, result.data.task.id);
        break;
      case 'action':
        if (result.data.level) {
          onJumpToLevel?.(result.data.level);
        } else if (result.data.action === 'toggle-filters') {
          onToggleFilters?.();
        }
        break;
    }
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose]);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-32 px-4">
      <Command
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        shouldFilter={false}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, teams, phases, or actions..."
            className="flex-1 outline-none text-base placeholder:text-gray-400"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <Command.List className="max-h-96 overflow-y-auto py-2">
          {filteredResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found for &quot;{search}&quot;
            </div>
          ) : (
            filteredResults.map((result, index) => {
              const Icon = result.icon;
              const isSelected = index === selectedIndex;

              return (
                <Command.Item
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result)}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className={`
                    p-2 rounded-lg
                    ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-sm text-gray-500 truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </Command.Item>
              );
            })
          )}
        </Command.List>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">↵</kbd>
              Select
            </span>
          </div>
          <span>{filteredResults.length} results</span>
        </div>
      </Command>
    </div>
  );
}
