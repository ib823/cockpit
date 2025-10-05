'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  status: 'active' | 'pending' | 'expired';
  exception: boolean;
  accessExpiresAt: string;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  timelinesGenerated: number;
  lastTimelineAt: string | null;
  createdAt: string;
  hasPasskey: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  }

  async function createAccess() {
    if (!email) return;

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/approve-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.ok) {
        setSuccess(`✓ Email approved. Code will be sent when user tries to login.`);
        setEmail('');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to approve email');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSending(false);
    }
  }

  async function deleteUser(userId: string, userEmail: string) {
    if (!confirm(`Delete ${userEmail}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess(`User ${userEmail} deleted`);
        fetchUsers();
      } else {
        setError('Failed to delete user');
      }
    } catch (e) {
      setError('Network error');
    }
  }

  async function extendAccess(userId: string, userEmail: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/extend`, {
        method: 'POST',
      });

      if (res.ok) {
        setSuccess(`Access extended for ${userEmail}`);
        fetchUsers();
      } else {
        setError('Failed to extend access');
      }
    } catch (e) {
      setError('Network error');
    }
  }

  async function toggleException(userId: string, currentException: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/exception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exception: !currentException }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        setError('Failed to update exception');
      }
    } catch (e) {
      setError('Network error');
    }
  }

  function getStatusBadge(user: User) {
    if (user.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
          Active
        </span>
      );
    }
    if (user.status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-600"></span>
        Pending
      </span>
    );
  }

  function formatDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatRelative(date: string | null) {
    if (!date) return '—';
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">Manage user access and monitor activity</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
            >
              Back to app →
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Access Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Approve User</h2>
          <p className="text-sm text-slate-600 mb-4">Approve email address. User will receive access code when they first login.</p>

          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createAccess()}
              placeholder="user@company.com"
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <button
              onClick={createAccess}
              disabled={sending || !email}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium
                       hover:bg-slate-800 transition-colors disabled:opacity-30
                       disabled:cursor-not-allowed whitespace-nowrap"
            >
              {sending ? 'Approving...' : 'Approve Email'}
            </button>
          </div>

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Users</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No users yet. Add one above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      First Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Timelines
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Access Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.email}</p>
                          {user.exception && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              No Expiry
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {user.firstLoginAt ? formatDate(user.firstLoginAt) : '—'}
                        </div>
                        {user.firstLoginAt && (
                          <div className="text-xs text-slate-500">
                            {formatRelative(user.firstLoginAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
                        </div>
                        {user.lastLoginAt && (
                          <div className="text-xs text-slate-500">
                            {formatRelative(user.lastLoginAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {user.timelinesGenerated || 0}
                        </div>
                        {user.lastTimelineAt && (
                          <div className="text-xs text-slate-500">
                            Last: {formatRelative(user.lastTimelineAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.exception ? (
                          <span className="text-sm text-slate-500">Never</span>
                        ) : (
                          <div>
                            <div className="text-sm text-slate-900">
                              {formatDate(user.accessExpiresAt)}
                            </div>
                            {new Date(user.accessExpiresAt) > new Date() && (
                              <div className="text-xs text-slate-500">
                                {Math.ceil((new Date(user.accessExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Exception */}
                          <button
                            onClick={() => toggleException(user.id, user.exception)}
                            title={user.exception ? 'Disable exception (re-enable expiry)' : 'Enable exception (never expires)'}
                            className={`p-2 rounded-lg transition-colors ${
                              user.exception
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M infinity" />
                              <text x="12" y="16" fontSize="16" textAnchor="middle" fill="currentColor" fontWeight="bold">∞</text>
                            </svg>
                          </button>

                          {/* Extend Access */}
                          <button
                            onClick={() => extendAccess(user.id, user.email)}
                            title="Extend access by 7 days"
                            className="p-2 text-slate-400 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => deleteUser(user.id, user.email)}
                            title="Delete user"
                            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {users.filter(u => u.status === 'active').length}
                </p>
                <p className="text-sm text-slate-600">Active Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {users.filter(u => u.status === 'pending').length}
                </p>
                <p className="text-sm text-slate-600">Pending Setup</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {users.reduce((sum, u) => sum + (u.timelinesGenerated || 0), 0)}
                </p>
                <p className="text-sm text-slate-600">Total Timelines</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
