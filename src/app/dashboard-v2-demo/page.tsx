/**
 * Comprehensive Dashboard v2 Demo
 * Next-generation three-panel dashboard with real-time validation and AI recommendations
 */

'use client';

import { useEffect, useState } from 'react';
import { ComprehensiveDashboard } from '@/components/dashboard-v2';
import { GanttProject } from '@/types/gantt-tool';
import { Card, Typography, Alert } from 'antd';

const { Title, Text } = Typography;

export default function DashboardV2DemoPage() {
  const [project, setProject] = useState<GanttProject | null>(null);
  const [proposedRevenue, setProposedRevenue] = useState(0);

  useEffect(() => {
    // Try to load project from localStorage (from gantt-tool)
    const storedProject = localStorage.getItem('gantt-project');
    if (storedProject) {
      try {
        const parsed = JSON.parse(storedProject);
        setProject(parsed);
      } catch (error) {
        console.error('Failed to parse project:', error);
      }
    }
  }, []);

  if (!project) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <Title level={2}>📊 Comprehensive Dashboard v2</Title>
          <Alert
            message="No Project Loaded"
            description={
              <div>
                <Text>
                  Please create or load a project first using the <a href="/gantt-tool">Gantt Tool</a>.
                </Text>
                <br />
                <br />
                <Text type="secondary">
                  The Comprehensive Dashboard v2 provides a next-generation three-panel view with:
                </Text>
                <ul style={{ marginTop: '12px' }}>
                  <li>🎯 <strong>Operational Panel:</strong> Real-time resource allocation and capacity planning</li>
                  <li>💰 <strong>Financial Intelligence:</strong> Live cost calculations and margin analysis</li>
                  <li>🚀 <strong>Strategic Insights:</strong> AI recommendations and risk assessment</li>
                </ul>
                <Text type="secondary">
                  Features include real-time validation, auto-save status, scenario management, and animated transitions.
                </Text>
              </div>
            }
            type="info"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return (
    <ComprehensiveDashboard
      project={project}
      proposedRevenue={proposedRevenue}
      onRevenueChange={setProposedRevenue}
      onSave={() => {
        console.log('Saving project...');
        localStorage.setItem('gantt-project', JSON.stringify(project));
        localStorage.setItem('proposed-revenue', proposedRevenue.toString());
      }}
      onExport={() => {
        console.log('Exporting dashboard...');
        // TODO: Implement export functionality
      }}
      onShare={() => {
        console.log('Sharing dashboard...');
        // TODO: Implement share functionality
      }}
    />
  );
}
