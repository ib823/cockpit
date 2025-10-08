/**
 * Decide Page (Tier 2)
 * Presales chip selection and decision making
 * Placeholder for future implementation
 */

import React from 'react';
import { Empty } from '@/app/_components/ui';
import { CheckSquare } from 'lucide-react';

export default function DecidePage() {
  return (
    <div className="py-12">
      <Empty
        icon={<CheckSquare size={48} />}
        title="Make Decisions"
        description="Select presales chips and make implementation decisions. This feeds into the timeline planning."
      />
    </div>
  );
}
