'use client';

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  };
}

// 12 high-contrast colors for the continue button
const BUTTON_COLORS = [
  { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'border-blue-600', focus: 'focus:border-blue-600' },
  { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', border: 'border-purple-600', focus: 'focus:border-purple-600' },
  { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', border: 'border-pink-600', focus: 'focus:border-pink-600' },
  { bg: 'bg-red-600', hover: 'hover:bg-red-700', border: 'border-red-600', focus: 'focus:border-red-600' },
  { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', border: 'border-orange-600', focus: 'focus:border-orange-600' },
  { bg: 'bg-amber-600', hover: 'hover:bg-amber-700', border: 'border-amber-600', focus: 'focus:border-amber-600' },
  { bg: 'bg-lime-600', hover: 'hover:bg-lime-700', border: 'border-lime-600', focus: 'focus:border-lime-600' },
  { bg: 'bg-green-600', hover: 'hover:bg-green-700', border: 'border-green-600', focus: 'focus:border-green-600' },
  { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', border: 'border-teal-600', focus: 'focus:border-teal-600' },
  { bg: 'bg-cyan-600', hover: 'hover:bg-cyan-700', border: 'border-cyan-600', focus: 'focus:border-cyan-600' },
  { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', border: 'border-indigo-600', focus: 'focus:border-indigo-600' },
  { bg: 'bg-violet-600', hover: 'hover:bg-violet-700', border: 'border-violet-600', focus: 'focus:border-violet-600' },
];

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
  const [colorIndex, setColorIndex] = useState(0);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

  // Handle magic link login and rate limit errors
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    const retryAfter = params.get('retry_after');

    if (error === 'rate_limit') {
      const minutes = Math.ceil(parseInt(retryAfter || '60') / 60);
      setErrorMessage(`Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
      showSymbol('warning');
    } else if (token) {
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
              showSymbol('success');
              setIsAuthInProgress(false);
              setTimeout(() => router.push('/'), 2000);
            } else {
              setStage('email');
              setErrorMessage(result.message || 'Passkey registration failed');
              showSymbol('warning');
              setIsAuthInProgress(false);
            }
          } catch (err: any) {
            console.error('Passkey registration error:', err);
            const isTimeout = err.name === 'NotAllowedError' && (err.message?.includes('timeout') || err.message?.includes('timed out'));
            setStage('email');
            setErrorMessage(isTimeout ? 'Passkey registration timed out' : 'Passkey registration cancelled or failed');
            showSymbol('warning');
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
              showSymbol('success');
              setIsAuthInProgress(false);
              setTimeout(() => router.push('/'), 2000);
            } else {
              setStage('email');
              setErrorMessage(result.message || 'Authentication failed');
              showSymbol('warning');
              setIsAuthInProgress(false);
            }
          } catch (err: any) {
            console.error('Passkey authentication error:', err);
            const isTimeout = err.name === 'NotAllowedError' && (err.message?.includes('timeout') || err.message?.includes('timed out'));
            setStage('email');
            setErrorMessage(isTimeout ? 'Passkey timed out' : 'Passkey authentication cancelled or failed');
            showSymbol('warning');
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
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setIsAuthInProgress(false);
      }
    } catch (err) {
      console.error('Magic link login error:', err);
      setStage('email');
      setErrorMessage('Magic link authentication failed');
      showSymbol('warning');
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
        showSymbol('warning');
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
        showSymbol('warning');
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
        showSymbol('success');
        setIsAuthInProgress(false);
        setTimeout(() => router.push('/'), 2000);
      } else {
        // If challenge expired, automatically restart the login flow
        if (result.challengeExpired) {
          setStage('email');
          setErrorMessage('Session expired');
          showSymbol('warning');
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
          showSymbol('warning');
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
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
      } else if (err.name === 'AbortError') {
        // Passkey authentication was aborted
        setStage('code');
        setErrorMessage('Passkey unavailable - use code instead');
        showSymbol('warning');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setErrorMessage(''), 5000);
      } else {
        // Other errors - show code page as fallback
        setStage('code');
        setErrorMessage(err.message || 'Passkey error - use code instead');
        showSymbol('warning');
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
          showSymbol('success');
          setIsAuthInProgress(false);

          // Redirect immediately for better UX
          setTimeout(() => {
            window.location.href = '/admin';
          }, 1000);
        } else {
          setStage('code');
          setErrorMessage('Invalid');
          showSymbol('warning');
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
        showSymbol('warning');
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
        showSymbol('success');
        setIsAuthInProgress(false);
        setTimeout(() => router.push('/'), 2000);
      } else {
        // If challenge expired, automatically retry registration
        if (result.challengeExpired) {
          setStage('code');
          setErrorMessage('Session expired');
          showSymbol('warning');
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
          showSymbol('warning');
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
      } else if (err.name === 'NotAllowedError') {
        const isTimeout = err.message?.includes('timeout') || err.message?.includes('timed out');
        setErrorMessage(isTimeout ? 'Passkey registration timed out' : 'Passkey registration was cancelled');
      } else if (err.name === 'AbortError') {
        setErrorMessage('Passkey registration was aborted');
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
            transform: translateY(-200%);
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
            transform: translateY(-200%);
            opacity: 0;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .slide-down {
          animation: slide-down 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .slide-up {
          animation: slide-up 0.4s ease-in forwards;
        }
        .shake {
          animation: shake 0.5s;
        }
      `}</style>

      {/* Top Banner - Error/Invalid - Slides down to 1/3 of page */}
      {showSymbolState && symbolType === 'warning' && errorMessage && (
        <div className={`fixed inset-x-0 z-50 pointer-events-none flex items-start justify-center ${showSymbolState ? 'slide-down' : 'slide-up'}`}
             style={{ top: '0', height: '33.333vh' }}>
          <div className="mt-6 mx-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-amber-200/50 py-4 px-6 pointer-events-auto max-w-md text-center min-w-[200px]"
               style={{
                 boxShadow: '0 10px 40px -10px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.1)'
               }}>
            <p className="text-sm text-amber-900 font-medium tracking-tight">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Top Banner - Verified - Slides down to 1/3 of page */}
      {showSymbolState && symbolType === 'success' && (
        <div className={`fixed inset-x-0 z-50 pointer-events-none flex items-start justify-center ${showSymbolState ? 'slide-down' : 'slide-up'}`}
             style={{ top: '0', height: '33.333vh' }}>
          <div className="mt-6 mx-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-emerald-200/50 py-4 px-6 pointer-events-auto max-w-md text-center min-w-[200px]"
               style={{
                 boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)'
               }}>
            <p className="text-sm text-emerald-900 font-medium tracking-tight">Verified</p>
          </div>
        </div>
      )}

      <div className={`w-full max-w-sm px-6 ${shake ? 'shake' : ''}`}>
        {/* Minimal Header - No branding */}
        <div className="mb-12"></div>

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
                  const newValue = e.target.value;
                  setEmail(newValue);
                  setErrorMessage(''); // Clear error when typing

                  // Change color based on email length (cycles through colors)
                  if (newValue.length > 0) {
                    setColorIndex(newValue.length % BUTTON_COLORS.length);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && handleContinue()}
                placeholder="Email"
                autoFocus
                className={`w-full px-4 py-3 text-base border-b-2 focus:outline-none transition-all duration-300 bg-transparent placeholder:text-slate-400 ${
                  email.includes('@')
                    ? `${BUTTON_COLORS[colorIndex].border} ${BUTTON_COLORS[colorIndex].focus}`
                    : 'border-slate-200 focus:border-slate-200'
                }`}
              />

              <button
                onClick={handleContinue}
                disabled={!email.includes('@') || isAuthInProgress}
                className={`w-full py-3 text-white rounded-lg font-medium transition-all duration-300 ${
                  email.includes('@') && !isAuthInProgress
                    ? `${BUTTON_COLORS[colorIndex].bg} ${BUTTON_COLORS[colorIndex].hover} cursor-pointer`
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
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
                disabled={code.length !== 6 || isAuthInProgress}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Verify
              </button>
              <button
                onClick={() => {
                  setStage('email');
                  setCode('');
                  setMessage('');
                  setIsAuthInProgress(false);
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
        </div>
      </div>
    </div>
  );
}
