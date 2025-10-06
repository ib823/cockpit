'use client';

import { useState, useEffect } from 'react';

export default function LoginDemoPage() {
  const [activeDemo, setActiveDemo] = useState<'warning' | 'success' | 'waiting' | 'announcement' | 'notification' | 'none'>('none');
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Detect when React has hydrated
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const triggerDemo = (type: 'warning' | 'success' | 'waiting' | 'announcement' | 'notification') => {
    setActiveDemo(type);
    if (type === 'notification') {
      setShowModal(true);
    } else if (type === 'announcement') {
      setShowBanner(true);
      setTimeout(() => {
        setShowBanner(false);
        setTimeout(() => setActiveDemo('none'), 500);
      }, 8000); // Longer duration for announcement
    } else if (type !== 'waiting') {
      setShowBanner(true);
      setTimeout(() => {
        setShowBanner(false);
        setTimeout(() => setActiveDemo('none'), 500);
      }, 3500); // 3.5 seconds for Invalid/Verified banners
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setActiveDemo('none'), 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <style jsx>{`
        /* Banner slide down animation */
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
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
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        /* 3D floating banner animation */
        @keyframes float-down-3d {
          from {
            transform: translateY(-120%) translateZ(50px) rotateX(-15deg);
            opacity: 0;
          }
          to {
            transform: translateY(0) translateZ(0px) rotateX(0deg);
            opacity: 1;
          }
        }

        @keyframes float-up-3d {
          from {
            transform: translateY(0) translateZ(0px) rotateX(0deg);
            opacity: 1;
          }
          to {
            transform: translateY(-120%) translateZ(50px) rotateX(-15deg);
            opacity: 0;
          }
        }

        /* Modal fade in/out */
        @keyframes modal-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modal-scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Standard spinner animation */
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }
        .slide-up {
          animation: slide-up 0.4s ease-in forwards;
        }
        .float-down-3d {
          animation: float-down-3d 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .float-up-3d {
          animation: float-up-3d 0.4s ease-in forwards;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        .modal-backdrop {
          animation: modal-fade-in 0.3s ease-out;
        }
        .modal-content {
          animation: modal-scale-in 0.3s ease-out;
        }
      `}</style>

      {/* Top Banner - Invalid */}
      {showBanner && activeDemo === 'warning' && (
        <div className={`fixed inset-x-0 top-0 z-50 pointer-events-none flex justify-center ${showBanner ? 'slide-down' : 'slide-up'}`}>
          <div className="mt-6 mx-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-amber-200/50 py-3.5 px-5 pointer-events-auto"
               style={{
                 boxShadow: '0 10px 40px -10px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.1)'
               }}>
            <p className="text-sm text-amber-900 font-medium tracking-tight text-center">Invalid</p>
          </div>
        </div>
      )}

      {/* Top Banner - Verified */}
      {showBanner && activeDemo === 'success' && (
        <div className={`fixed inset-x-0 top-0 z-50 pointer-events-none flex justify-center ${showBanner ? 'slide-down' : 'slide-up'}`}>
          <div className="mt-6 mx-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-emerald-200/50 py-3.5 px-5 pointer-events-auto"
               style={{
                 boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)'
               }}>
            <p className="text-sm text-emerald-900 font-medium tracking-tight text-center">Verified</p>
          </div>
        </div>
      )}

      {/* 3D Floating Banner - Browser notification announcement (NO BACKDROP) */}
      {showBanner && activeDemo === 'announcement' && (
        <div className={`fixed inset-x-0 top-16 z-50 pointer-events-none flex justify-center px-4 ${showBanner ? 'float-down-3d' : 'float-up-3d'}`}
             style={{ perspective: '1000px' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-blue-200 pointer-events-auto"
               style={{
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)',
                 transform: 'translateZ(20px)'
               }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b-2 border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg text-blue-900 font-semibold">Allow Browser Notification →</h2>
                  <p className="text-sm text-blue-700">Instant 1st time login</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 bg-white">
              {/* Your personal device */}
              <div className="mb-3">
                <p className="text-sm text-emerald-800 font-medium mb-1.5">✓ Your personal device</p>
                <p className="text-xs text-slate-600 leading-relaxed">Phone, laptop, tablet you own</p>
              </div>

              {/* Never on shared devices - Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <p className="text-sm text-amber-900 font-medium mb-1.5">⚠ Never on shared devices</p>
                <p className="text-xs text-amber-800 leading-relaxed">Library, café, borrowed, work computer</p>
              </div>
            </div>

            {/* Footer checkbox */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">This is my personal device</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Notification permission toggle */}
      {showModal && activeDemo === 'notification' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/40 backdrop-blur-sm">
          <div className="modal-content bg-white rounded-2xl shadow-2xl max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg text-indigo-900 font-semibold">Allow Browser Notification →</h3>
              </div>
            </div>
            <div className="px-6 py-6">
              {/* Toggle box - only toggle is clickable */}
              <div className="flex items-center justify-between mb-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex-1 select-none">
                  <p className="text-sm font-medium text-slate-900">Browser notification → Instant 1st time login</p>
                  <p className="text-xs text-slate-600 mt-1">One-click login</p>
                </div>
                <button
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ml-4 ${
                    notificationEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={notificationEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Your personal device */}
              <div className="mb-3 px-1">
                <p className="text-sm text-emerald-800 font-medium mb-1.5">✓ Your personal device</p>
                <p className="text-xs text-slate-600 leading-relaxed">Phone, laptop, tablet you own</p>
              </div>

              {/* Warning - Never on shared devices */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <p className="text-sm text-amber-900 font-medium mb-1.5">⚠ Never on shared devices</p>
                <p className="text-xs text-amber-800 leading-relaxed">Library, café, borrowed, work computer</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center spinner loader - Authenticating */}
      {activeDemo === 'waiting' && (
        <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full spinner"></div>
        </div>
      )}

      <div className="w-full max-w-sm px-6">
        {/* Minimal Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Cockpit
          </h1>
          <p className="text-xs text-slate-500 mt-2">Login UX Demo</p>
        </div>

        {/* Login Form - Always visible */}
        <div className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            disabled
            value="demo@example.com"
            className={`w-full px-4 py-3 text-base border-b-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-all duration-300 bg-transparent placeholder:text-slate-400 ${!isHydrated ? 'opacity-50' : 'opacity-100'}`}
          />
          <button
            disabled
            className={`w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all duration-300 ${!isHydrated ? 'opacity-50 cursor-wait' : 'opacity-100'}`}
          >
            {isHydrated ? 'Continue' : 'Loading...'}
          </button>
        </div>

        {/* Demo Controls */}
        <div className="mt-12 pt-8 border-t border-slate-200 space-y-3">
          <p className="text-xs text-slate-500 text-center mb-4">Trigger UX States:</p>

          <button
            onClick={() => triggerDemo('warning')}
            disabled={!isHydrated}
            className={`w-full py-2 px-4 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors text-sm ${!isHydrated ? 'opacity-50 cursor-wait' : ''}`}
          >
            ⚠️ Invalid (Banner)
          </button>

          <button
            onClick={() => triggerDemo('success')}
            disabled={!isHydrated}
            className={`w-full py-2 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm ${!isHydrated ? 'opacity-50 cursor-wait' : ''}`}
          >
            ✓ Verified (Banner)
          </button>

          <button
            onClick={() => {
              setActiveDemo('waiting');
              setTimeout(() => setActiveDemo('none'), 10000);
            }}
            disabled={!isHydrated}
            className={`w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm ${!isHydrated ? 'opacity-50 cursor-wait' : ''}`}
          >
            ⏳ Authenticating (Center loader)
          </button>

          <button
            onClick={() => triggerDemo('announcement')}
            disabled={!isHydrated}
            className={`w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm ${!isHydrated ? 'opacity-50 cursor-wait' : ''}`}
          >
            📢 Browser notification (3D Banner)
          </button>

          <button
            onClick={() => triggerDemo('notification')}
            disabled={!isHydrated}
            className={`w-full py-2 px-4 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm ${!isHydrated ? 'opacity-50 cursor-wait' : ''}`}
          >
            🔔 Notification permission (Modal)
          </button>

          <button
            onClick={() => {
              setActiveDemo('none');
              setShowBanner(false);
              setShowModal(false);
            }}
            disabled={!isHydrated}
            className={`w-full py-2 px-4 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors text-sm ${!isHydrated ? 'opacity-50 cursor-wait' : ''}`}
          >
            Reset
          </button>
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold text-slate-700 mb-2">Clean UX Design:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>🎯 <strong>Layout:</strong> Login form always visible, seamless overlays</li>
            <li>⚠️ <strong>Invalid:</strong> Top banner slides down, amber theme, icon + word</li>
            <li>✓ <strong>Verified:</strong> Top banner slides down, green theme, icon + word</li>
            <li>⏳ <strong>Authenticating:</strong> Standard spinning circle loader in center</li>
            <li>📢 <strong>Browser notification:</strong> 3D floating banner, seamless appearance</li>
            <li>🔔 <strong>Toggle notification:</strong> Blocking modal, only toggle clickable, must respond</li>
            <li>✨ <strong>Calm:</strong> Smooth 3D transitions, subtle colors, easy to read</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
