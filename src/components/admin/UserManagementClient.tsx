'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Switch, Button, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  createdAt: Date;
  accessExpiresAt: Date;
  exception: boolean;
}

interface UserFormValues {
  email: string;
  name?: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  accessExpiresAt: string;
  exception: boolean;
}

interface CodeResponse {
  code: string;
  email: string;
  userName: string | null;
  magicUrl: string;
  registrationUrl: string;
  codeExpiry: string;
  magicLinkExpiry: string;
}

export default function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
  const { message } = App.useApp();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<CodeResponse | null>(null);

  // Reload users from API
  const reloadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to reload users:', error);
    }
  };

  // Open modal for creating new user
  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'USER',
      exception: false,
      accessExpiresAt: dayjs().add(90, 'days').format('YYYY-MM-DD'),
    });
    setIsModalOpen(true);
  };

  // Open modal for editing user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      name: user.name,
      role: user.role,
      exception: user.exception,
      accessExpiresAt: dayjs(user.accessExpiresAt).format('YYYY-MM-DD'),
    });
    setIsModalOpen(true);
  };

  // Handle form submission (create or update)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingUser) {
        // Update existing user
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update user');
        }

        message.success('User updated successfully');
      } else {
        // Create new user
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create user');
        }

        message.success('User created successfully');
      }

      setIsModalOpen(false);
      form.resetFields();
      await reloadUsers();
    } catch (error: any) {
      message.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      message.success('User deleted successfully');
      await reloadUsers();
    } catch (error: any) {
      message.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle generating access code for user
  const handleGenerateCode = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/generate-code`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate code');
      }

      const data = await response.json();
      setGeneratedCode(data);
      setIsCodeModalOpen(true);
      message.success('Access code generated successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to generate access code');
    } finally {
      setLoading(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard`);
  };

  return (
    <div>
      {/* Header with Add User button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddUser}
          size="large"
        >
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
            <div className="mt-6">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
                Add User
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Expires
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const isExpired = user.accessExpiresAt && new Date(user.accessExpiresAt) <= new Date() && !user.exception;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.exception ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Permanent Access
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                        {dayjs(user.createdAt).format('MMM D, YYYY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                        {user.exception ? (
                          <span className="text-green-600 font-medium">Never</span>
                        ) : user.accessExpiresAt ? (
                          dayjs(user.accessExpiresAt).format('MMM D, YYYY')
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="text"
                            icon={<KeyOutlined />}
                            onClick={() => handleGenerateCode(user.id)}
                            title="Generate access code"
                          >
                            Code
                          </Button>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          >
                            Edit
                          </Button>
                          <Popconfirm
                            title="Delete user"
                            description="Are you sure you want to delete this user?"
                            onConfirm={() => handleDeleteUser(user.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              title="Delete user"
                            >
                              Delete
                            </Button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="user@example.com" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Select.Option value="USER">User</Select.Option>
              <Select.Option value="MANAGER">Manager</Select.Option>
              <Select.Option value="ADMIN">Admin</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="exception"
            label="Permanent Access"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.exception !== currentValues.exception}
          >
            {({ getFieldValue }) =>
              !getFieldValue('exception') && (
                <Form.Item
                  name="accessExpiresAt"
                  label="Access Expires At"
                  rules={[{ required: true, message: 'Please select expiration date' }]}
                >
                  <Input type="date" />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* Access Code Modal */}
      <Modal
        title="User Access Code"
        open={isCodeModalOpen}
        onCancel={() => {
          setIsCodeModalOpen(false);
          setGeneratedCode(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsCodeModalOpen(false);
              setGeneratedCode(null);
            }}
          >
            Close
          </Button>,
        ]}
        width={700}
      >
        {generatedCode && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                Share the following access code with <strong>{generatedCode.email}</strong>:
              </p>
            </div>

            {/* 6-Digit Code */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">6-Digit Access Code</label>
                <span className="text-xs text-gray-500">Valid for {generatedCode.codeExpiry}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedCode.code}
                  readOnly
                  className="font-mono text-2xl font-bold text-center tracking-wider"
                  style={{ fontSize: '24px', letterSpacing: '0.5em' }}
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(generatedCode.code, 'Access code')}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Magic Link */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Magic Link (Direct Login)</label>
                <span className="text-xs text-gray-500">Valid for {generatedCode.magicLinkExpiry}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input.TextArea
                  value={generatedCode.magicUrl}
                  readOnly
                  rows={2}
                  className="font-mono text-sm"
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(generatedCode.magicUrl, 'Magic link')}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Registration URL */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Registration Page</label>
              </div>
              <div className="flex items-center gap-2">
                <Input.TextArea
                  value={generatedCode.registrationUrl}
                  readOnly
                  rows={2}
                  className="font-mono text-sm"
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(generatedCode.registrationUrl, 'Registration URL')}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">📋 Instructions for User</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Send the user either the <strong>6-digit code</strong> OR the <strong>magic link</strong></li>
                <li>If using the code: User visits the registration page and enters their email and the 6-digit code</li>
                <li>If using magic link: User clicks the link for instant access (expires in {generatedCode.magicLinkExpiry})</li>
                <li>User will be prompted to set up passkey authentication for future logins</li>
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
