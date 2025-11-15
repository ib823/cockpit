/**
 * RicefwPanel Component
 *
 * UI for managing RICEFW objects with CRUD operations
 */

"use client";

import React, { useState } from "react";
import { ResponsiveCard, ResponsiveStack } from "@/components/ui/ResponsiveShell";
import { Heading, Text } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  RicefwItem,
  RicefwType,
  Complexity,
  Phase,
  calculateRicefwSummary,
} from "@/lib/ricefw/model";
import {
  createRicefwItem,
  updateRicefwItem,
  calculateRicefwPhaseImpact,
} from "@/lib/ricefw/calculator";

export interface RicefwPanelProps {
  projectId: string;
  items: RicefwItem[];
  averageHourlyRate?: number;
  onChange: (items: RicefwItem[]) => void;
  readonly?: boolean;
}

export function RicefwPanel({
  projectId,
  items,
  averageHourlyRate = 150,
  onChange,
  readonly = false,
}: RicefwPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    type: RicefwType;
    name: string;
    description: string;
    complexity: Complexity;
    count: number;
    phase: Phase;
  }>({
    type: "report",
    name: "",
    description: "",
    complexity: "M",
    count: 1,
    phase: "realize",
  });

  const summary = calculateRicefwSummary(items, averageHourlyRate);
  const phaseImpact = calculateRicefwPhaseImpact(items);

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      // Update existing
      const updated = items.map((item) =>
        item.id === editingId ? updateRicefwItem(item, formData) : item
      );
      onChange(updated);
      setEditingId(null);
    } else {
      // Create new
      const newItem = createRicefwItem(
        projectId,
        formData.type,
        formData.name,
        formData.complexity,
        formData.count,
        formData.phase,
        formData.description
      );
      onChange([...items, newItem]);
    }

    // Reset form
    setFormData({
      type: "report",
      name: "",
      description: "",
      complexity: "M",
      count: 1,
      phase: "realize",
    });
    setShowForm(false);
  };

  const handleEdit = (item: RicefwItem) => {
    setFormData({
      type: item.type,
      name: item.name,
      description: item.description || "",
      complexity: item.complexity,
      count: item.count,
      phase: item.phase,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <ResponsiveCard padding="lg">
      <ResponsiveStack spacing="lg">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Heading as="h2" size="xl">
              RICEFW Objects
            </Heading>
            <Text color="muted" className="mt-1">
              Reports, Interfaces, Conversions, Enhancements, Forms, Workflows
            </Text>
          </div>

          <div className="text-right">
            <Text size="sm" color="muted">
              Total Effort
            </Text>
            <Text size="2xl" weight="bold">
              {summary.totals.effort.toFixed(1)} PD
            </Text>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { key: "reports", label: "Reports", color: "blue" },
            { key: "interfaces", label: "Interfaces", color: "green" },
            { key: "conversions", label: "Conversions", color: "yellow" },
            { key: "enhancements", label: "Enhancements", color: "purple" },
            { key: "forms", label: "Forms", color: "orange" },
            { key: "workflows", label: "Workflows", color: "red" },
          ].map(({ key, label, color }) => {
            const data = summary[key as keyof Omit<typeof summary, "totals">];
            return (
              <ResponsiveCard key={key} padding="sm" border>
                <div className="text-center space-y-1">
                  <Text size="xs" color="muted">
                    {label}
                  </Text>
                  <Text size="lg" weight="bold">
                    {data.count}
                  </Text>
                  <Text size="xs" color="muted">
                    {data.effort.toFixed(1)} PD
                  </Text>
                </div>
              </ResponsiveCard>
            );
          })}
        </div>

        {/* Add New Button */}
        {!readonly && !showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add RICEFW Item
          </Button>
        )}

        {/* Add/Edit Form */}
        {showForm && !readonly && (
          <ResponsiveCard padding="md" border className="bg-gray-50 dark:bg-gray-900">
            <ResponsiveStack spacing="sm">
              <Heading as="h3" size="lg">
                {editingId ? "Edit" : "Add"} RICEFW Item
              </Heading>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ricefw-type" required>
                    Type
                  </Label>
                  <NativeSelect
                    id="ricefw-type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as RicefwType })
                    }
                  >
                    <option value="report">Report</option>
                    <option value="interface">Interface</option>
                    <option value="conversion">Conversion</option>
                    <option value="enhancement">Enhancement</option>
                    <option value="form">Form</option>
                    <option value="workflow">Workflow</option>
                  </NativeSelect>
                </div>

                <div>
                  <Label htmlFor="ricefw-name" required>
                    Name
                  </Label>
                  <Input
                    id="ricefw-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Inventory Aging Report"
                  />
                </div>

                <div>
                  <Label htmlFor="ricefw-complexity" required>
                    Complexity
                  </Label>
                  <NativeSelect
                    id="ricefw-complexity"
                    value={formData.complexity}
                    onChange={(e) =>
                      setFormData({ ...formData, complexity: e.target.value as Complexity })
                    }
                  >
                    <option value="S">Simple (S)</option>
                    <option value="M">Medium (M)</option>
                    <option value="L">Large (L)</option>
                  </NativeSelect>
                </div>

                <div>
                  <Label htmlFor="ricefw-count" required>
                    Count
                  </Label>
                  <Input
                    id="ricefw-count"
                    type="number"
                    value={formData.count}
                    onChange={(e) =>
                      setFormData({ ...formData, count: parseInt(e.target.value) || 0 })
                    }
                    min={1}
                    max={1000}
                  />
                </div>

                <div>
                  <Label htmlFor="ricefw-phase" required>
                    Primary Phase
                  </Label>
                  <NativeSelect
                    id="ricefw-phase"
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value as Phase })}
                  >
                    <option value="explore">Explore</option>
                    <option value="realize">Realize</option>
                    <option value="deploy">Deploy</option>
                  </NativeSelect>
                </div>
              </div>

              <div>
                <Label htmlFor="ricefw-description">Description / Rationale</Label>
                <Textarea
                  id="ricefw-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description or justification for this item..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                  {editingId ? "Update" : "Add"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      type: "report",
                      name: "",
                      description: "",
                      complexity: "M",
                      count: 1,
                      phase: "realize",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </ResponsiveStack>
          </ResponsiveCard>
        )}

        {/* Items List */}
        {items.length > 0 && (
          <ResponsiveStack spacing="sm">
            <Heading as="h3" size="lg">
              Items ({items.length})
            </Heading>

            {items.map((item) => (
              <ResponsiveCard key={item.id} padding="md" border>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Text weight="semibold">{item.name}</Text>
                      <Badge variant="default" size="sm">
                        {item.type}
                      </Badge>
                      <Badge variant="info" size="sm">
                        {item.count}x {item.complexity}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {item.phase}
                      </Badge>
                    </div>

                    {item.description && (
                      <Text size="sm" color="muted">
                        {item.description}
                      </Text>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <Text size="sm" color="muted">
                        Base: {item.effortPerItem} PD/item
                      </Text>
                      <Text size="sm" weight="semibold">
                        Total: {item.totalEffort.toFixed(1)} PD
                      </Text>
                    </div>
                  </div>

                  {!readonly && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </ResponsiveCard>
            ))}
          </ResponsiveStack>
        )}

        {/* Phase Impact */}
        <ResponsiveCard padding="md" className="bg-gray-50 dark:bg-gray-900">
          <Heading as="h3" size="lg" className="mb-4">
            Phase Impact
          </Heading>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div>
              <Text size="sm" color="muted">
                Explore
              </Text>
              <Text size="xl" weight="bold">
                {phaseImpact.explore.toFixed(1)} PD
              </Text>
            </div>
            <div>
              <Text size="sm" color="muted">
                Realize
              </Text>
              <Text size="xl" weight="bold" color="primary">
                {phaseImpact.realize.toFixed(1)} PD
              </Text>
            </div>
            <div>
              <Text size="sm" color="muted">
                Deploy
              </Text>
              <Text size="xl" weight="bold">
                {phaseImpact.deploy.toFixed(1)} PD
              </Text>
            </div>
            <div>
              <Text size="sm" color="muted">
                Total
              </Text>
              <Text size="xl" weight="bold">
                {phaseImpact.total.toFixed(1)} PD
              </Text>
            </div>
          </div>
        </ResponsiveCard>
      </ResponsiveStack>
    </ResponsiveCard>
  );
}
