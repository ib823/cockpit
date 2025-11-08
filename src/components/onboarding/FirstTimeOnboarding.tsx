/**
 * FirstTimeOnboarding Component
 * Interactive tour for first-time users
 *
 * Uses browser localStorage to track if user has seen the tour
 */

'use client';

import { useState, useEffect } from 'react';
import { Tour, TourProps } from 'antd';
import { usePathname } from 'next/navigation';

const ONBOARDING_STORAGE_KEY = 'sap-cockpit-onboarding-completed';
const ONBOARDING_VERSION = '1.0'; // Increment to show tour again after updates

// Extract the step type from TourProps
type TourStep = NonNullable<TourProps['steps']>[number];

interface OnboardingStep extends TourStep {
  pathname: string; // Which page this step belongs to
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  // Dashboard steps
  {
    pathname: '/dashboard',
    title: 'Welcome to Keystone!',
    description: 'Let\'s take a quick tour to help you get started. This will only take a minute.',
    target: null,
  },
  {
    pathname: '/dashboard',
    title: 'Quick Actions',
    description: 'Start a new estimate or create a project timeline right from your dashboard.',
    target: () => document.querySelector('[data-tour="quick-actions"]') as HTMLElement,
    placement: 'bottom',
  },
  {
    pathname: '/dashboard',
    title: 'Your Statistics',
    description: 'Track your project metrics, estimates, and time saved at a glance.',
    target: () => document.querySelector('[data-tour="statistics"]') as HTMLElement,
    placement: 'bottom',
  },
  // Estimator steps
  {
    pathname: '/estimator',
    title: 'SAP Estimator',
    description: 'Configure your implementation parameters here. All calculations happen in real-time.',
    target: null,
  },
  {
    pathname: '/estimator',
    title: 'Implementation Profile',
    description: 'Choose your SAP implementation profile to set baseline effort estimates.',
    target: () => document.querySelector('[data-tour="profile-selector"]') as HTMLElement,
    placement: 'right',
  },
  {
    pathname: '/estimator',
    title: 'Live Results',
    description: 'Your estimate updates automatically as you change inputs. No need to click "Calculate"!',
    target: () => document.querySelector('[data-tour="results-panel"]') as HTMLElement,
    placement: 'left',
  },
  {
    pathname: '/estimator',
    title: 'Generate Timeline',
    description: 'When you\'re happy with your estimate, generate a detailed project timeline with one click.',
    target: () => document.querySelector('[data-tour="generate-timeline"]') as HTMLElement,
    placement: 'top',
  },
];

interface FirstTimeOnboardingProps {
  pathname?: string;
}

export function FirstTimeOnboarding({ pathname: propPathname }: FirstTimeOnboardingProps = {}) {
  const routerPathname = usePathname();
  const pathname = propPathname || routerPathname;

  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completedVersion = localStorage.getItem(ONBOARDING_STORAGE_KEY);

    if (completedVersion !== ONBOARDING_VERSION) {
      // Show opt-in banner instead of auto-starting tour
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartTour = () => {
    setShowBanner(false);
    setOpen(true);
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, ONBOARDING_VERSION);
  };

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, ONBOARDING_VERSION);
  };

  const handleStepChange = (current: number) => {
    setCurrentStep(current);
  };

  // Filter steps for current page
  const pageSteps = ONBOARDING_STEPS.filter(step => step.pathname === pathname).map(
    ({ pathname, ...step }) => step
  );

  if (pageSteps.length === 0) return null;

  return (
    <>
      {/* Opt-in Banner */}
      {showBanner && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 1000,
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            maxWidth: '360px',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flexShrink: 0, fontSize: '24px' }}>👋</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', className="text-sm", fontWeight: 600, color: '#111827' }}>
                New here? Take a quick tour
              </h4>
              <p style={{ margin: '0 0 12px 0', className="text-sm", color: '#6b7280', lineHeight: 1.5 }}>
                Learn the key features in under a minute
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleStartTour}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    className="text-sm",
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                >
                  Start Tour
                </button>
                <button
                  onClick={handleDismissBanner}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    className="text-sm",
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                >
                  No thanks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tour
        open={open}
        onClose={handleClose}
        onChange={handleStepChange}
        current={currentStep}
        steps={pageSteps}
        indicatorsRender={(current, total) => (
          <span className="text-xs" style={{ color: '#64748b'
          }}>
            {current + 1} / {total}
          </span>
        )}
        type="primary"
        arrow={true}
        mask={{
          style: {
            backdropFilter: 'blur(2px)',
            backgroundColor: 'rgba(0, 0, 0, 0.45)'
          }
        }}
      />

      {/* Add slide-in animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

/**
 * Reset onboarding (for testing or user request)
 */
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  const completedVersion = localStorage.getItem(ONBOARDING_STORAGE_KEY);
  return completedVersion === ONBOARDING_VERSION;
}
