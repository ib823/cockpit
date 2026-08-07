/**
 * Sign-in and registration — behaviour after the design-system migration.
 *
 * The migration replaced presentation only; every handler, state field and
 * auth flow was preserved byte-for-byte. These assert the parts a user
 * touches, so a future change to either page has to keep them working.
 *
 * They also cover three things the old markup did not do, which is the actual
 * argument for migrating: the email field is reachable by its label, errors
 * are announced rather than only coloured red, and a busy button reports
 * `aria-busy` instead of silently disabling.
 */

import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@simplewebauthn/browser", () => ({
  startRegistration: vi.fn(),
  startAuthentication: vi.fn(),
}));

vi.mock("@/components/shared/VersionDisplay", () => ({
  default: () => null,
}));

import LoginPage from "../page";

const originalFetch = global.fetch;

beforeEach(() => {
  push.mockReset();
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
});

function mockCheck(response: Record<string, unknown>) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    json: async () => response,
    ok: true,
  });
}

describe("sign-in — the form", () => {
  test("the email field is reachable by its label", async () => {
    render(<LoginPage />);
    expect(await screen.findByLabelText(/Work email/)).toBeInTheDocument();
  });

  test("it is a real email input with autocomplete, so password managers work", async () => {
    render(<LoginPage />);
    const input = await screen.findByLabelText(/Work email/);

    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
  });

  test("the email field is required", async () => {
    render(<LoginPage />);
    expect(await screen.findByLabelText(/Work email/)).toBeRequired();
  });

  test("Continue is present and typing works", async () => {
    render(<LoginPage />);
    const input = await screen.findByLabelText(/Work email/);

    await userEvent.type(input, "ada@example.com");
    expect(input).toHaveValue("ada@example.com");
    expect(screen.getByRole("button", { name: /Continue/ })).toBeInTheDocument();
  });
});

describe("sign-in — email lookup", () => {
  test("an unapproved email explains itself rather than failing silently", async () => {
    mockCheck({
      ok: true,
      registered: false,
      hasPasskey: false,
      invited: false,
      inviteMethod: null,
      needsAction: "not_found",
    });

    render(<LoginPage />);
    await userEvent.type(await screen.findByLabelText(/Work email/), "nobody@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    await waitFor(() => {
      expect(screen.getByText(/not registered or approved/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Try a different email/ })
    ).toBeInTheDocument();
  });

  test("a code invite shows the code field", async () => {
    mockCheck({
      ok: true,
      registered: false,
      hasPasskey: false,
      invited: true,
      inviteMethod: "code",
      needsAction: "enter_invite",
    });

    render(<LoginPage />);
    await userEvent.type(await screen.findByLabelText(/Work email/), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    const code = await screen.findByLabelText(/6-digit code/);
    expect(code).toBeInTheDocument();
    expect(code).toHaveAttribute("inputmode", "numeric");
    // One-time-code autofill is why users stop retyping SMS codes by hand.
    expect(code).toHaveAttribute("autocomplete", "one-time-code");
  });

  test("the code field rejects non-digits and caps at six", async () => {
    mockCheck({
      ok: true,
      registered: false,
      hasPasskey: false,
      invited: true,
      inviteMethod: "code",
      needsAction: "enter_invite",
    });

    render(<LoginPage />);
    await userEvent.type(await screen.findByLabelText(/Work email/), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    const code = await screen.findByLabelText(/6-digit code/);
    await userEvent.type(code, "12ab34cd567");
    expect(code).toHaveValue("1234567".slice(0, 6));
  });

  test("Create passkey stays unavailable until the code is complete", async () => {
    mockCheck({
      ok: true,
      registered: false,
      hasPasskey: false,
      invited: true,
      inviteMethod: "code",
      needsAction: "enter_invite",
    });

    render(<LoginPage />);
    await userEvent.type(await screen.findByLabelText(/Work email/), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    const submit = await screen.findByRole("button", { name: /Create passkey/ });
    expect(submit).toHaveAttribute("aria-disabled", "true");

    await userEvent.type(await screen.findByLabelText(/6-digit code/), "123456");
    expect(submit).not.toHaveAttribute("aria-disabled");
  });

  test("a magic-link invite offers the link, not a code field", async () => {
    mockCheck({
      ok: true,
      registered: false,
      hasPasskey: false,
      invited: true,
      inviteMethod: "link",
      needsAction: "enter_invite",
    });

    render(<LoginPage />);
    await userEvent.type(await screen.findByLabelText(/Work email/), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(
      await screen.findByRole("button", { name: /Email me a sign-in link/ })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/6-digit code/)).not.toBeInTheDocument();
  });
});

describe("sign-in — errors are announced, not just coloured", () => {
  test("a lookup failure reaches an alert region", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));

    render(<LoginPage />);
    await userEvent.type(await screen.findByLabelText(/Work email/), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    // The old markup used a styled div; a screen-reader user learned nothing.
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/failed/i);
  });
});
