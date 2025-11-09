/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays all available keyboard shortcuts for the Gantt tool.
 * Triggered by Shift+? or Help button.
 */

'use client';

import { Modal } from 'antd';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: '↓', description: 'Navigate to next item' },
        { key: '↑', description: 'Navigate to previous item' },
        { key: '←', description: 'Collapse phase or go to parent task' },
        { key: '→', description: 'Expand phase or go to first child task' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { key: 'Enter / Space', description: 'Edit selected item' },
        { key: 'Delete / ⌫', description: 'Delete selected item (with confirmation)' },
        { key: 'Esc', description: 'Deselect item or exit focus mode' },
        { key: 'F', description: 'Focus on selected phase (RTS zoom)' },
      ],
    },
    {
      category: 'Create New',
      items: [
        { key: 'N', description: 'Create new phase' },
        { key: 'T', description: 'Create new task (when phase selected)' },
        { key: 'M', description: 'Create new milestone' },
      ],
    },
    {
      category: 'Help',
      items: [
        { key: 'Shift+?', description: 'Show this keyboard shortcuts panel' },
      ],
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Keyboard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</div>
            <div className="text-sm font-normal text-gray-500">Speed up your workflow with keyboard navigation</div>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <div className="space-y-6 mt-6">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">{item.description}</span>
                  <kbd className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-gray-100 border border-gray-300 text-xs font-mono font-semibold text-gray-800 shadow-sm">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Pro Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-bold text-blue-900 mb-2">💡 Pro Tips</h3>
          <ul className="space-y-1.5 text-sm text-blue-800">
            <li>• Use arrow keys to quickly navigate through your project timeline</li>
            <li>• Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-blue-300 text-xs font-mono">F</kbd> to focus on a phase and see only its tasks</li>
            <li>• Keyboard shortcuts work everywhere except when typing in text fields</li>
            <li>• Delete actions always ask for confirmation - your data is safe</li>
          </ul>
        </div>

        {/* Accessibility Note */}
        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Accessibility:</strong> All features are keyboard accessible. Screen reader users can navigate
            with standard ARIA navigation keys. For assistance, contact support.
          </p>
        </div>
      </div>
    </Modal>
  );
}
