'use client';
import { Card, Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { AppLayout } from '@/components/project-v2/AppLayout';
import { PresentMode } from '@/components/project-v2/modes/PresentMode';
import { useState } from 'react';

export default function PresentPage() {
  const [presenting, setPresenting] = useState(false);

  if (presenting) {
    return <PresentMode />;
  }

  return (
    <AppLayout progress={100}>
      <Card className="text-center">
        <h2 className="text-3xl font-semibold mb-4">Ready to Present</h2>
        <p className="text-gray-600 mb-8">
          Your SAP implementation proposal is ready to present to stakeholders.
        </p>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlayCircleOutlined />}
          onClick={() => setPresenting(true)}
          className="h-14 px-12 text-lg"
        >
          Start Presentation
        </Button>
      </Card>
    </AppLayout>
  );
}
