/**
 * Display primitives — principle P4, enforced.
 *
 * "Colour is the second channel." These assert that status, counts and
 * progress each carry a non-colour signal, so the interface survives a
 * projector, a monochrome printout, and any colour-vision deficiency.
 */

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusPill, Badge, Chip, Avatar, Progress, Skeleton } from "../Display";

describe("StatusPill carries a word, not only a colour", () => {
  test.each([
    ["success", "On track"],
    ["warning", "At risk"],
    ["danger", "Late"],
    ["info", "Baseline"],
    ["neutral", "Not started"],
  ] as const)("%s renders its label as text", (tone, label) => {
    render(<StatusPill tone={tone}>{label}</StatusPill>);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  test("the glyph is decorative, so it does not pollute the accessible name", () => {
    const { container } = render(<StatusPill tone="danger">Late</StatusPill>);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    // The word carries the meaning; the glyph is the redundant second channel.
    expect(container.textContent).toBe("Late");
  });
});

describe("Badge", () => {
  test("a bare number is given meaning in its accessible name", () => {
    // "3" alone tells a screen-reader user nothing.
    render(<Badge count={3} label="pending approvals" />);
    expect(screen.getByLabelText("3 pending approvals")).toBeInTheDocument();
  });

  test("counts above the cap render as N+ but announce the true figure", () => {
    render(<Badge count={250} max={99} label="notifications" />);

    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.getByLabelText("250 notifications")).toBeInTheDocument();
  });
});

describe("Chip", () => {
  test("a static chip has no remove control", () => {
    render(<Chip>EMEA</Chip>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("removal names what it removes", async () => {
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} removeLabel="EMEA">
        EMEA
      </Chip>
    );

    // "Remove" alone is useless in a row of eight filter chips.
    await userEvent.click(screen.getByRole("button", { name: "Remove EMEA" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe("Avatar", () => {
  test("initials come from the first and last name", () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveTextContent("AL");
  });

  test("a single name yields one initial", () => {
    render(<Avatar name="Ada" />);
    expect(screen.getByRole("img", { name: "Ada" })).toHaveTextContent("A");
  });

  test("a three-part name still uses first and last", () => {
    render(<Avatar name="Ada King Lovelace" />);
    expect(screen.getByRole("img", { name: "Ada King Lovelace" })).toHaveTextContent("AL");
  });

  test("the name is the accessible name whether or not there is a photo", () => {
    render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
  });
});

describe("Progress", () => {
  test("it reports its value, not just its width", () => {
    render(<Progress value={62} label="Realize phase" />);
    const bar = screen.getByRole("progressbar", { name: "Realize phase" });

    expect(bar).toHaveAttribute("aria-valuenow", "62");
    expect(bar).toHaveAttribute("aria-valuetext", "62%");
  });

  test("the figure is printed, so the bar is readable on a projector", () => {
    render(<Progress value={62} label="Realize phase" />);
    expect(screen.getByText("62%")).toBeInTheDocument();
  });

  test("over-allocation is reported truthfully rather than clamped away", () => {
    // 120% is a staffing escalation. Reporting it as 100% would hide the very
    // thing the bar exists to surface.
    render(<Progress value={120} label="Consultant A" />);
    const bar = screen.getByRole("progressbar", { name: "Consultant A" });

    expect(bar).toHaveAttribute("aria-valuenow", "120");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("120%")).toBeInTheDocument();
  });

  test("a negative value does not render a backwards bar", () => {
    render(<Progress value={-10} label="Consultant A" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "-10");
  });
});

describe("Skeleton", () => {
  test("it is hidden from assistive technology", () => {
    // A dozen announced empty boxes tell a screen-reader user nothing; the
    // surrounding region carries aria-busy instead.
    const { container } = render(<Skeleton width={120} height={12} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
