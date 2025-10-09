/**
 * Present Page (Tier 4)
 * Client-ready presentation generation
 * Placeholder for future implementation
 */

import React from 'react';
import { Empty } from '@/app/_components/ui';
import { Presentation } from 'lucide-react';

export default function PresentPage() {
  return (
    <div className="py-12">
      <Empty
        icon={<Presentation size={48} />}
        title="Present to Client"
        description="Generate client-ready presentations and proposals from your timeline and decisions."
      />
    </div>
  );
}
