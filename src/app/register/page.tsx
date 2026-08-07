"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";
// Imported from their own modules rather than the barrel: `@/components/ds`
// re-exports Modal, which pulls focus-trap-react into any page that touches
// the barrel. That alone took /login from 28kB to 121kB of route JS.
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Field";
import { Banner } from "@/components/ds/Banner";
import { AuthShell, AuthStatus, AuthActions, codeInputClass } from "@/components/ds/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"input" | "waiting" | "done">("input");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

  async function handleRegister() {
    if (!email || !code || code.length !== 6 || isAuthInProgress) return;
    setIsAuthInProgress(true);
    setStage("waiting");
    setErrorMessage("");

    try {
      // Begin registration with email + code
      const beginRes = await fetch("/api/auth/begin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const beginData = await beginRes.json();

      if (!beginRes.ok || !beginData?.ok) {
        setStage("input");
        setErrorMessage(
          beginData?.message || "Registration failed. Please check your email and code."
        );
        setIsAuthInProgress(false);
        return;
      }

      // Create passkey
      const credential = await startRegistration({ optionsJSON: beginData.options });

      // Finish registration
      const finishRes = await fetch("/api/auth/finish-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, response: credential }),
      });

      const result = await finishRes.json();

      if (result.ok) {
        setStage("done");
        setMessage("Passkey registered successfully!");
        setIsAuthInProgress(false);
        // Use role from registration response
        const role = result.user?.role;
        setTimeout(() => router.replace(role === "ADMIN" ? "/admin" : "/dashboard"), 2000);
      } else {
        setStage("input");
        setErrorMessage(result.message || "Failed to complete registration.");
        setIsAuthInProgress(false);
      }
    } catch (err: unknown) {
      setStage("input");
      const error = err as { name?: string; message?: string };
      if (error.name === "NotAllowedError") {
        setErrorMessage("Passkey creation was cancelled.");
      } else if (error.name === "SecurityError" && error.message?.includes("invalid domain")) {
        setErrorMessage("Please use localhost instead of 127.0.0.1");
      } else {
        setErrorMessage("An error occurred during registration. Please try again.");
      }
      setIsAuthInProgress(false);
    }
  }

  return (
    <AuthShell
      title={
        stage === "input"
          ? "Create your passkey"
          : stage === "waiting"
            ? "Setting up"
            : "All set"
      }
      subtitle={
        stage === "input"
          ? "Enter your email and the code your administrator gave you"
          : stage === "waiting"
            ? "Follow your browser prompt"
            : "Signing you in"
      }
    >
      {errorMessage && (
        <Banner tone="danger" title="Registration failed">
          {errorMessage}
        </Banner>
      )}

      {stage === "input" && (
        <>
          <Input
            label="Email address"
            type="email"
            size="lg"
            required
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value.trim().toLowerCase());
              setErrorMessage("");
            }}
          />

          <Input
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            size="lg"
            required
            placeholder="000000"
            className={codeInputClass}
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(value);
              setErrorMessage("");
            }}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              email.includes("@") &&
              code.length === 6 &&
              handleRegister()
            }
            helper="Enter the code provided by your administrator."
          />

          <AuthActions>
            <Button
              variant="primary"
              size="lg"
              disabled={!email.includes("@") || code.length !== 6}
              loading={isAuthInProgress}
              loadingLabel="Creating…"
              onClick={handleRegister}
            >
              Create passkey
            </Button>
            <Button variant="ghost" onClick={() => router.push("/login")}>
              Already have a passkey? Sign in
            </Button>
          </AuthActions>
        </>
      )}

      {stage === "waiting" && (
        <AuthStatus message={message || "Setting up your passkey…"} />
      )}

      {stage === "done" && <AuthStatus variant="success" message={message} />}
    </AuthShell>
  );
}
