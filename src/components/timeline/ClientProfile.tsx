import React from 'react';
import { useTimelineStore } from '@/stores/timeline-store';

const ClientProfile: React.FC = () => {
  const { profile, setProfile } = useTimelineStore();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Profile</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            value={profile.company}
            onChange={(e) => setProfile({ company: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your Company Name"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select
              value={profile.region}
              onChange={(e) => setProfile({ region: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ABMY">Malaysia</option>
              <option value="ABSG">Singapore</option>
              <option value="ABVN">Vietnam</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
            <select
              value={profile.complexity}
              onChange={(e) => setProfile({ complexity: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="simple">Simple</option>
              <option value="standard">Standard</option>
              <option value="complex">Complex</option>
              <option value="very_complex">Very Complex</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
