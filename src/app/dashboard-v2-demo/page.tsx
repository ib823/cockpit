/**
 * Comprehensive Dashboard v2 Demo
 * Next-generation three-panel dashboard with real-time validation and AI recommendations
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, Typography, Alert, Modal, Radio, Space } from 'antd';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { ComprehensiveDashboard } from '@/components/dashboard-v2';
import { GanttProject } from '@/types/gantt-tool';
import { calculateTotalCost, calculateMargins } from '@/lib/dashboard/calculation-engine';
import { exportDashboard, ExportData } from '@/lib/dashboard/export-engine';

const { Title, Text } = Typography;

export default function DashboardV2DemoPage() {
  const [project, setProject] = useState<GanttProject | null>(null);
  const [proposedRevenue, setProposedRevenue] = useState(0);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('pdf');

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

  // Calculate export data
  const exportData = useMemo<ExportData | null>(() => {
    if (!project) return null;

    const costBreakdown = calculateTotalCost(project);
    const revenue = proposedRevenue > 0 ? proposedRevenue : costBreakdown.totalCost / 0.7;
    const margins = calculateMargins(revenue, costBreakdown);

    return {
      project,
      costBreakdown,
      margins,
      revenue,
      timestamp: new Date(),
    };
  }, [project, proposedRevenue]);

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

  const handleExport = () => {
    setExportModalVisible(true);
  };

  const handleConfirmExport = () => {
    if (exportData) {
      exportDashboard(exportData, exportFormat);
      setExportModalVisible(false);
    }
  };

  return (
    <>
      <ComprehensiveDashboard
        project={project}
        proposedRevenue={proposedRevenue}
        onRevenueChange={setProposedRevenue}
        onSave={() => {
          localStorage.setItem('gantt-project', JSON.stringify(project));
          localStorage.setItem('proposed-revenue', proposedRevenue.toString());
        }}
        onExport={handleExport}
        onShare={() => {
          // TODO: Implement share functionality
          console.log('Share dashboard');
        }}
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
    </>
  );
}
