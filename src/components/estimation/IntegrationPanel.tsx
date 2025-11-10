/**
 * IntegrationPanel Component
 *
 * Manage integrations with CRUD operations
 */

"use client";

import React, { useState } from "react";
import { Table, Button, Modal, Input, Select, Tag, Space, Popconfirm, InputNumber } from "antd";
import { Plus, Edit, Trash2, Link2 } from "lucide-react";
import { ResponsiveCard } from "@/components/ui/ResponsiveShell";
import { Heading, Text } from "@/components/ui/Typography";
import { IntegrationItem, Complexity } from "@/lib/ricefw/model";

const { Option } = Select;

export interface IntegrationPanelProps {
  projectId: string;
  integrations: IntegrationItem[];
  onChange: (integrations: IntegrationItem[]) => void;
  readonly?: boolean;
}

const integrationTypeColors: Record<string, string> = {
  api: "blue",
  file: "green",
  database: "purple",
  realtime: "orange",
  batch: "cyan",
};

const integrationTypeLabels: Record<string, string> = {
  api: "API",
  file: "File Transfer",
  database: "Database",
  realtime: "Real-time",
  batch: "Batch",
};

const complexityColors: Record<Complexity, string> = {
  S: "green",
  M: "blue",
  L: "orange",
};

const volumeColors: Record<string, string> = {
  low: "green",
  medium: "blue",
  high: "red",
};

export function IntegrationPanel({
  projectId,
  integrations,
  onChange,
  readonly = false,
}: IntegrationPanelProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationItem | null>(null);
  const [integrationData, setIntegrationData] = useState<Partial<IntegrationItem>>({});

  const totalEffort = integrations.reduce((sum, int) => sum + int.effort, 0);

  const handleAdd = () => {
    setEditingIntegration(null);
    setIntegrationData({
      type: "api",
      complexity: "M",
      volume: "medium",
      effort: 8,
      source: "",
      target: "",
    });
    setIsModalVisible(true);
  };

  const handleEdit = (integration: IntegrationItem) => {
    setEditingIntegration(integration);
    setIntegrationData(integration);
    setIsModalVisible(true);
  };

  const handleDelete = (integrationId: string) => {
    onChange(integrations.filter((i) => i.id !== integrationId));
  };

  const handleSave = () => {
    if (
      !integrationData.name ||
      !integrationData.type ||
      !integrationData.source ||
      !integrationData.target
    )
      return;

    const newIntegration: IntegrationItem = {
      id: editingIntegration?.id || `integration-${Date.now()}`,
      projectId,
      name: integrationData.name,
      type: integrationData.type as any,
      source: integrationData.source,
      target: integrationData.target,
      complexity: integrationData.complexity || "M",
      volume: integrationData.volume || "medium",
      effort: integrationData.effort || 8,
      createdAt: editingIntegration?.createdAt || new Date(),
    };

    if (editingIntegration) {
      onChange(integrations.map((i) => (i.id === editingIntegration.id ? newIntegration : i)));
    } else {
      onChange([...integrations, newIntegration]);
    }

    setIsModalVisible(false);
    setIntegrationData({});
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: IntegrationItem) => (
        <Space>
          <Link2 size={16} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={integrationTypeColors[type]}>{integrationTypeLabels[type]}</Tag>
      ),
    },
    {
      title: "Source → Target",
      key: "flow",
      render: (_: any, record: IntegrationItem) => (
        <span className="text-xs">
          <span style={{ fontWeight: 500 }}>{record.source}</span>
          {" → "}
          <span style={{ fontWeight: 500 }}>{record.target}</span>
        </span>
      ),
    },
    {
      title: "Volume",
      dataIndex: "volume",
      key: "volume",
      render: (volume: string) => <Tag color={volumeColors[volume]}>{volume.toUpperCase()}</Tag>,
    },
    {
      title: "Complexity",
      dataIndex: "complexity",
      key: "complexity",
      render: (complexity: Complexity) => (
        <Tag color={complexityColors[complexity]}>{complexity.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Effort (PD)",
      dataIndex: "effort",
      key: "effort",
      render: (effort: number) => effort.toFixed(1),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: IntegrationItem) => (
        <Space>
          <Button
            type="link"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
            disabled={readonly}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this integration?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            disabled={readonly}
          >
            <Button type="link" danger icon={<Trash2 size={16} />} disabled={readonly}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ResponsiveCard padding="lg">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <Heading as="h2" size="xl">
            Integrations
          </Heading>
          <Text color="muted" className="mt-1">
            API, File, Database, and Real-time integrations
          </Text>
        </div>
        {!readonly && (
          <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
            Add Integration
          </Button>
        )}
      </div>

      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        <div>
          <Text size="sm" color="muted">
            Total Integrations
          </Text>
          <Text size="xl" weight="bold">
            {integrations.length}
          </Text>
        </div>
        <div>
          <Text size="sm" color="muted">
            Total Effort
          </Text>
          <Text size="xl" weight="bold" color="primary">
            {totalEffort.toFixed(1)} PD
          </Text>
        </div>
      </div>

      <Table
        dataSource={integrations}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: "No integrations added yet" }}
      />

      <Modal
        title={editingIntegration ? "Edit Integration" : "Add Integration"}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="Save"
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Integration Name <span style={{ color: "red" }}>*</span>
            </label>
            <Input
              placeholder="e.g., SAP to Salesforce Sync"
              value={integrationData.name}
              onChange={(e) => setIntegrationData({ ...integrationData, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Integration Type <span style={{ color: "red" }}>*</span>
            </label>
            <Select
              style={{ width: "100%" }}
              value={integrationData.type}
              onChange={(type) => setIntegrationData({ ...integrationData, type: type as any })}
            >
              <Option value="api">API Integration</Option>
              <Option value="file">File Transfer</Option>
              <Option value="database">Database Connection</Option>
              <Option value="realtime">Real-time Integration</Option>
              <Option value="batch">Batch Processing</Option>
            </Select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                Source System <span style={{ color: "red" }}>*</span>
              </label>
              <Input
                placeholder="e.g., SAP ECC"
                value={integrationData.source}
                onChange={(e) => setIntegrationData({ ...integrationData, source: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                Target System <span style={{ color: "red" }}>*</span>
              </label>
              <Input
                placeholder="e.g., Salesforce"
                value={integrationData.target}
                onChange={(e) => setIntegrationData({ ...integrationData, target: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Data Volume
            </label>
            <Select
              style={{ width: "100%" }}
              value={integrationData.volume}
              onChange={(volume) =>
                setIntegrationData({ ...integrationData, volume: volume as any })
              }
            >
              <Option value="low">Low (&lt;1000 records/day)</Option>
              <Option value="medium">Medium (1K-10K records/day)</Option>
              <Option value="high">High (&gt;10K records/day)</Option>
            </Select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Complexity
            </label>
            <Select
              style={{ width: "100%" }}
              value={integrationData.complexity}
              onChange={(complexity) =>
                setIntegrationData({ ...integrationData, complexity: complexity as Complexity })
              }
            >
              <Option value="simple">Simple</Option>
              <Option value="medium">Medium</Option>
              <Option value="complex">Complex</Option>
            </Select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Effort (Person-Days)
            </label>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={0.5}
              value={integrationData.effort}
              onChange={(effort) => setIntegrationData({ ...integrationData, effort: effort || 0 })}
            />
          </div>
        </Space>
      </Modal>
    </ResponsiveCard>
  );
}
