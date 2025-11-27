'use client';

import { Card, Input, Button, Space, Select, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useArchitectureStore } from '../../stores/architectureStore';
import type { BridgeConnection } from '../../types';

const { TextArea } = Input;

const INTEGRATION_METHODS = [
  'Data Migration',
  'Real-time Sync',
  'Batch Transfer',
  'API Integration',
  'Event-Driven',
  'Message Queue',
  'File Transfer',
  'Other',
];

const MIGRATION_STRATEGIES = [
  'Phased Cutover',
  'Big Bang',
  'Parallel Run',
  'Pilot / Rollout',
  'Greenfield (No Migration)',
  'Other',
];

export function IntegrationBridgeForm() {
  const { data, updateData } = useArchitectureStore();

  const bridge = data.bridge || { connections: [] };

  // Get lists of AS-IS and TO-BE systems for dropdowns
  const asIsSystems = [
    ...(data.asIs?.sapModules?.flatMap((area) =>
      area.modules.map((m) => `${m.code} - ${m.name}`)
    ) || []),
    ...(data.asIs?.nonSAPSystems?.map((s) => s.name) || []),
  ];

  const toBeSystems = [
    ...(data.toBe?.sapModules?.flatMap((area) =>
      area.modules.map((m) => `${m.code} - ${m.name}`)
    ) || []),
    ...(data.toBe?.cloudSystems?.map((s) => s.name) || []),
  ];

  const handleAddConnection = () => {
    const newConnection: BridgeConnection = {
      id: crypto.randomUUID(),
      name: '',
      asIsSource: '',
      toBeTarget: '',
      method: '',
      dataType: '',
      strategy: '',
      notes: '',
    };
    updateData({
      bridge: {
        connections: [...bridge.connections, newConnection],
      },
    });
  };

  const handleUpdateConnection = (id: string, updates: Partial<BridgeConnection>) => {
    updateData({
      bridge: {
        connections: bridge.connections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      },
    });
  };

  const handleRemoveConnection = (id: string) => {
    updateData({
      bridge: {
        connections: bridge.connections.filter((c) => c.id !== id),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-1">🔗 Integration Bridge (AS-IS → TO-BE)</h3>
        <p className="text-sm text-purple-700">
          Define how the TO-BE solution will connect to existing AS-IS systems. This maps the migration strategy and
          integration points between current and future state.
        </p>
      </div>

      <Card
        title={
          <span>
            Bridge Connections{' '}
            {bridge.connections.length > 0 && <Tag color="purple">{bridge.connections.length}</Tag>}
          </span>
        }
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddConnection}>
            Add Connection
          </Button>
        }
      >
        {bridge.connections.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No bridge connections defined. Add connections showing how TO-BE will integrate with AS-IS systems.
            <br />
            <span className="text-sm">
              Example: &quot;Legacy Oracle ERP&quot; (AS-IS) → &quot;SAP S/4HANA Finance&quot; (TO-BE) via Data Migration
            </span>
          </div>
        ) : (
          <Space direction="vertical" className="w-full" size="large">
            {bridge.connections.map((connection) => (
              <Card key={connection.id} size="small" className="border-2 border-purple-200 bg-purple-50">
                <div className="space-y-4">
                  {/* Connection Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Connection Name *</label>
                    <Input
                      size="large"
                      placeholder="e.g., ERP to S/4HANA Migration, Legacy CRM to SAP Sales Cloud"
                      value={connection.name}
                      onChange={(e) => handleUpdateConnection(connection.id, { name: e.target.value })}
                      className="font-medium"
                    />
                  </div>

                  {/* AS-IS Source → TO-BE Target */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">AS-IS Source *</label>
                      <Select
                        placeholder="Select AS-IS system"
                        value={connection.asIsSource || undefined}
                        onChange={(value) => handleUpdateConnection(connection.id, { asIsSource: value })}
                        className="w-full"
                        options={asIsSystems.map((s) => ({ label: s, value: s }))}
                        showSearch
                        mode="tags"
                        maxTagCount={1}
                      />
                      <div className="text-xs text-gray-500 mt-1">From AS-IS Landscape</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">TO-BE Target *</label>
                      <Select
                        placeholder="Select TO-BE system"
                        value={connection.toBeTarget || undefined}
                        onChange={(value) => handleUpdateConnection(connection.id, { toBeTarget: value })}
                        className="w-full"
                        options={toBeSystems.map((s) => ({ label: s, value: s }))}
                        showSearch
                        mode="tags"
                        maxTagCount={1}
                      />
                      <div className="text-xs text-gray-500 mt-1">To TO-BE Solution</div>
                    </div>
                  </div>

                  {/* Method & Data Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Integration Method</label>
                      <Select
                        placeholder="How will they integrate?"
                        value={connection.method || undefined}
                        onChange={(value) => handleUpdateConnection(connection.id, { method: value })}
                        className="w-full"
                        options={INTEGRATION_METHODS.map((m) => ({ label: m, value: m }))}
                        showSearch
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Data Type</label>
                      <Input
                        placeholder="e.g., Master Data, Transactional Data"
                        value={connection.dataType}
                        onChange={(e) => handleUpdateConnection(connection.id, { dataType: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Strategy */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Migration Strategy</label>
                    <Select
                      placeholder="What's the migration approach?"
                      value={connection.strategy || undefined}
                      onChange={(value) => handleUpdateConnection(connection.id, { strategy: value })}
                      className="w-full"
                      options={MIGRATION_STRATEGIES.map((s) => ({ label: s, value: s }))}
                      showSearch
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Additional Notes</label>
                    <TextArea
                      rows={2}
                      placeholder="Any additional details about this integration/migration..."
                      value={connection.notes}
                      onChange={(e) => handleUpdateConnection(connection.id, { notes: e.target.value })}
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveConnection(connection.id)}
                    >
                      Delete Connection
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      {/* Help Section */}
      <Card size="small" className="bg-gray-50">
        <div className="text-sm text-gray-700">
          <p className="font-medium mb-2">💡 Tips for Integration Bridge:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Map each AS-IS system to its TO-BE replacement or integration point</li>
            <li>Define migration strategy: Phased Cutover, Big Bang, or Parallel Run</li>
            <li>Include both data migration AND ongoing integrations</li>
            <li>Document whether it&apos;s a replacement, coexistence, or integration scenario</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
