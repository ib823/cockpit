"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { logger } from "@/lib/logger";
import VersionDisplay from "@/components/shared/VersionDisplay";
// Imported from their own modules rather than the barrel: `@/components/ds`
// re-exports Modal, which pulls focus-trap-react into any page that touches
// the barrel. That alone took /login from 28kB to 121kB of route JS.
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Field";
import { Banner } from "@/components/ds/Banner";
import {
  AuthShell,
  AuthStatus,
  AuthActions,
  codeInputClass,
} from "@/components/ds/AuthShell";

type EmailStatus = {
  registered: boolean;
  hasPasskey: boolean;
  invited: boolean;
  inviteMethod: "code" | "link" | null;
  needsAction: "login" | "enter_invite" | "not_found";
};

function LoginContent() {
  const _router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stage, setStage] = useState<"input" | "creating" | "verifying" | "success">("input");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const onRegisterWithMagicLink = useCallback(async (emailAddress: string, registrationGrant: string) => {
    setBusy(true);
    setErr(null);
    setStage("creating");
    try {
      const begin = await fetch("/api/auth/begin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress, magicLink: true, registrationGrant }),
      }).then((r) => r.json());

      if (!begin.ok) {
        setErr(begin.message || "Registration failed. Please try again.");
        setStage("input");
        return;
      }

      // Use SimpleWebAuthn for registration
      const credential = await startRegistration({ optionsJSON: begin.options });

      setStage("verifying");
      const finish = await fetch("/api/auth/finish-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress, response: credential }),
      }).then((r) => r.json());

      if (!finish.ok) {
        setErr(finish.message || "Registration failed. Please try again.");
        setStage("input");
        return;
      }

      setStage("success");
      setSuccessMessage("Passkey registered successfully!");
      setTimeout(() => {
        // Use window.location to force full page reload and update SessionProvider
        window.location.href = "/dashboard";
      }, 1500);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        setErr("Passkey creation was cancelled.");
      } else {
        setErr("Invalid. Contact Admin.");
      }
      setStage("input");
    } finally {
      setBusy(false);
    }
  }, []);

  const verifyMagicLink = useCallback(async (token: string) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/verify-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();

      if (!json.ok) {
        setErr(json.message || "Invalid or expired magic link");
        return;
      }

      // Auto-populate email and check status
      setEmail(json.email);
      const statusRes = await fetch(
        `/api/auth/email-status?email=${encodeURIComponent(json.email)}`
      );
      const statusJson = await statusRes.json();
      setStatus(statusJson);

      if (statusJson.needsAction === "enter_invite") {
        // Automatically trigger passkey registration since magic link was verified.
        // The grant is the server's proof of that verification — begin-register
        // rejects the request without it.
        if (!json.registrationGrant) {
          setErr("Magic link verification incomplete. Please request a new link.");
          return;
        }
        setSuccessMessage("Magic link verified! Creating your passkey...");
        const grant = json.registrationGrant as string;
        setTimeout(() => onRegisterWithMagicLink(json.email, grant), 500);
      } else if (statusJson.needsAction === "login") {
        setSuccessMessage("Magic link verified! Please use your passkey to login.");
      }
    } catch (_error) {
      setErr("Failed to verify magic link. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [onRegisterWithMagicLink]);

  // Handle magic link token on page load
  useEffect(() => {
    const token = searchParams?.get("token");
    if (token) {
      verifyMagicLink(token);
    }
  }, [searchParams, verifyMagicLink]);

  const onCheck = async () => {
    setErr(null);
    const e = email.trim().toLowerCase();
    if (!e) return setErr("Please enter your work email.");
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/email-status?email=${encodeURIComponent(e)}`);
      const json = await res.json();
      setStatus(json);
      if (json.needsAction === "not_found") {
        setErr("Invalid. Contact Admin");
      } else if (json.needsAction === "login") {
        // Auto-trigger passkey login for returning users
        setSuccessMessage("Welcome back! Preparing your passkey...");
        setTimeout(() => onPasskeyLogin(), 500);
      }
    } catch {
      setErr("Could not check email. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const onPasskeyLogin = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setBusy(true);
    setErr(null);
    setStage("creating");
    try {
      const begin = await fetch("/api/auth/begin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      }).then((r) => r.json());

      if (!begin.ok) {
        setErr(begin.message || "Invalid. Contact Admin.");
        setStage("input");
        setStatus(null);
        setSuccessMessage("");
        return;
      }

      // Use SimpleWebAuthn for authentication
      const credential = await startAuthentication({ optionsJSON: begin.options });

      setStage("verifying");
      const finish = await fetch("/api/auth/finish-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, response: credential }),
      }).then((r) => r.json());

      if (!finish.ok) {
        setErr(finish.message || "Invalid passkey. Try again or Contact Admin.");
        setStage("input");
        setStatus(null);
        setSuccessMessage("");
        return;
      }

      setStage("success");
      setSuccessMessage("Login successful!");
      setTimeout(() => {
        // Use window.location to force full page reload and update SessionProvider
        window.location.href = "/dashboard";
      }, 1500);
    } catch (_e: unknown) {
      setErr("Passkey authentication was cancelled or failed. Please try again.");
      setStage("input");
      setStatus(null);
      setSuccessMessage("");
    } finally {
      setBusy(false);
    }
  };

  const onRegisterWithCode = async () => {
    const e = email.trim().toLowerCase();
    const c = code.trim();
    if (!e || !c) return;
    setBusy(true);
    setErr(null);
    setStage("creating");
    try {
      const begin = await fetch("/api/auth/begin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, code: c }),
      }).then((r) => r.json());

      if (!begin.ok) {
        setErr(begin.message || "Invalid code. Please try again.");
        setStage("input");
        return;
      }

      // Use SimpleWebAuthn for registration
      const credential = await startRegistration({ optionsJSON: begin.options });

      setStage("verifying");
      const finish = await fetch("/api/auth/finish-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, response: credential }),
      }).then((r) => r.json());

      if (!finish.ok) {
        setErr(finish.message || "Registration failed. Please try again.");
        setStage("input");
        return;
      }

      setStage("success");
      setSuccessMessage("Passkey registered successfully!");
      setTimeout(() => {
        // Use window.location to force full page reload and update SessionProvider
        window.location.href = "/dashboard";
      }, 1500);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        setErr("Passkey creation was cancelled.");
      } else {
        setErr("Invalid. Contact Admin.");
      }
      setStage("input");
    } finally {
      setBusy(false);
    }
  };

  const onSendMagicLink = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      }).then((r) => r.json());

      if (!res.ok) {
        setErr(res.message || "Failed to send magic link");
        return;
      }

      if (res.devMode) {
        // In dev mode, show the magic link
        setSuccessMessage(`Magic link: ${res.magicLink}`);
        logger.info("Magic Link:", { magicLink: res.magicLink });
      } else {
        setSuccessMessage("Magic link sent! Check your email.");
      }
      setStage("success");
    } catch (_error) {
      setErr("Failed to send magic link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const subtitle =
    stage === "input"
      ? "Enter your work email to continue"
      : stage === "creating"
        ? "Follow your browser prompt"
        : stage === "verifying"
          ? "Completing registration"
          : "Redirecting to your dashboard";

  const title =
    stage === "input"
      ? "Sign in"
      : stage === "creating"
        ? "Creating passkey"
        : stage === "verifying"
          ? "Verifying"
          : "Signed in";

  return (
    <AuthShell title={title} subtitle={subtitle}>
      {(stage === "creating" || stage === "verifying") && (
        <AuthStatus
          message={
            stage === "creating" ? "Waiting for passkey…" : "Verifying credentials…"
          }
        />
      )}

      {stage === "success" && <AuthStatus variant="success" message={successMessage} />}

      {stage === "input" && (
        <>
          {err && (
            <Banner
              tone="danger"
              title="Sign-in failed"
              actions={
                // Only a cancelled passkey prompt is retryable in place;
                // anything else needs the email re-checked first.
                err.includes("cancelled") ? (
                  <Button size="sm" variant="secondary" loading={busy} onClick={onCheck}>
                    Try again
                  </Button>
                ) : undefined
              }
            >
              {err}
            </Banner>
          )}

          <Input
            label="Work email"
            id="login-email"
            type="email"
            required
            autoComplete="email"
            size="lg"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // Enter submits, because a single-field form that requires
            // reaching for the mouse is a form that annoys everyone.
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy && !status) onCheck();
            }}
            readOnly={Boolean(status)}
            helper={status ? "Change email to sign in as someone else." : undefined}
          />

          {!status && (
            <AuthActions>
              <Button variant="primary" size="lg" loading={busy} loadingLabel="Checking…" onClick={onCheck}>
                Continue
              </Button>
            </AuthActions>
          )}

          {status?.needsAction === "not_found" && (
            <>
              <Banner tone="info" title="No access for this email">
                This email is not registered or approved for access. Ask an
                administrator to approve it, then try again.
              </Banner>
              <AuthActions>
                <Button
                  variant="secondary"
                  size="lg"
                  loading={busy}
                  onClick={() => {
                    setStatus(null);
                    setEmail("");
                    setErr(null);
                  }}
                >
                  Try a different email
                </Button>
              </AuthActions>
            </>
          )}

          {status?.needsAction === "login" && (
            <>
              <AuthStatus message={successMessage || "Preparing your passkey…"} />
              <AuthActions>
                <Button
                  variant="ghost"
                  loading={busy}
                  onClick={() => {
                    setStatus(null);
                    setErr(null);
                    setSuccessMessage("");
                  }}
                >
                  Change email
                </Button>
              </AuthActions>
            </>
          )}

          {status?.needsAction === "enter_invite" && status.inviteMethod === "link" && (
            <AuthActions>
              <Button
                variant="primary"
                size="lg"
                loading={busy}
                loadingLabel="Sending…"
                onClick={onSendMagicLink}
              >
                Email me a sign-in link
              </Button>
              <Button
                variant="ghost"
                loading={busy}
                onClick={() => {
                  setStatus(null);
                  setErr(null);
                }}
              >
                Change email
              </Button>
            </AuthActions>
          )}

          {status?.needsAction === "enter_invite" && status.inviteMethod === "code" && (
            <>
              <Input
                label="6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                size="lg"
                placeholder="000000"
                className={codeInputClass}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6 && !busy) onRegisterWithCode();
                }}
                helper="Enter the code provided by your administrator."
              />
              <AuthActions row>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={code.length !== 6}
                  loading={busy}
                  loadingLabel="Creating…"
                  onClick={onRegisterWithCode}
                >
                  Create passkey
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  loading={busy}
                  onClick={() => {
                    setStatus(null);
                    setCode("");
                    setErr(null);
                  }}
                >
                  Change
                </Button>
              </AuthActions>
            </>
          )}
        </>
      )}
    </AuthShell>
  );
}

export default function LoginEmailFirst() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Sign in">
          <AuthStatus message="Loading…" />
        </AuthShell>
      }
    >
      <LoginContent />
      <VersionDisplay position="bottom-right" />
    </Suspense>
  );
}
