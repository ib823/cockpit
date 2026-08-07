/**
 * Settings — redirects to security settings.
 *
 * Kept as a real page rather than a Next.js redirect so the transition is
 * announced: a redirect that happens in an effect leaves a screen-reader user
 * on a silent page for as long as the navigation takes.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, AuthStatus } from "@/components/ds/AuthShell";

export default function SettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to security settings
    router.replace("/settings/security");
  }, [router]);

  return (
    <AuthShell title="Settings">
      <AuthStatus message="Opening security settings…" />
    </AuthShell>
  );
}
