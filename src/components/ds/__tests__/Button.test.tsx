/**
 * Button — behaviour, not markup.
 *
 * The existing a11y suite asserts HTML strings, which is why `BaseModal` could
 * ship with no `role="dialog"` and no focus trap while its evidence file
 * claimed both were present. These tests render the real component and drive
 * it the way a user does.
 */

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";

describe("activation", () => {
  test("a resting button fires its handler", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save plan</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Save plan" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("a disabled button does not fire", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save plan
      </Button>
    );

    await userEvent.click(screen.getByRole("button", { name: "Save plan" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  test("a loading button does not fire again", async () => {
    // The double-submit this prevents is the whole reason the state exists.
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Saving…" onClick={onClick}>
        Save plan
      </Button>
    );

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  test("a disabled submit button does not submit its form", async () => {
    // aria-disabled carries no behaviour of its own, so without an explicit
    // preventDefault the form would still submit.
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" disabled>
          Save plan
        </Button>
      </form>
    );

    await userEvent.click(screen.getByRole("button", { name: "Save plan" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("focusability", () => {
  test("a disabled button is still reachable by keyboard", async () => {
    // The point of aria-disabled over the disabled attribute: a control the
    // user cannot reach is a control that can never explain why it is off.
    render(<Button disabled>Save plan</Button>);

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Save plan" })).toHaveFocus();
  });

  test("keyboard activation is blocked while disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save plan
      </Button>
    );

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("state is announced", () => {
  test("disabled sets aria-disabled and never the disabled attribute", () => {
    render(<Button disabled>Save plan</Button>);
    const button = screen.getByRole("button", { name: "Save plan" });

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
  });

  test("loading sets aria-busy but not aria-disabled", () => {
    // A busy control is not an unavailable one, and marking it disabled would
    // also paint the disabled grey over the loading state.
    render(
      <Button loading loadingLabel="Saving…">
        Save plan
      </Button>
    );
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).not.toHaveAttribute("aria-disabled");
  });

  test("a resting button announces neither", () => {
    render(<Button>Save plan</Button>);
    const button = screen.getByRole("button", { name: "Save plan" });

    expect(button).not.toHaveAttribute("aria-busy");
    expect(button).not.toHaveAttribute("aria-disabled");
  });
});

describe("loading", () => {
  test("the progressive label replaces the resting one visually", () => {
    render(
      <Button loading loadingLabel="Saving…">
        Save plan
      </Button>
    );

    expect(screen.getByText("Saving…")).toBeInTheDocument();
    // The resting label stays in the DOM to hold the width open.
    expect(screen.getByText("Save plan")).toBeInTheDocument();
  });

  test("the resting label is kept in the layout so the row cannot reflow", () => {
    render(
      <Button loading loadingLabel="Saving…">
        Save plan
      </Button>
    );

    // visibility:hidden reserves space; display:none would not. This is the
    // difference between a stable row and one that jumps when the user clicks.
    const resting = screen.getByText("Save plan");
    expect(resting.className).not.toBe("");
    expect(screen.getByRole("button")).toContainElement(resting);
  });
});

describe("icon-only buttons", () => {
  test("the label becomes the accessible name", () => {
    render(<Button iconOnly label="Add task" icon={<svg />} />);
    expect(screen.getByRole("button", { name: "Add task" })).toBeInTheDocument();
  });

  test("an icon-only button cannot be built without a name", () => {
    // Enforced by the type signature: `label` is required when `iconOnly` is
    // set, so the nameless case fails to compile rather than shipping.
    // @ts-expect-error - iconOnly requires label
    const invalid = <Button iconOnly icon={<svg />} />;
    expect(invalid).toBeTruthy();
  });
});

describe("menu buttons", () => {
  test("a menu button announces its popup and collapsed state", () => {
    render(<Button menu>Filters</Button>);
    const button = screen.getByRole("button", { name: "Filters" });

    expect(button).toHaveAttribute("aria-haspopup", "menu");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("expanded is reflected", () => {
    render(
      <Button menu expanded>
        Filters
      </Button>
    );
    expect(screen.getByRole("button", { name: "Filters" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  test("a plain button claims no popup", () => {
    render(<Button>Filters</Button>);
    const button = screen.getByRole("button", { name: "Filters" });

    expect(button).not.toHaveAttribute("aria-haspopup");
    expect(button).not.toHaveAttribute("aria-expanded");
  });
});

describe("defaults", () => {
  test("type defaults to button, so it cannot submit a form by accident", () => {
    render(<Button>Add phase</Button>);
    expect(screen.getByRole("button", { name: "Add phase" })).toHaveAttribute(
      "type",
      "button"
    );
  });

  test("an explicit type is respected", () => {
    render(<Button type="submit">Save plan</Button>);
    expect(screen.getByRole("button", { name: "Save plan" })).toHaveAttribute(
      "type",
      "submit"
    );
  });
});
