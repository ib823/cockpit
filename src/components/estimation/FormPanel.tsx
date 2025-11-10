/**
 * FormPanel Component
 *
 * Manage custom forms with CRUD operations
 */

"use client";

import React, { useState } from "react";
import { Table, Button, Modal, Input, Select, Tag, Space, Popconfirm, InputNumber } from "antd";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { ResponsiveCard } from "@/components/ui/ResponsiveShell";
import { Heading, Text } from "@/components/ui/Typography";
import { FormItem, Complexity } from "@/lib/ricefw/model";

const { Option } = Select;

export interface FormPanelProps {
  projectId: string;
  forms: FormItem[];
  onChange: (forms: FormItem[]) => void;
  readonly?: boolean;
}

const formTypeColors: Record<string, string> = {
  po: "blue",
  invoice: "green",
  deliveryNote: "orange",
  custom: "purple",
};

const formTypeLabels: Record<string, string> = {
  po: "Purchase Order",
  invoice: "Invoice",
  deliveryNote: "Delivery Note",
  custom: "Custom Form",
};

const complexityColors: Record<Complexity, string> = {
  S: "green",
  M: "blue",
  L: "orange",
};

export function FormPanel({ projectId, forms, onChange, readonly = false }: FormPanelProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingForm, setEditingForm] = useState<FormItem | null>(null);
  const [formData, setFormData] = useState<Partial<FormItem>>({});

  const totalEffort = forms.reduce((sum, form) => sum + form.effort, 0);

  const handleAdd = () => {
    setEditingForm(null);
    setFormData({
      type: "custom",
      languages: ["en"],
      complexity: "M",
      effort: 5,
    });
    setIsModalVisible(true);
  };

  const handleEdit = (form: FormItem) => {
    setEditingForm(form);
    setFormData(form);
    setIsModalVisible(true);
  };

  const handleDelete = (formId: string) => {
    onChange(forms.filter((f) => f.id !== formId));
  };

  const handleSave = () => {
    if (!formData.name || !formData.type) return;

    const newForm: FormItem = {
      id: editingForm?.id || `form-${Date.now()}`,
      projectId,
      name: formData.name,
      type: formData.type as any,
      languages: formData.languages || ["en"],
      complexity: formData.complexity || "M",
      effort: formData.effort || 5,
      createdAt: editingForm?.createdAt || new Date(),
    };

    if (editingForm) {
      onChange(forms.map((f) => (f.id === editingForm.id ? newForm : f)));
    } else {
      onChange([...forms, newForm]);
    }

    setIsModalVisible(false);
    setFormData({});
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: FormItem) => (
        <Space>
          <FileText size={16} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color={formTypeColors[type]}>{formTypeLabels[type]}</Tag>,
    },
    {
      title: "Languages",
      dataIndex: "languages",
      key: "languages",
      render: (languages: string[]) => (
        <Space wrap>
          {languages.map((lang) => (
            <Tag key={lang}>{lang.toUpperCase()}</Tag>
          ))}
        </Space>
      ),
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
      render: (_: any, record: FormItem) => (
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
            title="Delete this form?"
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
            Custom Forms
          </Heading>
          <Text color="muted" className="mt-1">
            PO, Invoice, Delivery Note, and custom form templates
          </Text>
        </div>
        {!readonly && (
          <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
            Add Form
          </Button>
        )}
      </div>

      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        <div>
          <Text size="sm" color="muted">
            Total Forms
          </Text>
          <Text size="xl" weight="bold">
            {forms.length}
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
        dataSource={forms}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: "No forms added yet" }}
      />

      <Modal
        title={editingForm ? "Edit Form" : "Add Form"}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="Save"
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Form Name <span style={{ color: "red" }}>*</span>
            </label>
            <Input
              placeholder="e.g., Custom Invoice Template"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Form Type <span style={{ color: "red" }}>*</span>
            </label>
            <Select
              style={{ width: "100%" }}
              value={formData.type}
              onChange={(type) => setFormData({ ...formData, type: type as any })}
            >
              <Option value="po">Purchase Order</Option>
              <Option value="invoice">Invoice</Option>
              <Option value="deliveryNote">Delivery Note</Option>
              <Option value="custom">Custom Form</Option>
            </Select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Languages
            </label>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select languages"
              value={formData.languages}
              onChange={(languages) => setFormData({ ...formData, languages })}
            >
              <Option value="en">English</Option>
              <Option value="de">German</Option>
              <Option value="fr">French</Option>
              <Option value="es">Spanish</Option>
              <Option value="it">Italian</Option>
              <Option value="zh">Chinese</Option>
              <Option value="ja">Japanese</Option>
            </Select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Complexity
            </label>
            <Select
              style={{ width: "100%" }}
              value={formData.complexity}
              onChange={(complexity) =>
                setFormData({ ...formData, complexity: complexity as Complexity })
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
              value={formData.effort}
              onChange={(effort) => setFormData({ ...formData, effort: effort || 0 })}
            />
          </div>
        </Space>
      </Modal>
    </ResponsiveCard>
  );
}
