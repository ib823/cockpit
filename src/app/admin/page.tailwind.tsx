'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AccessCodeModal from '@/components/admin/AccessCodeModal';

interface User {
  id: string;
  email: string;
  name: string | null;
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
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [generatedMagicUrl, setGeneratedMagicUrl] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string | null } | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.ok && data.user) {
        setCurrentUser({ email: data.user.email, name: data.user.name });
      }
    } catch (e) {
      console.error('Failed to fetch current user', e);
    }
  }

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

  async function handleLogout() {
    setLoggingOut(true);
    setShowLogoutModal(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error('Logout failed', e);
      setLoggingOut(false);
    }
  }

  async function createAccess() {
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setError('This email is already in the system');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/approve-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (data.ok) {
        // Show modal with magic link and code
        setGeneratedCode(data.code);
        setGeneratedEmail(data.email);
        setGeneratedMagicUrl(data.magicUrl || '');
        setModalOpen(true);
        setEmail('');
        setName('');
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
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @keyframes subtle-pulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
        .subtle-pulse {
          animation: subtle-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle ambient background - matches login theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl subtle-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl subtle-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header - Minimal and clean */}
      <div className="relative bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">Cockpit</h1>
              <p className="text-sm text-slate-600 mt-1">Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Current User Info */}
              {currentUser && (
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {currentUser.name || 'Admin'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {currentUser.email}
                  </p>
                </div>
              )}

              {/* Go to App */}
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to App
              </button>

              {/* Logout */}
              <button
                onClick={() => setShowLogoutModal(true)}
                disabled={loggingOut}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {loggingOut ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Create Access Card - Minimal design */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Approve User</h2>

          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createAccess()}
                placeholder="Full Name"
                className="flex-1 px-4 py-3 border-b-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors bg-transparent"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createAccess()}
                placeholder="user@company.com"
                className="flex-1 px-4 py-3 border-b-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors bg-transparent"
              />
            </div>
            <button
              onClick={createAccess}
              disabled={sending || !email}
              className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {sending ? 'Approving...' : 'Approve User'}
            </button>
          </div>

          {success && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-green-900 font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-red-900 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Stats Cards - Visual icons */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-light text-slate-900">
                  {users.filter(u => u.status === 'active').length}
                </p>
                <p className="text-sm text-slate-600">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-light text-slate-900">
                  {users.filter(u => u.status === 'pending').length}
                </p>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-light text-slate-900">
                  {users.reduce((sum, u) => sum + (u.timelinesGenerated || 0), 0)}
                </p>
                <p className="text-sm text-slate-600">Timelines</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">Users</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No users yet. Approve one above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-slate-200">
                {users.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-slate-50/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {user.name && (
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        )}
                        <p className={`text-sm ${user.name ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                          {user.email}
                        </p>
                      </div>
                      {getStatusBadge(user)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">First Login</p>
                        <p className="text-slate-900">{user.firstLoginAt ? formatRelative(user.firstLoginAt) : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Last Active</p>
                        <p className="text-slate-900">{user.lastLoginAt ? formatRelative(user.lastLoginAt) : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Timelines</p>
                        <p className="font-medium text-slate-900">{user.timelinesGenerated || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Access Expires</p>
                        <p className="text-slate-900">
                          {user.exception ? 'Never' : (
                            new Date(user.accessExpiresAt) > new Date()
                              ? `${Math.ceil((new Date(user.accessExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d`
                              : 'Expired'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleException(user.id, user.exception)}
                        className={`flex-1 min-h-[44px] p-2 rounded-lg transition-colors ${
                          user.exception
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-lg font-bold">∞</span>
                      </button>
                      <button
                        onClick={() => extendAccess(user.id, user.email)}
                        className="flex-1 min-h-[44px] p-2 bg-green-50 text-green-600 rounded-lg"
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteUser(user.id, user.email)}
                        className="flex-1 min-h-[44px] p-2 bg-red-50 text-red-600 rounded-lg"
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <table className="w-full hidden md:table">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      User
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
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          {user.name && (
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          )}
                          <p className={`text-sm ${user.name ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                            {user.email}
                          </p>
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
                            className={`min-h-[44px] min-w-[44px] p-2 rounded-lg transition-colors ${
                              user.exception
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                          >
                            <span className="text-lg font-bold">∞</span>
                          </button>

                          {/* Extend Access */}
                          <button
                            onClick={() => extendAccess(user.id, user.email)}
                            title="Extend access by 7 days"
                            className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => deleteUser(user.id, user.email)}
                            title="Delete user"
                            className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>

      {/* Access Code Modal */}
      <AccessCodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        email={generatedEmail}
        code={generatedCode}
        magicUrl={generatedMagicUrl}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-200">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Logout
              </h3>

              {/* Personalized Message */}
              <p className="text-slate-600 mb-6">
                Are you sure you want to logout{currentUser?.name ? `, ${currentUser.name}` : ''}?
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
