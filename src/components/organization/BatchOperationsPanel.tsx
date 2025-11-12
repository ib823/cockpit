/**
 * Batch Operations Panel
 *
 * Panel for performing batch operations on multiple selected resources
 */

"use client";

import { useCallback } from "react";
import { Drawer, Form, Select, Button, Typography, Space, List, Tag, App } from "antd";
import {
  TeamOutlined,
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";

const { Title, Text } = Typography;

interface BatchOperationsPanelProps {
  selectedResourceIds: Set<string>;
  onClose: () => void;
  onUpdate: () => void;
  onClearSelection: () => void;
}

export function BatchOperationsPanel({
  selectedResourceIds,
  onClose,
  onUpdate,
  onClearSelection,
}: BatchOperationsPanelProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const currentProject = useGanttToolStore((state) => state.currentProject);
  const assignManager = useGanttToolStore((state) => (state as any).assignManager);
  const unassignManager = useGanttToolStore((state) => (state as any).unassignManager);

  const selectedResources =
    currentProject?.resources.filter((r) => selectedResourceIds.has(r.id)) || [];

  // Available managers (exclude selected resources to prevent circular refs)
  const availableManagers =
    currentProject?.resources.filter((r) => !selectedResourceIds.has(r.id)) || [];

  const handleBatchAssignManager = useCallback(() => {
    form.validateFields().then((values) => {
      const managerId = values.managerId || null;
      let successCount = 0;
      let errorCount = 0;

      selectedResourceIds.forEach((resourceId) => {
        try {
          assignManager(resourceId, managerId);
          successCount++;
        } catch (error) {
          console.error(`Failed to assign manager to resource ${resourceId}:`, error);
          errorCount++;
        }
      });

      if (successCount > 0) {
        message.success(`Successfully assigned manager to ${successCount} resource(s)`);
        onUpdate();
        onClearSelection();
        onClose();
      }

      if (errorCount > 0) {
        message.error(`Failed to assign manager to ${errorCount} resource(s)`);
      }
    });
  }, [selectedResourceIds, assignManager, form, onUpdate, onClearSelection, onClose, message]);

  const handleBatchRemoveManager = useCallback(() => {
    let successCount = 0;

    selectedResourceIds.forEach((resourceId) => {
      unassignManager(resourceId);
      successCount++;
    });

    message.success(`Successfully removed manager from ${successCount} resource(s)`);
    onUpdate();
    onClearSelection();
    onClose();
  }, [selectedResourceIds, unassignManager, onUpdate, onClearSelection, onClose, message]);

  return (
    <Drawer
      title={
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>
            Batch Operations
          </Title>
          <Text type="secondary">{selectedResourceIds.size} resources selected</Text>
        </Space>
      }
      placement="right"
      width={500}
      onClose={onClose}
      open={true}
      footer={
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Button onClick={onClearSelection} icon={<ClearOutlined />}>
            Clear Selection
          </Button>
          <Button onClick={onClose} icon={<CloseOutlined />}>
            Close
          </Button>
        </Space>
      }
    >
      {/* Selected Resources List */}
      <div className="mb-6">
        <Title level={5}>Selected Resources</Title>
        <List
          size="small"
          bordered
          dataSource={selectedResources}
          style={{ maxHeight: "200px", overflowY: "auto" }}
          renderItem={(resource) => {
            const categoryInfo = RESOURCE_CATEGORIES[resource.category];
            const designationLabel = RESOURCE_DESIGNATIONS[resource.designation];
            return (
              <List.Item>
                <Space>
                  <span>{categoryInfo.icon}</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{resource.name}</div>
                    <Text type="secondary" className="text-xs">
                      {designationLabel}
                    </Text>
                  </div>
                </Space>
              </List.Item>
            );
          }}
        />
      </div>

      {/* Batch Assign Manager */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Title level={5}>Assign Manager to All</Title>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="managerId"
            label={
              <span className="flex items-center gap-2">
                <TeamOutlined />
                Select Manager
              </span>
            }
          >
            <Select
              placeholder="Select a manager"
              size="large"
              allowClear
              showSearch
              optionFilterProp="label"
              options={[
                { value: undefined, label: " No Manager (Top Level)" },
                ...availableManagers.map((manager) => ({
                  value: manager.id,
                  label: `${RESOURCE_CATEGORIES[manager.category].icon} ${manager.name} - ${RESOURCE_DESIGNATIONS[manager.designation]}`,
                })),
              ]}
            />
          </Form.Item>
        </Form>

        <Space style={{ width: "100%", marginTop: "12px" }}>
          <Button type="primary" onClick={handleBatchAssignManager} icon={<SaveOutlined />} block>
            Assign to All Selected
          </Button>
        </Space>
      </div>

      {/* Batch Remove Manager */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <Title level={5}>Remove Manager from All</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: "12px" }}>
          This will make all selected resources top-level (no manager)
        </Text>
        <Button danger onClick={handleBatchRemoveManager} icon={<DeleteOutlined />} block>
          Remove Manager from All
        </Button>
      </div>
    </Drawer>
  );
}
