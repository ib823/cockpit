/**
 * D-04: Automated axe-core a11y checks
 *
 * Validates critical UI patterns against WCAG 2.2 AA using axe-core.
 * Runs in JSDOM via Vitest — wired into CI through the standard test gate.
 */

import { describe, it, expect, beforeEach } from "vitest";
import axe, { type AxeResults } from "axe-core";

/** Run axe on the current document and return violations */
async function runAxe(html: string): Promise<AxeResults> {
  document.body.innerHTML = html;
  return axe.run(document.body, {
    rules: {
      // Only enforce WCAG 2.2 AA rules
      region: { enabled: false }, // fragments don't have full landmarks
    },
  });
}

function expectNoViolations(results: AxeResults) {
  const violations = results.violations.map(
    (v) => `[${v.id}] ${v.help} (${v.impact}) — ${v.nodes.length} node(s)`
  );
  expect(violations, `axe violations:\n${violations.join("\n")}`).toEqual([]);
}

// ───────────────────────────────────────────────────────────────
// Login form pattern (src/app/login/page.tsx)
// ───────────────────────────────────────────────────────────────
describe("axe: Login form pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes axe with proper label and required attributes", async () => {
    const results = await runAxe(`
      <main>
        <h1>Sign In</h1>
        <form>
          <label for="login-email">Email address</label>
          <input id="login-email" type="email" aria-required="true" autocomplete="email" />
          <button type="submit">Continue</button>
        </form>
        <div role="status" aria-live="polite"></div>
      </main>
    `);
    expectNoViolations(results);
  });

  it("passes axe with error alert visible", async () => {
    const results = await runAxe(`
      <main>
        <h1>Sign In</h1>
        <div role="alert">Invalid email address</div>
        <form>
          <label for="login-email">Email address</label>
          <input id="login-email" type="email" aria-required="true" autocomplete="email" />
          <button type="submit">Continue</button>
        </form>
      </main>
    `);
    expectNoViolations(results);
  });
});

// ───────────────────────────────────────────────────────────────
// Admin data table pattern (src/app/admin/approvals, email-approvals)
// ───────────────────────────────────────────────────────────────
describe("axe: Admin data table pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes axe with caption and scope attributes", async () => {
    const results = await runAxe(`
      <table>
        <caption class="sr-only">User approvals and audit data</caption>
        <thead>
          <tr>
            <th scope="col">Email</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>user@example.com</td>
            <td><span>Active</span></td>
            <td>Feb 20, 2026</td>
            <td><button>Approve</button></td>
          </tr>
        </tbody>
      </table>
    `);
    expectNoViolations(results);
  });

  it("fails axe when form input lacks label", async () => {
    const results = await runAxe(`
      <form>
        <input type="text" id="unlabeled-input" />
        <button type="submit">Submit</button>
      </form>
    `);
    // axe catches missing labels — verifies our test harness detects real violations
    expect(results.violations.some((v) => v.id === "label")).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────
// Modal dialog pattern (recovery-requests approve/reject)
// ───────────────────────────────────────────────────────────────
describe("axe: Modal dialog pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes axe with role, aria-modal, and aria-labelledby", async () => {
    const results = await runAxe(`
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Approve Recovery Request</h2>
        <p>You are about to approve the recovery request.</p>
        <label for="admin-notes">Admin Notes (Optional)</label>
        <textarea id="admin-notes"></textarea>
        <button>Cancel</button>
        <button>Approve Request</button>
      </div>
    `);
    expectNoViolations(results);
  });

  it("passes axe for reject modal with required select", async () => {
    const results = await runAxe(`
      <div role="dialog" aria-modal="true" aria-labelledby="reject-title">
        <h2 id="reject-title">Reject Recovery Request</h2>
        <label for="reject-reason">Rejection Reason</label>
        <select id="reject-reason" aria-required="true">
          <option value="">Select a reason...</option>
          <option value="identity">Unable to verify identity</option>
          <option value="docs">Insufficient documentation</option>
        </select>
        <label for="reject-notes">Additional Notes</label>
        <textarea id="reject-notes"></textarea>
        <button>Cancel</button>
        <button>Reject Request</button>
      </div>
    `);
    expectNoViolations(results);
  });
});

// ───────────────────────────────────────────────────────────────
// Filter button pattern (recovery-requests status filter)
// ───────────────────────────────────────────────────────────────
describe("axe: Filter/navigation pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes axe with aria-current on active filter", async () => {
    const results = await runAxe(`
      <nav aria-label="Filter requests by status">
        <button aria-current="page">Pending (3)</button>
        <button>Approved (1)</button>
        <button>Rejected (0)</button>
        <button>All</button>
      </nav>
    `);
    expectNoViolations(results);
  });
});

// ───────────────────────────────────────────────────────────────
// Toggle button pattern (admin approvals exception toggle)
// ───────────────────────────────────────────────────────────────
describe("axe: Toggle button pattern", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes axe with aria-pressed and aria-label", async () => {
    const results = await runAxe(`
      <table>
        <caption class="sr-only">Toggle controls</caption>
        <thead>
          <tr><th scope="col">User</th><th scope="col">Exception</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>admin@example.com</td>
            <td>
              <button aria-pressed="true" aria-label="Exception enabled for admin@example.com">
                Enabled
              </button>
            </td>
          </tr>
          <tr>
            <td>user@example.com</td>
            <td>
              <button aria-pressed="false" aria-label="Exception disabled for user@example.com">
                Disabled
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    `);
    expectNoViolations(results);
  });
});

// ───────────────────────────────────────────────────────────────
// Loading/status pattern
// ───────────────────────────────────────────────────────────────
describe("axe: Loading and status patterns", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes axe with role=status for loading spinner", async () => {
    const results = await runAxe(`
      <div role="status" aria-live="polite">
        <span aria-hidden="true">⏳</span>
        Loading recovery requests...
      </div>
    `);
    expectNoViolations(results);
  });

  it("passes axe with role=alert for error messages", async () => {
    const results = await runAxe(`
      <div role="alert">
        Failed to load recovery requests. Please try again.
      </div>
    `);
    expectNoViolations(results);
  });
});

// ───────────────────────────────────────────────────────────────
// Image/icon accessibility
// ───────────────────────────────────────────────────────────────
describe("axe: Image and icon accessibility", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes axe with decorative images hidden from AT", async () => {
    const results = await runAxe(`
      <div>
        <img src="/logo.png" alt="Cockpit logo" />
        <svg aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="5" /></svg>
        <button aria-label="Close">
          <svg aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6l-12 12" /></svg>
        </button>
      </div>
    `);
    expectNoViolations(results);
  });

  it("fails axe when img lacks alt text", async () => {
    const results = await runAxe(`
      <div>
        <img src="/logo.png" />
      </div>
    `);
    expect(results.violations.some((v) => v.id === "image-alt")).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────
// Heading hierarchy
// ───────────────────────────────────────────────────────────────
describe("axe: Heading hierarchy", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("passes axe with correct heading order", async () => {
    const results = await runAxe(`
      <main>
        <h1>Account Recovery Requests</h1>
        <section>
          <h2>Pending Requests</h2>
          <h3>Request from user@example.com</h3>
        </section>
      </main>
    `);
    expectNoViolations(results);
  });
});
