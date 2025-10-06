/**
 * FormPanel Component
 *
 * Simplified panel for managing custom forms
 */

'use client';

import React from 'react';
import { ResponsiveCard } from '@/components/ui/ResponsiveShell';
import { Heading, Text } from '@/components/ui/Typography';
import { FormItem } from '@/lib/ricefw/model';

export interface FormPanelProps {
  projectId: string;
  forms: FormItem[];
  onChange: (forms: FormItem[]) => void;
  readonly?: boolean;
}

export function FormPanel({ projectId, forms, onChange, readonly = false }: FormPanelProps) {
  const totalEffort = forms.reduce((sum, form) => sum + form.effort, 0);

  return (
    <ResponsiveCard padding="lg">
      <div>
        <Heading as="h2" size="xl">
          Custom Forms
        </Heading>
        <Text color="muted" className="mt-1">
          PO, Invoice, Delivery Note, and custom form templates
        </Text>
      </div>

      <div className="mt-6">
        <Text size="lg" weight="bold">
          Total Forms: {forms.length}
        </Text>
        <Text size="lg" weight="bold" color="primary">
          Total Effort: {totalEffort.toFixed(1)} PD
        </Text>
      </div>

      {/* TODO: Add form list and editor */}
      <Text size="sm" color="muted" className="mt-4">
        Form management UI coming in next iteration
      </Text>
    </ResponsiveCard>
  );
}
