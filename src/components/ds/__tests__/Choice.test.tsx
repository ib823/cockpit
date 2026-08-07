/**
 * Choice controls — semantics that hand-rolled versions usually lose.
 *
 * Each of these keeps a real `<input>` under the visual control. The point of
 * these tests is that the platform semantics survive: role, checked state,
 * keyboard operation, and grouping.
 */

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox, Radio, Toggle, ChoiceGroup } from "../Choice";

describe("Checkbox", () => {
  test("it is a real checkbox with the label as its name", () => {
    render(<Checkbox label="Include weekends" />);
    expect(screen.getByRole("checkbox", { name: "Include weekends" })).toBeInTheDocument();
  });

  test("it toggles by click and by keyboard", async () => {
    render(<Checkbox label="Include weekends" />);
    const box = screen.getByRole("checkbox", { name: "Include weekends" });

    await userEvent.click(box);
    expect(box).toBeChecked();

    // Space is the platform binding; losing it is the classic cost of
    // replacing the input with a styled div.
    await userEvent.keyboard(" ");
    expect(box).not.toBeChecked();
  });

  test("indeterminate is set on the DOM property, which has no attribute", () => {
    render(<Checkbox label="Select all" indeterminate />);
    const box = screen.getByRole("checkbox", { name: "Select all" }) as HTMLInputElement;

    expect(box.indeterminate).toBe(true);
    expect(box).toBePartiallyChecked();
  });

  test("a description is linked to the control", () => {
    render(<Checkbox label="Select all" description="3 of 12 tasks selected" />);
    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "3 of 12 tasks selected"
    );
  });

  test("read-only blocks the change but keeps the control reachable", async () => {
    render(<Checkbox label="Accept the rate card" readOnly defaultChecked />);
    const box = screen.getByRole("checkbox");

    expect(box).not.toBeDisabled();
    await userEvent.click(box);
    expect(box).toBeChecked();
  });

  test("disabled blocks the change", async () => {
    render(<Checkbox label="Accept the rate card" disabled />);
    const box = screen.getByRole("checkbox");

    await userEvent.click(box);
    expect(box).not.toBeChecked();
  });

  test("error is announced, not only coloured", () => {
    render(<Checkbox label="Accept the rate card" error />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Radio", () => {
  test("radios in a group are mutually exclusive", async () => {
    render(
      <ChoiceGroup legend="Pricing model">
        <Radio name="pricing" label="Fixed price" value="fixed" />
        <Radio name="pricing" label="Time and materials" value="tm" />
      </ChoiceGroup>
    );

    await userEvent.click(screen.getByRole("radio", { name: "Time and materials" }));
    expect(screen.getByRole("radio", { name: "Time and materials" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Fixed price" })).not.toBeChecked();
  });

  test("arrow keys move between radios — platform behaviour, kept", async () => {
    render(
      <ChoiceGroup legend="Pricing model">
        <Radio name="pricing" label="Fixed price" value="fixed" defaultChecked />
        <Radio name="pricing" label="Time and materials" value="tm" />
      </ChoiceGroup>
    );

    screen.getByRole("radio", { name: "Fixed price" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Time and materials" })).toBeChecked();
  });

  test("a radio carries no aria-invalid — the role does not support it", () => {
    render(
      <ChoiceGroup legend="Pricing model" error="Choose a pricing model.">
        <Radio name="pricing" label="Fixed price" value="fixed" error />
      </ChoiceGroup>
    );

    expect(screen.getByRole("radio")).not.toHaveAttribute("aria-invalid");
  });
});

describe("ChoiceGroup", () => {
  test("the legend names the group, so a radio is not announced context-free", () => {
    render(
      <ChoiceGroup legend="Pricing model">
        <Radio name="pricing" label="Fixed price" value="fixed" />
      </ChoiceGroup>
    );

    expect(screen.getByRole("group", { name: "Pricing model" })).toBeInTheDocument();
  });

  test("group-level validity lives on the group, where radios can carry it", () => {
    render(
      <ChoiceGroup legend="Pricing model" error="Choose a pricing model.">
        <Radio name="pricing" label="Fixed price" value="fixed" />
      </ChoiceGroup>
    );

    const group = screen.getByRole("group", { name: "Pricing model" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("Choose a pricing model.");
  });

  test("the error replaces the helper rather than stacking", () => {
    render(
      <ChoiceGroup legend="Pricing model" helper="Affects the proposal." error="Required.">
        <Radio name="pricing" label="Fixed price" value="fixed" />
      </ChoiceGroup>
    );

    expect(screen.queryByText("Affects the proposal.")).not.toBeInTheDocument();
    expect(screen.getByText("Required.")).toBeInTheDocument();
  });
});

describe("Toggle", () => {
  test("it is a switch, so it announces on/off rather than checked", () => {
    render(<Toggle label="Email notifications" />);
    expect(screen.getByRole("switch", { name: "Email notifications" })).toBeInTheDocument();
  });

  test("it flips", async () => {
    const onChange = vi.fn();
    render(<Toggle label="Email notifications" onChange={onChange} />);

    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("pending is announced as busy, distinct from on", () => {
    // A toggle commits immediately with no Save to press, so an unconfirmed
    // change must not present itself as done.
    render(<Toggle label="Email notifications" checked pending onChange={() => {}} />);
    const control = screen.getByRole("switch");

    expect(control).toHaveAttribute("aria-busy", "true");
    expect(control).toBeChecked();
  });

  test("a hidden label is still the accessible name", () => {
    render(<Toggle label="Email notifications" hideLabel />);
    expect(screen.getByRole("switch", { name: "Email notifications" })).toBeInTheDocument();
  });

  test("read-only blocks the flip", async () => {
    render(<Toggle label="Email notifications" readOnly defaultChecked />);
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toBeChecked();
  });
});
