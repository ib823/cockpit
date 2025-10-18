'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

type EmailStatus = {
  registered: boolean;
  hasPasskey: boolean;
  invited: boolean;
  inviteMethod: 'code' | 'link' | null;
  needsAction: 'login' | 'enter_invite' | 'not_found';
};

export default function LoginEmailFirst() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    try {
      const begin = await fetch('/api/auth/begin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e }),
      }).then(r => r.json());

      if (!begin.ok) {
        setErr(begin.message || 'Invalid. Contact Admin.');
        return;
      }

      // Use SimpleWebAuthn for authentication
      const credential = await startAuthentication({ optionsJSON: begin.options });

      const finish = await fetch('/api/auth/finish-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, response: credential }),
      }).then(r => r.json());

      if (!finish.ok) {
        setErr(finish.message || 'Invalid passkey. Try again or Contact Admin.');
        return;
      }

      const role = finish?.user?.role;
      router.replace(role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setErr('Invalid passkey. Try again or Contact Admin.');
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
    try {
      const begin = await fetch('/api/auth/begin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, code: c }),
      }).then(r => r.json());

      if (!begin.ok) {
        setErr(begin.message || 'Invalid code. Please try again.');
        return;
      }

      // Use SimpleWebAuthn for registration
      const credential = await startRegistration({ optionsJSON: begin.options });

      const finish = await fetch('/api/auth/finish-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, response: credential }),
      }).then(r => r.json());

      if (!finish.ok) {
        setErr(finish.message || 'Registration failed. Please try again.');
        return;
      }

      const role = finish?.user?.role;
      router.replace(role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setErr('Passkey creation was cancelled.');
      } else {
        setErr('Invalid. Contact Admin.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <label className="block text-sm">
        Work email
        <input
          type="email"
          className="mt-1 w-full border rounded p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </label>
      <button onClick={onCheck} disabled={busy} className="px-4 py-2 border rounded disabled:opacity-50">
        Continue
      </button>

      {status?.needsAction === 'login' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Welcome back. Use your passkey to continue.</p>
          <div className="flex gap-2">
            <button onClick={onPasskeyLogin} disabled={busy} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:bg-gray-400">
              Use Passkey
            </button>
            <button
              onClick={() => { setStatus(null); setErr(null); }}
              disabled={busy}
              className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Change email
            </button>
          </div>
        </div>
      )}

      {status?.needsAction === 'enter_invite' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Enter the 6-digit code to proceed</p>
          <input
            inputMode="numeric"
            maxLength={6}
            className="w-full border rounded p-2 tracking-widest"
            placeholder="••••••"
            value={code}
            onChange={e => setCode(e.target.value.replace(/[^0-9]/g,''))}
          />
          <div className="flex gap-2">
            <button onClick={onRegisterWithCode} disabled={busy || code.length !== 6} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:bg-gray-400">
              Continue
            </button>
            <button
              onClick={() => { setStatus(null); setCode(''); setErr(null); }}
              disabled={busy}
              className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Change email
            </button>
          </div>
        </div>
      )}

      {err && <div className="text-sm text-red-700 bg-red-50 border rounded p-3">{err}</div>}
    </div>
  );
}
