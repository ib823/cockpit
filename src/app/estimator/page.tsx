/**
 * Estimator Page - DISABLED
 *
 * This feature is currently disabled and not available for use.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Typography, Button } from "antd";
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function EstimatorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center shadow-lg">
        <div className="mb-6">
          <LockOutlined className="text-6xl text-gray-400 mb-4" />
        </div>
        <Title level={2}>Estimator Feature Disabled</Title>
        <Text className="text-gray-600 block mb-6">
          The estimator feature is currently not available. Please use the Gantt Tool for project
          planning.
        </Text>
        <Button
          type="primary"
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/dashboard")}
        >
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
}

// Original implementation removed - feature is disabled
// See active EstimatorPage component above for the current implementation
