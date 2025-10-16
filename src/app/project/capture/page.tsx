'use client';
import { Card, Progress, Row, Col, Tag, Button, Space } from 'antd';
import { CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { AppLayout } from '@/components/project-v2/AppLayout';
import { usePresalesStore } from '@/stores/presales-store';
import { useRouter } from 'next/navigation';

export default function CapturePage() {
  const { chips } = usePresalesStore();
  const router = useRouter();
  
  const progress = Math.min((chips.length / 10) * 100, 100);
  
  const chipsByCategory = chips.reduce((acc, chip) => {
    const category = chip.type || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(chip);
    return acc;
  }, {} as Record<string, typeof chips>);

  return (
    <AppLayout progress={progress}>
      <Space direction="vertical" size="large" className="w-full">
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <Row align="middle">
            <Col flex="auto">
              <Space direction="vertical" size="small">
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-2xl text-green-600" />
                  <h2 className="text-2xl font-semibold m-0">Requirements Complete!</h2>
                </div>
                <p className="text-gray-600 m-0">All key requirements identified</p>
              </Space>
            </Col>
            <Col>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{Math.round(progress)}%</div>
                <div className="text-sm text-gray-500">{chips.length} requirements</div>
              </div>
            </Col>
          </Row>
          <Progress percent={progress} showInfo={false} className="mt-4" />
        </Card>

        <Card title="Extracted Requirements">
          <Row gutter={[16, 16]}>
            {Object.entries(chipsByCategory).map(([category, items]) => (
              <Col span={12} key={category}>
                <Card size="small" className="h-full">
                  <Space direction="vertical" className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-600">{category}:</span>
                      <Tag color="blue">{Math.round((items.length / chips.length) * 100)}%</Tag>
                    </div>
                    <div className="text-lg">{items.map(i => i.value).join(', ')}</div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <div className="flex justify-center">
          <Button 
            type="primary" 
            size="large" 
            icon={<ArrowRightOutlined />}
            onClick={() => router.push('/project/decide')}
            className="h-14 px-8 text-lg"
          >
            Continue to Decisions
          </Button>
        </div>
      </Space>
    </AppLayout>
  );
}
