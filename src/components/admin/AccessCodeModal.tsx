'use client';

import { useState } from 'react';

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  code: string;
  magicUrl?: string;
}

export default function AccessCodeModal({ isOpen, onClose, email, code, magicUrl }: AccessCodeModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyLink = async () => {
    if (!magicUrl) return;
    try {
      await navigator.clipboard.writeText(magicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenEmail = () => {
    const subject = 'Welcome to Cockpit - Your Access is Ready!';

    const bodyText = `Hi there,

Welcome to Cockpit! Your access has been approved and you're all set to get started.

Choose your preferred way to login:

========================================

MAGIC LINK (Quick Login)
${magicUrl || 'N/A'}
Expires in: 2 minutes

========================================

6-DIGIT CODE (Manual Entry)
${code}
Expires in: 7 days

========================================

How to Get Started:

Option 1 (Recommended):
- Click the magic link above for instant access
- Set up your passkey (fingerprint/Face ID)
- Done! You're logged in

Option 2 (Manual):
- Visit the login page
- Enter your email
- Enter the 6-digit code above
- Set up your passkey
- Start using Cockpit!

========================================

Security Tip:
After setup, you'll use your device's passkey (fingerprint or Face ID) to sign in. No passwords needed!

Need help? Reply to this email or contact your admin.

Best regards,
The Cockpit Team

========================================
This is an automated message from SAP Implementation Cockpit.`;

    // Create mailto link
    const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

    // Try to open in a new window first (more reliable)
    const opened = window.open(mailtoLink, '_blank');

    // Fallback to direct location change if popup blocked
    if (!opened) {
      window.location.href = mailtoLink;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5 align-middle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Approved!</h2>
          <p className="text-sm text-slate-600">
            Access code ready for <span className="font-medium text-slate-900">{email}</span>
          </p>
        </div>

        {/* Magic Link Section */}
        {magicUrl && (
          <div className="mb-6">
            <div className="text-center mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Magic Link</h3>
              <p className="text-xs text-slate-500">Expires in 2 minutes</p>
            </div>
            <div className="relative">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 overflow-hidden">
                <p className="text-xs text-blue-900 font-mono truncate text-center">
                  {magicUrl}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                {copiedLink ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </span>
                ) : (
                  'Copy'
                )}
              </button>
            </div>
          </div>
        )}

        {/* 6-Digit Code Section */}
        <div className="mb-8">
          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">6-Digit Code</h3>
            <p className="text-xs text-slate-500">Expires in 7 days</p>
          </div>
          <div className="relative">
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
              <p className="text-4xl font-bold text-slate-900 font-mono tracking-widest text-center">
                {code}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              {copiedCode ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </span>
              ) : (
                'Copy'
              )}
            </button>
          </div>
        </div>

        {/* Email Button */}
        <button
          onClick={handleOpenEmail}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Open Email Client
        </button>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
