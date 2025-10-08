/**
 * A11y Smoke Tests
 * Run axe on key pages to ensure accessibility compliance
 *
 * To run: npm run test:e2e (with axe-core setup)
 *
 * NOTE: These are starter tests. Full implementation requires axe-core + Playwright.
 */

import { describe, it, expect } from 'vitest';

describe('Accessibility - Smoke Tests', () => {
  it.skip('Plan page should have no axe violations', async () => {
    // TODO: Navigate to /project/plan
    // TODO: Run axe.run()
    // TODO: Assert no violations
  });

  it.skip('All interactive elements should have focus-visible styles', async () => {
    // TODO: Tab through all interactive elements
    // TODO: Assert each has visible focus ring
  });

  it.skip('Color contrast should be ≥ 4.5:1', async () => {
    // TODO: Check text colors against backgrounds
    // TODO: Assert all pass WCAG AA
  });

  it.skip('Keyboard navigation should work without mouse', async () => {
    // TODO: Navigate entire Plan page with keyboard only
    // TODO: Assert all actions (select, open sheet, close) work
  });

  it.skip('ARIA labels should be meaningful', async () => {
    // TODO: Check all icons and controls have aria-label
    // TODO: Assert labels describe action (not "icon" or "button")
  });

  it.skip('Screen reader should announce phase selection', async () => {
    // TODO: Select a phase
    // TODO: Assert announcement includes phase name, duration, dates
  });
});

describe('Accessibility - Lighthouse Scores', () => {
  it.skip('Plan page should score ≥ 90 on Lighthouse Accessibility', async () => {
    // TODO: Run Lighthouse on /project/plan
    // TODO: Assert accessibility score ≥ 90
  });

  it.skip('Plan page should score ≥ 85 on Lighthouse Performance', async () => {
    // TODO: Run Lighthouse on /project/plan
    // TODO: Assert performance score ≥ 85
  });
});
