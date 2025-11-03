/**
 * Customizable Dashboard Component
 * Drag-to-reorder cards and toggle visibility
 *
 * Features:
 * - Drag-and-drop card reordering with @dnd-kit
 * - Toggle card visibility
 * - Save layout to user preferences
 * - Reset to default layout
 * - Smooth animations
 *
 * NOTE: Currently unused - requires @dnd-kit installation
 */

// @ts-nocheck - Unused component with missing dependencies
/* eslint-disable */
'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Button, Space, Dropdown, Typography, Switch } from 'antd';
import { MenuOutlined, SettingOutlined, EyeOutlined, EyeInvisibleOutlined, UndoOutlined } from '@ant-design/icons';
import { useDashboardPreferences } from '@/stores/user-preferences-store';

const { Text } = Typography;

export interface DashboardCardConfig {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultVisible?: boolean;
}

interface CustomizableDashboardProps {
  /** Available dashboard cards */
  cards: DashboardCardConfig[];
  /** Show customize controls */
  customizable?: boolean;
}

/**
 * Sortable Card Component
 * Individual card with drag handle
 */
interface SortableCardProps {
  id: string;
  title: string;
  content: React.ReactNode;
  customizable: boolean;
  onToggleVisibility?: (id: string) => void;
}

function SortableCard({ id, title, content, customizable, onToggleVisibility }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {customizable && (
              <div
                {...listeners}
                style={{
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  marginLeft: '-4px',
                }}
              >
                <MenuOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
              </div>
            )}
            <span>{title}</span>
          </div>
        }
        extra={
          customizable && onToggleVisibility ? (
            <Button
              type="text"
              size="small"
              icon={<EyeInvisibleOutlined />}
              onClick={() => onToggleVisibility(id)}
              aria-label={`Hide ${title} card`}
            />
          ) : null
        }
        style={{
          marginBottom: 16,
          borderRadius: '12px',
          boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {content}
      </Card>
    </div>
  );
}

/**
 * Customizable Dashboard Component
 */
export function CustomizableDashboard({ cards, customizable = true }: CustomizableDashboardProps) {
  const [customizeMode, setCustomizeMode] = useState(false);
  const { cardOrder, hiddenCards, setCardOrder, toggleCard } = useDashboardPreferences();

  // Initialize card order from preferences or default
  const getOrderedCards = useCallback(() => {
    if (cardOrder && cardOrder.length > 0) {
      // Sort by saved order
      const ordered = cardOrder
        .map(id => cards.find(card => card.id === id))
        .filter((card): card is DashboardCardConfig => card !== undefined);

      // Add any new cards not in saved order
      const newCards = cards.filter(card => !cardOrder.includes(card.id));
      return [...ordered, ...newCards];
    }

    return cards;
  }, [cards, cardOrder]);

  const [items, setItems] = useState(getOrderedCards());

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Save to preferences
        setCardOrder(newItems.map(item => item.id));

        return newItems;
      });
    }
  };

  // Toggle card visibility
  const handleToggleVisibility = (cardId: string) => {
    toggleCard(cardId);
  };

  // Reset to default layout
  const handleReset = () => {
    setItems(cards);
    setCardOrder([]);
    // Clear hidden cards
    hiddenCards?.forEach(id => toggleCard(id));
  };

  // Filter visible cards
  const visibleCards = items.filter(card => !hiddenCards?.includes(card.id));
  const hiddenCardsList = items.filter(card => hiddenCards?.includes(card.id));

  return (
    <div>
      {/* Customize Controls */}
      {customizable && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            background: customizeMode ? '#e6f7ff' : '#fafafa',
            borderColor: customizeMode ? '#1890ff' : '#f0f0f0',
          }}
        >
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <SettingOutlined style={{ color: customizeMode ? '#1890ff' : '#8c8c8c' }} />
              <Text strong>Customize Dashboard</Text>
              <Switch
                checked={customizeMode}
                onChange={setCustomizeMode}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
            </Space>

            {customizeMode && (
              <Space>
                {hiddenCardsList.length > 0 && (
                  <Dropdown
                    menu={{
                      items: hiddenCardsList.map(card => ({
                        key: card.id,
                        label: card.title,
                        icon: <EyeOutlined />,
                        onClick: () => handleToggleVisibility(card.id),
                      })),
                    }}
                    placement="bottomRight"
                  >
                    <Button size="small">
                      Show Hidden ({hiddenCardsList.length})
                    </Button>
                  </Dropdown>
                )}

                <Button
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={handleReset}
                >
                  Reset Layout
                </Button>
              </Space>
            )}
          </Space>

          {customizeMode && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                💡 <strong>Tip:</strong> Drag cards by the <MenuOutlined style={{ fontSize: '12px' }} /> handle to reorder.
                Click <EyeInvisibleOutlined style={{ fontSize: '12px' }} /> to hide cards.
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Dashboard Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleCards.map(card => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {visibleCards.map((card) => (
            <SortableCard
              key={card.id}
              id={card.id}
              title={card.title}
              content={card.content}
              customizable={customizeMode}
              onToggleVisibility={customizeMode ? handleToggleVisibility : undefined}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {visibleCards.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Text type="secondary">
            All cards are hidden. Click &quot;Show Hidden&quot; to display cards again.
          </Text>
        </Card>
      )}
    </div>
  );
}
