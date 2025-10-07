/**
 * ENTERPRISE ARCHITECTURE MODAL
 *
 * Proper EA layers as requested:
 * 1. Business Strategy & Business Processes
 * 2. Client Systems (CRM, Marketing, Other Tools)
 * 3. SAP Modules (supplementary)
 * 4. SAP Code/Custom Development
 * 5. BTP / Analytics
 * 6. Data & Infrastructure
 *
 * OR: SAP Activate Methodology
 */

"use client";

import { AnimatePresence, motion } from 'framer-motion';
import {  X, Download, Target, Users, Boxes, Code, BarChart3, Database,
  CheckCircle, Clock, Zap } from 'lucide-react';
import { animation } from '@/lib/design-system';
import { useState } from 'react';

interface EnterpriseArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

type ViewMode = 'ea' | 'activate';

export function EnterpriseArchitectureModal({ isOpen, onClose, projectName = 'SAP Implementation' }: EnterpriseArchitectureModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('ea');

  if (!isOpen) return null;

  const handleExport = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: animation.duration.fast }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Enterprise Architecture</h2>
              <p className="text-sm text-gray-600 mt-1">{projectName}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('ea')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'ea'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Architecture
                </button>
                <button
                  onClick={() => setViewMode('activate')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'activate'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  SAP Activate
                </button>
              </div>

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            {viewMode === 'ea' ? <EnterpriseArchitectureView /> : <SAPActivateView />}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function EnterpriseArchitectureView() {
  return (
    <div className="space-y-6">
      {/* Layer 1: Business Strategy & Processes */}
      <Layer
        number={1}
        title="Business Strategy & Processes"
        icon={<Target className="w-6 h-6" />}
        color="from-purple-600 to-purple-700"
        items={[
          'Strategic Objectives & KPIs',
          'Business Process Model (BPMN)',
          'Value Chain Analysis',
          'Stakeholder Requirements'
        ]}
      />

      {/* Layer 2: Client Systems (CRM, Marketing, etc.) */}
      <Layer
        number={2}
        title="Client Systems & Tools"
        icon={<Users className="w-6 h-6" />}
        color="from-blue-600 to-blue-700"
        items={[
          'CRM Platform (Salesforce, etc.)',
          'Marketing Automation',
          'Legacy ERP System',
          'Custom Applications'
        ]}
      />

      {/* Layer 3: SAP Modules */}
      <Layer
        number={3}
        title="SAP Modules"
        icon={<Boxes className="w-6 h-6" />}
        color="from-green-600 to-green-700"
        items={[
          'SAP S/4HANA Finance',
          'SAP Materials Management',
          'SAP Sales & Distribution',
          'SAP HCM / SuccessFactors'
        ]}
      />

      {/* Layer 4: SAP Code / Custom Development */}
      <Layer
        number={4}
        title="Custom Development"
        icon={<Code className="w-6 h-6" />}
        color="from-orange-600 to-orange-700"
        items={[
          'ABAP Programs & Function Modules',
          'Fiori/UI5 Custom Apps',
          'Integration Middleware',
          'Custom Reports & Forms'
        ]}
      />

      {/* Layer 5: BTP / Analytics */}
      <Layer
        number={5}
        title="BTP & Analytics"
        icon={<BarChart3 className="w-6 h-6" />}
        color="from-indigo-600 to-indigo-700"
        items={[
          'SAP Analytics Cloud',
          'BTP Integration Suite',
          'AI/ML Services',
          'Workflow Automation'
        ]}
      />

      {/* Layer 6: Data & Infrastructure */}
      <Layer
        number={6}
        title="Data & Infrastructure"
        icon={<Database className="w-6 h-6" />}
        color="from-gray-700 to-gray-800"
        items={[
          'HANA Database',
          'Cloud Infrastructure (AWS/Azure/GCP)',
          'Data Migration & Archiving',
          'Security & Compliance'
        ]}
      />
    </div>
  );
}

function SAPActivateView() {
  return (
    <div className="space-y-6">
      {/* Prepare Phase */}
      <PhaseCard
        title="Prepare"
        duration="2-4 weeks"
        icon={<CheckCircle className="w-6 h-6" />}
        color="from-blue-600 to-blue-700"
        deliverables={[
          'Project Charter',
          'Project Team Mobilization',
          'Infrastructure Setup',
          'Initial Backlog Creation'
        ]}
      />

      {/* Explore Phase */}
      <PhaseCard
        title="Explore"
        duration="4-8 weeks"
        icon={<Target className="w-6 h-6" />}
        color="from-purple-600 to-purple-700"
        deliverables={[
          'Fit-to-Standard Workshops',
          'Process Design Documentation',
          'Solution Validation',
          'Organizational Change Management Plan'
        ]}
      />

      {/* Realize Phase */}
      <PhaseCard
        title="Realize"
        duration="12-20 weeks"
        icon={<Code className="w-6 h-6" />}
        color="from-green-600 to-green-700"
        deliverables={[
          'System Configuration',
          'Custom Development (RICEFW)',
          'Data Migration',
          'Integration Testing'
        ]}
      />

      {/* Deploy Phase */}
      <PhaseCard
        title="Deploy"
        duration="4-6 weeks"
        icon={<Zap className="w-6 h-6" />}
        color="from-orange-600 to-orange-700"
        deliverables={[
          'User Training',
          'Cutover Execution',
          'Go-Live Support',
          'Production Stabilization'
        ]}
      />

      {/* Run Phase */}
      <PhaseCard
        title="Run"
        duration="Ongoing"
        icon={<Clock className="w-6 h-6" />}
        color="from-gray-700 to-gray-800"
        deliverables={[
          'Hypercare Support (4-8 weeks)',
          'Continuous Improvement',
          'User Adoption Monitoring',
          'Knowledge Transfer'
        ]}
      />
    </div>
  );
}

function Layer({ number, title, icon, color, items }: {
  number: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: number * 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className={`bg-gradient-to-r ${color} px-6 py-4 text-white flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
            {icon}
          </div>
          <div>
            <div className="text-xs font-medium opacity-90">Layer {number}</div>
            <div className="text-lg font-semibold">{title}</div>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function PhaseCard({ title, duration, icon, color, deliverables }: {
  title: string;
  duration: string;
  icon: React.ReactNode;
  color: string;
  deliverables: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className={`bg-gradient-to-r ${color} px-6 py-4 text-white flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
            {icon}
          </div>
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm opacity-90">{duration}</div>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Deliverables</h4>
        <ul className="space-y-2">
          {deliverables.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
