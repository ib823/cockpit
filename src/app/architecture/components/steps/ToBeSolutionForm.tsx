'use client';

import { useState } from 'react';
import { Card, Input, Button, Space, Select, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useArchitectureStore } from '../../stores/architectureStore';
import { SAP_MODULE_TEMPLATES } from '../../data/templates';
import type { ModuleArea, Module, CloudSystem, Integration } from '../../types';

const { TextArea } = Input;

const CLOUD_SYSTEM_TYPES: Array<CloudSystem['type']> = [
  'BTP',
  'Ariba',
  'SuccessFactors',
  'Concur',
  'Fieldglass',
  'Analytics Cloud',
  'Other',
];

export function ToBeSolutionForm() {
  const { data, updateData } = useArchitectureStore();
  const [showModuleTemplates, setShowModuleTemplates] = useState(false);

  const toBe = data.toBe || {
    sapModules: [],
    cloudSystems: [],
    integrations: [],
    database: { type: '', size: '', notes: '' },
    integrationLayer: { middleware: '', description: '' },
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
      toBe: {
        ...toBe,
        sapModules: [...toBe.sapModules, newArea],
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
      toBe: {
        ...toBe,
        sapModules: [...toBe.sapModules, newArea],
      },
    });
  };

  const handleUpdateModuleArea = (id: string, field: string, value: string) => {
    updateData({
      toBe: {
        ...toBe,
        sapModules: toBe.sapModules.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
      },
    });
  };

  const handleRemoveModuleArea = (id: string) => {
    updateData({
      toBe: {
        ...toBe,
        sapModules: toBe.sapModules.filter((a) => a.id !== id),
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
      toBe: {
        ...toBe,
        sapModules: toBe.sapModules.map((a) =>
          a.id === areaId ? { ...a, modules: [...a.modules, newModule] } : a
        ),
      },
    });
  };

  const handleUpdateModule = (areaId: string, moduleId: string, updates: Partial<Module>) => {
    updateData({
      toBe: {
        ...toBe,
        sapModules: toBe.sapModules.map((a) =>
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
      toBe: {
        ...toBe,
        sapModules: toBe.sapModules.map((a) =>
          a.id === areaId ? { ...a, modules: a.modules.filter((m) => m.id !== moduleId) } : a
        ),
      },
    });
  };

  // === CLOUD SYSTEM HANDLERS ===
  const handleAddCloudSystem = () => {
    const newSystem: CloudSystem = {
      id: crypto.randomUUID(),
      name: '',
      type: 'BTP',
      modules: [],
      purpose: '',
    };
    updateData({
      toBe: {
        ...toBe,
        cloudSystems: [...toBe.cloudSystems, newSystem],
      },
    });
  };

  const handleUpdateCloudSystem = (id: string, updates: Partial<CloudSystem>) => {
    updateData({
      toBe: {
        ...toBe,
        cloudSystems: toBe.cloudSystems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      },
    });
  };

  const handleRemoveCloudSystem = (id: string) => {
    updateData({
      toBe: {
        ...toBe,
        cloudSystems: toBe.cloudSystems.filter((s) => s.id !== id),
      },
    });
  };

  const handleCloudSystemModulesChange = (id: string, value: string) => {
    const modules = value.split('\n').filter((line) => line.trim().length > 0);
    handleUpdateCloudSystem(id, { modules });
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
      toBe: {
        ...toBe,
        integrations: [...toBe.integrations, newIntegration],
      },
    });
  };

  const handleUpdateIntegration = (id: string, updates: Partial<Integration>) => {
    updateData({
      toBe: {
        ...toBe,
        integrations: toBe.integrations.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      },
    });
  };

  const handleRemoveIntegration = (id: string) => {
    updateData({
      toBe: {
        ...toBe,
        integrations: toBe.integrations.filter((i) => i.id !== id),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-1">🚀 TO-BE Solution (Future State)</h3>
        <p className="text-sm text-green-700">
          Define your planned SAP modules, cloud systems (BTP, Ariba, SuccessFactors), and new integrations. This will generate your TO-BE diagram.
        </p>
      </div>

      {/* PLANNED SAP MODULES */}
      <Card
        title={
          <span>
            Planned SAP Modules{' '}
            {toBe.sapModules.length > 0 && <Tag color="blue">{toBe.sapModules.length} areas</Tag>}
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

        {toBe.sapModules.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No planned SAP modules. Add planned modules (S/4HANA modules, extensions, etc.)
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="large">
            {toBe.sapModules.map((area) => (
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

      {/* CLOUD SYSTEMS (BTP, Ariba, SuccessFactors, etc.) */}
      <Card
        title={
          <span>
            Cloud Systems (BTP, Ariba, SuccessFactors){' '}
            {toBe.cloudSystems.length > 0 && <Tag color="cyan">{toBe.cloudSystems.length}</Tag>}
          </span>
        }
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCloudSystem}>
            Add Cloud System
          </Button>
        }
      >
        {toBe.cloudSystems.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No cloud systems defined. Add SAP BTP, Ariba, SuccessFactors, Concur, etc.
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {toBe.cloudSystems.map((system) => (
              <Card key={system.id} size="small" className="border-2 border-cyan-200">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">System Name *</label>
                      <Input
                        placeholder="e.g., SAP Ariba Procurement"
                        value={system.name}
                        onChange={(e) => handleUpdateCloudSystem(system.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type *</label>
                      <Select
                        placeholder="Select type"
                        value={system.type}
                        onChange={(value: CloudSystem['type']) =>
                          handleUpdateCloudSystem(system.id, { type: value })
                        }
                        className="w-full"
                        options={CLOUD_SYSTEM_TYPES.map((t) => ({ label: t, value: t }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Purpose</label>
                    <Input
                      placeholder="What will this cloud system do?"
                      value={system.purpose}
                      onChange={(e) => handleUpdateCloudSystem(system.id, { purpose: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Modules / Components (one per line)
                    </label>
                    <TextArea
                      rows={3}
                      placeholder="e.g., Procurement&#10;Supplier Management&#10;Contract Management"
                      value={system.modules.join('\n')}
                      onChange={(e) => handleCloudSystemModulesChange(system.id, e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveCloudSystem(system.id)}
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

      {/* NEW INTEGRATIONS */}
      <Card
        title={
          <span>
            New Integrations{' '}
            {toBe.integrations.length > 0 && <Tag color="green">{toBe.integrations.length}</Tag>}
          </span>
        }
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddIntegration}>
            Add Integration
          </Button>
        }
      >
        {toBe.integrations.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No new integrations defined. Add planned system-to-system integrations.
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {toBe.integrations.map((integration) => (
              <Card key={integration.id} size="small" className="border-2 border-green-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Integration Name *</label>
                    <Input
                      placeholder="e.g., S/4HANA to Ariba Integration"
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

      {/* TO-BE DATABASE */}
      <Card title="TO-BE Database" size="small">
        <Space direction="vertical" className="w-full">
          <div>
            <label className="block text-sm font-medium mb-1">Database Type *</label>
            <Input
              placeholder="e.g., SAP HANA"
              value={toBe.database?.type || ''}
              onChange={(e) =>
                updateData({
                  toBe: {
                    ...toBe,
                    database: { ...toBe.database, type: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size / Specifications</label>
            <Input
              placeholder="e.g., 2TB RAM, 10TB storage"
              value={toBe.database?.size || ''}
              onChange={(e) =>
                updateData({
                  toBe: {
                    ...toBe,
                    database: { ...toBe.database, size: e.target.value },
                  },
                })
              }
            />
          </div>
        </Space>
      </Card>

      {/* INTEGRATION LAYER / MIDDLEWARE */}
      <Card title="Integration Layer / Middleware" size="small">
        <Space direction="vertical" className="w-full">
          <div>
            <label className="block text-sm font-medium mb-1">Middleware</label>
            <Input
              placeholder="e.g., SAP BTP Integration Suite, Dell Boomi, MuleSoft"
              value={toBe.integrationLayer?.middleware || ''}
              onChange={(e) =>
                updateData({
                  toBe: {
                    ...toBe,
                    integrationLayer: { ...toBe.integrationLayer, middleware: e.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <TextArea
              rows={2}
              placeholder="How will the integration layer work?"
              value={toBe.integrationLayer?.description || ''}
              onChange={(e) =>
                updateData({
                  toBe: {
                    ...toBe,
                    integrationLayer: { ...toBe.integrationLayer, description: e.target.value },
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
