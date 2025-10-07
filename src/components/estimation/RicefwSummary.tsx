/**
 * RicefwSummary Component
 *
 * Read-only summary of all RICEFW items for dashboard/review
 */

'use client';

import React from 'react';
import { ResponsiveCard, ResponsiveGrid } from '@/components/ui/ResponsiveShell';
import { Heading, Text } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/badge';
import { RicefwItem, calculateRicefwSummary } from '@/lib/ricefw/model';
import { FileText, Zap, Database, Code, FileSignature, Workflow } from 'lucide-react';

export interface RicefwSummaryProps {
  items: RicefwItem[];
  averageHourlyRate?: number;
}

export function RicefwSummary({ items, averageHourlyRate = 150 }: RicefwSummaryProps) {
  const summary = calculateRicefwSummary(items, averageHourlyRate);

  const categories = [
    {
      key: 'reports',
      label: 'Reports',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      key: 'interfaces',
      label: 'Interfaces',
      icon: Zap,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      key: 'conversions',
      label: 'Conversions',
      icon: Database,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      key: 'enhancements',
      label: 'Enhancements',
      icon: Code,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      key: 'forms',
      label: 'Forms',
      icon: FileSignature,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      key: 'workflows',
      label: 'Workflows',
      icon: Workflow,
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-900/20',
    },
  ];

  return (
    <ResponsiveCard padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Heading as="h2" size="xl">
            RICEFW Summary
          </Heading>
          <div className="text-right">
            <Text size="sm" color="muted">
              Total Effort
            </Text>
            <Text size="2xl" weight="bold" color="primary">
              {summary.totals.effort.toFixed(1)} PD
            </Text>
          </div>
        </div>

        {/* Category Cards */}
        <ResponsiveGrid cols={{ default: 2, md: 3, lg: 6 }} gap="sm">
          {categories.map(({ key, label, icon: Icon, color, bg }) => {
            const data = summary[key as keyof Omit<typeof summary, 'totals'>];
            return (
              <div
                key={key}
                className={`p-4 rounded-lg ${bg} text-center space-y-2`}
              >
                <Icon className={`h-6 w-6 mx-auto ${color}`} />
                <Text size="sm" weight="semibold">
                  {label}
                </Text>
                <Text size="xl" weight="bold">
                  {data.count}
                </Text>
                <Text size="xs" color="muted">
                  {data.effort.toFixed(1)} PD
                </Text>

                <div className="flex justify-center gap-1 flex-wrap">
                  {data.byComplexity.S > 0 && (
                    <Badge variant="default" size="sm">
                      {data.byComplexity.S}S
                    </Badge>
                  )}
                  {data.byComplexity.M > 0 && (
                    <Badge variant="default" size="sm">
                      {data.byComplexity.M}M
                    </Badge>
                  )}
                  {data.byComplexity.L > 0 && (
                    <Badge variant="default" size="sm">
                      {data.byComplexity.L}L
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </ResponsiveGrid>

        {/* Totals Bar */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
          <div>
            <Text size="sm" color="muted">
              Total Count
            </Text>
            <Text size="xl" weight="bold">
              {summary.totals.count}
            </Text>
          </div>
          <div>
            <Text size="sm" color="muted">
              Total Effort
            </Text>
            <Text size="xl" weight="bold" color="primary">
              {summary.totals.effort.toFixed(1)} PD
            </Text>
          </div>
        </div>
      </div>
    </ResponsiveCard>
  );
}
