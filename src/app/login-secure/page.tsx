'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SecureLoginPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);

  // Security alerts
  const [securityAlert, setSecurityAlert] = useState<{
    type: 'new_device' | 'new_location' | 'password_expiring' | null;
    message: string;
  }>({ type: null, message: '' });

  // ============================================
  // Load FingerprintJS on mount
  // ============================================
  useEffect(() => {
    const loadFingerprint = async () => {
      try {
        // @ts-expect-error - FingerprintJS is loaded via CDN or npm
        const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setDeviceFingerprint(result.visitorId);
      } catch (err) {
        console.error('[Login] Failed to load device fingerprint:', err);
        // Continue without fingerprint - server will use fallback
      }
    };

    loadFingerprint();
  }, []);

  // ============================================
  // Handle Login
  // ============================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    if (totpCode.length !== 6) {
      setError('TOTP code must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          totpCode,
          fingerprint: deviceFingerprint,
          rememberDevice
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        // Handle specific error cases
        if (data.locked) {
          setError(data.message || 'Account locked. Please contact support.');
        } else if (data.passwordExpired) {
          setError('Your password has expired. Please reset it.');
          // TODO: Redirect to password reset page
        } else {
          setError(data.message || 'Invalid credentials. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Show security alerts if any
      if (data.security) {
        if (data.security.newDevice) {
          setSecurityAlert({
            type: 'new_device',
            message: 'New device detected. Check your email for security alert.'
          });
        } else if (data.security.newLocation) {
          setSecurityAlert({
            type: 'new_location',
            message: 'Login from new location detected.'
          });
        } else if (data.security.passwordExpiresIn !== null && data.security.passwordExpiresIn <= 15) {
          setSecurityAlert({
            type: 'password_expiring',
            message: `Your password expires in ${data.security.passwordExpiresIn} day(s).`
          });
        }
      }

      // Store session token (you might want to use httpOnly cookies instead)
      if (data.session?.sessionToken) {
        sessionStorage.setItem('sessionToken', data.session.sessionToken);
      }

      // Redirect based on role
      const redirectPath = data.user?.role === 'ADMIN' ? '/admin' : '/dashboard';

      setTimeout(() => {
        router.push(redirectPath);
      }, securityAlert.type ? 2000 : 500);

    } catch (err) {
      console.error('[Login] Error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // ============================================
  // Handle TOTP Code Input (auto-format)
  // ============================================
  const handleTotpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setTotpCode(digits);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Secure Sign In
            </h1>
            <p className="text-sm text-slate-600">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Security Alert */}
          {securityAlert.type && (
            <div className={`mb-6 p-4 rounded-lg border ${
              securityAlert.type === 'password_expiring'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">{securityAlert.message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 text-base border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* TOTP Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Authenticator Code (TOTP)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={totpCode}
                onChange={(e) => handleTotpChange(e.target.value)}
                placeholder="000000"
                maxLength={6}
                disabled={loading}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {/* Remember Device */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-slate-700">
                Remember this device (skip security alerts)
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || !password || totpCode.length !== 6}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Help Links */}
          <div className="mt-6 space-y-2 text-center">
            <button
              onClick={() => router.push('/forgot-password')}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors block w-full"
            >
              Forgot your password?
            </button>
            <button
              onClick={() => router.push('/register-secure')}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors block w-full"
            >
              Don&apos;t have an account? Register
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-xs text-slate-600">
                <strong className="block mb-1">Secure Login</strong>
                <p>Your connection is encrypted. We&apos;ll never ask for your password via email.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
