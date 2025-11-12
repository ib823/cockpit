/**
 * Organization Chart - Redirect to Architecture V3
 *
 * This route has been replaced by Architecture V3.
 * Automatically redirects to /architecture/v3
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HexLoader } from "@/components/ui/HexLoader";

export default function OrgChartRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Architecture V3
    router.replace("/architecture/v3");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <HexLoader size="xl" />
        <p className="mt-4 text-gray-600">Redirecting to Architecture V3...</p>
      </div>
    </div>
  );
}
