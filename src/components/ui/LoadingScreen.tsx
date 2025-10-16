'use client';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="text-center">
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          size="large"
        />
        <p className="mt-4 text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}
