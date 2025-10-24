/**
 * Comprehensive Dashboard - Next-Generation Resource Planning & Proposal Analytics
 *
 * Three-Panel Architecture:
 * - LEFT: Operational Reality (Gantt, Resource Heatmap, Skill Gap Analysis)
 * - CENTER: Financial Intelligence (Real-time KPIs, Margin Waterfall, Cost/Revenue Analysis)
 * - RIGHT: Strategic Insights (Risk Gauges, AI Recommendations, What-If Scenarios)
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, Select, Button, Space, Typography, Badge, Alert, Divider, Tabs, Spin } from 'antd';
import {
  Save,
  Download,
  Share2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GanttProject } from '@/types/gantt-tool';
import { OperationalPanel } from './panels/OperationalPanel';
import { FinancialIntelligencePanel } from './panels/FinancialIntelligencePanel';
import { StrategicInsightsPanel } from './panels/StrategicInsightsPanel';
import { validateProject, ValidationResult } from '@/lib/dashboard/validation-engine';
import { calculateTotalCost, calculateMargins, calculateRiskScore } from '@/lib/dashboard/calculation-engine';
import { OptimizationEngine } from '@/lib/dashboard/optimization-engine';
import { formatMYR } from '@/lib/rate-card';

const { Title, Text } = Typography;

interface ComprehensiveDashboardProps {
  project: GanttProject;
  proposedRevenue?: number;
  onRevenueChange?: (revenue: number) => void;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

interface Scenario {
  id: string;
  name: string;
  project: GanttProject;
  revenue: number;
}

export function ComprehensiveDashboard({
  project,
  proposedRevenue = 0,
  onRevenueChange,
  onSave,
  onExport,
  onShare,
}: ComprehensiveDashboardProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: 'baseline', name: 'Current Plan (Baseline)', project, revenue: proposedRevenue },
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState('baseline');
  const [isCalculating, setIsCalculating] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Get active scenario
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  // Calculate metrics for active scenario
  const metrics = useMemo(() => {
    setIsCalculating(true);
    const costBreakdown = calculateTotalCost(activeScenario.project);
    const revenue = activeScenario.revenue > 0 ? activeScenario.revenue : costBreakdown.totalCost / 0.7;
    const margins = calculateMargins(revenue, costBreakdown);
    const riskScore = calculateRiskScore(activeScenario.project);

    setIsCalculating(false);

    return {
      costBreakdown,
      revenue,
      margins,
      riskScore,
    };
  }, [activeScenario]);

  // Real-time validation
  const validation = useMemo<ValidationResult>(() => {
    return validateProject(activeScenario.project, {
      minimumMargin: 15,
      proposedRevenue: metrics.revenue,
    });
  }, [activeScenario.project, metrics.revenue]);

  // AI Recommendations
  const recommendations = useMemo(() => {
    const engine = new OptimizationEngine(activeScenario.project);
    return engine.generateRecommendations().slice(0, 5); // Top 5
  }, [activeScenario.project]);

  // Auto-save simulation
  useEffect(() => {
    setAutoSaveStatus('unsaved');
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving');
      setTimeout(() => setAutoSaveStatus('saved'), 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeScenario]);

  // Calculate total violation count for header badge
  const totalViolations = validation.violations.length + validation.warnings.length;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F7FA' }}>
      {/* ============================================ */}
      {/* HEADER: Global Controls */}
      {/* ============================================ */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          style={{
            margin: '16px 16px 0 16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            {/* Project Metadata */}
            <Space direction="vertical" size={0}>
              <Title level={3} style={{ margin: 0, color: 'white' }}>
                📊 {activeScenario.project.name}
              </Title>
              <Space size="large" style={{ marginTop: '8px' }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  <strong>{activeScenario.project.phases.length}</strong> Phases
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  <strong>{activeScenario.project.resources?.length || 0}</strong> Resources
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  Revenue: <strong>{formatMYR(metrics.revenue)}</strong>
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  Margin: <strong style={{ color: metrics.margins.grossMarginPercent >= 20 ? '#A7F3D0' : '#FCA5A5' }}>
                    {metrics.margins.grossMarginPercent.toFixed(1)}%
                  </strong>
                </Text>
              </Space>
            </Space>

            {/* Controls */}
            <Space size="middle">
              {/* Scenario Selector */}
              <Select
                value={activeScenarioId}
                onChange={setActiveScenarioId}
                style={{ width: 200 }}
                options={scenarios.map(s => ({
                  label: s.name,
                  value: s.id,
                }))}
                suffixIcon={<Zap size={16} color="white" />}
                dropdownStyle={{ borderRadius: '8px' }}
              />

              {/* Action Buttons */}
              <Button
                icon={<Settings size={16} />}
                onClick={() => console.log('Settings')}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                }}
              >
                Settings
              </Button>

              {onSave && (
                <Button
                  icon={<Save size={16} />}
                  onClick={onSave}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  Save
                </Button>
              )}

              {onExport && (
                <Button
                  icon={<Download size={16} />}
                  onClick={onExport}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  Export
                </Button>
              )}

              {onShare && (
                <Button
                  icon={<Share2 size={16} />}
                  onClick={onShare}
                  type="primary"
                  style={{
                    background: 'white',
                    color: '#667eea',
                    border: 'none',
                  }}
                >
                  Share
                </Button>
              )}
            </Space>
          </div>
        </Card>
      </motion.div>

      {/* ============================================ */}
      {/* MAIN CANVAS: Three-Panel Interactive View */}
      {/* ============================================ */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '16px', display: 'flex', gap: '16px' }}>
        {/* LEFT PANEL: Operational Reality */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{ flex: 1, overflow: 'auto' }}
        >
          <Card
            title={
              <Space>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>🎯 Operational Reality</span>
                <Badge count={validation.violations.filter(v => v.rule === 'resource_allocation').length} />
              </Space>
            }
            style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            <OperationalPanel project={activeScenario.project} validation={validation} />
          </Card>
        </motion.div>

        {/* CENTER PANEL: Financial Intelligence */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{ flex: 1.2, overflow: 'auto' }}
        >
          <Card
            title={
              <Space>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>💰 Financial Intelligence</span>
                {isCalculating && <Spin size="small" />}
              </Space>
            }
            style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            <FinancialIntelligencePanel
              project={activeScenario.project}
              costBreakdown={metrics.costBreakdown}
              margins={metrics.margins}
              revenue={metrics.revenue}
              onRevenueChange={onRevenueChange}
            />
          </Card>
        </motion.div>

        {/* RIGHT PANEL: Strategic Insights */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          style={{ flex: 1, overflow: 'auto' }}
        >
          <Card
            title={
              <Space>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>🚀 Strategic Insights</span>
                <Badge count={recommendations.length} style={{ background: '#52c41a' }} />
              </Space>
            }
            style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            <StrategicInsightsPanel
              project={activeScenario.project}
              riskScore={metrics.riskScore}
              recommendations={recommendations}
              scenarios={scenarios}
              onCreateScenario={(name, newProject) => {
                const newScenario: Scenario = {
                  id: `scenario-${Date.now()}`,
                  name,
                  project: newProject,
                  revenue: metrics.revenue,
                };
                setScenarios([...scenarios, newScenario]);
                setActiveScenarioId(newScenario.id);
              }}
            />
          </Card>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* FOOTER: Validation & Alerts */}
      {/* ============================================ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <Card
          style={{
            margin: '0 16px 16px 16px',
            borderRadius: '12px',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Validation Status */}
            <Space size="large">
              {validation.isValid ? (
                <Space>
                  <CheckCircle2 size={20} color="#52c41a" />
                  <Text strong style={{ color: '#52c41a' }}>All Validations Passed</Text>
                </Space>
              ) : (
                <Space>
                  <AlertTriangle size={20} color="#ff4d4f" />
                  <Text strong style={{ color: '#ff4d4f' }}>
                    {validation.violations.length} Critical Issue(s)
                  </Text>
                </Space>
              )}

              {validation.warnings.length > 0 && (
                <Space>
                  <Info size={20} color="#faad14" />
                  <Text style={{ color: '#faad14' }}>
                    {validation.warnings.length} Warning(s)
                  </Text>
                </Space>
              )}

              {/* Data Quality Indicator */}
              <Space>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: validation.isValid ? '#52c41a' : '#ff4d4f',
                  }}
                />
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  Data Quality: {validation.isValid ? 'Excellent' : 'Needs Review'}
                </Text>
              </Space>
            </Space>

            {/* Auto-save Status */}
            <Space>
              <AnimatePresence mode="wait">
                {autoSaveStatus === 'saved' && (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Space>
                      <CheckCircle2 size={16} color="#52c41a" />
                      <Text type="secondary" style={{ fontSize: '13px' }}>Saved</Text>
                    </Space>
                  </motion.div>
                )}
                {autoSaveStatus === 'saving' && (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Space>
                      <Spin size="small" />
                      <Text type="secondary" style={{ fontSize: '13px' }}>Saving...</Text>
                    </Space>
                  </motion.div>
                )}
              </AnimatePresence>
            </Space>
          </div>

          {/* Violation Details (Expandable) */}
          {!validation.isValid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ marginTop: '12px' }}
            >
              <Divider style={{ margin: '8px 0' }} />
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {validation.violations.slice(0, 3).map((violation, idx) => (
                  <Alert
                    key={idx}
                    message={violation.message}
                    description={violation.suggestion}
                    type="error"
                    showIcon
                    closable
                    style={{ fontSize: '12px' }}
                  />
                ))}
              </Space>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
