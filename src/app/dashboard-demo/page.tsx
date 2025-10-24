/**
 * Dashboard Demo Page
 *
 * Demonstrates the Three-Layer Cake Dashboard with sample data
 */

'use client';

import { App } from 'antd';
import { ThreeLayerDashboard } from '@/components/dashboard';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';

export default function DashboardDemoPage() {
  const { currentProject } = useGanttToolStoreV2();

  if (!currentProject) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f5f5',
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>No Project Loaded</h2>
          <p>Please create or load a Gantt project first at <a href="/gantt-tool">/gantt-tool</a></p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    console.log('Export dashboard');
    // Implement export logic here
  };

  const handleRefresh = () => {
    console.log('Refresh dashboard');
    // Implement refresh logic here
  };

  return (
    <App>
      <ThreeLayerDashboard
        project={currentProject}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />
    </App>
  );
}
