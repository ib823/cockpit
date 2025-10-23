/**
 * Estimator Wizard Component
 * Mobile-optimized step-by-step wizard for SAP implementation estimates
 *
 * Features:
 * - Step-by-step progression (Profile → Team Size → Advanced → Results)
 * - Progress indicators
 * - Back/Next navigation
 * - Skip advanced options
 * - Save progress between steps
 * - Mobile-first design
 */

'use client';

import { useState, ReactNode } from 'react';
import { Card, Button, Space, Steps, Typography, Select, Slider } from 'antd';
import {
  RightOutlined,
  LeftOutlined,
  CheckOutlined,
  RocketOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useEstimatorStore } from '@/stores/estimator-store';
import { useEstimatorPreferences } from '@/stores/user-preferences-store';
import { AVAILABLE_PROFILES, INPUT_CONSTRAINTS } from '@/lib/estimator/types';
import { ScopeBreadth } from './ScopeBreadth';
import { ProcessComplexity } from './ProcessComplexity';
import { OrgScale } from './OrgScale';
import { Capacity } from './Capacity';
import { ResultsPanel } from './ResultsPanel';

const { Title, Text } = Typography;

interface WizardStep {
  key: string;
  title: string;
  icon: ReactNode;
  component: ReactNode;
  optional?: boolean;
}

export function EstimatorWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const { inputs, setProfile, setCapacity } = useEstimatorStore();
  const { saveProfilePreference, saveCapacityPreference } = useEstimatorPreferences();

  // Wizard steps definition
  const steps: WizardStep[] = [
    {
      key: 'profile',
      title: 'Profile',
      icon: <RocketOutlined />,
      component: (
        <div>
          <Title level={4}>Select Implementation Profile</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Choose the SAP configuration that best matches your project
          </Text>

          <Select
            value={inputs.profile.name}
            onChange={(profileName) => {
              const profile = AVAILABLE_PROFILES.find(p => p.name === profileName);
              if (profile) {
                setProfile(profile);
                saveProfilePreference(profileName);
              }
            }}
            style={{ width: '100%' }}
            size="large"
            options={AVAILABLE_PROFILES.map((profile) => ({
              value: profile.name,
              label: (
                <div>
                  <div style={{ fontWeight: 500 }}>{profile.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Base: {profile.baseFT} MD | Security: {profile.securityAuth} MD
                  </div>
                </div>
              ),
            }))}
          />

          <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              <strong>Current Selection:</strong> {inputs.profile.name}
              <br />
              Foundation effort: {inputs.profile.baseFT} man-days
            </Text>
          </Card>
        </div>
      ),
    },
    {
      key: 'team-size',
      title: 'Team Size',
      icon: <TeamOutlined />,
      component: (
        <div>
          <Title level={4}>Team Size (FTE)</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            How many full-time team members will work on this project?
          </Text>

          <div className="flex justify-between mb-4">
            <Text strong style={{ fontSize: '16px' }}>Full-Time Equivalents</Text>
            <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
              {inputs.fte}
            </Text>
          </div>

          <Slider
            min={INPUT_CONSTRAINTS.fte.min}
            max={20}
            step={0.5}
            value={inputs.fte}
            onChange={(val) => {
              setCapacity({ fte: val });
              saveCapacityPreference(val);
            }}
            marks={{
              1: '1',
              5: '5',
              10: '10',
              15: '15',
              20: '20',
            }}
            tooltip={{ formatter: (val) => `${val} FTE` }}
          />

          <Card size="small" style={{ marginTop: 24, background: '#f5f5f5' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              <strong>What is FTE?</strong> Full-Time Equivalent represents the number of
              team members working full-time on this project. For example, 5 FTE could be
              5 people working 100% of their time, or 10 people working 50% of their time.
            </Text>
          </Card>
        </div>
      ),
    },
    {
      key: 'advanced',
      title: 'Advanced',
      icon: <SettingOutlined />,
      optional: true,
      component: (
        <div>
          <Title level={4}>Advanced Options (Optional)</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Fine-tune complexity factors for more accurate estimates
          </Text>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Scope Breadth */}
            <ScopeBreadth />

            {/* Process Complexity */}
            <ProcessComplexity />

            {/* Organizational Scale */}
            <OrgScale />

            {/* Full Capacity Settings */}
            <Capacity />
          </Space>

          <Card size="small" style={{ marginTop: 16, background: '#e6f7ff', borderColor: '#1890ff' }}>
            <Text style={{ fontSize: '13px' }}>
              💡 <strong>Tip:</strong> You can skip this step and use default values.
              Advanced options can always be adjusted later.
            </Text>
          </Card>
        </div>
      ),
    },
    {
      key: 'results',
      title: 'Results',
      icon: <BarChartOutlined />,
      component: (
        <div>
          <Title level={4}>Your Estimate</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Based on your inputs, here's the calculated project estimate
          </Text>

          <ResultsPanel />
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isOptionalStep = currentStepData.optional;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkip = () => {
    if (isOptionalStep) {
      handleNext();
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Progress Steps */}
      <div style={{ marginBottom: 24, background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Steps
          current={currentStep}
          items={steps.map((step) => ({
            title: step.title,
            icon: step.icon,
            description: step.optional ? 'Optional' : undefined,
          }))}
          responsive={false}
          size="small"
        />
      </div>

      {/* Current Step Content */}
      <Card
        style={{
          minHeight: '400px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {currentStepData.component}
      </Card>

      {/* Fixed Navigation Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Back Button */}
        <Button
          size="large"
          disabled={isFirstStep}
          onClick={handleBack}
          icon={<LeftOutlined />}
          style={{ minWidth: '100px' }}
        >
          Back
        </Button>

        {/* Step Counter */}
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Step {currentStep + 1} of {steps.length}
        </Text>

        {/* Next/Skip/Finish Buttons */}
        <Space>
          {isOptionalStep && !isLastStep && (
            <Button size="large" onClick={handleSkip} style={{ minWidth: '100px' }}>
              Skip
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            onClick={handleNext}
            disabled={isLastStep}
            icon={isLastStep ? <CheckOutlined /> : <RightOutlined />}
            style={{ minWidth: '100px' }}
          >
            {isLastStep ? 'Done' : 'Next'}
          </Button>
        </Space>
      </div>

      {/* Help Text */}
      <div
        style={{
          position: 'fixed',
          bottom: 70,
          right: 16,
          background: 'rgba(0,0,0,0.75)',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          maxWidth: '200px',
          opacity: isLastStep ? 0 : 0.8,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
        }}
      >
        💡 Swipe left/right or use buttons to navigate
      </div>
    </div>
  );
}

/**
 * Hook to determine if mobile wizard should be used
 * Based on viewport width and user preference
 */
export function useMobileWizard() {
  const [isMobile, setIsMobile] = useState(false);

  // Check viewport width on mount and resize
  if (typeof window !== 'undefined') {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', checkMobile);
    checkMobile();

    return isMobile;
  }

  return false;
}
