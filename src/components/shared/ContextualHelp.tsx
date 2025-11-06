/**
 * Contextual Help System
 *
 * Provides context-aware help, tooltips, and guidance throughout the application
 */

'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Tooltip, Drawer, Collapse, Button } from 'antd';
import { HelpCircle, BookOpen, Lightbulb, Video, ExternalLink, X } from 'lucide-react';
import { colorValues, withOpacity } from '@/lib/design-system';

interface HelpContent {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
  videoUrl?: string;
  docsUrl?: string;
}

interface ContextualHelpProps {
  context: string; // e.g., 'gantt-tool', 'estimator', 'dashboard'
  helpContent?: HelpContent;
  children?: ReactNode;
}

// Help content database
const HELP_CONTENT: Record<string, HelpContent> = {
  'gantt-tool': {
    title: 'Gantt Chart Tool',
    description:
      'Create professional project timelines with phases, tasks, dependencies, and resource allocation.',
    steps: [
      'Create phases to organize your project',
      'Add tasks within each phase',
      'Set dependencies between tasks',
      'Assign resources to tasks',
      'Track progress with percentage completion',
    ],
    tips: [
      'Use Cmd/Ctrl+Z to undo changes',
      'Right-click tasks for quick actions',
      'Drag tasks to reschedule',
      'Use templates to start quickly',
    ],
  },
  'critical-path': {
    title: 'Critical Path Analysis',
    description:
      'Identify the sequence of tasks that determines your project duration and find optimization opportunities.',
    steps: [
      'Review tasks on the critical path (zero slack)',
      'Monitor risky tasks with low slack',
      'Consider crashing opportunities for time savings',
      'Evaluate fast-tracking to parallelize work',
    ],
    tips: [
      'Any delay in critical path tasks delays the entire project',
      'Focus resources on critical path to stay on schedule',
      'Buffer time protects against unexpected delays',
    ],
  },
  'baseline-comparison': {
    title: 'Baseline Comparison',
    description:
      'Compare actual project progress against saved baselines to track variance and identify issues early.',
    steps: [
      'Save a baseline when your plan is approved',
      'Update project progress regularly',
      'Review variance reports to identify drift',
      'Take corrective action on critical issues',
    ],
    tips: [
      'Save baselines at major milestones',
      'Schedule Performance Index (SPI) > 1 means ahead of schedule',
      'Address critical issues immediately',
    ],
  },
  'analytics-dashboard': {
    title: 'Analytics Dashboard',
    description:
      'Comprehensive project insights with burndown charts, velocity tracking, and earned value management.',
    steps: [
      'Review project health in the overview tab',
      'Monitor burndown to track remaining work',
      'Check velocity trends for predictability',
      'Assess resource utilization',
      'Address identified risks',
    ],
    tips: [
      'Green health = ahead of schedule',
      'Velocity shows your team\'s sustainable pace',
      'EVM metrics provide early warning signals',
    ],
  },
  'templates': {
    title: 'Project Templates',
    description:
      'Start projects quickly with pre-configured templates for common project types.',
    steps: [
      'Browse templates by category',
      'Preview template details',
      'Select "Use This Template"',
      'Customize dates and resources',
      'Save as your project',
    ],
    tips: [
      'Templates include realistic durations',
      'You can modify any template after creation',
      'Save your own projects as templates',
    ],
  },
  'resource-planning': {
    title: 'Resource Planning',
    description: 'Manage team members, track allocation, and balance workload across your projects.',
    steps: [
      'Add team members with roles and rates',
      'Assign resources to tasks',
      'Monitor utilization percentages',
      'Balance workload across team',
      'Track costs and budgets',
    ],
    tips: [
      'Aim for 70-90% utilization for optimal productivity',
      'Overallocation (>100%) leads to burnout',
      'Underutilization (<60%) indicates capacity',
    ],
  },
};

/**
 * Contextual Help Tooltip
 */
export function HelpTooltip({
  content,
  title,
  placement = 'top',
  children,
}: {
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children?: ReactNode;
}) {
  return (
    <Tooltip
      title={
        <div>
          {title && (
            <div className="font-semibold mb-1" style={{ color: '#fff' }}>
              {title}
            </div>
          )}
          <div style={{ color: 'rgba(255,255,255,0.85)' }}>{content}</div>
        </div>
      }
      placement={placement}
      overlayStyle={{
        maxWidth: '300px',
      }}
    >
      {children || (
        <HelpCircle
          className="w-4 h-4 cursor-help"
          style={{ color: colorValues.neutral[400] }}
        />
      )}
    </Tooltip>
  );
}

/**
 * Help Panel - Slide-in drawer with contextual help
 */
export function HelpPanel({ context }: { context: string }) {
  const [open, setOpen] = useState(false);
  const helpContent = HELP_CONTENT[context];

  useEffect(() => {
    // Listen for help request
    const handleShowHelp = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.context === context) {
        setOpen(true);
      }
    };

    window.addEventListener('show-contextual-help', handleShowHelp);
    return () => window.removeEventListener('show-contextual-help', handleShowHelp);
  }, [context]);

  if (!helpContent) return null;

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
        style={{
          backgroundColor: colorValues.primary[500],
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
        title="Get help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: colorValues.primary[600] }} />
            <span>Help & Guidance</span>
          </div>
        }
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        width={400}
      >
        <div className="space-y-6">
          {/* Title & Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colorValues.neutral[900] }}>
              {helpContent.title}
            </h3>
            <p className="text-sm" style={{ color: colorValues.neutral[600] }}>
              {helpContent.description}
            </p>
          </div>

          {/* Steps */}
          {helpContent.steps && helpContent.steps.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: colorValues.primary[600] }} />
                <span style={{ color: colorValues.neutral[900] }}>How to Use</span>
              </h4>
              <ol className="space-y-2">
                {helpContent.steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm"
                    style={{ color: colorValues.neutral[700] }}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        backgroundColor: withOpacity(colorValues.primary[500], 0.1),
                        color: colorValues.primary[600],
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tips */}
          {helpContent.tips && helpContent.tips.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" style={{ color: colorValues.warning[600] }} />
                <span style={{ color: colorValues.neutral[900] }}>Pro Tips</span>
              </h4>
              <div className="space-y-2">
                {helpContent.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: withOpacity(colorValues.warning[500], 0.05),
                      border: `1px solid ${colorValues.warning[200]}`,
                    }}
                  >
                    <p className="text-sm" style={{ color: colorValues.neutral[700] }}>
                      💡 {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(helpContent.videoUrl || helpContent.docsUrl) && (
            <div className="space-y-3">
              {helpContent.videoUrl && (
                <a
                  href={helpContent.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border transition-colors duration-150"
                  style={{
                    borderColor: colorValues.neutral[200],
                    color: colorValues.primary[600],
                  }}
                >
                  <Video className="w-4 h-4" />
                  <span className="flex-1 text-sm font-medium">Watch Video Tutorial</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {helpContent.docsUrl && (
                <a
                  href={helpContent.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border transition-colors duration-150"
                  style={{
                    borderColor: colorValues.neutral[200],
                    color: colorValues.primary[600],
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="flex-1 text-sm font-medium">Read Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Quick Reference */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: withOpacity(colorValues.primary[500], 0.03),
              border: `1px solid ${colorValues.primary[200]}`,
            }}
          >
            <h4 className="font-semibold mb-2" style={{ color: colorValues.neutral[900] }}>
              Need More Help?
            </h4>
            <p className="text-sm mb-3" style={{ color: colorValues.neutral[600] }}>
              Press <kbd className="px-2 py-1 bg-white rounded border text-xs">Cmd+/</kbd> to view
              all keyboard shortcuts
            </p>
            <p className="text-sm" style={{ color: colorValues.neutral[600] }}>
              Press <kbd className="px-2 py-1 bg-white rounded border text-xs">Cmd+K</kbd> to open
              the command palette
            </p>
          </div>
        </div>
      </Drawer>
    </>
  );
}

/**
 * Quick Tip Component - Inline help hints
 */
export function QuickTip({ children }: { children: ReactNode }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg mb-4"
      style={{
        backgroundColor: withOpacity(colorValues.primary[500], 0.05),
        border: `1px solid ${colorValues.primary[200]}`,
      }}
    >
      <Lightbulb
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        style={{ color: colorValues.primary[600] }}
      />
      <div className="flex-1 text-sm" style={{ color: colorValues.neutral[700] }}>
        {children}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 transition-opacity duration-150 hover:opacity-70"
        style={{ color: colorValues.neutral[400] }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Hook to trigger contextual help
 */
export function useContextualHelp() {
  const show = (context: string) => {
    window.dispatchEvent(
      new CustomEvent('show-contextual-help', { detail: { context } })
    );
  };

  return { show };
}

/**
 * Feature Highlight - Highlight new features
 */
export function FeatureHighlight({
  title,
  description,
  onDismiss,
}: {
  title: string;
  description: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="p-4 rounded-xl shadow-lg"
      style={{
        backgroundColor: '#fff',
        border: `2px solid ${colorValues.primary[500]}`,
        maxWidth: '350px',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: colorValues.primary[500],
            color: '#fff',
          }}
        >
          ✨
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1" style={{ color: colorValues.neutral[900] }}>
            {title}
          </h4>
          <p className="text-sm mb-3" style={{ color: colorValues.neutral[600] }}>
            {description}
          </p>
          <Button type="primary" size="small" onClick={onDismiss}>
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
}
