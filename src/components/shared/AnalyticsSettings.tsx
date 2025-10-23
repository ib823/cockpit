/**
 * AnalyticsSettings Component
 * User interface for managing analytics preferences
 */

'use client';

import { Card, Space, Switch, Typography, Alert, Divider } from 'antd';
import { LineChartOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { HelpTooltip } from './HelpTooltip';

const { Title, Text, Paragraph } = Typography;

interface AnalyticsPreferences {
  analyticsEnabled: boolean;
  performanceTracking: boolean;
  errorTracking: boolean;
  userBehaviorTracking: boolean;
}

const DEFAULT_PREFERENCES: AnalyticsPreferences = {
  analyticsEnabled: false,
  performanceTracking: true,
  errorTracking: true,
  userBehaviorTracking: false,
};

export function AnalyticsSettings() {
  const [preferences, setPreferences] = useState<AnalyticsPreferences>(DEFAULT_PREFERENCES);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analytics-preferences');
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load analytics preferences:', error);
        }
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPrefs: AnalyticsPreferences) => {
    setPreferences(newPrefs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics-preferences', JSON.stringify(newPrefs));
    }
    setHasUnsavedChanges(false);
  };

  const handleToggle = (key: keyof AnalyticsPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    savePreferences(newPrefs);
  };

  const isDoNotTrackEnabled =
    typeof window !== 'undefined' &&
    (window.navigator.doNotTrack === '1' ||
      (window.navigator as any).msDoNotTrack === '1' ||
      (window as any).doNotTrack === '1');

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {isDoNotTrackEnabled && (
        <Alert
          message="Do Not Track Enabled"
          description="Your browser's Do Not Track setting is enabled. Analytics will be disabled regardless of your preferences below."
          type="info"
          icon={<EyeInvisibleOutlined />}
          showIcon
        />
      )}

      <Card
        title={
          <Space>
            <LineChartOutlined />
            <span>Analytics & Tracking</span>
            <HelpTooltip
              title="Analytics & Tracking"
              description="Control how we collect and use data to improve your experience"
            />
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Paragraph type="secondary">
            We use analytics to understand how you use our application and to improve your experience.
            All data is anonymized and never shared with third parties.
          </Paragraph>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Enable Analytics
                <HelpTooltip
                  title="Analytics"
                  description="Allow us to collect anonymized usage data to improve the application"
                />
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Help us improve by sharing anonymized usage data
              </Text>
            </div>
            <Switch
              checked={preferences.analyticsEnabled}
              onChange={(checked) => handleToggle('analyticsEnabled', checked)}
              disabled={isDoNotTrackEnabled}
            />
          </div>

          {preferences.analyticsEnabled && (
            <>
              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    Performance Tracking
                    <HelpTooltip
                      title="Performance Tracking"
                      description="Track page load times and performance metrics to identify and fix slow pages"
                    />
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Monitor page load times and performance metrics
                  </Text>
                </div>
                <Switch
                  checked={preferences.performanceTracking}
                  onChange={(checked) => handleToggle('performanceTracking', checked)}
                />
              </div>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    Error Tracking
                    <HelpTooltip
                      title="Error Tracking"
                      description="Automatically report errors to help us fix bugs faster"
                    />
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Help us identify and fix bugs by reporting errors
                  </Text>
                </div>
                <Switch
                  checked={preferences.errorTracking}
                  onChange={(checked) => handleToggle('errorTracking', checked)}
                />
              </div>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    User Behavior Tracking
                    <HelpTooltip
                      title="User Behavior Tracking"
                      description="Track clicks, scrolls, and interactions to improve the user experience"
                    />
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Track clicks and interactions to optimize the interface
                  </Text>
                </div>
                <Switch
                  checked={preferences.userBehaviorTracking}
                  onChange={(checked) => handleToggle('userBehaviorTracking', checked)}
                />
              </div>
            </>
          )}
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Text strong>Privacy Information</Text>
          <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
            • All analytics data is anonymized and encrypted
            <br />
            • We never sell or share your data with third parties
            <br />
            • You can opt out at any time
            <br />
            • Analytics data is automatically deleted after 90 days
            <br />• We respect your browser's Do Not Track setting
          </Paragraph>
        </Space>
      </Card>
    </Space>
  );
}
