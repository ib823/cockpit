/**
 * Estimator Page - DISABLED
 *
 * This feature is currently disabled and not available for use.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Button } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function EstimatorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center shadow-lg">
        <div className="mb-6">
          <LockOutlined className="text-6xl text-gray-400 mb-4" />
        </div>
        <Title level={2}>Estimator Feature Disabled</Title>
        <Text className="text-gray-600 block mb-6">
          The estimator feature is currently not available. Please use the Gantt Tool for project planning.
        </Text>
        <Button
          type="primary"
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
}

// Original implementation preserved but unused
function _UnusedEstimatorPage() {
  const {
    inputs,
    setProfile,
    setResults,
    calculating: storeCalculating,
  } = useEstimatorStore();

  const {
    calculate,
    calculating: workerCalculating,
    ready: workerReady,
    error: workerError,
  } = useFormulaWorker();

  const isCalculating = storeCalculating || workerCalculating;

  // Auto-calculate when inputs change (with debounce)
  useEffect(() => {
    if (!workerReady) return;

    const performCalculation = async () => {
      try {
        const { results, warnings } = await calculate(inputs);
        setResults(results, warnings);
      } catch (error) {
        console.error('[Estimator] Calculation error:', error);
      }
    };

    // Debounce: wait 300ms after last input change
    const timer = setTimeout(performCalculation, 300);

    return () => clearTimeout(timer);
  }, [inputs, calculate, setResults, workerReady]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <Space align="center" className="mb-2">
          <RocketOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0 }}>
            SAP S/4HANA Estimator
          </Title>
          {isCalculating && (
            <LoadingOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          )}
        </Space>
        <Text type="secondary">
          Configure project parameters to generate effort and timeline estimates
        </Text>
      </div>

      {/* Worker Status */}
      {!workerReady && (
        <Alert
          message="Initializing calculation engine..."
          type="info"
          showIcon
          icon={<LoadingOutlined />}
          className="mb-4"
        />
      )}

      {workerError && (
        <Alert
          message="Calculation Error"
          description={workerError.message}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Left Column: Input Controls */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Profile Selector */}
            <Card
              title={
                <Space>
                  <span>🎯 Project Profile</span>
                </Space>
              }
              size="small"
            >
              <div>
                <Text strong className="block mb-2">
                  Select Implementation Profile
                </Text>
                <Select
                  value={inputs.profile.name}
                  onChange={(profileName) => {
                    const profile = AVAILABLE_PROFILES.find(
                      (p) => p.name === profileName
                    );
                    if (profile) {
                      setProfile(profile);
                    }
                  }}
                  style={{ width: '100%' }}
                  options={AVAILABLE_PROFILES.map((profile) => ({
                    value: profile.name,
                    label: (
                      <div>
                        <div style={{ fontWeight: 500 }}>{profile.name}</div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#666',
                          }}
                        >
                          Base: {profile.baseFT} MD | Security: {profile.securityAuth} MD
                        </div>
                      </div>
                    ),
                  }))}
                />
                <Text type="secondary" style={{ fontSize: '12px' }} className="block mt-2">
                  Foundation effort for {inputs.profile.name} implementation
                </Text>
              </div>
            </Card>

            {/* Scope Breadth */}
            <ScopeBreadth />

            {/* Process Complexity */}
            <ProcessComplexity />

            {/* Organizational Scale */}
            <OrgScale />

            {/* Capacity */}
            <Capacity />
          </Space>
        </Col>

        {/* Right Column: Results */}
        <Col xs={24} lg={14}>
          <ResultsPanel />
        </Col>
      </Row>
    </div>
  );
}
