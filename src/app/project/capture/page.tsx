/**
 * Capture Page (Tier 1)
 * Initial requirements gathering
 * Placeholder for future implementation
 */

import React from 'react';
import { Empty } from '@/app/_components/ui';
import { FileText } from 'lucide-react';

export default function CapturePage() {
  return (
    <div className="py-12">
      <Empty
        icon={<FileText size={48} />}
        title="Capture Requirements"
        description="Gather initial project requirements and scope. This feature will connect to the estimator workflow."
      />
    </div>
  );
}
