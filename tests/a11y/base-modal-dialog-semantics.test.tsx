/**
 * Regression tests for BaseModal's dialog semantics.
 *
 * BaseModal is the foundation for 28 dialogs across the app, and it shipped
 * without `role="dialog"`, without `aria-modal`, and without `aria-labelledby`
 * — so assistive technology announced each one as an unlabelled group and did
 * not confine the user to it. It also passed `initialFocus: false` to
 * focus-trap, explicitly telling the trap NOT to move focus into the dialog,
 * leaving keyboard users on the trigger behind the overlay (WCAG 2.4.3).
 *
 * docs/A11Y_EVIDENCE.md listed all of this as fixed under "D-01: Core A11y
 * Violations Fixed". It was not. These tests exist so that claim becomes
 * enforceable rather than aspirational.
 *
 * Note these mount the real component, unlike tests/a11y/axe-automated.test.ts,
 * which runs axe over hand-written HTML string literals and therefore cannot
 * detect a regression in the application itself.
 */

import React from "react";
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BaseModal } from "@/components/ui/BaseModal";

// Render animated elements as plain ones so assertions describe the DOM the
// user actually gets. Matches the mocking already used in
// src/components/ui/__tests__/BaseModal.test.tsx.
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// focus-trap-react throws in jsdom when it cannot find a tabbable node. Focus
// behaviour itself is verified in the real browser via Playwright; these tests
// assert the ARIA contract and the scroll lock.
vi.mock("focus-trap-react", () => ({
  default: ({ children }: any) => <>{children}</>,
}));
/* eslint-enable @typescript-eslint/no-explicit-any */

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

/**
 * Returns the dialog node.
 *
 * Queried by attribute rather than `getByRole`, because jsdom does not do
 * layout: `getComputedStyle` reports `display: none` for these inline-styled
 * nodes, so dom-testing-library treats the dialog as removed from the
 * accessibility tree and role queries find nothing. The attribute contract is
 * what these tests are pinning, and it is what assistive technology reads.
 */
function getDialog(): HTMLElement {
  const el = document.querySelector<HTMLElement>('[role="dialog"]');
  if (!el) throw new Error("no element with role=dialog was rendered");
  return el;
}

function getDialogs(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'));
}

function renderModal(props: Partial<React.ComponentProps<typeof BaseModal>> = {}) {
  return render(
    <BaseModal isOpen onClose={() => {}} title="Allocate resources" {...props}>
      <p>body content</p>
    </BaseModal>
  );
}

describe("BaseModal dialog semantics", () => {
  test("exposes a dialog role", () => {
    renderModal();
    expect(getDialog()).toBeInTheDocument();
  });

  test("marks the dialog as modal", () => {
    renderModal();
    expect(getDialog()).toHaveAttribute("aria-modal", "true");
  });

  test("is accessibly named by its own visible heading", () => {
    renderModal({ title: "Allocate resources" });

    const dialog = getDialog();
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();

    // The label must resolve to the real heading node, not just any element.
    const heading = document.getElementById(labelledBy!);
    expect(heading).not.toBeNull();
    expect(heading).toHaveTextContent("Allocate resources");
    expect(heading?.tagName).toBe("H2");
  });

  test("describes itself with the subtitle when one is present", () => {
    renderModal({ subtitle: "Across the delivery phase" });

    const dialog = getDialog();
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      "Across the delivery phase"
    );
  });

  test("omits aria-describedby when there is no subtitle", () => {
    renderModal();
    expect(getDialog()).not.toHaveAttribute("aria-describedby");
  });

  test("is focusable so focus can be moved into it on open", () => {
    renderModal();
    // initialFocus targets this node; it needs tabIndex=-1 to accept focus.
    expect(getDialog()).toHaveAttribute("tabindex", "-1");
  });

  test("two dialogs get distinct label ids", () => {
    render(
      <>
        <BaseModal isOpen onClose={() => {}} title="First">
          <p>a</p>
        </BaseModal>
        <BaseModal isOpen onClose={() => {}} title="Second">
          <p>b</p>
        </BaseModal>
      </>
    );

    const [first, second] = getDialogs();
    expect(first.getAttribute("aria-labelledby")).not.toBe(
      second.getAttribute("aria-labelledby")
    );
  });
});

describe("BaseModal body scroll lock", () => {
  test("locks page scroll while open", () => {
    renderModal();
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("closing a stacked modal keeps the lock while an outer one is open", () => {
    const { rerender } = render(
      <>
        <BaseModal isOpen onClose={() => {}} title="Outer">
          <p>outer</p>
        </BaseModal>
        <BaseModal isOpen onClose={() => {}} title="Inner">
          <p>inner</p>
        </BaseModal>
      </>
    );

    expect(document.body.style.overflow).toBe("hidden");

    // Close only the inner modal. The page must stay locked — the outer modal
    // is still covering it.
    rerender(
      <>
        <BaseModal isOpen onClose={() => {}} title="Outer">
          <p>outer</p>
        </BaseModal>
        <BaseModal isOpen={false} onClose={() => {}} title="Inner">
          <p>inner</p>
        </BaseModal>
      </>
    );

    expect(document.body.style.overflow).toBe("hidden");
  });

  test("releases the lock once the last modal closes", () => {
    const { rerender } = render(
      <BaseModal isOpen onClose={() => {}} title="Only">
        <p>only</p>
      </BaseModal>
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <BaseModal isOpen={false} onClose={() => {}} title="Only">
        <p>only</p>
      </BaseModal>
    );
    expect(document.body.style.overflow).toBe("");
  });
});
