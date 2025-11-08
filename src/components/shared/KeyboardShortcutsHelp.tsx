/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts organized by category
 *
 * Features:
 * - Triggered by Cmd+/ or help button
 * - Organized by category
 * - Context-aware (shows relevant shortcuts)
 * - Searchable
 * - Printable
 */

'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Typography, Space, Tag, Tabs } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import {
  getAllShortcuts,
  formatShortcut,
  type KeyboardShortcut,
} from '@/hooks/useKeyboardShortcuts';

const { Text, Title } = Typography;

interface KeyboardShortcutsHelpProps {
  /** Current page context */
  context?: string;
}

export function KeyboardShortcutsHelp({ context }: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Listen for help shortcut
  useEffect(() => {
    const handleShowHelp = () => {
      setOpen(true);
    };

    window.addEventListener('show-keyboard-help', handleShowHelp);

    return () => window.removeEventListener('show-keyboard-help', handleShowHelp);
  }, []);

  // Get all shortcuts
  const allShortcuts = getAllShortcuts(context);

  // Group by category
  const groupedShortcuts = allShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Filter by search
  const filteredShortcuts = searchQuery
    ? allShortcuts.filter(
        (s) =>
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formatShortcut(s).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  // Category labels
  const categoryLabels: Record<string, string> = {
    navigation: '🧭 Navigation',
    actions: '⚡ Actions',
    editing: '✏️ Editing',
    view: '👁️ View',
    help: '❓ Help',
  };

  // Render shortcut row
  const renderShortcut = (shortcut: KeyboardShortcut) => (
    <div
      key={shortcut.id}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Text>{shortcut.description}</Text>
      <Tag
        style={{
          fontFamily: 'monospace',
          className="text-sm",
          padding: '4px 8px',
          background: '#f5f5f5',
          border: '1px solid #d9d9d9',
        }}
      >
        {formatShortcut(shortcut)}
      </Tag>
    </div>
  );

  return (
    <>
      {/* Trigger Button (optional - also triggered by Cmd+/) */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#1890ff',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          className="text-lg",
          fontWeight: 'bold',
          transition: 'transform 0.2s, box-shadow 0.2s',
          zIndex: 999,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.4)';
        }}
        aria-label="Show keyboard shortcuts"
        title="Keyboard Shortcuts (⌘/)"
      >
        ?
      </button>

      {/* Modal */}
      <Modal
        title={
          <Space>
            <span style={{ className="text-lg" }}>⌨️ Keyboard Shortcuts</span>
            <Tag color="blue">Press Cmd+/ to toggle</Tag>
          </Space>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={700}
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto' },
        }}
      >
        {/* Search */}
        <Input
          placeholder="Search shortcuts..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="large"
          style={{ marginBottom: 16 }}
          allowClear
        />

        {/* Shortcuts List */}
        {filteredShortcuts ? (
          // Search results
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              {filteredShortcuts.length} result{filteredShortcuts.length !== 1 ? 's' : ''}
            </Text>
            {filteredShortcuts.map(renderShortcut)}
          </div>
        ) : (
          // Grouped by category
          <Tabs
            items={Object.entries(groupedShortcuts).map(([category, shortcuts]) => ({
              key: category,
              label: categoryLabels[category] || category,
              children: (
                <div style={{ minHeight: '200px' }}>
                  {shortcuts.map(renderShortcut)}
                </div>
              ),
            }))}
          />
        )}

        {/* Footer Tips */}
        <div
          style={{
            marginTop: 16,
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '6px',
          }}
        >
          <Text type="secondary" style={{ className="text-sm" }}>
            💡 <strong>Tip:</strong> Most shortcuts work globally. Some are context-specific
            and only active on certain pages.
          </Text>
        </div>

        {/* Context Indicator */}
        {context && (
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <Tag color="purple">Current context: {context}</Tag>
          </div>
        )}
      </Modal>
    </>
  );
}

/**
 * Hook to trigger keyboard shortcuts help
 */
export function useKeyboardShortcutsHelp() {
  const show = () => {
    window.dispatchEvent(new CustomEvent('show-keyboard-help'));
  };

  return { show };
}
