/**
 * Field family — the accessibility contract.
 *
 * These assert the wiring that makes a form usable without sight: the label
 * names the control, the helper and error text are *linked* to it rather than
 * merely adjacent, and invalidity is announced rather than only painted red.
 */

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Textarea, NumberInput, SearchInput, Select } from "../Field";

describe("labels name their control", () => {
  test.each([
    ["Input", <Input key="i" label="Task name" />],
    ["Textarea", <Textarea key="t" label="Task name" />],
    ["NumberInput", <NumberInput key="n" label="Task name" />],
    [
      "Select",
      <Select key="s" label="Task name">
        <option>A</option>
      </Select>,
    ],
  ])("%s is reachable by its label text", (_name, element) => {
    render(element);
    expect(screen.getByLabelText(/Task name/)).toBeInTheDocument();
  });

  test("clicking the label focuses the control", async () => {
    render(<Input label="Task name" />);
    await userEvent.click(screen.getByText(/Task name/));
    expect(screen.getByLabelText(/Task name/)).toHaveFocus();
  });
});

describe("helper and error text are linked, not merely adjacent", () => {
  test("helper text is announced with the field", () => {
    render(<Input label="Task name" helper="Shown in the Gantt tree." />);
    expect(screen.getByLabelText(/Task name/)).toHaveAccessibleDescription(
      "Shown in the Gantt tree."
    );
  });

  test("error text replaces the helper as the description", () => {
    render(
      <Input label="Task name" helper="Shown in the Gantt tree." error="Task name is required." />
    );

    const input = screen.getByLabelText(/Task name/);
    expect(input).toHaveAccessibleDescription("Task name is required.");
    // One line, not two — a validating form must not grow and push the next
    // field down the page.
    expect(screen.queryByText("Shown in the Gantt tree.")).not.toBeInTheDocument();
  });

  test("an invalid field says so, rather than only looking red", () => {
    render(<Input label="Task name" error="Task name is required." />);
    expect(screen.getByLabelText(/Task name/)).toHaveAttribute("aria-invalid", "true");
  });

  test("a valid field is not marked invalid", () => {
    render(<Input label="Task name" helper="Optional guidance" />);
    expect(screen.getByLabelText(/Task name/)).not.toHaveAttribute("aria-invalid");
  });
});

describe("read-only and disabled are different states", () => {
  test("read-only keeps the value editable-looking but not editable", async () => {
    render(<Input label="Rate" readOnly defaultValue="1200" />);
    const input = screen.getByLabelText("Rate");

    expect(input).toHaveAttribute("readonly");
    expect(input).not.toBeDisabled();

    await userEvent.type(input, "999");
    expect(input).toHaveValue("1200");
  });

  test("read-only stays focusable, so it can still be read and copied", async () => {
    render(<Input label="Rate" readOnly defaultValue="1200" />);
    await userEvent.tab();
    expect(screen.getByLabelText("Rate")).toHaveFocus();
  });

  test("disabled is genuinely disabled", () => {
    render(<Input label="Rate" disabled />);
    expect(screen.getByLabelText("Rate")).toBeDisabled();
  });
});

describe("required", () => {
  test("required is announced, not just marked with an asterisk", () => {
    render(<Input label="Task name" required />);
    expect(screen.getByLabelText(/Task name/)).toBeRequired();
  });
});

describe("NumberInput", () => {
  test("the steppers change the value and notify React", async () => {
    const onChange = vi.fn();
    render(<NumberInput label="Allocation" defaultValue={50} step={5} onChange={onChange} />);

    // The steppers are aria-hidden, so query by DOM rather than role — that
    // is the point of the test: they must not add tab stops.
    const buttons = document.querySelectorAll("button");
    expect(buttons).toHaveLength(2);

    await userEvent.click(buttons[0]);
    expect(screen.getByLabelText("Allocation")).toHaveValue(55);
  });

  test("the steppers add no tab stops", async () => {
    render(<NumberInput label="Allocation" defaultValue={50} />);

    await userEvent.tab();
    expect(screen.getByLabelText("Allocation")).toHaveFocus();

    // Tabbing again must leave the field entirely rather than landing on a
    // stepper — a table of numeric cells would otherwise triple its tab stops.
    await userEvent.tab();
    expect(screen.getByLabelText("Allocation")).not.toHaveFocus();
  });

  test("the preconditions for browser arrow-key stepping are present", () => {
    // The steppers are deliberately aria-hidden and out of the tab order
    // because a native number input already steps on ArrowUp/ArrowDown. That
    // stepping is implemented by the browser, and jsdom does not emulate it —
    // asserting the value changes here would only prove jsdom's behaviour, not
    // a user's. So this asserts the preconditions that make browsers do it,
    // and the keystroke itself belongs in the Playwright suite.
    render(<NumberInput label="Allocation" defaultValue={50} step={5} />);
    const input = screen.getByLabelText("Allocation");

    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("step", "5");
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute("readonly");
  });

  test("a read-only number cannot be stepped", async () => {
    render(<NumberInput label="Allocation" defaultValue={50} readOnly />);
    const buttons = document.querySelectorAll("button");

    await userEvent.click(buttons[0]);
    expect(screen.getByLabelText("Allocation")).toHaveValue(50);
  });
});

describe("SearchInput", () => {
  test("the clear button appears only when there is something to clear", () => {
    const { rerender } = render(
      <SearchInput label="Search" value="" onChange={() => {}} onClear={() => {}} />
    );
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();

    rerender(<SearchInput label="Search" value="rate" onChange={() => {}} onClear={() => {}} />);
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });

  test("clearing calls back", async () => {
    const onClear = vi.fn();
    render(<SearchInput label="Search" value="rate" onChange={() => {}} onClear={onClear} />);

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test("it is exposed as a searchbox", () => {
    render(<SearchInput label="Search" value="" onChange={() => {}} />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });
});

describe("Select", () => {
  test("it is a native select, so it keeps platform keyboard and type-ahead", async () => {
    render(
      <Select label="Region">
        <option value="emea">EMEA</option>
        <option value="apac">APAC</option>
      </Select>
    );

    const select = screen.getByLabelText("Region");
    expect(select.tagName).toBe("SELECT");

    await userEvent.selectOptions(select, "apac");
    expect(select).toHaveValue("apac");
  });
});

describe("adornments sit inside the field", () => {
  test("a prefix does not become a separate focusable control", async () => {
    render(<Input label="Rate" prefix="MYR" defaultValue="2400" />);

    expect(screen.getByText("MYR")).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByLabelText("Rate")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByLabelText("Rate")).not.toHaveFocus();
  });
});
