/**
 * Gantt Tool - Redirect to V3
 *
 * This route has been replaced by Timeline V3.
 * Automatically redirects to /gantt-tool/v3
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HexLoader } from "@/components/ui/HexLoader";

export default function GanttToolRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to V3
    router.replace("/gantt-tool/v3");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <HexLoader size="xl" />
        <p className="mt-4 text-gray-600">Redirecting to Timeline V3...</p>
      </div>
    </div>
  );
}
