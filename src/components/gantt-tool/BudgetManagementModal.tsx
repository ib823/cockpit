/**
 * Budget Management Modal
 *
 * Steve Jobs: "Quality is more important than quantity."
 *
 * Configure project budget, alerts, and constraints.
 */

"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Button, Divider, Space, Tag } from "antd";
import { DollarSign, AlertTriangle, Plus, Trash2 } from "lucide-react";
import type { ProjectBudget, BudgetAlert } from "@/types/gantt-tool";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialBudget?: ProjectBudget;
  onSave: (budget: ProjectBudget) => void;
}

const CURRENCY_OPTIONS = [
  { label: "USD - US Dollar", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - British Pound", value: "GBP" },
  { label: "CAD - Canadian Dollar", value: "CAD" },
  { label: "AUD - Australian Dollar", value: "AUD" },
  { label: "INR - Indian Rupee", value: "INR" },
];

export function BudgetManagementModal({ isOpen, onClose, initialBudget, onSave }: Props) {
  const [form] = Form.useForm();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);

  useEffect(() => {
    if (initialBudget) {
      form.setFieldsValue({
        totalBudget: initialBudget.totalBudget,
        currency: initialBudget.currency,
        contingencyPercentage: initialBudget.contingencyPercentage,
        approvedBy: initialBudget.approvedBy,
      });
      setAlerts(initialBudget.budgetAlerts || []);
    } else {
      // Set defaults
      form.setFieldsValue({
        currency: "USD",
        contingencyPercentage: 10,
      });
      // Default alerts
      setAlerts([
        {
          id: `alert-${Date.now()}-1`,
          threshold: 75,
          type: "warning",
          triggered: false,
        },
        {
          id: `alert-${Date.now()}-2`,
          threshold: 90,
          type: "critical",
          triggered: false,
        },
      ]);
    }
  }, [initialBudget, form, isOpen]);

  const handleAddAlert = () => {
    const newAlert: BudgetAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      threshold: 80,
      type: "warning",
      triggered: false,
    };
    setAlerts([...alerts, newAlert]);
  };

  const handleRemoveAlert = (alertId: string) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
  };

  const handleUpdateAlert = (
    alertId: string,
    field: "threshold" | "type",
    value: number | string
  ) => {
    setAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, [field]: value } : alert)));
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      const budget: ProjectBudget = {
        totalBudget: values.totalBudget,
        currency: values.currency,
        contingencyPercentage: values.contingencyPercentage,
        budgetAlerts: alerts.sort((a, b) => a.threshold - b.threshold),
        approvedBy: values.approvedBy,
        approvedAt: new Date().toISOString(),
        baselineDate: new Date().toISOString(),
      };
      onSave(budget);
      onClose();
    });
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      afterClose={() => {
        // PERMANENT FIX: Force cleanup of modal side effects
        if (document.body.style.overflow === "hidden") document.body.style.overflow = "";
        if (document.body.style.paddingRight) document.body.style.paddingRight = "";
        document.body.style.pointerEvents = "";
      }}
      destroyOnHidden={true}
      width={600}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span>Budget Management</span>
        </div>
      }
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save Budget
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" className="mt-4">
        {/* Total Budget */}
        <Form.Item
          label="Total Budget"
          name="totalBudget"
          rules={[{ required: true, message: "Please enter total budget" }]}
        >
          <InputNumber
            min={0}
            step={1000}
            className="w-full"
            prefix={<DollarSign className="w-4 h-4 text-gray-400" />}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value: any) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        {/* Currency */}
        <Form.Item
          label="Currency"
          name="currency"
          rules={[{ required: true, message: "Please select currency" }]}
        >
          <Select options={CURRENCY_OPTIONS} />
        </Form.Item>

        {/* Contingency Percentage */}
        <Form.Item
          label="Contingency Reserve (%)"
          name="contingencyPercentage"
          rules={[{ required: true, message: "Please enter contingency percentage" }]}
          tooltip="Reserve budget for unexpected costs"
        >
          <InputNumber min={0} max={50} step={5} className="w-full" suffix="%" />
        </Form.Item>

        {/* Approved By */}
        <Form.Item
          label="Approved By"
          name="approvedBy"
          tooltip="Name of person who approved this budget"
        >
          <Input placeholder="e.g., John Doe, CFO" />
        </Form.Item>

        <Divider className="my-4" />

        {/* Budget Alerts */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">Budget Alerts</span>
            </div>
            <Button
              type="dashed"
              size="small"
              icon={<Plus className="w-3 h-3" />}
              onClick={handleAddAlert}
            >
              Add Alert
            </Button>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-gray-600">When budget reaches</span>
                  <InputNumber
                    min={0}
                    max={100}
                    value={alert.threshold}
                    onChange={(value) => handleUpdateAlert(alert.id, "threshold", value as number)}
                    suffix="%"
                    size="small"
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">show</span>
                  <Select
                    value={alert.type}
                    onChange={(value) => handleUpdateAlert(alert.id, "type", value)}
                    size="small"
                    className="w-28"
                    options={[
                      { label: "Warning", value: "warning" },
                      { label: "Critical", value: "critical" },
                    ]}
                  />
                </div>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 className="w-3 h-3" />}
                  onClick={() => handleRemoveAlert(alert.id)}
                />
              </div>
            ))}
          </div>

          {alerts.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm border border-dashed border-gray-300 rounded-lg">
              No budget alerts configured
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-800 font-semibold mb-1">Tip</div>
          <div className="text-xs text-blue-700">
            Budget alerts help you stay aware of spending. Set warning alerts at 75% and critical
            alerts at 90% to avoid going over budget.
          </div>
        </div>
      </Form>
    </Modal>
  );
}
