'use client';
import React from "react";
import { Card, Form, Input, Button, Typography } from "antd";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [form] = Form.useForm();
  const onFinish = async (values: any) => {
    await signIn('credentials', { email: values.email, password: values.password, callbackUrl: '/' });
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm rounded-2xl shadow">
        <Typography.Title level={3} style={{marginBottom: 16}}>Sign in</Typography.Title>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{required:true, message:'Email is required'}]}>
            <Input type="email" placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{required:true, message:'Password is required'}]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Sign in</Button>
        </Form>
      </Card>
    </div>
  );
}
