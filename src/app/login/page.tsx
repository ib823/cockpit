'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

type EmailStatus = {
  registered: boolean;
  hasPasskey: boolean;
  invited: boolean;
  inviteMethod: 'code' | 'link' | null;
  needsAction: 'login' | 'enter_invite' | 'not_found';
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stage, setStage] = useState<'input' | 'creating' | 'verifying' | 'success'>('input');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle magic link token on page load
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyMagicLink(token);
    }
  }, [searchParams]);

  const verifyMagicLink = async (token: string) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/auth/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();

      if (!json.ok) {
        setErr(json.message || 'Invalid or expired magic link');
        return;
      }

      // Auto-populate email and check status
      setEmail(json.email);
      const statusRes = await fetch(`/api/auth/email-status?email=${encodeURIComponent(json.email)}`);
      const statusJson = await statusRes.json();
      setStatus(statusJson);

      if (statusJson.needsAction === 'enter_invite') {
        // Automatically trigger passkey registration since magic link was verified
        setSuccessMessage('Magic link verified! Creating your passkey...');
        setTimeout(() => onRegisterWithMagicLink(json.email), 500);
      } else if (statusJson.needsAction === 'login') {
        setSuccessMessage('Magic link verified! Please use your passkey to login.');
      }
    } catch (error) {
      setErr('Failed to verify magic link. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onRegisterWithMagicLink = async (emailAddress: string) => {
    setBusy(true);
    setErr(null);
    setStage('creating');
    try {
      const begin = await fetch('/api/auth/begin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress, magicLink: true }),
      }).then(r => r.json());

      if (!begin.ok) {
        setErr(begin.message || 'Registration failed. Please try again.');
        setStage('input');
        return;
      }

      // Use SimpleWebAuthn for registration
      const credential = await startRegistration({ optionsJSON: begin.options });

      setStage('verifying');
      const finish = await fetch('/api/auth/finish-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress, response: credential }),
      }).then(r => r.json());

      if (!finish.ok) {
        setErr(finish.message || 'Registration failed. Please try again.');
        setStage('input');
        return;
      }

      setStage('success');
      setSuccessMessage('Passkey registered successfully!');
      const role = finish?.user?.role;
      setTimeout(() => {
        router.replace(role === 'ADMIN' ? '/admin' : '/dashboard');
      }, 1500);
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setErr('Passkey creation was cancelled.');
      } else {
        setErr('Invalid. Contact Admin.');
      }
      setStage('input');
    } finally {
      setBusy(false);
    }
  };

  const onCheck = async () => {
    setErr(null);
    const e = email.trim().toLowerCase();
    if (!e) return setErr('Please enter your work email.');
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/email-status?email=${encodeURIComponent(e)}`);
      const json = await res.json();
      setStatus(json);
      if (json.needsAction === 'not_found') {
        setErr('Invalid. Contact Admin');
      }
    } catch {
      setErr('Could not check email. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onPasskeyLogin = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setBusy(true);
    setErr(null);
    setStage('creating');
    try {
      const begin = await fetch('/api/auth/begin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e }),
      }).then(r => r.json());

      if (!begin.ok) {
        setErr(begin.message || 'Invalid. Contact Admin.');
        setStage('input');
        return;
      }

      // Use SimpleWebAuthn for authentication
      const credential = await startAuthentication({ optionsJSON: begin.options });

      setStage('verifying');
      const finish = await fetch('/api/auth/finish-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, response: credential }),
      }).then(r => r.json());

      if (!finish.ok) {
        setErr(finish.message || 'Invalid passkey. Try again or Contact Admin.');
        setStage('input');
        return;
      }

      setStage('success');
      setSuccessMessage('Login successful!');
      const role = finish?.user?.role;
      setTimeout(() => {
        router.replace(role === 'ADMIN' ? '/admin' : '/dashboard');
      }, 1500);
    } catch (e: any) {
      setErr('Invalid passkey. Try again or Contact Admin.');
      setStage('input');
    } finally {
      setBusy(false);
    }
  };

  const onRegisterWithCode = async () => {
    const e = email.trim().toLowerCase();
    const c = code.trim();
    if (!e || !c) return;
    setBusy(true);
    setErr(null);
    setStage('creating');
    try {
      const begin = await fetch('/api/auth/begin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, code: c }),
      }).then(r => r.json());

      if (!begin.ok) {
        setErr(begin.message || 'Invalid code. Please try again.');
        setStage('input');
        return;
      }

      // Use SimpleWebAuthn for registration
      const credential = await startRegistration({ optionsJSON: begin.options });

      setStage('verifying');
      const finish = await fetch('/api/auth/finish-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, response: credential }),
      }).then(r => r.json());

      if (!finish.ok) {
        setErr(finish.message || 'Registration failed. Please try again.');
        setStage('input');
        return;
      }

      setStage('success');
      setSuccessMessage('Passkey registered successfully!');
      const role = finish?.user?.role;
      setTimeout(() => {
        router.replace(role === 'ADMIN' ? '/admin' : '/dashboard');
      }, 1500);
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setErr('Passkey creation was cancelled.');
      } else {
        setErr('Invalid. Contact Admin.');
      }
      setStage('input');
    } finally {
      setBusy(false);
    }
  };

  const onSendMagicLink = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e }),
      }).then(r => r.json());

      if (!res.ok) {
        setErr(res.message || 'Failed to send magic link');
        return;
      }

      if (res.devMode) {
        // In dev mode, show the magic link
        setSuccessMessage(`Magic link: ${res.magicLink}`);
        console.log('🔗 Magic Link:', res.magicLink);
      } else {
        setSuccessMessage('Magic link sent! Check your email.');
      }
      setStage('success');
    } catch (error) {
      setErr('Failed to send magic link. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {stage === 'input' && 'Sign in'}
              {stage === 'creating' && 'Creating Passkey'}
              {stage === 'verifying' && 'Verifying'}
              {stage === 'success' && 'Success!'}
            </h1>
            <p className="text-sm text-slate-600">
              {stage === 'input' && 'Enter your work email to continue'}
              {stage === 'creating' && 'Follow your browser prompt...'}
              {stage === 'verifying' && 'Completing registration...'}
              {stage === 'success' && 'Redirecting to dashboard...'}
            </p>
          </div>

          {/* Loading/Success States */}
          {(stage === 'creating' || stage === 'verifying') && (
            <div className="text-center py-8">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mb-4"></div>
              <p className="text-slate-600">
                {stage === 'creating' && 'Waiting for passkey...'}
                {stage === 'verifying' && 'Verifying credentials...'}
              </p>
            </div>
          )}

          {stage === 'success' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl text-slate-900 font-semibold mb-2">{successMessage}</p>
              <p className="text-sm text-slate-600">Please wait...</p>
            </div>
          )}

          {/* Input Stage */}
          {stage === 'input' && (
            <div className="space-y-6">
              {/* Error Message */}
              {err && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <p>{err}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>

              {!status && (
                <button
                  onClick={onCheck}
                  disabled={busy}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Continue
                </button>
              )}

              {status?.needsAction === 'not_found' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 text-center">
                    This email is not registered or approved for access.
                  </p>
                  <button
                    onClick={() => { setStatus(null); setEmail(''); setErr(null); }}
                    disabled={busy}
                    className="w-full py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Try Different Email
                  </button>
                </div>
              )}

              {status?.needsAction === 'login' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 text-center">Welcome back! Use your passkey to continue.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={onPasskeyLogin}
                      disabled={busy}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Use Passkey
                    </button>
                    <button
                      onClick={() => { setStatus(null); setErr(null); }}
                      disabled={busy}
                      className="px-4 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {status?.needsAction === 'enter_invite' && status.inviteMethod === 'link' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 text-center">
                    Click the button below to receive a magic link via email.
                  </p>
                  <button
                    onClick={onSendMagicLink}
                    disabled={busy}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Magic Link
                  </button>
                  <button
                    onClick={() => { setStatus(null); setErr(null); }}
                    disabled={busy}
                    className="w-full py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change Email
                  </button>
                </div>
              )}

              {status?.needsAction === 'enter_invite' && status.inviteMethod === 'code' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      6-Digit Code
                    </label>
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                      placeholder="000000"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/[^0-9]/g,''))}
                    />
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Enter the code provided by your administrator
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onRegisterWithCode}
                      disabled={busy || code.length !== 6}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Create Passkey
                    </button>
                    <button
                      onClick={() => { setStatus(null); setCode(''); setErr(null); }}
                      disabled={busy}
                      className="px-4 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginEmailFirst() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
