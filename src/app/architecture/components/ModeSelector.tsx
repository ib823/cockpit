'use client';

import { Card } from 'antd';
import { FileTextOutlined, RocketOutlined } from '@ant-design/icons';

interface ModeSelectorProps {
  onSelect: (mode: 'as-is' | 'to-be') => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            SAP Architecture Documentation
          </h1>
          <p className="text-xl text-gray-600">
            What are you creating today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AS-IS Card */}
          <button
            onClick={() => onSelect('as-is')}
            className="group text-left"
          >
            <Card
              hoverable
              className="h-full border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <FileTextOutlined className="text-blue-500" />
                </div>

                <h2 className="text-3xl font-semibold mb-4 group-hover:text-blue-600 transition-colors">
                  Document Existing System
                </h2>

                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                  Capture your current architecture, integrations, and infrastructure setup.
                </p>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-1">✓</div>
                    <div>
                      <div className="font-medium text-gray-900">AS-IS Documentation</div>
                      <div className="text-sm text-gray-500">Current state assessment</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-1">✓</div>
                    <div>
                      <div className="font-medium text-gray-900">Gap Analysis Ready</div>
                      <div className="text-sm text-gray-500">Identify improvement areas</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-1">✓</div>
                    <div>
                      <div className="font-medium text-gray-900">Audit & Compliance</div>
                      <div className="text-sm text-gray-500">Document actual setup</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-2">Best for:</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      System Assessment
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Documentation
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Audits
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </button>

          {/* TO-BE Card */}
          <button
            onClick={() => onSelect('to-be')}
            className="group text-left"
          >
            <Card
              hoverable
              className="h-full border-2 border-gray-200 hover:border-purple-500 hover:shadow-2xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <RocketOutlined className="text-purple-500" />
                </div>

                <h2 className="text-3xl font-semibold mb-4 group-hover:text-purple-600 transition-colors">
                  Design New System
                </h2>

                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                  Plan your future architecture, modules, integrations, and requirements.
                </p>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-purple-500 mt-1">✓</div>
                    <div>
                      <div className="font-medium text-gray-900">TO-BE Architecture</div>
                      <div className="text-sm text-gray-500">Future state design</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-purple-500 mt-1">✓</div>
                    <div>
                      <div className="font-medium text-gray-900">RFP Documentation</div>
                      <div className="text-sm text-gray-500">Vendor proposals</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-purple-500 mt-1">✓</div>
                    <div>
                      <div className="font-medium text-gray-900">Implementation Planning</div>
                      <div className="text-sm text-gray-500">Blueprint for execution</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-2">Best for:</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      New Projects
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      RFPs
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      Proposals
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            This choice helps us customize labels and templates for your specific needs.
            <br />
            You can always export diagrams in different formats later.
          </p>
        </div>
      </div>
    </div>
  );
}
