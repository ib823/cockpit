'use client';

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import SecurityEducationModal from '@/components/login/SecurityEducationModal';
import { subscribeToPushNotifications, sendPushSubscriptionToServer } from '@/lib/push-notifications';

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'email' | 'code' | 'waiting' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [shake, setShake] = useState(false);
  const [showSymbolState, setShowSymbolState] = useState(false);
  const [symbolType, setSymbolType] = useState<'warning' | 'success'>('warning');
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Handle magic link login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      handleMagicLinkLogin(token);
    }
  }, []);

  const showSymbol = (type: 'warning' | 'success') => {
    setSymbolType(type);
    setShowSymbolState(true);

    // Vibrate if supported
    if ('vibrate' in navigator) {
      if (type === 'warning') {
        navigator.vibrate([100, 50, 100]); // Double vibrate for error
      } else {
        navigator.vibrate(200); // Single smooth vibrate for success
      }
    }

    // Auto-hide after 3.5 seconds
    setTimeout(() => {
      setShowSymbolState(false);
    }, 3500);
  };

  async function handleMagicLinkLogin(token: string) {
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
        setStage('done');
        const name = data.user?.name;
        setMessage(name ? `Welcome back, ${name}!` : 'Welcome back!');
        // Clear token from URL
        window.history.replaceState({}, document.title, '/login');
        setTimeout(() => router.push('/'), 2000);
      } else {
        setStage('email');
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      console.error('Magic link login error:', err);
      setStage('email');
      showSymbol('warning');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  async function handleContinue() {
    if (!email) return;
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
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000); // Clear error after 5s
        return;
      }

      if (!data.pendingPasskey) {
        // No passkey found - this is a new user needing registration
        setIsAdmin(false);
        setIsNewUser(true);

        // Show security education modal for new users
        // Only show if browser supports notifications and not in incognito
        if ('Notification' in window && 'indexedDB' in window) {
          setShowSecurityModal(true);
          return;
        }

        // If no notification support, go straight to code
        setStage('code');
        setMessage('');
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
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      if (result.ok) {
        setStage('done');
        const name = result.user?.name;
        setMessage(name ? `Welcome back, ${name}!` : 'Welcome back!');
        showSymbol('success');
        setTimeout(() => router.push('/'), 2000);
      } else {
        // If challenge expired, automatically restart the login flow
        if (result.challengeExpired) {
          setStage('email');
          setErrorMessage('Session expired. Starting over...');
          showSymbol('warning');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setTimeout(() => {
            setErrorMessage('');
            // Auto-restart the login process
            handleContinue();
          }, 1500);
        } else {
          setStage('email');
          setErrorMessage(result.message || 'Authentication failed');
          showSymbol('warning');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setTimeout(() => setErrorMessage(''), 5000);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.name === 'NotAllowedError') {
        // User cancelled the passkey prompt - go back to email
        setStage('email');
        setErrorMessage('Passkey authentication cancelled');
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
      } else if (err.name === 'AbortError') {
        // Passkey authentication was aborted - go back to email
        setStage('email');
        setErrorMessage('Passkey authentication aborted');
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
      } else {
        // Other errors - show code page
        setStage('code');
        setErrorMessage(err.message || 'Authentication error');
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    }
  }

  async function handleRegister() {
    if (!email || code.length !== 6) return;
    setStage('waiting');
    setMessage('');

    try {
      // Admin login (no passkey)
      if (isAdmin) {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code }),
        });

        const result = await res.json();

        if (result.ok) {
          setStage('done');
          setMessage('Welcome, Admin!');
          showSymbol('success');
          setTimeout(() => router.push('/admin'), 2000);
        } else {
          setStage('code');
          setErrorMessage(result.message || 'Invalid code');
          showSymbol('warning');
          setShake(true);
          setTimeout(() => setShake(false), 500);
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
        setErrorMessage(data.message || 'Invalid code');
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
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
        showSymbol('success');
        setTimeout(() => router.push('/'), 2000);
      } else {
        // If challenge expired, automatically retry registration
        if (result.challengeExpired) {
          setStage('code');
          setErrorMessage('Session expired. Please verify your code again.');
          showSymbol('warning');
          setShake(true);
          setTimeout(() => setShake(false), 500);
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
          showSymbol('warning');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setTimeout(() => setErrorMessage(''), 5000);
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setStage('code');

      // Show helpful error message for passkey issues
      if (err.name === 'SecurityError' || err.message?.includes('invalid domain')) {
        setErrorMessage('Passkey registration requires localhost or HTTPS. Please access via localhost instead of 127.0.0.1');
      } else if (err.name === 'NotAllowedError') {
        setErrorMessage('Passkey registration was cancelled');
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }

      showSymbol('warning');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }
        .slide-up {
          animation: slide-up 0.4s ease-in forwards;
        }
        .shake {
          animation: shake 0.5s;
        }
      `}</style>

      {/* Top Banner - Error/Invalid - Floats from top to 1/3 of page */}
      {showSymbolState && symbolType === 'warning' && errorMessage && (
        <div className={`fixed inset-x-0 z-50 pointer-events-none flex justify-center ${showSymbolState ? 'slide-down' : 'slide-up'}`}
             style={{ top: '0', maxHeight: '33.333vh' }}>
          <div className="mt-6 mx-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-amber-200/50 py-4 px-6 pointer-events-auto max-w-md text-center"
               style={{
                 boxShadow: '0 10px 40px -10px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.1)'
               }}>
            <p className="text-sm text-amber-900 font-medium tracking-tight">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Top Banner - Verified - Floats from top to 1/3 of page */}
      {showSymbolState && symbolType === 'success' && (
        <div className={`fixed inset-x-0 z-50 pointer-events-none flex justify-center ${showSymbolState ? 'slide-down' : 'slide-up'}`}
             style={{ top: '0', maxHeight: '33.333vh' }}>
          <div className="mt-6 mx-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-emerald-200/50 py-3.5 px-5 pointer-events-auto"
               style={{
                 boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)'
               }}>
            <p className="text-sm text-emerald-900 font-medium tracking-tight text-center">Verified</p>
          </div>
        </div>
      )}

      <div className={`w-full max-w-sm px-6 ${shake ? 'shake' : ''}`}>
        {/* Minimal Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Cockpit
          </h1>
        </div>

        {/* Login Container - Morphs between states */}
        <div className={`
          relative transition-all duration-1000 ease-out
          ${stage === 'done' ? 'liquid-morph' : ''}
        `}>
          {/* Email Stage */}
          {stage === 'email' && (
            <div className="space-y-6">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(''); // Clear error when typing
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                placeholder="Email"
                autoFocus
                className="w-full px-4 py-3 text-base border-b-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors bg-transparent placeholder:text-slate-400"
              />

              <button
                onClick={handleContinue}
                disabled={!email}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Code Stage */}
          {stage === 'code' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-600 mb-4 text-center">
                  {isAdmin ? 'Enter your admin code' : 'Enter the code from your admin'}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleRegister()}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-b-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors bg-transparent"
                />
              </div>
              <button
                onClick={handleRegister}
                disabled={code.length !== 6}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Verify
              </button>
              <button
                onClick={() => {
                  setStage('email');
                  setCode('');
                  setMessage('');
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {/* Waiting Stage */}
          {stage === 'waiting' && (
            <div className="text-center py-8">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            </div>
          )}

          {/* Success Stage */}
          {stage === 'done' && (
            <div className="text-center py-8">
              <p className="text-xl text-slate-900 font-medium">{message}</p>
            </div>
          )}

          {/* Push notifications handled during login flow - no separate toggle needed */}
        </div>
      </div>

      {/* Security Education Modal - Auto-shown for new users */}
      <SecurityEducationModal
        isOpen={showSecurityModal}
        onClose={() => {
          setShowSecurityModal(false);
          setStage('code'); // Proceed to code entry without notification
        }}
        onAccept={async () => {
          setShowSecurityModal(false);

          // Subscribe to push notifications after user acknowledges
          if ('Notification' in window) {
            try {
              const subscription = await subscribeToPushNotifications();
              if (subscription) {
                // Save subscription to server with email
                await sendPushSubscriptionToServer(subscription, email);
                console.log('Push notification subscription saved');
              }
            } catch (err) {
              console.error('Push notification subscription error:', err);
            }
          }

          setStage('code'); // Proceed to code entry
        }}
      />
    </div>
  );
}
