/**
 * L3 Catalog Modal
 *
 * Modal dialog for selecting L3 scope items from the 293-item catalog.
 * Features:
 * - Virtual scrolling for performance
 * - Real-time search and filter
 * - Group by LOB with expand/collapse
 * - Tier badges with color coding
 * - Selected count and coefficient impact preview
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Modal, Input, Select, Checkbox, Button, Typography, Space, Divider } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useQuery } from '@tanstack/react-query';
import { TierBadge } from './TierBadge';
import type { L3ScopeItem } from '@/lib/estimator/types';

const { Text } = Typography;

interface L3CatalogModalProps {
  open: boolean;
  onClose: () => void;
  selectedItems: L3ScopeItem[];
  onApply: (items: L3ScopeItem[]) => void;
}

interface L3ItemWithLob extends L3ScopeItem {
  lobName: string;
}

export function L3CatalogModal({ open, onClose, selectedItems, onApply }: L3CatalogModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLob, setFilterLob] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [tempSelected, setTempSelected] = useState<Set<string>>(
    new Set(selectedItems.map((item) => item.id))
  );

  // Fetch L3 catalog from API
  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['l3-catalog'],
    queryFn: async () => {
      const res = await fetch('/api/l3-catalog?includeMetrics=true');
      if (!res.ok) throw new Error('Failed to fetch L3 catalog');
      return res.json() as Promise<{ items: L3ItemWithLob[] }>;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const items = catalogData?.items || [];

  // Get unique LOBs for filter
  const lobs = useMemo(() => {
    const uniqueLobs = new Set(items.map((item) => item.lobName));
    return Array.from(uniqueLobs).sort();
  }, [items]);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesCode = item.l3Code.toLowerCase().includes(search);
        const matchesName = item.l3Name.toLowerCase().includes(search);
        if (!matchesCode && !matchesName) return false;
      }

      // LOB filter
      if (filterLob !== 'all' && item.lobName !== filterLob) return false;

      // Tier filter
      if (filterTier !== 'all' && item.complexityMetrics?.defaultTier !== filterTier) {
        return false;
      }

      return true;
    });
  }, [items, searchTerm, filterLob, filterTier]);

  // Calculate impact preview
  const impactPreview = useMemo(() => {
    const selectedItemsFromCatalog = items.filter((item) => tempSelected.has(item.id));
    const totalCoefficient = selectedItemsFromCatalog.reduce((sum, item) => {
      if (item.complexityMetrics?.defaultTier === 'D') return sum;
      return sum + (item.complexityMetrics?.coefficient || 0);
    }, 0);

    const tierDCount = selectedItemsFromCatalog.filter(
      (item) => item.complexityMetrics?.defaultTier === 'D'
    ).length;

    return {
      count: tempSelected.size,
      coefficient: totalCoefficient,
      tierDCount,
    };
  }, [items, tempSelected]);

  // Toggle item selection
  const toggleItem = useCallback((itemId: string) => {
    setTempSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Handle apply
  const handleApply = useCallback(() => {
    const selectedItemsFromCatalog = items.filter((item) => tempSelected.has(item.id));
    onApply(selectedItemsFromCatalog);
    onClose();
  }, [items, tempSelected, onApply, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    // Reset to original selection
    setTempSelected(new Set(selectedItems.map((item) => item.id)));
    onClose();
  }, [selectedItems, onClose]);

  // Row renderer for virtual list
  const Row = useCallback(
    ({ index, style, ariaAttributes }: {
      index: number;
      style: React.CSSProperties;
      ariaAttributes?: { [key: string]: any };
    }) => {
      const item = filteredItems[index];
      const isSelected = tempSelected.has(item.id);

      return (
        <div
          {...ariaAttributes}
          style={style}
          className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
          onClick={() => toggleItem(item.id)}
        >
          <Checkbox checked={isSelected} onChange={() => toggleItem(item.id)} />
          <Text className="ml-2 font-mono text-xs text-gray-600" style={{ width: '80px' }}>
            {item.l3Code}
          </Text>
          <Text className="ml-2 flex-1" ellipsis={{ tooltip: item.l3Name }}>
            {item.l3Name}
          </Text>
          <TierBadge tier={item.complexityMetrics?.defaultTier as 'A' | 'B' | 'C' | 'D'} showTooltip />
          <Text className="ml-2 text-gray-500 text-xs" style={{ width: '60px', textAlign: 'right' }}>
            {item.complexityMetrics?.coefficient?.toFixed(3) || 'N/A'}
          </Text>
        </div>
      );
    },
    [filteredItems, tempSelected, toggleItem]
  );

  return (
    <Modal
      title="Select L3 Scope Items"
      open={open}
      onCancel={handleCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Apply Selection ({impactPreview.count} items)
        </Button>,
      ]}
      styles={{
        body: { height: '600px', display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* Search and Filters */}
      <Space className="mb-4" style={{ width: '100%' }}>
        <Input
          placeholder="Search by code or name..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          value={filterLob}
          onChange={setFilterLob}
          style={{ width: 200 }}
          placeholder="Filter by LOB"
          suffixIcon={<FilterOutlined />}
        >
          <Select.Option value="all">All LOBs</Select.Option>
          {lobs.map((lob) => (
            <Select.Option key={lob} value={lob}>
              {lob}
            </Select.Option>
          ))}
        </Select>
        <Select
          value={filterTier}
          onChange={setFilterTier}
          style={{ width: 150 }}
          placeholder="Filter by Tier"
        >
          <Select.Option value="all">All Tiers</Select.Option>
          <Select.Option value="A">Tier A</Select.Option>
          <Select.Option value="B">Tier B</Select.Option>
          <Select.Option value="C">Tier C</Select.Option>
          <Select.Option value="D">Tier D</Select.Option>
        </Select>
      </Space>

      {/* Impact Preview */}
      <div className="mb-2 p-3 bg-blue-50 rounded">
        <Space split={<Divider type="vertical" />}>
          <Text strong>Selected: {impactPreview.count} items</Text>
          <Text>Scope Breadth: +{impactPreview.coefficient.toFixed(3)}</Text>
          {impactPreview.tierDCount > 0 && (
            <Text type="danger">⚠️ {impactPreview.tierDCount} Tier D items (custom pricing)</Text>
          )}
        </Space>
      </div>

      {/* Virtual List */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Text>Loading catalog...</Text>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Text type="secondary">No items match your search</Text>
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List<Record<string, never>>
                style={{ height, width }}
                rowCount={filteredItems.length}
                rowHeight={56}
                overscanCount={5}
                rowComponent={Row as any}
                rowProps={{} as any}
              />
            )}
          </AutoSizer>
        )}
      </div>
    </Modal>
  );
}
