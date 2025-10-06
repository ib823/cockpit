'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  code: string;
}

export default function AccessCodeModal({ isOpen, onClose, email, code }: AccessCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && code && canvasRef.current) {
      // Generate QR code with login data
      const loginData = JSON.stringify({ email, code });
      QRCode.toCanvas(canvasRef.current, loginData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch(console.error);

      // Also generate data URL for download
      QRCode.toDataURL(loginData, { width: 512, margin: 2 })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [isOpen, code, email]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `access-code-${email}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Approved!</h2>
          <p className="text-sm text-slate-600">
            Share this code with <span className="font-medium text-slate-900">{email}</span>
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-slate-50 rounded-xl p-6 mb-6">
          <div className="flex justify-center mb-4">
            <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
          </div>
          <p className="text-xs text-center text-slate-500">Scan with phone to auto-fill login</p>
        </div>

        {/* Code Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">6-Digit Code</label>
          <div className="relative">
            <input
              type="text"
              value={code}
              readOnly
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-center text-2xl font-mono font-bold text-slate-900 tracking-widest"
            />
            <button
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleDownloadQR}
            className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download QR Code
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Expires:</strong> 7 days • <strong>One-time use</strong> • Secure delivery via email/QR
          </p>
        </div>
      </div>
    </div>
  );
}
