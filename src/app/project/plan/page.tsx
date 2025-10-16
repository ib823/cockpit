'use client';
import { Card, Timeline, Button, Space, Row, Col, Statistic } from 'antd';
import { ClockCircleOutlined, TeamOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { AppLayout } from '@/components/project-v2/AppLayout';
import { useTimelineStore } from '@/stores/timeline-store';
import { useRouter } from 'next/navigation';

export default function PlanPage() {
  const { phases } = useTimelineStore();
  const router = useRouter();
  
  const totalDays = phases.reduce((sum, p) => sum + p.workingDays, 0);
  const totalResources = phases.reduce((sum, p) => sum + (p.resources?.length || 0), 0);

  return (
    <AppLayout progress={75}>
      <Space direction="vertical" size="large" className="w-full">
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Duration" 
                value={Math.round(totalDays / 22)} 
                suffix="months"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Phases" 
                value={phases.length}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="Team Members" 
                value={totalResources}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Implementation Timeline">
          <Timeline
            items={phases.map((phase, idx) => ({
              color: idx === 0 ? 'green' : 'blue',
              children: (
                <div>
                  <div className="font-semibold">{phase.name}</div>
                  <div className="text-sm text-gray-500">
                    {Math.round(phase.workingDays / 22)} months • {phase.resources?.length || 0} team members
                  </div>
                </div>
              ),
            }))}
          />
        </Card>

        <div className="flex justify-center">
          <Button 
            type="primary" 
            size="large" 
            icon={<ArrowRightOutlined />}
            onClick={() => router.push('/project/present')}
          >
            Continue to Presentation
          </Button>
        </div>
      </Space>
    </AppLayout>
  );
}
