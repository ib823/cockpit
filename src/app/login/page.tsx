'use client';

import { startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'email' | 'otp' | 'waiting' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeyOptions, setPasskeyOptions] = useState<any>(null);

  async function handleContinue() {
    if (!email || isAuthInProgress) return;
    setIsAuthInProgress(true);
    setStage('waiting');
    setErrorMessage('');

    try {
      // Check if user has passkey
      const res = await fetch('/api/auth/begin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setStage('email');
        setErrorMessage(data?.message || 'Login failed. Please check your email.');
        setIsAuthInProgress(false);
        return;
      }

      // User has passkey option
      if (data.pendingPasskey) {
        setHasPasskey(true);
        setPasskeyOptions(data.options);
      }

      // Send OTP code via email
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpRes.json();

      if (otpRes.ok && otpData.ok) {
        setStage('otp');
        setMessage(data.pendingPasskey ? 'Enter the code from your email, or use your passkey' : 'Enter the code from your email');
        setIsAuthInProgress(false);
      } else {
        setStage('email');
        setErrorMessage(otpData.message || 'Failed to send verification code');
        setIsAuthInProgress(false);
      }
    } catch (err: any) {
      setStage('email');
      setErrorMessage('An error occurred. Please try again.');
      setIsAuthInProgress(false);
    }
  }

  async function handleOtpSubmit() {
    if (!otp || otp.length !== 6 || isAuthInProgress) return;
    setIsAuthInProgress(true);
    setStage('waiting');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const result = await res.json();

      if (result.ok) {
        setStage('done');
        setMessage('Welcome!');
        setIsAuthInProgress(false);
        setTimeout(() => router.push('/'), 2000);
      } else {
        setStage('otp');
        setOtp('');
        setErrorMessage(result.message || 'Invalid code. Please try again.');
        setIsAuthInProgress(false);
      }
    } catch (err) {
      setStage('otp');
      setErrorMessage('Verification failed. Please try again.');
      setIsAuthInProgress(false);
    }
  }

  async function handlePasskeyAuth() {
    if (!passkeyOptions || isAuthInProgress) return;
    setIsAuthInProgress(true);
    setStage('waiting');

    try {
      const credential = await startAuthentication({ optionsJSON: passkeyOptions });

      const finishRes = await fetch('/api/auth/finish-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, response: credential }),
      });

      const result = await finishRes.json();

      if (result.ok) {
        setStage('done');
        setMessage('Welcome back!');
        setIsAuthInProgress(false);
        setTimeout(() => router.push('/'), 2000);
      } else {
        setStage('otp');
        setErrorMessage('Passkey authentication failed. Please use the code instead.');
        setIsAuthInProgress(false);
      }
    } catch (err: any) {
      setStage('otp');
      if (err.name === 'SecurityError' && err.message?.includes('invalid domain')) {
        setErrorMessage('Please use localhost instead of 127.0.0.1');
      } else {
        setErrorMessage('Passkey cancelled. Please use the code instead.');
      }
      setIsAuthInProgress(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h1>
            <p className="text-sm text-slate-600">
              {stage === 'email' && 'Enter your email to continue'}
              {stage === 'otp' && 'Check your email for verification code'}
              {stage === 'waiting' && 'Please wait...'}
              {stage === 'done' && 'Success!'}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Email Stage */}
          {stage === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && handleContinue()}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
              </div>
              <button
                onClick={handleContinue}
                disabled={!email.includes('@') || isAuthInProgress}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Continue
              </button>
            </div>
          )}

          {/* OTP Stage */}
          {stage === 'otp' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    setErrorMessage('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && handleOtpSubmit()}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              <button
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6 || isAuthInProgress}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Verify Code
              </button>

              {/* Passkey Option */}
              {hasPasskey && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500">OR</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePasskeyAuth}
                    disabled={isAuthInProgress}
                    className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Use Passkey
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setStage('email');
                  setOtp('');
                  setErrorMessage('');
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Back to email
              </button>
            </div>
          )}

          {/* Waiting Stage */}
          {stage === 'waiting' && (
            <div className="text-center py-8">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mb-4"></div>
              <p className="text-slate-600">{message || 'Processing...'}</p>
            </div>
          )}

          {/* Success Stage */}
          {stage === 'done' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl text-slate-900 font-semibold">{message}</p>
              <p className="text-sm text-slate-600 mt-2">Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
