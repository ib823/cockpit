'use client';

/**
 * LOGIN PAGE - VIBE DESIGN SYSTEM VERSION
 *
 * Professional Monday.com-style login with WebAuthn passkey support
 * Migrated from custom Tailwind to Vibe for consistency
 */

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button, TextField, Loader, Box, Flex, Heading } from 'monday-ui-react-core';
import { Email, Check, Alert } from 'monday-ui-react-core/icons';
import 'monday-ui-react-core/dist/main.css';
import '../../styles/vibe-theme.css';

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  };
}

export default function LoginPageVibe() {
  const router = useRouter();
  const [stage, setStage] = useState<'email' | 'code' | 'waiting' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [shake, setShake] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

  // Handle magic link login on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    const retryAfter = params.get('retry_after');

    if (error === 'rate_limit') {
      const minutes = Math.ceil(parseInt(retryAfter || '60') / 60);
      setErrorMessage(`Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
      showNotification('error', `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
    } else if (token) {
      handleMagicLinkLogin(token);
    }
  }, []);

  // Toast notification handler
  const showNotification = (type: 'success' | 'error', msg: string) => {
    setToastType(type);
    if (type === 'error') {
      setErrorMessage(msg);
    } else {
      setMessage(msg);
    }
    setShowToast(true);

    // Auto-hide
    setTimeout(() => {
      setShowToast(false);
    }, 3500);

    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'error' ? [100, 50, 100] : [200]);
    }
  };

  async function handleMagicLinkLogin(token: string) {
    if (isAuthInProgress) return;
    setIsAuthInProgress(true);
    setStage('waiting');
    setMessage('');

    try {
      const res = await fetch('/api/auth/magic-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          deviceInfo: JSON.stringify(getDeviceInfo()),
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // Clear token from URL
        window.history.replaceState({}, document.title, '/login');

        // Case 1: User needs to register passkey (first time)
        if (data.requiresPasskeyRegistration) {
          setEmail(data.email);
          setUserName(data.name || '');
          setStage('waiting');

          try {
            // Trigger passkey registration
            const attestation = await startRegistration(data.options);

            const finishRes = await fetch('/api/auth/finish-register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: data.email, response: attestation }),
            });

            const result = await finishRes.json();

            if (result.ok) {
              setStage('done');
              setMessage(`Welcome, ${data.name || ''}!`);
              showNotification('success', `Welcome, ${data.name || ''}!`);
              setIsAuthInProgress(false);
              setTimeout(() => router.push('/'), 2000);
            } else {
              setStage('email');
              setErrorMessage(result.message || 'Passkey registration failed');
              showNotification('error', result.message || 'Passkey registration failed');
              setIsAuthInProgress(false);
            }
          } catch (err: any) {
            console.error('Passkey registration error:', err);
            const isTimeout = err.name === 'NotAllowedError' && (err.message?.includes('timeout') || err.message?.includes('timed out'));
            setStage('email');
            setErrorMessage(isTimeout ? 'Passkey registration timed out' : 'Passkey registration cancelled or failed');
            showNotification('error', isTimeout ? 'Passkey registration timed out' : 'Passkey registration cancelled or failed');
            setIsAuthInProgress(false);
          }
          return;
        }

        // Case 2: User has passkey - trigger passkey authentication
        if (data.requiresPasskeyAuth) {
          setEmail(data.email);
          setUserName(data.name || '');
          setStage('waiting');

          try {
            // Trigger passkey authentication
            const credential = await startAuthentication({ optionsJSON: data.options });

            const finishRes = await fetch('/api/auth/finish-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: data.email, response: credential }),
            });

            const result = await finishRes.json();

            if (result.ok) {
              setStage('done');
              setMessage(`Welcome back${data.name ? `, ${data.name}` : ''}!`);
              showNotification('success', `Welcome back${data.name ? `, ${data.name}` : ''}!`);
              setIsAuthInProgress(false);
              setTimeout(() => router.push('/'), 2000);
            } else {
              setStage('email');
              setErrorMessage(result.message || 'Authentication failed');
              showNotification('error', result.message || 'Authentication failed');
              setIsAuthInProgress(false);
            }
          } catch (err: any) {
            console.error('Passkey authentication error:', err);
            const isTimeout = err.name === 'NotAllowedError' && (err.message?.includes('timeout') || err.message?.includes('timed out'));
            setStage('email');
            setErrorMessage(isTimeout ? 'Passkey timed out' : 'Passkey authentication cancelled or failed');
            showNotification('error', isTimeout ? 'Passkey timed out' : 'Passkey authentication cancelled or failed');
            setIsAuthInProgress(false);
          }
          return;
        }

        // Fallback: Should not reach here with new logic
        setStage('email');
        setErrorMessage('Please enter your email to continue');
        setIsAuthInProgress(false);
      } else {
        setStage('email');
        setErrorMessage(data.error || 'Invalid or expired link');
        showNotification('error', data.error || 'Invalid or expired link');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setIsAuthInProgress(false);
      }
    } catch (err) {
      console.error('Magic link login error:', err);
      setStage('email');
      setErrorMessage('Magic link authentication failed');
      showNotification('error', 'Magic link authentication failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setIsAuthInProgress(false);
    }
  }

  async function handleContinue() {
    if (!email || isAuthInProgress) return;
    setIsAuthInProgress(true);
    setStage('waiting');
    setMessage('');

    try {
      // Check if admin email
      const checkRes = await fetch('/api/auth/check-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();

      if (checkData.isAdmin) {
        // Admin: show code input (no passkey needed)
        setIsAdmin(true);
        setStage('code');
        setMessage('');
        setIsAuthInProgress(false);
        return;
      }

      // Regular user: try passkey login
      const res = await fetch('/api/auth/begin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      // Handle error responses
      if (!res.ok || !data?.ok) {
        setStage('email');
        setMessage('');
        setErrorMessage(data?.message || 'Login failed. Please try again.');
        showNotification('error', data?.message || 'Login failed. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000); // Clear error after 5s
        setIsAuthInProgress(false);
        return;
      }

      if (!data.pendingPasskey) {
        // No passkey found - this is a new user needing registration
        setIsAdmin(false);
        setStage('code');
        setMessage('');
        setIsAuthInProgress(false);
        return;
      }

      // Trigger passkey authentication
      const credential = await startAuthentication({ optionsJSON: data.options });

      const finishRes = await fetch('/api/auth/finish-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, response: credential }),
      });

      let result;
      try {
        result = await finishRes.json();
      } catch (e) {
        console.error('Failed to parse finish-login response:', e);
        setStage('email');
        setErrorMessage('Login failed. Please try again.');
        showNotification('error', 'Login failed. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
        setIsAuthInProgress(false);
        return;
      }

      if (result.ok) {
        setStage('done');
        const name = result.user?.name;
        setMessage(`Welcome back${name ? `, ${name}` : ''}`);
        showNotification('success', `Welcome back${name ? `, ${name}` : ''}`);
        setIsAuthInProgress(false);
        setTimeout(() => router.push('/'), 2000);
      } else {
        // If challenge expired, automatically restart the login flow
        if (result.challengeExpired) {
          setStage('email');
          setErrorMessage('Session expired');
          showNotification('error', 'Session expired');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setIsAuthInProgress(false);
          setTimeout(() => {
            setErrorMessage('');
            // Auto-restart the login process
            handleContinue();
          }, 1500);
        } else {
          setStage('email');
          setErrorMessage(result.message || 'Authentication failed');
          showNotification('error', result.message || 'Authentication failed');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setTimeout(() => setErrorMessage(''), 5000);
          setIsAuthInProgress(false);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setIsAuthInProgress(false);

      // Handle WebAuthn-specific errors
      if (err.name === 'NotAllowedError') {
        // Timeout or user cancelled - offer alternative
        const isTimeout = err.message?.includes('timeout') || err.message?.includes('timed out');
        setStage('code');
        setErrorMessage(isTimeout ? 'Passkey timed out - use code instead' : 'Passkey cancelled - use code instead');
        showNotification('error', isTimeout ? 'Passkey timed out - use code instead' : 'Passkey cancelled - use code instead');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
      } else if (err.name === 'AbortError') {
        // Passkey authentication was aborted
        setStage('code');
        setErrorMessage('Passkey unavailable - use code instead');
        showNotification('error', 'Passkey unavailable - use code instead');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
      } else {
        // Other errors - show code page as fallback
        setStage('code');
        setErrorMessage(err.message || 'Passkey error - use code instead');
        showNotification('error', err.message || 'Passkey error - use code instead');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    }
  }

  async function handleRegister() {
    if (!email || code.length !== 6 || isAuthInProgress) return;
    setIsAuthInProgress(true);
    setStage('waiting');
    setMessage('');

    try {
      // Admin login (no passkey)
      if (isAdmin) {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code }),
          credentials: 'include', // CRITICAL: Required for cookies to be set/sent
        });

        const result = await res.json();

        if (result.ok) {
          setStage('done');
          setMessage('Welcome, Admin!');
          showNotification('success', 'Welcome, Admin!');
          setIsAuthInProgress(false);

          // Redirect immediately for better UX
          setTimeout(() => {
            window.location.href = '/admin';
          }, 1000);
        } else {
          setStage('code');
          setErrorMessage('Invalid');
          showNotification('error', 'Invalid');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setIsAuthInProgress(false);
        }
        return;
      }

      // Regular user registration (with passkey)
      const res = await fetch('/api/auth/begin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !data.options) {
        setStage('code');
        setErrorMessage('Invalid');
        showNotification('error', 'Invalid');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setIsAuthInProgress(false);
        return;
      }

      const attestation = await startRegistration(data.options);

      const finishRes = await fetch('/api/auth/finish-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, response: attestation }),
      });

      let result;
      try {
        result = await finishRes.json();
      } catch (e) {
        console.error('Failed to parse finish-register response:', e);
        throw new Error('Failed to parse server response');
      }

      if (result.ok) {
        setStage('done');
        const name = result.user?.name;
        setMessage(name ? `Welcome, ${name}!` : 'Welcome!');
        showNotification('success', name ? `Welcome, ${name}!` : 'Welcome!');
        setIsAuthInProgress(false);
        setTimeout(() => router.push('/'), 2000);
      } else {
        // If challenge expired, automatically retry registration
        if (result.challengeExpired) {
          setStage('code');
          setErrorMessage('Session expired');
          showNotification('error', 'Session expired');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setIsAuthInProgress(false);
          setTimeout(() => {
            setErrorMessage('');
            // Auto-retry with the same code
            if (code.length === 6) {
              handleRegister();
            }
          }, 1500);
        } else {
          setStage('code');
          setErrorMessage(result.message || 'Registration failed');
          showNotification('error', result.message || 'Registration failed');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setTimeout(() => setErrorMessage(''), 5000);
          setIsAuthInProgress(false);
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setStage('code');
      setIsAuthInProgress(false);

      // Show helpful error message for passkey issues
      if (err.name === 'SecurityError' || err.message?.includes('invalid domain')) {
        setErrorMessage('Passkey requires localhost or HTTPS');
        showNotification('error', 'Passkey requires localhost or HTTPS');
      } else if (err.name === 'NotAllowedError') {
        const isTimeout = err.message?.includes('timeout') || err.message?.includes('timed out');
        setErrorMessage(isTimeout ? 'Passkey registration timed out' : 'Passkey registration was cancelled');
        showNotification('error', isTimeout ? 'Passkey registration timed out' : 'Passkey registration was cancelled');
      } else if (err.name === 'AbortError') {
        setErrorMessage('Passkey registration was aborted');
        showNotification('error', 'Passkey registration was aborted');
      } else {
        setErrorMessage('Registration failed. Please try again.');
        showNotification('error', 'Registration failed. Please try again.');
      }

      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F6F7FB 0%, #E6F0FF 100%)',
      position: 'relative',
    }}>
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
                {toastType === 'error' ? errorMessage : message}
              </span>
            </Flex>
          </Box>
        </div>
      )}

      {/* Login Card */}
      <Box
        padding={Box.paddings.LARGE}
        rounded={Box.roundeds.MEDIUM}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'white',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          margin: '0 24px',
        }}
        className={shake ? 'shake' : ''}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'var(--vibe-gradient-primary)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Email style={{ color: 'white', fontSize: '24px' }} />
          </div>
          <Heading type={Heading.types.h2} value="SAP Cockpit" style={{ margin: 0, marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', color: '#676879', margin: 0 }}>
            {stage === 'email' && 'Enter your email to continue'}
            {stage === 'code' && (isAdmin ? 'Enter admin code' : 'Enter verification code')}
            {stage === 'waiting' && 'Authenticating...'}
            {stage === 'done' && 'Success!'}
          </p>
        </div>

        {/* Email Stage */}
        {stage === 'email' && (
          <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.MEDIUM}>
            <TextField
              value={email}
              onChange={setEmail}
              onKeyDown={(e: any) => e.key === 'Enter' && email.includes('@') && handleContinue()}
              placeholder="Enter your email"
              autoFocus
              size="large"
              validation={errorMessage ? { status: 'error', text: errorMessage } : undefined}
            />

            <Button
              onClick={handleContinue}
              disabled={!email.includes('@') || isAuthInProgress}
              kind={Button.kinds.PRIMARY}
              size={Button.sizes.LARGE}
              style={{ width: '100%' }}
            >
              Continue
            </Button>
          </Flex>
        )}

        {/* Code Stage */}
        {stage === 'code' && (
          <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.MEDIUM}>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleRegister()}
              placeholder="000000"
              maxLength={6}
              autoFocus
              style={{
                width: '100%',
                padding: '16px',
                textAlign: 'center',
                fontSize: '24px',
                fontFamily: 'monospace',
                letterSpacing: '0.2em',
                border: `2px solid ${code.length === 6 ? '#0073EA' : '#C3C6D4'}`,
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />

            <Button
              onClick={handleRegister}
              disabled={code.length !== 6 || isAuthInProgress}
              kind={Button.kinds.PRIMARY}
              size={Button.sizes.LARGE}
              style={{ width: '100%' }}
            >
              Verify
            </Button>

            <Button
              onClick={() => {
                setStage('email');
                setCode('');
                setMessage('');
                setIsAuthInProgress(false);
              }}
              kind={Button.kinds.TERTIARY}
              size={Button.sizes.MEDIUM}
              style={{ width: '100%' }}
            >
              Back to email
            </Button>
          </Flex>
        )}

        {/* Waiting Stage */}
        {stage === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader size={Loader.sizes.LARGE} />
            <p style={{ marginTop: '16px', color: '#676879', fontSize: '14px' }}>
              Please complete authentication...
            </p>
          </div>
        )}

        {/* Success Stage */}
        {stage === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--vibe-gradient-success)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Check style={{ color: 'white', fontSize: '32px' }} />
            </div>
            <Heading type={Heading.types.h3} value={message} style={{ margin: 0, color: '#323338' }} />
            <p style={{ marginTop: '8px', color: '#676879', fontSize: '14px' }}>
              Redirecting...
            </p>
          </div>
        )}
      </Box>

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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }

        .shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
