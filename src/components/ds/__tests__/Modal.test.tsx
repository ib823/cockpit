/**
 * Modal and Drawer — the guarantees BaseModal claimed and did not have.
 *
 * `A11Y_EVIDENCE.md` stated that the dialog carried role="dialog", aria-modal
 * and aria-labelledby, and trapped focus. It carried none of them, and passed
 * `initialFocus: false` — telling focus-trap explicitly not to move focus in.
 * The suite that was supposed to catch this asserted HTML strings, which could
 * not, and could not have even if written correctly, because getByRole was
 * broken repo-wide.
 *
 * These drive the rendered component.
 */

import React, { useState } from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal, Drawer } from "../Modal";

function Basic({
  onClose = () => {},
  ...props
}: Partial<React.ComponentProps<typeof Modal>>) {
  return (
    <Modal open title="Delete phase" onClose={onClose} {...props}>
      <p>This removes Realize and its 24 tasks.</p>
      <input aria-label="Confirm phase name" />
    </Modal>
  );
}

describe("dialog semantics", () => {
  test("it is a dialog", () => {
    render(<Basic />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("it is modal", () => {
    render(<Basic />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  test("the title is the accessible name", () => {
    render(<Basic />);
    expect(screen.getByRole("dialog", { name: "Delete phase" })).toBeInTheDocument();
  });

  test("the description is linked when present", () => {
    render(<Basic description="This cannot be undone." />);
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "This cannot be undone."
    );
  });

  test("closed renders nothing", () => {
    render(
      <Modal open={false} title="Delete phase" onClose={() => {}}>
        body
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("focus", () => {
  test("focus moves into the dialog, not onto Close", async () => {
    render(<Basic />);

    await waitFor(() => {
      expect(screen.getByLabelText("Confirm phase name")).toHaveFocus();
    });
    expect(screen.getByRole("button", { name: "Close" })).not.toHaveFocus();
  });

  test("content behind the dialog cannot be reached by Tab", async () => {
    // The guarantee stated as a user would experience it: tabbing must never
    // arrive at the page underneath.
    //
    // Not asserted as "activeElement is always inside the dialog" — under
    // jsdom, userEvent.tab() computes the next tabbable itself and lands on
    // <body> before focus-trap's handler pulls focus back, so that assertion
    // would be measuring jsdom's tab emulation rather than the trap.
    render(
      <>
        <button type="button">Behind the dialog</button>
        <Basic />
      </>
    );

    const background = screen.getByRole("button", { name: "Behind the dialog" });
    await waitFor(() => expect(screen.getByLabelText("Confirm phase name")).toHaveFocus());

    for (let i = 0; i < 8; i++) {
      await userEvent.tab();
      expect(background).not.toHaveFocus();
    }

    // And focus settles back inside rather than drifting away for good.
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement
    );
  });

  test("the trigger regains focus when the dialog closes", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal open={open} title="Delete phase" onClose={() => setOpen(false)}>
            <p>Body</p>
          </Modal>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open" });

    await userEvent.click(trigger);
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe("dismissal", () => {
  test("Escape closes", async () => {
    const onClose = vi.fn();
    render(<Basic onClose={onClose} />);

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("clicking the scrim closes", async () => {
    const onClose = vi.fn();
    render(<Basic onClose={onClose} />);

    // The dialog is portalled to <body>, so the scrim is found from the
    // dialog upwards rather than by guessing at the document structure.
    const scrim = screen.getByRole("dialog").closest("[class*='scrim']");
    expect(scrim).not.toBeNull();

    await userEvent.click(scrim as Element);
    expect(onClose).toHaveBeenCalled();
  });

  test("a drag that starts inside and ends on the scrim does not close", async () => {
    // Selecting text in the body and releasing past the edge must not discard
    // the dialog. This is why dismissal is on mousedown, not click.
    const onClose = vi.fn();
    render(<Basic onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    const scrim = dialog.parentElement!.parentElement!;

    await userEvent.pointer([
      { target: dialog, keys: "[MouseLeft>]" },
      { target: scrim },
      { keys: "[/MouseLeft]" },
    ]);

    expect(onClose).not.toHaveBeenCalled();
  });

  test("a non-dismissible dialog ignores Escape and has no Close button", async () => {
    const onClose = vi.fn();
    render(<Basic onClose={onClose} dismissible={false} />);

    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});

describe("page behind the dialog", () => {
  test("the body cannot scroll while open", () => {
    const { unmount } = render(<Basic />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
  });

  test("scrolling is restored on close", async () => {
    const { unmount } = render(<Basic />);
    unmount();
    await waitFor(() => expect(document.body.style.overflow).not.toBe("hidden"));
  });

  test("a stacked dialog does not unlock the page when it alone closes", async () => {
    function Harness({ second }: { second: boolean }) {
      return (
        <>
          <Modal open title="Parent" onClose={() => {}}>
            <p>Parent body</p>
          </Modal>
          {second && (
            <Modal open title="Child" onClose={() => {}}>
              <p>Child body</p>
            </Modal>
          )}
        </>
      );
    }

    const { rerender } = render(<Harness second />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Harness second={false} />);
    // The parent is still open, so the lock must survive.
    expect(document.body.style.overflow).toBe("hidden");
  });
});

describe("footer", () => {
  test("footer content renders", () => {
    render(
      <Basic
        footer={
          <>
            <button type="button">Cancel</button>
            <button type="button">Delete</button>
          </>
        }
      />
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  test("focus does not land on a destructive footer action", async () => {
    render(
      <Modal
        open
        title="Delete phase"
        onClose={() => {}}
        footer={
          <>
            <button type="button">Cancel</button>
            <button type="button">Delete phase</button>
          </>
        }
      >
        <p>This removes Realize and its 24 tasks.</p>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toContainElement(
        document.activeElement as HTMLElement
      );
    });

    // A prose-only body has no interactive element, so focus falls back to
    // the dialog itself — which is what a screen reader wants, and crucially
    // is not the destructive button.
    expect(screen.getByRole("button", { name: "Delete phase" })).not.toHaveFocus();
    expect(screen.getByRole("button", { name: "Close" })).not.toHaveFocus();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });
});

describe("Drawer", () => {
  test("it carries the same dialog semantics", () => {
    render(
      <Drawer open title="Task details" onClose={() => {}}>
        <p>Body</p>
      </Drawer>
    );

    const drawer = screen.getByRole("dialog", { name: "Task details" });
    expect(drawer).toHaveAttribute("aria-modal", "true");
  });

  test("Escape closes it", async () => {
    const onClose = vi.fn();
    render(
      <Drawer open title="Task details" onClose={onClose}>
        <p>Body</p>
      </Drawer>
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
