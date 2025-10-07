/**
 * IntegrationPanel Component
 *
 * Simplified panel for managing integrations
 */

'use client';

import React from 'react';
import { ResponsiveCard } from '@/components/ui/ResponsiveShell';
import { Heading, Text } from '@/components/ui/Typography';
import { IntegrationItem } from '@/lib/ricefw/model';

export interface IntegrationPanelProps {
  projectId: string;
  integrations: IntegrationItem[];
  onChange: (integrations: IntegrationItem[]) => void;
  readonly?: boolean;
}

export function IntegrationPanel({
  projectId,
  integrations,
  onChange,
  readonly = false,
}: IntegrationPanelProps) {
  const totalEffort = integrations.reduce((sum, int) => sum + int.effort, 0);

  return (
    <ResponsiveCard padding="lg">
      <div>
        <Heading as="h2" size="xl">
          Integrations
        </Heading>
        <Text color="muted" className="mt-1">
          API, File, Database, and Real-time integrations
        </Text>
      </div>

      <div className="mt-6">
        <Text size="lg" weight="bold">
          Total Integrations: {integrations.length}
        </Text>
        <Text size="lg" weight="bold" color="primary">
          Total Effort: {totalEffort.toFixed(1)} PD
        </Text>
      </div>

      {/* TODO: Add integration list and editor */}
      <Text size="sm" color="muted" className="mt-4">
        Integration management UI coming in next iteration
      </Text>
    </ResponsiveCard>
  );
}
