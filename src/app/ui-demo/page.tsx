"use client";

import React, { useState } from "react";
import { AppShell } from "@/ui/layout/AppShell";
import { PageHeader } from "@/ui/layout/PageHeader";
import {
  Button,
  Input,
  Checkbox,
  Toggle,
  Select,
  Modal,
  Tooltip,
  Alert,
  Progress,
  SkeletonText,
  SkeletonRect,
  Tabs,
  Breadcrumb,
  Pagination,
} from "@/ui";
import { useToast } from "@/ui/toast/ToastProvider";
import { AntDataGrid } from "@/ui/datagrid/AntDataGrid";
import type { ColumnsType } from "antd/es/table";

type ProjectRow = {
  key: string;
  name: string;
  owner: string;
  status: string;
  progress: number;
};

const columns: ColumnsType<ProjectRow> = [
  { title: "Project", dataIndex: "name", key: "name" },
  { title: "Owner", dataIndex: "owner", key: "owner" },
  { title: "Status", dataIndex: "status", key: "status" },
  {
    title: "Progress",
    dataIndex: "progress",
    key: "progress",
    render: (val: number) => <Progress value={val} className="w-24" />,
  },
];

const data: ProjectRow[] = [
  { key: "1", name: "SAP S/4HANA Migration", owner: "Alice Chen", status: "Active", progress: 75 },
  {
    key: "2",
    name: "Cloud ERP Implementation",
    owner: "Bob Smith",
    status: "Planning",
    progress: 30,
  },
  { key: "3", name: "Fiori UX Redesign", owner: "Carol Wang", status: "Active", progress: 60 },
  { key: "4", name: "Data Warehouse Setup", owner: "David Lee", status: "On Hold", progress: 15 },
  { key: "5", name: "Integration Hub", owner: "Eve Martinez", status: "Active", progress: 90 },
];

export default function UIDemo() {
  const { push } = useToast();
  const [checked, setChecked] = useState(false);
  const [toggled, setToggled] = useState(true);
  const [selectVal, setSelectVal] = useState<string | null>("alpha");
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AppShell
      nav={[
        { key: "demo", label: "UI Demo", active: true },
        { key: "components", label: "Components" },
        { key: "docs", label: "Documentation" },
      ]}
      pageHeader={
        <PageHeader
          title="UI Toolkit Demo"
          subtitle="Comprehensive showcase of all components"
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Tools", href: "#" },
                { label: "UI Demo" },
              ]}
            />
          }
          actions={
            <>
              <Button
                variant="ghost"
                onClick={() =>
                  push({ kind: "info", title: "Refreshed", desc: "Data is up to date" })
                }
              >
                Refresh
              </Button>
              <Button
                onClick={() =>
                  push({ kind: "success", title: "Saved!", desc: "All changes persisted" })
                }
              >
                Save
              </Button>
            </>
          }
        />
      }
    >
      <div className="space-y-8">
        {/* Alerts */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Alerts</h2>
          <div className="space-y-3">
            <Alert variant="info" title="Information">
              This is an informational message with additional context.
            </Alert>
            <Alert variant="success" title="Success!">
              Your changes have been saved successfully.
            </Alert>
            <Alert variant="warning" title="Warning">
              This action may have unintended consequences.
            </Alert>
            <Alert variant="error" title="Error" onClose={() => { /* Alert closed */ }}>
              Something went wrong. Please try again.
            </Alert>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Form Controls */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Form Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Input</label>
                <Input placeholder="Enter text..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Input with state</label>
                <Input state="error" placeholder="Error state" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Select</label>
                <Select
                  options={[
                    { value: "alpha", label: "Alpha Project" },
                    { value: "beta", label: "Beta Release" },
                    { value: "gamma", label: "Gamma Testing" },
                  ]}
                  value={selectVal}
                  onChange={setSelectVal}
                  searchable
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Checkbox checked={checked} onChange={setChecked} label="Remember preferences" />
              </div>
              <div>
                <Toggle checked={toggled} onChange={setToggled} label="Enable notifications" />
              </div>
              <div>
                <Button variant="secondary" onClick={() => setModalOpen(true)}>
                  Open Modal
                </Button>
                <Modal
                  open={modalOpen}
                  onClose={() => setModalOpen(false)}
                  title="Example Modal"
                  footer={
                    <>
                      <Button variant="ghost" onClick={() => setModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setModalOpen(false)}>Confirm</Button>
                    </>
                  }
                >
                  <p>This is a modal dialog with focus trap and keyboard navigation.</p>
                </Modal>
              </div>
            </div>
          </div>
        </section>

        {/* Progress & Skeleton */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Progress value={42} label="Upload progress" />
              <Progress indeterminate label="Processing..." />
            </div>
            <div className="space-y-4">
              <SkeletonText lines={3} />
              <SkeletonRect className="h-32" />
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Tabs</h2>
          <Tabs
            variant="underline"
            value={activeTab}
            onChange={setActiveTab}
            items={[
              {
                value: "overview",
                label: "Overview",
                content: <div className="py-4">Overview content with project summaries.</div>,
              },
              {
                value: "activity",
                label: "Activity",
                content: <div className="py-4">Recent activity and updates.</div>,
              },
              {
                value: "settings",
                label: "Settings",
                content: <div className="py-4">Configuration and preferences.</div>,
              },
            ]}
          />
        </section>

        {/* DataGrid */}
        <section>
          <h2 className="text-xl font-semibold mb-4">DataGrid (AntD + Tokens)</h2>
          <AntDataGrid<ProjectRow>
            columns={columns}
            dataSource={data}
            density="compact"
            zebra
            pagination={false}
          />
        </section>

        {/* Pagination */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Pagination</h2>
          <Pagination page={page} pageCount={12} onPageChange={setPage} />
        </section>

        {/* Tooltips */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Tooltips</h2>
          <div className="flex gap-4">
            <Tooltip content="This is a helpful tooltip">
              <Button variant="secondary">Hover me</Button>
            </Tooltip>
            <Tooltip content="Tooltips work with keyboard focus too">
              <Button variant="ghost">Focus me</Button>
            </Tooltip>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
