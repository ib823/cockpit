/**
 * Resource Detail Panel Component
 *
 * Side panel for viewing and editing resource details in the organization chart.
 * Allows editing all resource fields including manager assignment.
 */

"use client";

import { useEffect } from "react";
import { Drawer, Form, Input, Select, Button, Typography, Space, Tag } from "antd";
import {
  UserOutlined,
  MailOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  TeamOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";
import type { Resource, ResourceCategory, ResourceDesignation } from "@/types/gantt-tool";

const { Title, Text } = Typography;

interface ResourceDetailPanelProps {
  resourceId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ResourceDetailPanel({ resourceId, onClose, onUpdate }: ResourceDetailPanelProps) {
  const [form] = Form.useForm();
  const currentProject = useGanttToolStore((state) => state.currentProject);
  const updateResource = useGanttToolStore((state) => state.updateResource);

  const resource = currentProject?.resources.find((r) => r.id === resourceId);

  // Get direct reports - resources that have this resource as their manager
  const getDirectReports = (managerId: string): Resource[] => {
    if (!currentProject) return [];
    return currentProject.resources.filter((r) => r.managerResourceId === managerId);
  };

  const directReports = getDirectReports(resourceId);

  useEffect(() => {
    if (!resource) return;
    form.setFieldsValue({
      name: resource.name || "",
      email: resource.email || "",
      department: resource.department || "",
      location: resource.location || "",
      projectRole: resource.projectRole || "",
      managerResourceId: resource.managerResourceId || undefined,
    });
  }, [resource, form]);

  if (!resource || !currentProject) {
    return null;
  }

  const categoryInfo = RESOURCE_CATEGORIES[resource.category];
  const designationLabel = RESOURCE_DESIGNATIONS[resource.designation];

  // Available managers (all resources except self and direct reports to prevent circular refs)
  const availableManagers = currentProject.resources.filter(
    (r: Resource) => r.id !== resourceId && !directReports.some((dr: Resource) => dr.id === r.id)
  );

  const handleSave = () => {
    form.validateFields().then((values) => {
      // Update basic resource fields
      updateResource(resourceId, {
        name: values.name,
        email: values.email || undefined,
        department: values.department || undefined,
        location: values.location || undefined,
        projectRole: values.projectRole || undefined,
      });

      // Update manager assignment if changed
      if (values.managerResourceId !== resource.managerResourceId) {
        const newManagerId = values.managerResourceId || null;
        updateResource(resourceId, { managerResourceId: newManagerId });
      }

      form.resetFields();
      onUpdate();
      onClose();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={
        <Space direction="vertical" size={0}>
          <Space>
            <Tag color={categoryInfo.color}>
              {categoryInfo.icon} {categoryInfo.label}
            </Tag>
          </Space>
          <Title level={4} style={{ margin: 0 }}>
            {resource.name}
          </Title>
          <Text type="secondary">{designationLabel}</Text>
        </Space>
      }
      placement="right"
      width={450}
      onClose={handleCancel}
      open={true}
      footer={
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={handleCancel} icon={<CloseOutlined />}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSave} icon={<SaveOutlined />}>
            Save Changes
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        {/* Name */}
        <Form.Item
          name="name"
          label="Resource Name"
          rules={[{ required: true, message: "Please enter a resource name" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="e.g., John Smith" size="large" />
        </Form.Item>

        {/* Manager Assignment - Prominent */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Form.Item
            name="managerResourceId"
            label={
              <span className="flex items-center gap-2 font-semibold text-blue-900">
                <TeamOutlined />
                Reports To (Manager)
              </span>
            }
            className="mb-0"
          >
            <Select
              placeholder="No Manager (Top Level)"
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
          <div className="text-xs text-blue-700 mt-2">
            Assign a manager to establish reporting relationships in the org chart
          </div>
        </div>

        {/* Email */}
        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: "email", message: "Please enter a valid email" }]}
        >
          <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" />
        </Form.Item>

        {/* Department */}
        <Form.Item name="department" label="Department">
          <Input prefix={<TeamOutlined />} placeholder="e.g., Finance & Accounting" size="large" />
        </Form.Item>

        {/* Location */}
        <Form.Item name="location" label="Location">
          <Input
            prefix={<EnvironmentOutlined />}
            placeholder="e.g., New York, Remote"
            size="large"
          />
        </Form.Item>

        {/* Project Role */}
        <Form.Item name="projectRole" label="Project Role">
          <Input
            prefix={<IdcardOutlined />}
            placeholder="e.g., Financial Workstream Lead"
            size="large"
          />
        </Form.Item>

        {/* Direct Reports */}
        {directReports.length > 0 && (
          <Form.Item label={`Direct Reports (${directReports.length})`}>
            <Space direction="vertical" style={{ width: "100%" }}>
              {directReports.map((report: Resource) => {
                const reportCategoryInfo = RESOURCE_CATEGORIES[report.category];
                return (
                  <div
                    key={report.id}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "6px",
                      border: "1px solid #d9d9d9",
                    }}
                  >
                    <Space>
                      <span>{reportCategoryInfo.icon}</span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{report.name}</div>
                        <Text type="secondary" className="text-xs">
                          {RESOURCE_DESIGNATIONS[report.designation]}
                        </Text>
                      </div>
                    </Space>
                  </div>
                );
              })}
            </Space>
          </Form.Item>
        )}

        {/* Description (Read-only) */}
        <Form.Item label="Description">
          <Input.TextArea
            value={resource.description}
            disabled
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
