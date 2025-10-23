/**
 * Command Palette Component
 * Global search and quick navigation with Cmd+K / Ctrl+K
 *
 * Features:
 * - Keyboard shortcut activation (Cmd+K / Ctrl+K)
 * - Fuzzy search across pages, actions, and recent items
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Recent items tracking
 * - Quick actions (New estimate, New project, etc.)
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Input, List, Typography, Space, Tag, Empty } from 'antd';
import {
  SearchOutlined,
  RocketOutlined,
  DashboardOutlined,
  CalculatorOutlined,
  ProjectOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'page' | 'action' | 'recent';
  keywords: string[];
  url?: string;
}

interface CommandPaletteProps {
  userRole?: 'USER' | 'ADMIN';
}

const RECENT_ITEMS_KEY = 'sap-cockpit-recent-commands';
const MAX_RECENT_ITEMS = 5;

export function CommandPalette({ userRole = 'USER' }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const router = useRouter();

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch (e) {
        console.warn('[CommandPalette] Failed to parse recent items:', e);
      }
    }
  }, []);

  // Save recent items to localStorage
  const saveRecentItem = useCallback((itemId: string) => {
    setRecentItems(prev => {
      const updated = [itemId, ...prev.filter(id => id !== itemId)].slice(0, MAX_RECENT_ITEMS);
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Navigate to URL
  const navigateTo = useCallback((url: string, itemId: string) => {
    saveRecentItem(itemId);
    setOpen(false);
    setSearchText('');
    router.push(url);
  }, [router, saveRecentItem]);

  // Execute action
  const executeAction = useCallback((action: () => void, itemId: string) => {
    saveRecentItem(itemId);
    setOpen(false);
    setSearchText('');
    action();
  }, [saveRecentItem]);

  // Define all available commands
  const allCommands: CommandItem[] = useMemo(() => {
    const commands: CommandItem[] = [
      // Pages
      {
        id: 'page-dashboard',
        title: 'Dashboard',
        subtitle: 'View your project overview and statistics',
        icon: <DashboardOutlined />,
        action: () => navigateTo('/dashboard', 'page-dashboard'),
        category: 'page',
        keywords: ['dashboard', 'home', 'overview', 'stats'],
        url: '/dashboard',
      },
      {
        id: 'page-estimator',
        title: 'Estimator',
        subtitle: 'Create SAP implementation estimates',
        icon: <CalculatorOutlined />,
        action: () => navigateTo('/estimator', 'page-estimator'),
        category: 'page',
        keywords: ['estimator', 'estimate', 'calculate', 'sap', 'implementation'],
        url: '/estimator',
      },
      {
        id: 'page-gantt',
        title: 'Gantt Tool',
        subtitle: 'Visual project timeline and resource allocation',
        icon: <BarChartOutlined />,
        action: () => navigateTo('/gantt-tool', 'page-gantt'),
        category: 'page',
        keywords: ['gantt', 'timeline', 'chart', 'schedule', 'project'],
        url: '/gantt-tool',
      },
      {
        id: 'page-timeline',
        title: 'Timeline',
        subtitle: 'Project phase planning',
        icon: <ClockCircleOutlined />,
        action: () => navigateTo('/timeline', 'page-timeline'),
        category: 'page',
        keywords: ['timeline', 'phases', 'schedule'],
        url: '/timeline',
      },
      {
        id: 'page-resources',
        title: 'Resources',
        subtitle: 'Resource planning and allocation',
        icon: <TeamOutlined />,
        action: () => navigateTo('/resource-planning', 'page-resources'),
        category: 'page',
        keywords: ['resources', 'team', 'allocation', 'planning'],
        url: '/resource-planning',
      },
      {
        id: 'page-organization',
        title: 'Organization Chart',
        subtitle: 'View organizational structure',
        icon: <ProjectOutlined />,
        action: () => navigateTo('/organization-chart', 'page-organization'),
        category: 'page',
        keywords: ['organization', 'org', 'chart', 'structure'],
        url: '/organization-chart',
      },
      {
        id: 'page-account',
        title: 'Account Settings',
        subtitle: 'Manage your account and preferences',
        icon: <SettingOutlined />,
        action: () => navigateTo('/account', 'page-account'),
        category: 'page',
        keywords: ['account', 'settings', 'profile', 'preferences'],
        url: '/account',
      },
    ];

    // Add admin pages if user is admin
    if (userRole === 'ADMIN') {
      commands.push(
        {
          id: 'page-admin',
          title: 'Admin Dashboard',
          subtitle: 'System administration',
          icon: <SettingOutlined />,
          action: () => navigateTo('/admin', 'page-admin'),
          category: 'page',
          keywords: ['admin', 'administration', 'system', 'manage'],
          url: '/admin',
        },
        {
          id: 'page-admin-users',
          title: 'User Management',
          subtitle: 'Manage users and permissions',
          icon: <TeamOutlined />,
          action: () => navigateTo('/admin/users', 'page-admin-users'),
          category: 'page',
          keywords: ['users', 'admin', 'permissions', 'manage'],
          url: '/admin/users',
        }
      );
    }

    // Quick actions
    commands.push(
      {
        id: 'action-new-estimate',
        title: 'New Estimate',
        subtitle: 'Start a new SAP implementation estimate',
        icon: <RocketOutlined />,
        action: () => navigateTo('/estimator', 'action-new-estimate'),
        category: 'action',
        keywords: ['new', 'create', 'estimate', 'start'],
        url: '/estimator',
      },
      {
        id: 'action-new-project',
        title: 'New Project',
        subtitle: 'Create a new Gantt project timeline',
        icon: <ProjectOutlined />,
        action: () => navigateTo('/gantt-tool', 'action-new-project'),
        category: 'action',
        keywords: ['new', 'create', 'project', 'gantt'],
        url: '/gantt-tool',
      }
    );

    return commands;
  }, [userRole, navigateTo]);

  // Filter commands based on search text
  const filteredCommands = useMemo(() => {
    if (!searchText.trim()) {
      // Show recent items when no search
      return allCommands.filter(cmd => recentItems.includes(cmd.id));
    }

    const query = searchText.toLowerCase();
    return allCommands.filter(cmd => {
      // Match title, subtitle, or keywords
      return (
        cmd.title.toLowerCase().includes(query) ||
        cmd.subtitle?.toLowerCase().includes(query) ||
        cmd.keywords.some(keyword => keyword.includes(query))
      );
    }).sort((a, b) => {
      // Prioritize exact title matches
      const aExact = a.title.toLowerCase() === query;
      const bExact = b.title.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then prioritize title starts with query
      const aStarts = a.title.toLowerCase().startsWith(query);
      const bStarts = b.title.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Then prioritize recent items
      const aRecent = recentItems.indexOf(a.id);
      const bRecent = recentItems.indexOf(b.id);
      if (aRecent !== -1 && bRecent === -1) return -1;
      if (aRecent === -1 && bRecent !== -1) return 1;
      if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;

      // Default: pages before actions
      if (a.category === 'page' && b.category !== 'page') return -1;
      if (a.category !== 'page' && b.category === 'page') return 1;

      return 0;
    });
  }, [searchText, allCommands, recentItems]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setSearchText('');
        setSelectedIndex(0);
      }

      // Escape to close
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
        setSearchText('');
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Arrow key navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        if (selected.url) {
          navigateTo(selected.url, selected.id);
        } else {
          executeAction(selected.action, selected.id);
        }
      }
    }
  }, [selectedIndex, filteredCommands, navigateTo, executeAction]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  return (
    <Modal
      open={open}
      onCancel={() => {
        setOpen(false);
        setSearchText('');
        setSelectedIndex(0);
      }}
      footer={null}
      closable={false}
      width={640}
      style={{ top: 100 }}
      styles={{
        body: { padding: 0 },
      }}
    >
      <div>
        {/* Search Input */}
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Input
            size="large"
            placeholder="Search pages and actions..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              fontSize: '16px',
              border: 'none',
              boxShadow: 'none',
            }}
            suffix={
              <Space size={4}>
                <Tag style={{ fontSize: '11px', padding: '0 6px' }}>
                  {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                </Tag>
              </Space>
            }
          />
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredCommands.length === 0 && searchText.trim() ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No results found"
              style={{ padding: '32px' }}
            />
          ) : filteredCommands.length === 0 && !searchText.trim() ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <Text type="secondary">
                Type to search pages and actions
              </Text>
            </div>
          ) : (
            <List
              dataSource={filteredCommands}
              renderItem={(item, index) => (
                <List.Item
                  onClick={() => {
                    if (item.url) {
                      navigateTo(item.url, item.id);
                    } else {
                      executeAction(item.action, item.id);
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: index === selectedIndex ? '#f5f5f5' : 'transparent',
                    borderLeft: index === selectedIndex ? '3px solid #1890ff' : '3px solid transparent',
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        fontSize: '20px',
                        color: index === selectedIndex ? '#1890ff' : '#8c8c8c',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        {item.icon}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong>{item.title}</Text>
                        {item.category === 'action' && (
                          <Tag color="blue" style={{ fontSize: '11px' }}>Action</Tag>
                        )}
                        {recentItems.includes(item.id) && !searchText.trim() && (
                          <Tag color="default" style={{ fontSize: '11px' }}>Recent</Tag>
                        )}
                      </Space>
                    }
                    description={<Text type="secondary" style={{ fontSize: '13px' }}>{item.subtitle}</Text>}
                  />
                  {index === selectedIndex && (
                    <Tag style={{ fontSize: '11px' }}>↵</Tag>
                  )}
                </List.Item>
              )}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fafafa',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#8c8c8c',
          }}
        >
          <Space size={12}>
            <span><Tag style={{ fontSize: '10px' }}>↑↓</Tag> Navigate</span>
            <span><Tag style={{ fontSize: '10px' }}>↵</Tag> Select</span>
            <span><Tag style={{ fontSize: '10px' }}>Esc</Tag> Close</span>
          </Space>
          <span>{filteredCommands.length} results</span>
        </div>
      </div>
    </Modal>
  );
}

/**
 * useCommandPalette Hook
 * Programmatic control of command palette
 */
export function useCommandPalette() {
  const open = useCallback(() => {
    // Trigger keyboard shortcut
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  }, []);

  return { open };
}
