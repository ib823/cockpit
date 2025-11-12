/**
 * Settings - Redirect to Security Settings
 *
 * Main settings page that redirects to the security settings.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HexLoader } from "@/components/ui/HexLoader";

export default function SettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to security settings
    router.replace("/settings/security");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <HexLoader size="xl" />
        <p className="mt-4 text-gray-600">Loading settings...</p>
      </div>
    </div>
  );
}
