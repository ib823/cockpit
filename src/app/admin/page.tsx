'use client';

/**
 * ADMIN DASHBOARD - VIBE DESIGN SYSTEM VERSION
 *
 * Professional Monday.com-style admin interface
 * Migrated from custom Tailwind to Vibe for consistency
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  TextField,
  Heading,
  Box,
  Flex,
  Chips,
  Modal,
  ModalContent,
  Loader,
  IconButton,
  Divider,
} from 'monday-ui-react-core';
import {
  Home,
  LogOut,
  Delete,
  Add,
  Check,
  Alert,
  Team,
} from 'monday-ui-react-core/icons';
import 'monday-ui-react-core/dist/main.css';
import '../../styles/vibe-theme.css';
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

export default function AdminPageVibe() {
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
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  // Auto-hide notifications
  useEffect(() => {
    if (success || error) {
      setShowToast(true);
      setToastType(success ? 'success' : 'error');
      setToastMessage(success || error);

      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [success, error]);

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
      return <Chips label="Active" readOnly color={Chips.colors.POSITIVE} />;
    }
    if (user.status === 'expired') {
      return <Chips label="Expired" readOnly color={Chips.colors.NEGATIVE} />;
    }
    return <Chips label="Pending" readOnly />;
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F6F7FB 0%, #E6F0FF 100%)' }}>
      {/* Professional Toast Notifications */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          animation: 'slideDown 0.4s ease-out',
        }}>
          <Box
            padding={Box.paddings.MEDIUM}
            rounded={Box.roundeds.MEDIUM}
            style={{
              background: toastType === 'error' ? '#FFF4E5' : '#E6F7F1',
              border: `1px solid ${toastType === 'error' ? '#FDAB3D' : '#00C875'}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minWidth: '300px',
            }}
          >
            <Flex align={Flex.align.CENTER} gap={Flex.gaps.SMALL}>
              {toastType === 'error' ? (
                <Alert style={{ color: '#FDAB3D' }} />
              ) : (
                <Check style={{ color: '#00C875' }} />
              )}
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                color: toastType === 'error' ? '#9B5C00' : '#007A48',
              }}>
                {toastMessage}
              </span>
            </Flex>
          </Box>
        </div>
      )}

      {/* Header */}
      <Box
        padding={Box.paddings.LARGE}
        style={{
          background: 'white',
          borderBottom: '1px solid var(--vibe-ui-border-color-light)',
          marginBottom: '24px',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Flex justify={Flex.justify.SPACE_BETWEEN} align={Flex.align.CENTER}>
            <div>
              <Heading type={Heading.types.h1} value="SAP Cockpit" style={{ margin: 0 }} />
              <p style={{ fontSize: '14px', color: '#676879', marginTop: '4px' }}>Admin Dashboard</p>
            </div>

            <Flex gap={Flex.gaps.MEDIUM} align={Flex.align.CENTER}>
              {currentUser && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#323338', margin: 0 }}>
                    {currentUser.name || 'Admin'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#676879', margin: 0 }}>
                    {currentUser.email}
                  </p>
                </div>
              )}

              <Button
                onClick={() => router.push('/')}
                kind={Button.kinds.TERTIARY}
                size={Button.sizes.MEDIUM}
                leftIcon={Home}
              >
                Go to App
              </Button>

              <Button
                onClick={() => setShowLogoutModal(true)}
                disabled={loggingOut}
                kind={Button.kinds.PRIMARY}
                size={Button.sizes.MEDIUM}
                leftIcon={LogOut}
              >
                {loggingOut ? 'Logging out...' : 'LogOut'}
              </Button>
            </Flex>
          </Flex>
        </div>
      </Box>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 24px' }}>
        {/* Approve User Form */}
        <Box
          padding={Box.paddings.LARGE}
          rounded={Box.roundeds.MEDIUM}
          style={{
            background: 'white',
            marginBottom: '24px',
            boxShadow: 'var(--vibe-shadow-medium)',
          }}
        >
          <Heading type={Heading.types.h3} value="Approve User" style={{ marginBottom: '16px' }} />

          <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.MEDIUM}>
            <Flex gap={Flex.gaps.MEDIUM}>
              <div style={{ flex: 1 }}>
                <TextField
                  value={name}
                  onChange={setName}
                  onKeyDown={(e: any) => e.key === 'Enter' && createAccess()}
                  placeholder="Full Name"
                  size="large"
                />
              </div>
              <div style={{ flex: 1 }}>
                <TextField
                  value={email}
                  onChange={setEmail}
                  onKeyDown={(e: any) => e.key === 'Enter' && createAccess()}
                  placeholder="user@company.com"
                  size="large"
                  validation={error ? { status: 'error', text: error } : undefined}
                />
              </div>
            </Flex>

            <Button
              onClick={createAccess}
              disabled={sending || !email}
              kind={Button.kinds.PRIMARY}
              size={Button.sizes.LARGE}
              style={{ width: '100%' }}
            >
              {sending ? 'Approving...' : 'Approve User'}
            </Button>
          </Flex>
        </Box>

        {/* Stats Cards */}
        <Flex gap={Flex.gaps.MEDIUM} style={{ marginBottom: '24px' }}>
          <Box
            padding={Box.paddings.MEDIUM}
            rounded={Box.roundeds.MEDIUM}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #00C875 0%, #00A95F 100%)',
              color: 'white',
              boxShadow: 'var(--vibe-shadow-medium)',
            }}
          >
            <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.XS}>
              <div style={{ opacity: 0.9, fontSize: '12px' }}>Active Users</div>
              <div style={{ fontSize: '32px', fontWeight: 700 }}>
                {users.filter(u => u.status === 'active').length}
              </div>
            </Flex>
          </Box>

          <Box
            padding={Box.paddings.MEDIUM}
            rounded={Box.roundeds.MEDIUM}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #FDAB3D 0%, #F59E0B 100%)',
              color: 'white',
              boxShadow: 'var(--vibe-shadow-medium)',
            }}
          >
            <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.XS}>
              <div style={{ opacity: 0.9, fontSize: '12px' }}>Pending</div>
              <div style={{ fontSize: '32px', fontWeight: 700 }}>
                {users.filter(u => u.status === 'pending').length}
              </div>
            </Flex>
          </Box>

          <Box
            padding={Box.paddings.MEDIUM}
            rounded={Box.roundeds.MEDIUM}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #0073EA 0%, #6161FF 100%)',
              color: 'white',
              boxShadow: 'var(--vibe-shadow-medium)',
            }}
          >
            <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.XS}>
              <div style={{ opacity: 0.9, fontSize: '12px' }}>Timelines Generated</div>
              <div style={{ fontSize: '32px', fontWeight: 700 }}>
                {users.reduce((sum, u) => sum + (u.timelinesGenerated || 0), 0)}
              </div>
            </Flex>
          </Box>
        </Flex>

        {/* Users Table */}
        <Box
          padding={Box.paddings.LARGE}
          rounded={Box.roundeds.MEDIUM}
          style={{
            background: 'white',
            boxShadow: 'var(--vibe-shadow-medium)',
          }}
        >
          <Heading type={Heading.types.h3} value="Users" style={{ marginBottom: '16px' }} />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader size={Loader.sizes.LARGE} />
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#676879' }}>
              <Team style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }} />
              <p>No users yet. Approve one above to get started.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#F6F7FB', borderBottom: '1px solid var(--vibe-ui-border-color-light)' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#676879', textTransform: 'uppercase' }}>
                      User
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#676879', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#676879', textTransform: 'uppercase' }}>
                      First Login
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#676879', textTransform: 'uppercase' }}>
                      Last Active
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#676879', textTransform: 'uppercase' }}>
                      Timelines
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#676879', textTransform: 'uppercase' }}>
                      Access Expires
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#676879', textTransform: 'uppercase' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody style={{ borderBottom: '1px solid var(--vibe-ui-border-color-light)' }}>
                  {users.map((user, idx) => (
                    <tr key={user.id} style={{ borderBottom: idx < users.length - 1 ? '1px solid var(--vibe-ui-border-color-light)' : 'none' }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          {user.name && (
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#323338', margin: 0 }}>
                              {user.name}
                            </p>
                          )}
                          <p style={{ fontSize: '14px', color: '#676879', margin: 0 }}>
                            {user.email}
                          </p>
                          {user.exception && (
                            <div style={{ marginTop: '4px' }}>
                              <Chips label="No Expiry" readOnly color={Chips.colors.PRIMARY} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {getStatusBadge(user)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#323338' }}>
                          {user.firstLoginAt ? formatDate(user.firstLoginAt) : '—'}
                        </div>
                        {user.firstLoginAt && (
                          <div style={{ fontSize: '12px', color: '#676879' }}>
                            {formatRelative(user.firstLoginAt)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#323338' }}>
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
                        </div>
                        {user.lastLoginAt && (
                          <div style={{ fontSize: '12px', color: '#676879' }}>
                            {formatRelative(user.lastLoginAt)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#323338' }}>
                          {user.timelinesGenerated || 0}
                        </div>
                        {user.lastTimelineAt && (
                          <div style={{ fontSize: '12px', color: '#676879' }}>
                            Last: {formatRelative(user.lastTimelineAt)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {user.exception ? (
                          <span style={{ fontSize: '14px', color: '#676879' }}>Never</span>
                        ) : (
                          <div>
                            <div style={{ fontSize: '14px', color: '#323338' }}>
                              {formatDate(user.accessExpiresAt)}
                            </div>
                            {new Date(user.accessExpiresAt) > new Date() && (
                              <div style={{ fontSize: '12px', color: '#676879' }}>
                                {Math.ceil((new Date(user.accessExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <Flex gap={Flex.gaps.SMALL} justify={Flex.justify.END}>
                          {/* Toggle Exception */}
                          <button
                            onClick={() => toggleException(user.id, user.exception)}
                            title={user.exception ? 'Disable exception (re-enable expiry)' : 'Enable exception (never expires)'}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: user.exception ? 'rgba(0, 115, 234, 0.1)' : '#F6F7FB',
                              color: user.exception ? '#0073EA' : '#676879',
                              cursor: 'pointer',
                              fontSize: '18px',
                              fontWeight: 700,
                              transition: 'all 0.2s',
                            }}
                          >
                            ∞
                          </button>

                          {/* Extend Access */}
                          <IconButton
                            icon={Add}
                            kind={IconButton.kinds.TERTIARY}
                            ariaLabel="Extend access by 7 days"
                            onClick={() => extendAccess(user.id, user.email)}
                          />

                          {/* Delete User */}
                          <IconButton
                            icon={Delete}
                            kind={IconButton.kinds.TERTIARY}
                            ariaLabel="Delete user"
                            onClick={() => deleteUser(user.id, user.email)}
                          />
                        </Flex>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Box>
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
      <Modal
        show={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout"
        width="medium"
      >
        <ModalContent>
          <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.LARGE} style={{ textAlign: 'center' }}>
            <div>
              <LogOut style={{ fontSize: '48px', color: '#FDAB3D', marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', color: '#323338', margin: 0 }}>
                Are you sure you want to logout{currentUser?.name ? `, ${currentUser.name}` : ''}?
              </p>
            </div>

            <Flex gap={Flex.gaps.SMALL} justify={Flex.justify.CENTER}>
              <Button
                kind={Button.kinds.TERTIARY}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>
              <Button
                kind={Button.kinds.PRIMARY}
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </Flex>
          </Flex>
        </ModalContent>
      </Modal>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
