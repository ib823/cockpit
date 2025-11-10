"use client";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Button } from "antd";
import { useRouter } from "next/navigation";

export default function TestLoadingPage() {
  const router = useRouter();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Loading Screen Test</h1>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Default Loading:</h2>
          <div className="h-64 border">
            <LoadingScreen />
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Custom Message:</h2>
          <div className="h-64 border">
            <LoadingScreen message="Loading dashboard..." />
          </div>
        </div>

        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    </div>
  );
}
