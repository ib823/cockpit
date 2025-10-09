'use client';
import React from "react";
import { Card, Typography, Alert } from "antd";

export default function AdminPage() {
  // Replace with your own RBAC/NextAuth gate
  const allowed = false;
  return (
    <div className="min-h-screen p-6">
      <Card className="max-w-2xl">
        <Typography.Title level={3}>Admin</Typography.Title>
        {!allowed && <Alert type="warning" message="Access denied (demo placeholder). Wire RBAC with NextAuth." />}
      </Card>
    </div>
  );
}
