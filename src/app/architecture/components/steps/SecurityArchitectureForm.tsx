'use client';

import { Card, Input, Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useArchitectureStore } from '../../stores/architectureStore';
import type { AuthMethod, SecurityControl } from '../../types';

export function SecurityArchitectureForm() {
  const { data, updateData } = useArchitectureStore();

  const authMethods = data.authMethods || [];
  const securityControls = data.securityControls || [];
  const compliance = data.compliance || { standards: [], notes: '' };

  const handleAddAuthMethod = () => {
    const newAuth: AuthMethod = {
      id: crypto.randomUUID(),
      method: '',
      provider: '',
      details: '',
    };
    updateData({ authMethods: [...authMethods, newAuth] });
  };

  const handleUpdateAuthMethod = (id: string, updates: Partial<AuthMethod>) => {
    updateData({
      authMethods: authMethods.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const handleRemoveAuthMethod = (id: string) => {
    updateData({ authMethods: authMethods.filter((a) => a.id !== id) });
  };

  const handleAddSecurityControl = () => {
    const newControl: SecurityControl = {
      id: crypto.randomUUID(),
      layer: '',
      controls: [],
    };
    updateData({ securityControls: [...securityControls, newControl] });
  };

  const handleUpdateSecurityControl = (id: string, updates: Partial<SecurityControl>) => {
    updateData({
      securityControls: securityControls.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const handleRemoveSecurityControl = (id: string) => {
    updateData({ securityControls: securityControls.filter((c) => c.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Authentication */}
      <Card
        title="Authentication Methods"
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAuthMethod}>
            Add Method
          </Button>
        }
      >
        {authMethods.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No auth methods defined.</div>
        ) : (
          <Space direction="vertical" className="w-full" size="small">
            {authMethods.map((auth) => (
              <Card
                key={auth.id}
                size="small"
                className="border border-orange-200"
                extra={
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveAuthMethod(auth.id)}
                  />
                }
              >
                <Space direction="vertical" className="w-full">
                  <Input
                    placeholder="Method (e.g., Single Sign-On, Multi-Factor Auth)"
                    value={auth.method}
                    onChange={(e) => handleUpdateAuthMethod(auth.id, { method: e.target.value })}
                  />
                  <Input
                    placeholder="Provider (e.g., Active Directory, Okta, Duo)"
                    value={auth.provider}
                    onChange={(e) => handleUpdateAuthMethod(auth.id, { provider: e.target.value })}
                  />
                  <Input.TextArea
                    rows={2}
                    placeholder="Details (e.g., SAML 2.0 integration)"
                    value={auth.details}
                    onChange={(e) => handleUpdateAuthMethod(auth.id, { details: e.target.value })}
                  />
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      {/* Security Controls */}
      <Card
        title="Security Controls by Layer"
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSecurityControl}>
            Add Layer
          </Button>
        }
      >
        {securityControls.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No security controls defined.</div>
        ) : (
          <Space direction="vertical" className="w-full" size="small">
            {securityControls.map((control) => (
              <Card
                key={control.id}
                size="small"
                className="border border-red-200"
                extra={
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveSecurityControl(control.id)}
                  />
                }
              >
                <Space direction="vertical" className="w-full">
                  <Input
                    placeholder="Layer (e.g., Perimeter Security, Application Security)"
                    value={control.layer}
                    onChange={(e) => handleUpdateSecurityControl(control.id, { layer: e.target.value })}
                  />
                  <Input.TextArea
                    rows={3}
                    placeholder={`Controls (one per line):\n• Firewall\n• IPS/IDS\n• DDoS Protection`}
                    value={control.controls.join('\n')}
                    onChange={(e) =>
                      handleUpdateSecurityControl(control.id, {
                        controls: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                  />
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      {/* Compliance */}
      <Card title="Compliance & Standards" size="small">
        <Space direction="vertical" className="w-full">
          <Input.TextArea
            rows={2}
            placeholder={`Compliance Standards (one per line):\nISO 27001\nPDPA (Malaysia)\nSOC 2`}
            value={compliance.standards.join('\n')}
            onChange={(e) =>
              updateData({
                compliance: { ...compliance, standards: e.target.value.split('\n').filter(Boolean) },
              })
            }
          />
          <Input.TextArea
            rows={2}
            placeholder="Additional compliance notes..."
            value={compliance.notes}
            onChange={(e) => updateData({ compliance: { ...compliance, notes: e.target.value } })}
          />
        </Space>
      </Card>
    </div>
  );
}
