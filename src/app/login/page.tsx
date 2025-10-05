'use client';

import { useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'email' | 'code' | 'waiting' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [shake, setShake] = useState(false);

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

      if (!data || !data.pendingPasskey) {
        // No passkey found - need registration code
        setIsAdmin(false);
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

      const result = await finishRes.json();

      if (result.ok) {
        setStage('done');
        setMessage('Welcome back');
        setTimeout(() => router.push('/'), 800);
      } else {
        setStage('email');
        setMessage('');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.name === 'NotAllowedError') {
        setStage('email');
        setMessage('');
      } else {
        setStage('code');
        setMessage('');
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
          setMessage('Welcome Admin');
          setTimeout(() => router.push('/admin'), 800);
        } else {
          setStage('code');
          setMessage('');
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

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!data || !data.pendingPasskey) {
        setStage('code');
        setMessage('Invalid code');
        return;
      }

      const attestation = await startRegistration({ optionsJSON: data.options });

      const finishRes = await fetch('/api/auth/finish-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, response: attestation }),
      });

      const result = await finishRes.json();

      if (result.ok) {
        setStage('done');
        setMessage('Welcome');
        setTimeout(() => router.push('/'), 800);
      } else {
        setStage('code');
        setMessage('');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setStage('code');
      setMessage(err.name === 'NotAllowedError' ? '' : 'Setup cancelled');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .shake {
          animation: shake 0.5s;
        }
      `}</style>
      <div className={`w-full max-w-sm px-6 ${shake ? 'shake' : ''}`}>
        {/* Minimal Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Cockpit
          </h1>
        </div>

        {/* Email Stage */}
        {stage === 'email' && (
          <div className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {message && (
              <p className="text-sm text-red-600 text-center">{message}</p>
            )}
          </div>
        )}

        {/* Code Stage (only shown when registration needed) */}
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
            {message && (
              <p className="text-sm text-red-600 text-center">{message}</p>
            )}
          </div>
        )}

        {/* Waiting Stage */}
        {stage === 'waiting' && (
          <div className="text-center space-y-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
            <p className="text-sm text-slate-600">Authenticating...</p>
          </div>
        )}

        {/* Success Stage */}
        {stage === 'done' && (
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-900 font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
