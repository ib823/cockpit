/**
 * Feedback composites — the announcement behaviour, which is the part that
 * silently fails in production and never shows up in a screenshot.
 */

import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState, Banner, ToastProvider, useToast } from "../Feedback";

describe("EmptyState", () => {
  test("first-run is a status, not an alert — nothing is wrong", () => {
    render(
      <EmptyState
        kind="first-run"
        title="Build the timeline"
        body="Start with the five SAP Activate phases."
      />
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("an error is an alert, because the user is blocked", () => {
    render(
      <EmptyState
        kind="error"
        title="The plan could not be loaded"
        body="The server did not respond within 30 seconds."
        reference="PRJ-2291 / 14:32"
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  test("an error shows its support reference", () => {
    render(
      <EmptyState
        kind="error"
        title="The plan could not be loaded"
        body="Your local copy is intact."
        reference="PRJ-2291 / 14:32"
      />
    );

    // Without it, a support conversation starts with "which one?".
    expect(screen.getByText("PRJ-2291 / 14:32")).toBeInTheDocument();
  });

  test("the heading and explanation are both rendered", () => {
    render(
      <EmptyState
        kind="no-results"
        title="No tasks match these filters"
        body="3 filters are active. Removing the allocation filter would show 46 tasks."
      />
    );

    expect(
      screen.getByRole("heading", { name: "No tasks match these filters" })
    ).toBeInTheDocument();
    expect(screen.getByText(/would show 46 tasks/)).toBeInTheDocument();
  });

  test("actions render", () => {
    render(
      <EmptyState
        kind="no-results"
        title="No tasks match these filters"
        body="3 filters are active."
        primaryAction={<button type="button">Remove allocation filter</button>}
        secondaryAction={<button type="button">Clear all filters</button>}
      />
    );

    expect(
      screen.getByRole("button", { name: "Remove allocation filter" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all filters" })).toBeInTheDocument();
  });
});

describe("Banner", () => {
  test("danger is an alert; the rest are statuses", () => {
    const { rerender } = render(<Banner tone="danger" title="Sync failed" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(<Banner tone="info" title="Viewing a baseline" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("dismissal names what is being dismissed", async () => {
    const onDismiss = vi.fn();
    render(<Banner tone="info" title="Viewing a baseline" onDismiss={onDismiss} />);

    // "Dismiss" alone is ambiguous when three banners are stacked.
    await userEvent.click(
      screen.getByRole("button", { name: "Dismiss: Viewing a baseline" })
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("a banner without onDismiss cannot be dismissed", () => {
    render(<Banner tone="warning" title="Over-allocated" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Toast", () => {
  function Harness() {
    const { show } = useToast();
    return (
      <>
        <button type="button" onClick={() => show("Plan saved")}>
          Save
        </button>
        <button type="button" onClick={() => show("Sync failed", { tone: "danger" })}>
          Fail
        </button>
      </>
    );
  }

  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  test("the live region exists before any toast does", () => {
    // Creating a live region at the moment a message arrives is the classic
    // reason announcements are silently dropped — the region has to be in the
    // DOM first for assistive technology to be watching it.
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toBeEmptyDOMElement();
  });

  test("a toast appears in the live region", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Plan saved")).toBeInTheDocument();
  });

  test("an ordinary toast auto-dismisses", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Plan saved")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.queryByText("Plan saved")).not.toBeInTheDocument();
  });

  test("an error toast stays until dismissed", async () => {
    // An error that vanishes on a timer is an error the user may never read.
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Fail" }));

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText("Sync failed")).toBeInTheDocument();
  });

  test("no more than three are visible at once", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    const save = screen.getByRole("button", { name: "Save" });
    for (let i = 0; i < 5; i++) await user.click(save);

    expect(screen.getAllByText("Plan saved")).toHaveLength(3);
  });

  test("useToast outside a provider fails loudly", () => {
    // A silent no-op here would mean a save confirmation that never appears
    // and no indication why.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
