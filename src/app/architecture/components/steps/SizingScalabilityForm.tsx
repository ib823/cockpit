'use client';

import { Card, Input, Button, Space, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useArchitectureStore } from '../../stores/architectureStore';
import type { Phase, Transaction } from '../../types';

export function SizingScalabilityForm() {
  const { data, updateData } = useArchitectureStore();

  const phases = data.phases || [];
  const scalability = data.scalability || { approach: '', limits: '' };

  const handleAddPhase = () => {
    const newPhase: Phase = {
      id: crypto.randomUUID(),
      name: '',
      users: 0,
      timeline: '',
      transactions: [],
    };
    updateData({ phases: [...phases, newPhase] });
  };

  const handleUpdatePhase = (id: string, updates: Partial<Phase>) => {
    updateData({
      phases: phases.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  const handleRemovePhase = (id: string) => {
    updateData({ phases: phases.filter((p) => p.id !== id) });
  };

  const handleAddTransaction = (phaseId: string) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: '',
      volume: '',
    };

    updateData({
      phases: phases.map((p) =>
        p.id === phaseId ? { ...p, transactions: [...p.transactions, newTx] } : p
      ),
    });
  };

  const handleUpdateTransaction = (phaseId: string, txId: string, updates: Partial<Transaction>) => {
    updateData({
      phases: phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              transactions: p.transactions.map((t) =>
                t.id === txId ? { ...t, ...updates } : t
              ),
            }
          : p
      ),
    });
  };

  const handleRemoveTransaction = (phaseId: string, txId: string) => {
    updateData({
      phases: phases.map((p) =>
        p.id === phaseId
          ? { ...p, transactions: p.transactions.filter((t) => t.id !== txId) }
          : p
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Phases */}
      <Card
        title="Implementation Phases & Growth"
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPhase}>
            Add Phase
          </Button>
        }
      >
        {phases.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No phases defined.</div>
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {phases.map((phase) => (
              <Card
                key={phase.id}
                size="small"
                className="border-2 border-green-200"
                title={
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Phase Name (e.g., Phase 1 - Pilot)"
                      value={phase.name}
                      onChange={(e) => handleUpdatePhase(phase.id, { name: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                }
                extra={
                  <Space>
                    <Button
                      size="small"
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddTransaction(phase.id)}
                    >
                      Add Transaction Type
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemovePhase(phase.id)}
                    />
                  </Space>
                }
              >
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">User Count</label>
                    <InputNumber
                      min={0}
                      placeholder="51"
                      value={phase.users}
                      onChange={(val) => handleUpdatePhase(phase.id, { users: val || 0 })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Timeline</label>
                    <Input
                      placeholder="e.g., Months 1-6, Q1-Q2 2025"
                      value={phase.timeline}
                      onChange={(e) => handleUpdatePhase(phase.id, { timeline: e.target.value })}
                    />
                  </div>
                </div>

                <label className="block text-sm font-medium mb-2">Transaction Volumes</label>
                {phase.transactions.length === 0 ? (
                  <div className="text-sm text-gray-400 py-2">No transaction types defined.</div>
                ) : (
                  <Space direction="vertical" className="w-full" size="small">
                    {phase.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-2">
                        <Input
                          placeholder="Transaction Type (e.g., Purchase Orders)"
                          value={tx.type}
                          onChange={(e) =>
                            handleUpdateTransaction(phase.id, tx.id, { type: e.target.value })
                          }
                          className="flex-1"
                        />
                        <Input
                          placeholder="Volume (e.g., 750/month, 10K/day)"
                          value={tx.volume}
                          onChange={(e) =>
                            handleUpdateTransaction(phase.id, tx.id, { volume: e.target.value })
                          }
                          style={{ width: '200px' }}
                        />
                        <Button
                          danger
                          size="small"
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveTransaction(phase.id, tx.id)}
                        />
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            ))}
          </Space>
        )}
      </Card>

      {/* Scalability */}
      <Card title="Scalability Strategy" size="small">
        <Space direction="vertical" className="w-full">
          <Input.TextArea
            rows={3}
            placeholder="Scalability Approach (e.g., Horizontal scaling of app servers)"
            value={scalability.approach}
            onChange={(e) => updateData({ scalability: { ...scalability, approach: e.target.value } })}
          />
          <Input.TextArea
            rows={2}
            placeholder="Scalability Limits (e.g., Up to 500 concurrent users)"
            value={scalability.limits}
            onChange={(e) => updateData({ scalability: { ...scalability, limits: e.target.value } })}
          />
        </Space>
      </Card>
    </div>
  );
}
