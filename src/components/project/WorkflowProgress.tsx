/**
 * WorkflowProgress Component
 * Shows current progress in the project workflow: Capture → Decide → Plan → Present
 *
 * Clear visual indicator of where user is in the process
 */

'use client';

import { usePathname } from 'next/navigation';
import { CheckCircleFilled, RightOutlined } from '@ant-design/icons';

interface WorkflowStep {
  key: string;
  label: string;
  path: string;
  description: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    key: 'capture',
    label: 'Capture',
    path: '/project/capture',
    description: 'Gather requirements'
  },
  {
    key: 'decide',
    label: 'Decide',
    path: '/project/decide',
    description: 'Define architecture'
  },
  {
    key: 'plan',
    label: 'Plan',
    path: '/project/plan',
    description: 'Create timeline'
  },
  {
    key: 'present',
    label: 'Present',
    path: '/project/present',
    description: 'Generate proposal'
  }
];

export function WorkflowProgress() {
  const pathname = usePathname();

  const currentStepIndex = WORKFLOW_STEPS.findIndex(step =>
    pathname.includes(step.path)
  );

  if (currentStepIndex === -1) return null;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        marginTop: '-24px',
        marginLeft: '-24px',
        marginRight: '-24px',
        marginBottom: '24px'
      }}
      role="navigation"
      aria-label="Project workflow progress"
    >
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Step */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  gap: '8px'
                }}
              >
                {/* Circle/Check */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive
                      ? '#2563eb'
                      : isCompleted
                        ? '#16a34a'
                        : '#f3f4f6',
                    color: isActive || isCompleted ? '#ffffff' : '#9ca3af',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    border: isActive ? '2px solid #2563eb' : 'none',
                    boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none'
                  }}
                  role="img"
                  aria-label={
                    isCompleted
                      ? `${step.label} completed`
                      : isActive
                        ? `${step.label} in progress`
                        : `${step.label} upcoming`
                  }
                >
                  {isCompleted ? (
                    <CheckCircleFilled style={{ fontSize: '16px' }} />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive
                        ? '#0f172a'
                        : isCompleted
                          ? '#16a34a'
                          : '#64748b',
                      marginBottom: '2px'
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      display: isActive ? 'block' : 'none'
                    }}
                  >
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Arrow (except for last step) */}
              {index < WORKFLOW_STEPS.length - 1 && (
                <RightOutlined
                  style={{
                    fontSize: '12px',
                    color: isCompleted ? '#16a34a' : '#d1d5db',
                    marginTop: '-32px',
                    transition: 'color 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)'
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Screen reader only text */}
      <div className="sr-only" role="status" aria-live="polite">
        Step {currentStepIndex + 1} of {WORKFLOW_STEPS.length}: {WORKFLOW_STEPS[currentStepIndex].label}
      </div>
    </div>
  );
}
