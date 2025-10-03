// src/components/project/CaptureCanvas.tsx
'use client';

import { ChipCapture } from '@/components/presales/ChipCapture';

export function CaptureCanvas() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <ChipCapture />
      </div>
    </div>
  );
}
