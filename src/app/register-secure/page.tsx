'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

type RegistrationStep = 'email' | 'password' | 'totp' | 'backup-codes' | 'complete';

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export default function SecureRegisterPage() {
  const router = useRouter();

  // Step management
  const [step, setStep] = useState<RegistrationStep>('email');

  // Form data
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // TOTP data
  const [totpQRCode, setTotpQRCode] = useState('');
  const [totpManualEntry, setTotpManualEntry] = useState('');
  const [totpVerificationCode, setTotpVerificationCode] = useState('');

  // Backup codes
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesDownloadContent, setBackupCodesDownloadContent] = useState('');
  const [backupCodesAcknowledged, setBackupCodesAcknowledged] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [] });
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpManual, setShowTotpManual] = useState(false);

  // ============================================
  // Password Strength Assessment (Client-side)
  // ============================================
  const assessPasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (pwd.length >= 12) {
      score++;
      feedback.push('✓ Minimum length met');
    } else {
      feedback.push(`✗ At least 12 characters (${pwd.length}/12)`);
    }

    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) {
      score++;
      feedback.push('✓ Mixed case letters');
    } else {
      feedback.push('✗ Both uppercase and lowercase');
    }

    if (/[0-9]/.test(pwd)) {
      score++;
      feedback.push('✓ Contains numbers');
    } else {
      feedback.push('✗ At least one number');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      score++;
      feedback.push('✓ Special characters');
    } else {
      feedback.push('✗ At least one special character');
    }

    if (pwd.length >= 16) {
      score++;
      feedback.push('✓ Strong length');
    }

    return { score: Math.min(score, 5), feedback };
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordStrength(assessPasswordStrength(pwd));
    setError('');
  };

  // ============================================
  // Step 1: Email + Code Submission
  // ============================================
  const handleEmailSubmit = () => {
    if (!email.includes('@') || code.length !== 6) {
      setError('Please enter a valid email and 6-digit code');
      return;
    }
    setError('');
    setStep('password');
  };

  // ============================================
  // Step 2: Password Creation & Account Setup
  // ============================================
  const handlePasswordSubmit = async () => {
    // Validate password strength
    if (passwordStrength.score < 4) {
      setError('Password must meet all security requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // Store TOTP data
      setTotpQRCode(data.totp.qrCode);
      setTotpManualEntry(data.totp.manualEntry);

      // Store backup codes
      setBackupCodes(data.backupCodes.codes);
      setBackupCodesDownloadContent(data.backupCodes.downloadContent);

      setLoading(false);
      setStep('totp');
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // ============================================
  // Step 3: TOTP Setup
  // ============================================
  const handleTotpContinue = () => {
    if (!totpVerificationCode || totpVerificationCode.length !== 6) {
      setError('Please enter a 6-digit code from your authenticator app');
      return;
    }
    setError('');
    setStep('backup-codes');
  };

  // ============================================
  // Step 4: Backup Codes Download
  // ============================================
  const handleDownloadBackupCodes = () => {
    const blob = new Blob([backupCodesDownloadContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cockpit-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFinishRegistration = () => {
    if (!backupCodesAcknowledged) {
      setError('Please acknowledge that you have saved your backup codes');
      return;
    }
    setStep('complete');
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  // ============================================
  // Password Strength Color
  // ============================================
  const getStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-500';
    if (score < 3) return 'bg-orange-500';
    if (score < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score < 2) return 'Weak';
    if (score < 3) return 'Fair';
    if (score < 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {step === 'email' && 'Create Your Account'}
              {step === 'password' && 'Set Up Password'}
              {step === 'totp' && 'Enable Two-Factor Authentication'}
              {step === 'backup-codes' && 'Save Your Backup Codes'}
              {step === 'complete' && 'All Set!'}
            </h1>
            <p className="text-sm text-slate-600">
              {step === 'email' && 'Enter your approved email and access code'}
              {step === 'password' && 'Create a strong, secure password'}
              {step === 'totp' && 'Scan the QR code with your authenticator app'}
              {step === 'backup-codes' && 'Keep these codes in a safe place'}
              {step === 'complete' && 'Your account is ready'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['Email', 'Password', 'TOTP', 'Backup', 'Done'].map((label, index) => (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    (step === 'email' && index === 0) ||
                    (step === 'password' && index === 1) ||
                    (step === 'totp' && index === 2) ||
                    (step === 'backup-codes' && index === 3) ||
                    (step === 'complete' && index === 4)
                      ? 'bg-blue-600 text-white'
                      : index < ['email', 'password', 'totp', 'backup-codes', 'complete'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {index < ['email', 'password', 'totp', 'backup-codes', 'complete'].indexOf(step) ? '✓' : index + 1}
                  </div>
                  <span className="text-xs mt-1 text-slate-600 hidden sm:block">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Email + Code */}
          {step === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.trim().toLowerCase());
                    setError('');
                  }}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  6-Digit Access Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Enter the code provided by your administrator
                </p>
              </div>

              <button
                onClick={handleEmailSubmit}
                disabled={!email.includes('@') || code.length !== 6}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Continue
              </button>

              <div className="text-center">
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Password Creation */}
          {step === 'password' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter a strong password"
                    autoFocus
                    className="w-full px-4 py-3 pr-12 text-base border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">Password Strength</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score < 2 ? 'text-red-600' :
                        passwordStrength.score < 3 ? 'text-orange-600' :
                        passwordStrength.score < 4 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getStrengthLabel(passwordStrength.score)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <ul className="mt-2 space-y-1">
                      {passwordStrength.feedback.map((item, i) => (
                        <li key={i} className={`text-xs ${item.startsWith('✓') ? 'text-green-600' : 'text-slate-500'}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && passwordStrength.score >= 4 && password === confirmPassword && handlePasswordSubmit()}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Password Requirements:</strong>
                </p>
                <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>At least 12 characters long</li>
                  <li>Mix of uppercase and lowercase letters</li>
                  <li>At least one number</li>
                  <li>At least one special character (!@#$%^&*)</li>
                  <li>Not found in data breach databases</li>
                </ul>
              </div>

              <button
                onClick={handlePasswordSubmit}
                disabled={loading || passwordStrength.score < 4 || password !== confirmPassword}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          )}

          {/* Step 3: TOTP Setup */}
          {step === 'totp' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-slate-50 rounded-lg p-6 inline-block">
                  {totpQRCode && (
                    <Image
                      src={totpQRCode}
                      alt="TOTP QR Code"
                      width={300}
                      height={300}
                      className="rounded-lg"
                    />
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-4">
                  Scan this QR code with an authenticator app like Google Authenticator, Authy, or 1Password
                </p>
              </div>

              <button
                onClick={() => setShowTotpManual(!showTotpManual)}
                className="text-sm text-blue-600 hover:text-blue-700 mx-auto block"
              >
                {showTotpManual ? 'Hide' : 'Show'} manual entry code
              </button>

              {showTotpManual && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-2">Manual Entry Code:</p>
                  <code className="text-sm font-mono bg-white px-3 py-2 rounded border border-slate-300 block text-center">
                    {totpManualEntry}
                  </code>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verify Setup - Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={totpVerificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTotpVerificationCode(value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && totpVerificationCode.length === 6 && handleTotpContinue()}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Enter the code from your authenticator app
                </p>
              </div>

              <button
                onClick={handleTotpContinue}
                disabled={totpVerificationCode.length !== 6}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Verify & Continue
              </button>
            </div>
          )}

          {/* Step 4: Backup Codes */}
          {step === 'backup-codes' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-yellow-900 mb-2">⚠️ Important: Save These Codes</h3>
                <p className="text-sm text-yellow-800">
                  Each code can only be used once. You&apos;ll need these if you lose access to your authenticator app.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 border border-slate-300">
                <div className="grid grid-cols-2 gap-3">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-white px-4 py-3 rounded-lg border border-slate-200 text-center font-mono text-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleDownloadBackupCodes}
                className="w-full py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Backup Codes
              </button>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupCodesAcknowledged}
                  onChange={(e) => {
                    setBackupCodesAcknowledged(e.target.checked);
                    setError('');
                  }}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  I have saved these backup codes in a secure location and understand that I will not be able to see them again.
                </span>
              </label>

              <button
                onClick={handleFinishRegistration}
                disabled={!backupCodesAcknowledged}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Finish Setup
              </button>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created Successfully!</h2>
              <p className="text-slate-600 mb-4">Your account is now secure with:</p>
              <ul className="text-sm text-slate-700 space-y-2 mb-6 inline-block text-left">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Strong password protection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Two-factor authentication (TOTP)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> 10 backup recovery codes
                </li>
              </ul>
              <p className="text-sm text-slate-600">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
