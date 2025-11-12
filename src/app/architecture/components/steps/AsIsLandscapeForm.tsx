'use client';

import { useState } from 'react';
import { Card, Input, Button, Space, Select, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useArchitectureStore } from '../../stores/architectureStore';
import { SAP_MODULE_TEMPLATES } from '../../data/templates';
import type { ModuleArea, Module, NonSAPSystem, Integration } from '../../types';

const { TextArea } = Input;

const NON_SAP_SYSTEM_TYPES = [
  'Legacy ERP',
  'Custom Inventory System',
  'Manufacturing Execution System (MES)',
  'Warehouse Management System (WMS)',
  'Customer Relationship Management (CRM)',
  'Point of Sale (POS)',
  'Document Management System',
  'Business Intelligence / Reporting',
  'Other',
];

export function AsIsLandscapeForm() {
  const { data, updateData } = useArchitectureStore();
  const [showModuleTemplates, setShowModuleTemplates] = useState(false);

  const asIs = data.asIs || {
    sapModules: [],
    nonSAPSystems: [],
    integrations: [],
    database: { type: '', size: '', notes: '' },
  };

  // === SAP MODULE HANDLERS ===
  const handleApplyModuleTemplate = (templateKey: string) => {
    const template = SAP_MODULE_TEMPLATES[templateKey];
    const newArea: ModuleArea = {
      id: crypto.randomUUID(),
      area: template.area,
      modules: template.modules.map((m) => ({ ...m, id: crypto.randomUUID() })),
    };
    updateData({
      asIs: {
        ...asIs,
        sapModules: [...asIs.sapModules, newArea],
      },
    });
    setShowModuleTemplates(false);
  };

  const handleAddModuleArea = () => {
    const newArea: ModuleArea = {
      id: crypto.randomUUID(),
      area: '',
      modules: [],
    };
    updateData({
      asIs: {
        ...asIs,
        sapModules: [...asIs.sapModules, newArea],
      },
    });
  };

  const handleUpdateModuleArea = (id: string, field: string, value: string) => {
    updateData({
      asIs: {
        ...asIs,
        sapModules: asIs.sapModules.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
      },
    });
  };

  const handleRemoveModuleArea = (id: string) => {
    updateData({
      asIs: {
        ...asIs,
        sapModules: asIs.sapModules.filter((a) => a.id !== id),
      },
    });
  };

  const handleAddModule = (areaId: string) => {
    const newModule: Module = {
      id: crypto.randomUUID(),
      code: '',
      name: '',
      scope: '',
    };
    updateData({
      asIs: {
        ...asIs,
        sapModules: asIs.sapModules.map((a) =>
          a.id === areaId ? { ...a, modules: [...a.modules, newModule] } : a
        ),
      },
    });
  };

  const handleUpdateModule = (areaId: string, moduleId: string, updates: Partial<Module>) => {
    updateData({
      asIs: {
        ...asIs,
        sapModules: asIs.sapModules.map((a) =>
          a.id === areaId
            ? {
                ...a,
                modules: a.modules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m)),
              }
            : a
        ),
      },
    });
  };

  const handleRemoveModule = (areaId: string, moduleId: string) => {
    updateData({
      asIs: {
        ...asIs,
        sapModules: asIs.sapModules.map((a) =>
          a.id === areaId ? { ...a, modules: a.modules.filter((m) => m.id !== moduleId) } : a
        ),
      },
    });
  };

  // === NON-SAP SYSTEM HANDLERS ===
  const handleAddNonSAPSystem = () => {
    const newSystem: NonSAPSystem = {
      id: crypto.randomUUID(),
      name: '',
      type: '',
      vendor: '',
      purpose: '',
      modules: [],
    };
    updateData({
      asIs: {
        ...asIs,
        nonSAPSystems: [...asIs.nonSAPSystems, newSystem],
      },
    });
  };

  const handleUpdateNonSAPSystem = (id: string, updates: Partial<NonSAPSystem>) => {
    updateData({
      asIs: {
        ...asIs,
        nonSAPSystems: asIs.nonSAPSystems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      },
    });
  };

  const handleRemoveNonSAPSystem = (id: string) => {
    updateData({
      asIs: {
        ...asIs,
        nonSAPSystems: asIs.nonSAPSystems.filter((s) => s.id !== id),
      },
    });
  };

  // === INTEGRATION HANDLERS ===
  const handleAddIntegration = () => {
    const newIntegration: Integration = {
      id: crypto.randomUUID(),
      name: '',
      source: '',
      target: '',
      method: '',
      frequency: '',
      dataType: '',
      volume: '',
      direction: '',
    };
    updateData({
      asIs: {
        ...asIs,
        integrations: [...asIs.integrations, newIntegration],
      },
    });
  };

  const handleUpdateIntegration = (id: string, updates: Partial<Integration>) => {
    updateData({
      asIs: {
        ...asIs,
        integrations: asIs.integrations.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      },
    });
  };

  const handleRemoveIntegration = (id: string) => {
    updateData({
      asIs: {
        ...asIs,
        integrations: asIs.integrations.filter((i) => i.id !== id),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1">📋 AS-IS Landscape (Current State)</h3>
        <p className="text-sm text-blue-700">
          Document your current systems, modules, and integrations. This will generate your AS-IS diagram.
        </p>
      </div>

      {/* CURRENT SAP MODULES */}
      <Card
        title={
          <span>
            Current SAP Modules{' '}
            {asIs.sapModules.length > 0 && <Tag color="blue">{asIs.sapModules.length} areas</Tag>}
          </span>
        }
        size="small"
        extra={
          <Space>
            <Button
              type="dashed"
              icon={<ThunderboltOutlined />}
              onClick={() => setShowModuleTemplates(!showModuleTemplates)}
            >
              Quick Add
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModuleArea}>
              Add Module Area
            </Button>
          </Space>
        }
      >
        {showModuleTemplates && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-3">📦 Quick Add SAP Module Sets</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(SAP_MODULE_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleApplyModuleTemplate(key)}
                  className="text-left p-4 bg-white rounded-lg border-2 border-gray-200
                           hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">{template.name}</div>
                  <div className="text-sm text-gray-500 mb-2">{template.description}</div>
                  <div className="text-xs text-blue-600">
                    {template.modules.length} modules: {template.modules.map((m) => m.code).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {asIs.sapModules.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No SAP modules defined. Add current SAP modules (FI, CO, MM, SD, etc.)
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="large">
            {asIs.sapModules.map((area) => (
              <Card
                key={area.id}
                size="small"
                className="border-2 border-purple-200"
                title={
                  <Input
                    placeholder="Functional Area (e.g., Finance & Controlling)"
                    value={area.area}
                    onChange={(e) => handleUpdateModuleArea(area.id, 'area', e.target.value)}
                    className="font-bold"
                  />
                }
                extra={
                  <Space>
                    <Button
                      size="small"
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddModule(area.id)}
                    >
                      Add Module
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveModuleArea(area.id)}
                    />
                  </Space>
                }
              >
                {area.modules.length === 0 ? (
                  <div className="text-sm text-gray-400 py-2">No modules</div>
                ) : (
                  <Space direction="vertical" className="w-full" size="small">
                    {area.modules.map((module) => (
                      <div key={module.id} className="border rounded p-3 bg-purple-50">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-2">
                            <Input
                              placeholder="Code"
                              value={module.code}
                              onChange={(e) =>
                                handleUpdateModule(area.id, module.id, { code: e.target.value })
                              }
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              placeholder="Module Name"
                              value={module.name}
                              onChange={(e) =>
                                handleUpdateModule(area.id, module.id, { name: e.target.value })
                              }
                            />
                          </div>
                          <div className="col-span-5">
                            <Input
                              placeholder="Scope / Sub-components"
                              value={module.scope}
                              onChange={(e) =>
                                handleUpdateModule(area.id, module.id, { scope: e.target.value })
                              }
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button
                              danger
                              size="small"
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveModule(area.id, module.id)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            ))}
          </Space>
        )}
      </Card>

      {/* NON-SAP SYSTEMS */}
      <Card
        title={
          <span>
            Non-SAP / Legacy Systems{' '}
            {asIs.nonSAPSystems.length > 0 && <Tag color="orange">{asIs.nonSAPSystems.length}</Tag>}
          </span>
        }
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNonSAPSystem}>
            Add System
          </Button>
        }
      >
        {asIs.nonSAPSystems.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No non-SAP systems defined. Add legacy ERP, custom systems, etc.
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {asIs.nonSAPSystems.map((system) => (
              <Card key={system.id} size="small" className="border-2 border-orange-200">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">System Name *</label>
                      <Input
                        placeholder="e.g., Legacy Oracle ERP"
                        value={system.name}
                        onChange={(e) => handleUpdateNonSAPSystem(system.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type *</label>
                      <Select
                        placeholder="Select type"
                        value={system.type || undefined}
                        onChange={(value) => handleUpdateNonSAPSystem(system.id, { type: value })}
                        className="w-full"
                        options={NON_SAP_SYSTEM_TYPES.map((t) => ({ label: t, value: t }))}
                        showSearch
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Vendor</label>
                      <Input
                        placeholder="e.g., Oracle, Microsoft, In-house"
                        value={system.vendor}
                        onChange={(e) => handleUpdateNonSAPSystem(system.id, { vendor: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Purpose</label>
                      <Input
                        placeholder="What does it do?"
                        value={system.purpose}
                        onChange={(e) => handleUpdateNonSAPSystem(system.id, { purpose: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveNonSAPSystem(system.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      {/* CURRENT INTEGRATIONS */}
      <Card
        title={
          <span>
            Current Integrations{' '}
            {asIs.integrations.length > 0 && <Tag color="green">{asIs.integrations.length}</Tag>}
          </span>
        }
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddIntegration}>
            Add Integration
          </Button>
        }
      >
        {asIs.integrations.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No integrations defined. Add current system-to-system integrations.
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {asIs.integrations.map((integration) => (
              <Card key={integration.id} size="small" className="border-2 border-green-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Integration Name *</label>
                    <Input
                      placeholder="e.g., ERP to WMS Integration"
                      value={integration.name}
                      onChange={(e) => handleUpdateIntegration(integration.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Source</label>
                      <Input
                        placeholder="System name"
                        value={integration.source}
                        onChange={(e) => handleUpdateIntegration(integration.id, { source: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Target</label>
                      <Input
                        placeholder="System name"
                        value={integration.target}
                        onChange={(e) => handleUpdateIntegration(integration.id, { target: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveIntegration(integration.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      {/* DATABASE */}
      <Card title="Current Database" size="small">
        <Space direction="vertical" className="w-full">
          <div>
            <label className="block text-sm font-medium mb-1">Database Type *</label>
            <Input
              placeholder="e.g., Oracle, DB2, SQL Server"
              value={asIs.database?.type || ''}
              onChange={(e) =>
                updateData({
                  asIs: {
                    ...asIs,
                    database: { ...asIs.database, type: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size / Specifications</label>
            <Input
              placeholder="e.g., 1TB RAM, 5TB storage"
              value={asIs.database?.size || ''}
              onChange={(e) =>
                updateData({
                  asIs: {
                    ...asIs,
                    database: { ...asIs.database, size: e.target.value },
                  },
                })
              }
            />
          </div>
        </Space>
      </Card>
    </div>
  );
}
