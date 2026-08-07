/**
 * Contrast enforcement for the design-system foundation tokens.
 *
 * This test exists because the previous design system shipped a primary blue
 * at 4.02:1 — failing WCAG AA on the background of every primary button —
 * while the accessibility evidence file claimed it passed, and two visual
 * tests asserted the failing value as correct. Documentation does not stop
 * that; a computation does.
 *
 * It reads the REAL stylesheet rather than a copy of the values. A test that
 * restates the palette would pass happily while the shipped CSS drifted.
 */

import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const CSS = readFileSync(join(process.cwd(), "src/styles/foundations.css"), "utf8");

/* -------------------------------------------------------------------------
 * WCAG 2.2 relative luminance and contrast ratio.
 * -----------------------------------------------------------------------*/

function channel(value8Bit: number): number {
  const c = value8Bit / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Reads a token's value out of a specific block of the stylesheet.
 *
 * Scoped by selector because most colour tokens are defined more than once —
 * light on `:root`, dark on `:root.dark`, and dark again inside the
 * prefers-color-scheme query. A naive whole-file match would silently read
 * whichever came first.
 */
function tokenIn(selectorStart: string, name: string): string {
  const start = CSS.indexOf(selectorStart);
  expect(start, `selector not found: ${selectorStart}`).toBeGreaterThan(-1);
  const block = CSS.slice(start, CSS.indexOf("\n}", start));
  const match = block.match(new RegExp(`--ds-${name}\\s*:\\s*([^;]+);`));
  expect(match, `token --ds-${name} not found in ${selectorStart}`).not.toBeNull();
  return match![1].trim();
}

const light = (name: string) => tokenIn(":root,\n:root.light,", name);
const dark = (name: string) => tokenIn(":root.dark,\n:root[data-theme=\"dark\"] {", name);

/* -------------------------------------------------------------------------
 * The surfaces each foreground token can legitimately land on.
 *
 * This is the part the spec got wrong: it computed every ratio against
 * `surface/base` alone. A token used on a sunken well or a raised card has to
 * clear its floor there too, and those surfaces are always the harder ones.
 * -----------------------------------------------------------------------*/
const LIGHT_SURFACES = ["surface-base", "surface-app", "surface-sunken"] as const;
const DARK_SURFACES = ["surface-base", "surface-raised", "surface-sunken"] as const;

/** WCAG 2.2: 4.5:1 for body text, 3:1 for non-text UI (1.4.11). */
const TEXT_FLOOR = 4.5;
const UI_FLOOR = 3;

const FOREGROUNDS: Array<{ token: string; floor: number }> = [
  { token: "content-primary", floor: TEXT_FLOOR },
  { token: "content-secondary", floor: TEXT_FLOOR },
  { token: "content-tertiary", floor: TEXT_FLOOR },
  { token: "accent-default", floor: TEXT_FLOOR },
  { token: "accent-hover", floor: TEXT_FLOOR },
  { token: "accent-active", floor: TEXT_FLOOR },
  { token: "success-default", floor: TEXT_FLOOR },
  { token: "warning-default", floor: TEXT_FLOOR },
  { token: "danger-default", floor: TEXT_FLOOR },
  { token: "info-default", floor: TEXT_FLOOR },
  // Non-text: input edges, checkbox borders, Gantt bar outlines, focus ring.
  { token: "border-strong", floor: UI_FLOOR },
  { token: "border-focus", floor: UI_FLOOR },
];

describe("foundation tokens — foreground on every surface it can appear on", () => {
  describe.each([
    { theme: "light", read: light, surfaces: LIGHT_SURFACES },
    { theme: "dark", read: dark, surfaces: DARK_SURFACES },
  ])("$theme", ({ read, surfaces }) => {
    test.each(FOREGROUNDS)("$token clears $floor:1 on all surfaces", ({ token, floor }) => {
      const fg = read(token);
      for (const surface of surfaces) {
        const ratio = contrast(fg, read(surface));
        expect(
          ratio,
          `--ds-${token} (${fg}) on --ds-${surface} (${read(surface)}) = ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(floor);
      }
    });
  });
});

describe("status pills — text on its own subtle fill", () => {
  // A pill puts its own text on its own tinted background, so the pair has to
  // be checked directly; neither half is ever seen against a plain surface.
  const FAMILIES = ["success", "warning", "danger", "info", "accent"];

  test.each([
    { theme: "light", read: light },
    { theme: "dark", read: dark },
  ])("$theme", ({ read }) => {
    for (const family of FAMILIES) {
      const ratio = contrast(read(`${family}-default`), read(`${family}-subtle`));
      expect(
        ratio,
        `${family}: default on subtle = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(TEXT_FLOOR);
    }
  });
});

describe("filled surfaces — label on a solid accent or status fill", () => {
  test.each([
    { theme: "light", read: light },
    { theme: "dark", read: dark },
  ])("$theme", ({ read }) => {
    for (const family of ["accent", "success", "warning", "danger", "info"]) {
      const ratio = contrast(read(`${family}-on`), read(`${family}-default`));
      expect(
        ratio,
        `${family}: on-colour over default fill = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(TEXT_FLOOR);
    }
  });
});

describe("documented exemption", () => {
  // WCAG 1.4.3 exempts disabled controls. Asserted rather than ignored so the
  // exemption stays a deliberate decision: if someone later uses this token
  // for enabled text, this test is where the reason is recorded.
  test("content/disabled is below the floor, and that is intentional", () => {
    const lightRatio = contrast(light("content-disabled"), light("surface-base"));
    const darkRatio = contrast(dark("content-disabled"), dark("surface-base"));

    expect(lightRatio).toBeLessThan(TEXT_FLOOR);
    expect(darkRatio).toBeLessThan(TEXT_FLOOR);

    // It must still be perceivable — an exemption is not a licence for
    // invisible text.
    expect(lightRatio).toBeGreaterThan(2);
    expect(darkRatio).toBeGreaterThan(2);
  });
});

describe("interaction states", () => {
  // Hover/active are where a palette usually breaks: the base colour is
  // checked, the state it changes to is not, and a hover reads fine to the
  // person who picked it and fails for everyone else.
  const FILLED = [
    { fill: "accent-hover", on: "accent-on" },
    { fill: "accent-active", on: "accent-on" },
    { fill: "danger-hover", on: "danger-on" },
    { fill: "danger-active", on: "danger-on" },
  ];

  test.each([
    { theme: "light", read: light },
    { theme: "dark", read: dark },
  ])("$theme: label stays legible on every filled state", ({ read }) => {
    for (const { fill, on } of FILLED) {
      const ratio = contrast(read(on), read(fill));
      expect(ratio, `${on} on ${fill} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        TEXT_FLOOR
      );
    }
  });

  test.each([
    { theme: "light", read: light },
    { theme: "dark", read: dark },
  ])("$theme: neutral controls stay legible when hovered and pressed", ({ read }) => {
    for (const surface of ["surface-hover", "surface-active"]) {
      const ratio = contrast(read("content-primary"), read(surface));
      expect(
        ratio,
        `content-primary on ${surface} = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(TEXT_FLOOR);
    }
  });

  test.each([
    { theme: "light", read: light },
    { theme: "dark", read: dark },
  ])("$theme: the hovered border still reads as an edge", ({ read }) => {
    const ratio = contrast(read("border-strong-hover"), read("surface-hover"));
    expect(ratio, `border-strong-hover on surface-hover = ${ratio.toFixed(2)}:1`)
      .toBeGreaterThanOrEqual(UI_FLOOR);
  });
});

describe("the dark palette is declared identically in both of its blocks", () => {
  // Dark is declared twice — once for an explicit choice (.dark /
  // [data-theme="dark"]) and once for the OS preference, because a colour
  // whose only definition sits inside a media query leaves the explicit
  // toggle with nothing to apply. Two copies drift. This makes drift a test
  // failure rather than a bug someone finds in dark mode months later.
  /**
   * Slices exactly one rule by counting braces from its opening one.
   *
   * An earlier version looked for a literal "\n  }" to find the end. The two
   * blocks close at different indents — the explicit rule at column 0, the
   * one nested in the media query at column 2 — so from the explicit rule the
   * search ran past its own closing brace and swallowed the media-query rule
   * as well. Both sides then read the same text and the test could never fail.
   * Token values contain no braces, so counting is exact.
   */
  function blockTokens(startMarker: string): Map<string, string> {
    const start = CSS.indexOf(startMarker);
    expect(start, `block not found: ${startMarker}`).toBeGreaterThan(-1);

    const open = CSS.indexOf("{", start);
    let depth = 0;
    let end = open;
    for (let i = open; i < CSS.length; i++) {
      if (CSS[i] === "{") depth++;
      else if (CSS[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    expect(depth, `unbalanced braces after: ${startMarker}`).toBe(0);

    const out = new Map<string, string>();
    for (const m of CSS.slice(open, end).matchAll(/--ds-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      out.set(m[1], m[2].trim());
    }
    return out;
  }

  test("same tokens, same values", () => {
    const explicit = blockTokens(':root.dark,\n:root[data-theme="dark"] {');
    const preference = blockTokens(
      ':root:not(.light):not([data-theme="light"]) {'
    );

    expect(explicit.size).toBeGreaterThan(30);
    expect([...preference.keys()].sort()).toEqual([...explicit.keys()].sort());
    for (const [token, value] of explicit) {
      expect(preference.get(token), `--ds-${token} differs between dark blocks`).toBe(
        value
      );
    }
  });
});

describe("the specific defect this file was created to prevent", () => {
  test("content/tertiary does not regress to the spec's #667085", () => {
    // #667085 measures 4.48:1 on --ds-surface-sunken (#F1F3F7): under the
    // floor, and reachable — the spec puts placeholders in inset wells.
    expect(contrast("#667085", "#F1F3F7")).toBeLessThan(TEXT_FLOOR);
    expect(light("content-tertiary").toLowerCase()).not.toBe("#667085");
  });

  test("the old primary blue never comes back", () => {
    // #007AFF on white is 4.02:1. It shipped, and the evidence file said it
    // passed.
    expect(contrast("#007AFF", "#FFFFFF")).toBeLessThan(TEXT_FLOOR);
    expect(light("accent-default").toLowerCase()).not.toBe("#007aff");
  });

  test("the light content ramp stays ordered", () => {
    // Hierarchy is the point of three content levels. If a change inverts
    // them, the design reads as noise even while every ratio passes.
    const sunken = light("surface-sunken");
    const primary = contrast(light("content-primary"), sunken);
    const secondary = contrast(light("content-secondary"), sunken);
    const tertiary = contrast(light("content-tertiary"), sunken);

    expect(primary).toBeGreaterThan(secondary);
    expect(secondary).toBeGreaterThan(tertiary);
  });
});
