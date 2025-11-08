/**
 * Dashboard Demo Page
 *
 * Demonstrates the Three-Layer Cake Dashboard with sample data and export functionality
 */

'use client';

import { useState, useMemo } from 'react';
import { App, Modal, Radio, Space, Typography } from 'antd';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { ThreeLayerDashboard } from '@/components/dashboard';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { calculateTotalCost, calculateMargins } from '@/lib/dashboard/calculation-engine';
import { exportDashboard, ExportData } from '@/lib/dashboard/export-engine';

const { Text } = Typography;

export default function DashboardDemoPage() {
  const { currentProject } = useGanttToolStoreV2();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('pdf');

  // Calculate metrics for export
  const exportData = useMemo<ExportData | null>(() => {
    if (!currentProject) return null;

    const costBreakdown = calculateTotalCost(currentProject);
    const suggestedRevenue = costBreakdown.totalCost / 0.7; // 30% margin
    const margins = calculateMargins(suggestedRevenue, costBreakdown);

    return {
      project: currentProject,
      costBreakdown,
      margins,
      revenue: suggestedRevenue,
      timestamp: new Date(),
    };
  }, [currentProject]);

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
    setExportModalVisible(true);
  };

  const handleConfirmExport = () => {
    if (exportData) {
      exportDashboard(exportData, exportFormat);
      setExportModalVisible(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <App>
      <ThreeLayerDashboard
        project={currentProject}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />

      {/* Export Modal */}
      <Modal
        title="Export Dashboard"
        open={exportModalVisible}
        onOk={handleConfirmExport}
        onCancel={() => setExportModalVisible(false)}
        okText="Export"
        width={500}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Text>Choose export format:</Text>

          <Radio.Group
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Radio value="pdf">
                <Space>
                  <FileText size={20} />
                  <div>
                    <div style={{ fontWeight: 600 }}>PDF Report</div>
                    <Text type="secondary" className="text-xs">
                      Professional print-ready report with charts and tables
                    </Text>
                  </div>
                </Space>
              </Radio>

              <Radio value="excel">
                <Space>
                  <FileSpreadsheet size={20} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Excel Workbook (.xls)</div>
                    <Text type="secondary" className="text-xs">
                      Formatted HTML table that opens in Excel
                    </Text>
                  </div>
                </Space>
              </Radio>

              <Radio value="csv">
                <Space>
                  <Download size={20} />
                  <div>
                    <div style={{ fontWeight: 600 }}>CSV Spreadsheet (.csv)</div>
                    <Text type="secondary" className="text-xs">
                      Plain text data for import into any tool
                    </Text>
                  </div>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </Space>
      </Modal>
    </App>
  );
}
