"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Register Your Passkey</h1>
            <p className="text-sm text-slate-600">
              {stage === "input" && "Enter your email and 6-digit code"}
              {stage === "waiting" && "Creating your passkey..."}
              {stage === "done" && "Registration complete!"}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Input Stage */}
          {stage === "input" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.trim().toLowerCase());
                    setErrorMessage("");
                  }}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
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
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Enter the code provided by your administrator
                </p>
              </div>

              <button
                onClick={handleRegister}
                disabled={!email.includes("@") || code.length !== 6 || isAuthInProgress}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5 align-middle"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Create Passkey
              </button>

              <div className="text-center">
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Already have a passkey? Sign in
                </button>
              </div>
            </div>
          )}

          {/* Waiting Stage */}
          {stage === "waiting" && (
            <div className="text-center py-8">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mb-4"></div>
              <p className="text-slate-600">{message || "Setting up your passkey..."}</p>
            </div>
          )}

          {/* Success Stage */}
          {stage === "done" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-xl text-slate-900 font-semibold">{message}</p>
              <p className="text-sm text-slate-600 mt-2">Logging you in...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
