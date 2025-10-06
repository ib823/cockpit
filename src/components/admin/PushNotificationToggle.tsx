'use client';

import { useState, useEffect } from 'react';

interface PushNotificationToggleProps {
  email?: string;
  disabled?: boolean; // Disable toggle until user completes login flow
}

export default function PushNotificationToggle({ email, disabled = true }: PushNotificationToggleProps) {
  // Component is DISABLED by default - only shown for visual reference
  // Push notifications are handled during the login/registration flow
  // This toggle is just for display purposes
  return null;

  useEffect(() => {
    setSupported(isPushNotificationSupported());

    // Detect if likely public computer
    const detectPublicComputer = () => {
      const isIncognito = !window.indexedDB ||
                          (window.navigator && window.navigator.webdriver);

      const hasSharedComputerIndicators =
        window.navigator.userAgent.includes('Kiosk') ||
        window.navigator.userAgent.includes('Public');

      return isIncognito || hasSharedComputerIndicators;
    };

    setIsPublicComputer(detectPublicComputer());

    // Check if user has actual push subscription (but don't show it in toggle)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.pushManager.getSubscription().then((subscription) => {
            // If there's a real subscription, user has accepted before
            if (subscription) {
              setHasAcceptedThisSession(true);
            }
          });
        }
      });
    }

    // FORCE toggle to always be OFF on page load/navigation/refresh
    // Do NOT show subscription status in toggle - always start in OFF state
    setSubscribed(false);
  }, []);

  const handleToggle = async () => {
    if (!subscribed) {
      // Check notification permission status BEFORE showing any modal
      const currentPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

      // If already denied by browser, show warning immediately
      if (currentPermission === 'denied') {
        setShowEducation(true);
        return;
      }

      // If user already toggled ON this session AND accepted, skip modal and directly subscribe
      if (hasToggledOn && hasAcceptedThisSession) {
        setLoading(true);
        try {
          const subscription = await subscribeToPushNotifications();
          if (subscription) {
            const userEmail = email || '';
            const saved = await sendPushSubscriptionToServer(subscription, userEmail);
            if (saved) {
              setSubscribed(true);
            }
          } else {
            // Subscription failed - permission likely denied, show modal
            setShowEducation(true);
          }
        } catch (error) {
          console.error('Push notification toggle failed:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // First time toggling - ALWAYS show education modal
        setShowEducation(true);
        setHasToggledOn(true);
      }
      return;
    }

    // Unsubscribe
    setLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setSubscribed(false);
      }
    } catch (error) {
      console.error('Push notification toggle failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptEducation = async () => {
    setShowEducation(false);
    setLoading(true);

    try {
      const subscription = await subscribeToPushNotifications();
      if (subscription) {
        // Use provided email or fallback to empty string (server will handle)
        const userEmail = email || '';
        const saved = await sendPushSubscriptionToServer(subscription, userEmail);
        if (saved) {
          setSubscribed(true);
          setHasAcceptedThisSession(true); // Mark as accepted for this session
        }
      } else {
        // Permission was denied, show modal again with warning
        setShowEducation(true);
      }
    } catch (error) {
      console.error('Push notification toggle failed:', error);
      // Show modal again on error
      setShowEducation(true);
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return null;
  }

  // Visual states: danger (public), active (subscribed), available (default)
  const state = isPublicComputer ? 'danger' : subscribed ? 'active' : 'available';

  return (
    <>
      {/* Minimal visual toggle - uses color, icon, and motion to convey state */}
      <button
        onClick={handleToggle}
        disabled={loading || isPublicComputer}
        className={`
          relative w-full h-16 rounded-2xl overflow-hidden transition-all duration-500
          ${state === 'danger' ? 'bg-gradient-to-br from-red-100 via-red-50 to-orange-50 cursor-not-allowed' : ''}
          ${state === 'active' ? 'bg-gradient-to-br from-blue-100 via-indigo-50 to-blue-50' : ''}
          ${state === 'available' ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 hover:from-blue-100 hover:via-indigo-100 hover:to-blue-100' : ''}
          ${loading ? 'opacity-50' : ''}
        `}
      >
        {/* Content: Icon-only communication */}
        <div className="relative h-full flex items-center justify-between px-5">
          {/* Left: Visual state indicator (icon + color signal) */}
          <div className="flex items-center gap-3">
            {/* Icon changes based on state */}
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${state === 'danger' ? 'bg-red-200' : ''}
              ${state === 'active' ? 'bg-blue-500' : ''}
              ${state === 'available' ? 'bg-blue-200' : ''}
            `}>
              {state === 'danger' && (
                <svg className="w-6 h-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {state === 'active' && (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {state === 'available' && (
                <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </div>

            {/* Minimal text label - only when absolutely necessary */}
            <div className="text-left">
              <div className={`text-sm font-medium transition-colors duration-300
                ${state === 'danger' ? 'text-red-900' : ''}
                ${state === 'active' ? 'text-blue-900' : ''}
                ${state === 'available' ? 'text-blue-900' : ''}
              `}>
                Instant 1st
              </div>
            </div>
          </div>

          {/* Right: Toggle indicator (visual only, no text) */}
          <div className={`
            relative w-14 h-8 rounded-full transition-all duration-300
            ${state === 'danger' ? 'bg-red-300' : ''}
            ${state === 'active' ? 'bg-blue-600' : ''}
            ${state === 'available' ? 'bg-slate-300' : ''}
          `}>
            <div className={`
              absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md
              ${subscribed ? 'translate-x-6' : 'translate-x-0'}
            `}>
              {/* Inner indicator - shows loading spinner */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Educational Modal - only shown when user actively tries to enable */}
      <SecurityEducationModal
        isOpen={showEducation}
        onClose={() => setShowEducation(false)}
        onAccept={handleAcceptEducation}
      />
    </>
  );
}
