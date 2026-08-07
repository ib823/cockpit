"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { AuthShell, AuthActions } from "@/components/ds/AuthShell";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { Banner } from "@/components/ds/Banner";

export default function AddPasskeyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePasskey = async () => {
    if (!nickname.trim()) {
      setError("Please enter a nickname for this passkey");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Get registration options from server
      const beginRes = await fetch("/api/auth/passkey/register/begin", {
        method: "POST",
      });

      if (!beginRes.ok) {
        throw new Error("Failed to start passkey registration");
      }

      const options = await beginRes.json();

      // Step 2: Prompt user to create passkey
      let attResp;
      try {
        attResp = await startRegistration(options);
      } catch (err) {
        if (err instanceof Error && err.name === "NotAllowedError") {
          throw new Error("Passkey setup was cancelled");
        }
        throw err;
      }

      // Step 3: Send response to server with nickname
      const finishRes = await fetch("/api/auth/passkey/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: attResp,
          nickname: nickname.trim(),
        }),
      });

      if (!finishRes.ok) {
        const data = await finishRes.json();
        throw new Error(data.error || "Failed to register passkey");
      }

      // Success! Redirect back to account page
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Add a passkey"
      subtitle="A passkey signs you in with your device's fingerprint, face or PIN — no password."
    >
      {error && (
        <Banner tone="danger" title="Could not create the passkey">
          {error}
        </Banner>
      )}

      <Input
        label="Nickname"
        id="nickname"
        size="lg"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="e.g. My MacBook, iPhone 15"
        disabled={loading}
        helper="Names the device in your passkey list, so you can tell which one to remove later."
      />

      <AuthActions row>
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          loadingLabel="Creating…"
          onClick={handleCreatePasskey}
        >
          Create passkey
        </Button>
        <Button
          variant="secondary"
          size="lg"
          loading={loading}
          onClick={() => router.push("/account")}
        >
          Cancel
        </Button>
      </AuthActions>
    </AuthShell>
  );
}
