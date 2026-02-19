'use client';

import { SecurityArchitectureForm } from './SecurityArchitectureForm';
import { SizingScalabilityForm } from './SizingScalabilityForm';

export function SecuritySizingForm() {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-1">🔒 Security & Sizing</h3>
        <p className="text-sm text-red-700">
          Document security controls, authentication methods, and sizing/scalability requirements.
        </p>
      </div>

      <SecurityArchitectureForm />
      <SizingScalabilityForm />
    </div>
  );
}
