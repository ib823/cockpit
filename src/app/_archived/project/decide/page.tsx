"use client";
import { Card, Button, Space } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { AppLayout } from "@/components/project-v2/AppLayout";
import { useRouter } from "next/navigation";

export default function DecidePage() {
  const router = useRouter();

  return (
    <AppLayout progress={50}>
      <Space direction="vertical" size="large" className="w-full">
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Decision Analysis</h2>
          <p className="text-gray-600">
            Review requirements and make key decisions about your SAP implementation approach.
          </p>
        </Card>

        <div className="flex justify-center mt-8">
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => router.push("/project/plan")}
          >
            Continue to Planning
          </Button>
        </div>
      </Space>
    </AppLayout>
  );
}
