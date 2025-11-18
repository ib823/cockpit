'use client';

import { Card, Input, Button, Space, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useArchitectureStore } from '../../stores/architectureStore';
import type { Environment, Server } from '../../types';

export function DeploymentArchitectureForm() {
  const { data, updateData } = useArchitectureStore();

  const environments = data.environments || [];
  const infrastructure = data.infrastructure || {
    deploymentModel: '',
    location: '',
    backup: '',
    dr: '',
    network: '',
  };

  const handleAddEnvironment = () => {
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name: '',
      servers: [],
      notes: '',
    };
    updateData({ environments: [...environments, newEnv] });
  };

  const handleUpdateEnvironment = (id: string, updates: Partial<Environment>) => {
    updateData({
      environments: environments.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  };

  const handleRemoveEnvironment = (id: string) => {
    updateData({ environments: environments.filter((e) => e.id !== id) });
  };

  const handleAddServer = (envId: string) => {
    const newServer: Server = {
      id: crypto.randomUUID(),
      type: '',
      count: 1,
      specs: '',
      additionalInfo: '',
    };

    updateData({
      environments: environments.map((e) =>
        e.id === envId ? { ...e, servers: [...e.servers, newServer] } : e
      ),
    });
  };

  const handleUpdateServer = (envId: string, serverId: string, updates: Partial<Server>) => {
    updateData({
      environments: environments.map((e) =>
        e.id === envId
          ? {
              ...e,
              servers: e.servers.map((s) => (s.id === serverId ? { ...s, ...updates } : s)),
            }
          : e
      ),
    });
  };

  const handleRemoveServer = (envId: string, serverId: string) => {
    updateData({
      environments: environments.map((e) =>
        e.id === envId ? { ...e, servers: e.servers.filter((s) => s.id !== serverId) } : e
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Infrastructure Overview */}
      <Card title="Infrastructure Overview" size="small">
        <Space direction="vertical" className="w-full">
          <Input
            addonBefore="Deployment Model"
            placeholder="On-premise / SAP Cloud / AWS / Azure / Hybrid"
            value={infrastructure.deploymentModel}
            onChange={(e) => updateData({ infrastructure: { ...infrastructure, deploymentModel: e.target.value } })}
          />
          <Input
            addonBefore="Location"
            placeholder="Client Data Center, Kuala Lumpur"
            value={infrastructure.location}
            onChange={(e) => updateData({ infrastructure: { ...infrastructure, location: e.target.value } })}
          />
          <Input.TextArea
            placeholder="Backup Strategy (e.g., Daily incremental, Weekly full)"
            value={infrastructure.backup}
            onChange={(e) => updateData({ infrastructure: { ...infrastructure, backup: e.target.value } })}
            rows={2}
          />
          <Input.TextArea
            placeholder="Disaster Recovery (e.g., Hot standby site, 4-hour RTO)"
            value={infrastructure.dr}
            onChange={(e) => updateData({ infrastructure: { ...infrastructure, dr: e.target.value } })}
            rows={2}
          />
          <Input.TextArea
            placeholder="Network (e.g., 1Gbps dedicated line, site-to-site VPN)"
            value={infrastructure.network}
            onChange={(e) => updateData({ infrastructure: { ...infrastructure, network: e.target.value } })}
            rows={2}
          />
        </Space>
      </Card>

      {/* Environments */}
      <Card
        title="Environments (DEV / QA / PROD)"
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEnvironment}>
            Add Environment
          </Button>
        }
      >
        {environments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No environments defined.</div>
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {environments.map((env) => (
              <Card
                key={env.id}
                size="small"
                className="border-2 border-indigo-200"
                title={
                  <Input
                    placeholder="Environment Name (e.g., Production, QA, Development)"
                    value={env.name}
                    onChange={(e) => handleUpdateEnvironment(env.id, { name: e.target.value })}
                  />
                }
                extra={
                  <Space>
                    <Button
                      size="small"
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddServer(env.id)}
                    >
                      Add Server
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveEnvironment(env.id)}
                    />
                  </Space>
                }
              >
                {env.servers.length === 0 ? (
                  <div className="text-sm text-gray-400">No servers defined.</div>
                ) : (
                  <Space direction="vertical" className="w-full" size="small">
                    {env.servers.map((server) => (
                      <div key={server.id} className="border rounded p-2 bg-indigo-50">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-3">
                            <Input
                              size="small"
                              placeholder="Server Type"
                              value={server.type}
                              onChange={(e) => handleUpdateServer(env.id, server.id, { type: e.target.value })}
                            />
                            <span className="text-xs text-gray-500">App Server / DB</span>
                          </div>
                          <div className="col-span-1">
                            <InputNumber
                              size="small"
                              min={1}
                              placeholder="Count"
                              value={server.count}
                              onChange={(val) => handleUpdateServer(env.id, server.id, { count: val || 1 })}
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              size="small"
                              placeholder="Specs (e.g., 64 vCPU, 256GB RAM)"
                              value={server.specs}
                              onChange={(e) => handleUpdateServer(env.id, server.id, { specs: e.target.value })}
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              size="small"
                              placeholder="Additional Info"
                              value={server.additionalInfo}
                              onChange={(e) => handleUpdateServer(env.id, server.id, { additionalInfo: e.target.value })}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              danger
                              size="small"
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveServer(env.id, server.id)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </Space>
                )}
                <Input.TextArea
                  placeholder="Environment Notes"
                  value={env.notes}
                  onChange={(e) => handleUpdateEnvironment(env.id, { notes: e.target.value })}
                  rows={2}
                  className="mt-2"
                />
              </Card>
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
}
