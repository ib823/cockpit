'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';

export default function AddPasskeyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePasskey = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname for this passkey');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Get registration options from server
      const beginRes = await fetch('/api/auth/passkey/register/begin', {
        method: 'POST',
      });

      if (!beginRes.ok) {
        throw new Error('Failed to start passkey registration');
      }

      const options = await beginRes.json();

      // Step 2: Prompt user to create passkey
      let attResp;
      try {
        attResp = await startRegistration(options);
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          throw new Error('Passkey setup was cancelled');
        }
        throw err;
      }

      // Step 3: Send response to server with nickname
      const finishRes = await fetch('/api/auth/passkey/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: attResp,
          nickname: nickname.trim(),
        }),
      });

      if (!finishRes.ok) {
        const data = await finishRes.json();
        throw new Error(data.error || 'Failed to register passkey');
      }

      // Success! Redirect back to account page
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add Passkey</h1>
          <p className="mt-2 text-gray-600 text-sm">
            Create a new passkey for passwordless authentication
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., My MacBook, iPhone 15"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Give this passkey a memorable name to identify the device
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreatePasskey}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </span>
              ) : (
                'Create Passkey'
              )}
            </button>

            <button
              onClick={() => router.push('/account')}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-900">
            <strong>What&apos;s a passkey?</strong> Passkeys are a secure, passwordless way to sign in using
            your device&apos;s biometric authentication (fingerprint, face recognition) or device PIN.
          </p>
        </div>
      </div>
    </div>
  );
}
