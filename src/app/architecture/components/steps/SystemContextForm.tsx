'use client';

import { useState } from 'react';
import { Card, Input, Button, Space, Select, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useArchitectureStore } from '../../stores/architectureStore';
import { ACTOR_TEMPLATES, SYSTEM_TEMPLATES, SYSTEM_TYPES } from '../../data/templates';
import type { Actor, ExternalSystem } from '../../types';

const { TextArea } = Input;

export function SystemContextForm() {
  const { data, updateData } = useArchitectureStore();
  const [showActorTemplates, setShowActorTemplates] = useState(false);
  const [showSystemTemplates, setShowSystemTemplates] = useState(false);
  const [expandedActors, setExpandedActors] = useState<Set<string>>(new Set());
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());

  const projectInfo = data.projectInfo || {
    clientName: '',
    projectName: '',
    industry: '',
    description: '',
  };

  const actors = data.actors || [];
  const externalSystems = data.externalSystems || [];

  // Project Info handlers
  const handleProjectInfoChange = (field: string, value: string) => {
    updateData({
      projectInfo: {
        ...projectInfo,
        [field]: value,
      },
    });
  };

  // Actor handlers
  const handleAddActor = () => {
    const newActor: Actor = {
      id: crypto.randomUUID(),
      name: '',
      role: '',
      activities: [],
    };
    updateData({ actors: [...actors, newActor] });
  };

  const handleApplyActorTemplate = (templateKey: string) => {
    const template = ACTOR_TEMPLATES[templateKey];
    const newActors = template.actors.map((a) => ({ ...a, id: crypto.randomUUID() }));
    updateData({ actors: [...actors, ...newActors] });
    setShowActorTemplates(false);
  };

  const handleUpdateActor = (id: string, updates: Partial<Actor>) => {
    updateData({
      actors: actors.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const handleRemoveActor = (id: string) => {
    updateData({ actors: actors.filter((a) => a.id !== id) });
  };

  const handleActorActivitiesChange = (id: string, value: string) => {
    const activities = value.split('\n').filter((line) => line.trim());
    handleUpdateActor(id, { activities });
  };

  // External System handlers
  const handleAddExternalSystem = () => {
    const newSystem: ExternalSystem = {
      id: crypto.randomUUID(),
      name: '',
      type: '',
      purpose: '',
      integration: '',
    };
    updateData({ externalSystems: [...externalSystems, newSystem] });
  };

  const handleApplySystemTemplate = (templateKey: string) => {
    const template = SYSTEM_TEMPLATES[templateKey];
    const newSystems = template.systems.map((s) => ({ ...s, id: crypto.randomUUID() }));
    updateData({ externalSystems: [...externalSystems, ...newSystems] });
    setShowSystemTemplates(false);
  };

  const handleUpdateExternalSystem = (id: string, updates: Partial<ExternalSystem>) => {
    updateData({
      externalSystems: externalSystems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const handleRemoveExternalSystem = (id: string) => {
    updateData({ externalSystems: externalSystems.filter((s) => s.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Project Information */}
      <Card title="Project Information" size="small">
        <Space direction="vertical" className="w-full" size="middle">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client Name *</label>
              <Input
                size="large"
                placeholder="e.g., YTL Cement Berhad"
                value={projectInfo.clientName}
                onChange={(e) => handleProjectInfoChange('clientName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <Input
                size="large"
                placeholder="e.g., Manufacturing, Banking, Retail"
                value={projectInfo.industry}
                onChange={(e) => handleProjectInfoChange('industry', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Project Name *</label>
            <Input
              size="large"
              placeholder="e.g., SAP S/4HANA Implementation for Manufacturing"
              value={projectInfo.projectName}
              onChange={(e) => handleProjectInfoChange('projectName', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <TextArea
              rows={3}
              placeholder="Brief project description..."
              value={projectInfo.description}
              onChange={(e) => handleProjectInfoChange('description', e.target.value)}
            />
          </div>
        </Space>
      </Card>

      {/* Actors / Users */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <span>Actors / Users</span>
            <span className="text-sm font-normal text-gray-500">
              {actors.length} {actors.length === 1 ? 'actor' : 'actors'}
            </span>
          </div>
        }
        size="small"
        extra={
          <Space>
            <Button
              type="dashed"
              icon={<ThunderboltOutlined />}
              onClick={() => setShowActorTemplates(!showActorTemplates)}
            >
              Quick Add Teams
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddActor}>
              Add Actor
            </Button>
          </Space>
        }
      >
        {showActorTemplates && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-3">👥 Quick Add Teams</h4>
            <p className="text-sm text-gray-600 mb-4">
              Add common user roles in one click. Saves time on standard project setups.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(ACTOR_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleApplyActorTemplate(key)}
                  className="text-left p-3 bg-white rounded-lg border-2 border-gray-200
                           hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">{template.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{template.description}</div>
                  <div className="text-xs text-blue-600">
                    {template.actors.length} roles: {template.actors.map((a) => a.name).slice(0, 2).join(', ')}
                    {template.actors.length > 2 && ', ...'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {actors.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="mb-2">No actors defined yet.</p>
            <p className="text-sm">Click &quot;Quick Add Teams&quot; to add common roles, or &quot;Add Actor&quot; for custom roles.</p>
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {actors.map((actor) => {
              const isExpanded = expandedActors.has(actor.id);

              return (
                <Card key={actor.id} size="small" className="border-2 border-blue-200">
                  <div className="space-y-3">
                    {/* State Toggle + Name */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-1">
                        <label className="block text-sm font-medium mb-1">Actor Name *</label>
                        <Input
                          size="large"
                          placeholder="e.g., Plant Manager, Finance Manager"
                          value={actor.name}
                          onChange={(e) => handleUpdateActor(actor.id, { name: e.target.value })}
                          className="font-medium"
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Role / Department *</label>
                      <Input
                        placeholder="e.g., Operations, Finance, Sales"
                        value={actor.role}
                        onChange={(e) => handleUpdateActor(actor.id, { role: e.target.value })}
                      />
                    </div>

                    {/* Expanded: Activities */}
                    {isExpanded && (
                      <div className="pt-3 border-t">
                        <label className="block text-sm font-medium mb-1">Key Activities (one per line)</label>
                        <TextArea
                          rows={4}
                          placeholder="• Creates maintenance orders&#10;• Reviews production reports&#10;• Approves quality results"
                          value={actor.activities.join('\n')}
                          onChange={(e) => handleActorActivitiesChange(actor.id, e.target.value)}
                        />
                      </div>
                    )}

                    {/* Footer: Expand/Delete */}
                    <div className="pt-3 border-t flex items-center justify-between">
                      <Button
                        type="link"
                        icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => {
                          const newSet = new Set(expandedActors);
                          if (isExpanded) {
                            newSet.delete(actor.id);
                          } else {
                            newSet.add(actor.id);
                          }
                          setExpandedActors(newSet);
                        }}
                        className="px-0"
                      >
                        {isExpanded ? 'Hide' : 'Add'} activities
                      </Button>

                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveActor(actor.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </Card>

      {/* External Systems / Integrations */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <span>External Systems / Integrations</span>
            <span className="text-sm font-normal text-gray-500">
              {externalSystems.length} {externalSystems.length === 1 ? 'system' : 'systems'}
            </span>
          </div>
        }
        size="small"
        extra={
          <Space>
            <Button
              type="dashed"
              icon={<ThunderboltOutlined />}
              onClick={() => setShowSystemTemplates(!showSystemTemplates)}
            >
              Quick Add Systems
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExternalSystem}>
              Add System
            </Button>
          </Space>
        }
      >
        {showSystemTemplates && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium mb-3">⚙️ Quick Add Systems</h4>
            <p className="text-sm text-gray-600 mb-4">
              Add common external system integrations based on industry patterns.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(SYSTEM_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleApplySystemTemplate(key)}
                  className="text-left p-3 bg-white rounded-lg border-2 border-gray-200
                           hover:border-green-500 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">{template.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{template.description}</div>
                  <div className="text-xs text-green-600">
                    {template.systems.length} systems: {template.systems.map((s) => s.name).slice(0, 2).join(', ')}
                    {template.systems.length > 2 && ', ...'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {externalSystems.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="mb-2">No external systems defined yet.</p>
            <p className="text-sm">
              Click &quot;Quick Add Systems&quot; for common integrations, or &quot;Add System&quot; for custom systems.
            </p>
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {externalSystems.map((system) => {
              const isExpanded = expandedSystems.has(system.id);

              return (
                <Card key={system.id} size="small" className="border-2 border-green-200">
                  <div className="space-y-3">
                    {/* State Toggle + Name */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-1">
                      </div>
                      <div className="flex-grow">
                        <label className="block text-sm font-medium mb-1">System Name *</label>
                        <Input
                          size="large"
                          placeholder="e.g., Weighbridge, POS System, Banking Portal"
                          value={system.name}
                          onChange={(e) => handleUpdateExternalSystem(system.id, { name: e.target.value })}
                          className="font-medium"
                        />
                      </div>
                    </div>

                    {/* System Type - DROPDOWN not text! */}
                    <div>
                      <label className="block text-sm font-medium mb-1">System Type *</label>
                      <Select
                        placeholder="Select system type"
                        value={system.type || undefined}
                        onChange={(value) => handleUpdateExternalSystem(system.id, { type: value })}
                        className="w-full"
                        options={SYSTEM_TYPES.map((type) => ({ label: type, value: type }))}
                        showSearch
                      />
                    </div>

                    {/* Expanded: Purpose + Integration */}
                    {isExpanded && (
                      <div className="pt-3 border-t space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Purpose</label>
                          <TextArea
                            rows={2}
                            placeholder="e.g., Captures material weights for goods receipt"
                            value={system.purpose}
                            onChange={(e) => handleUpdateExternalSystem(system.id, { purpose: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Integration Method</label>
                          <Input
                            placeholder="e.g., REST API, File Transfer (XML), RFC"
                            value={system.integration}
                            onChange={(e) => handleUpdateExternalSystem(system.id, { integration: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer: Expand/Delete */}
                    <div className="pt-3 border-t flex items-center justify-between">
                      <Button
                        type="link"
                        icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => {
                          const newSet = new Set(expandedSystems);
                          if (isExpanded) {
                            newSet.delete(system.id);
                          } else {
                            newSet.add(system.id);
                          }
                          setExpandedSystems(newSet);
                        }}
                        className="px-0"
                      >
                        {isExpanded ? 'Hide' : 'Add'} details
                      </Button>

                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveExternalSystem(system.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </Card>
    </div>
  );
}
