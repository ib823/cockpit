'use client';

import { Steps, Button, Space } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useArchitectureStore } from '../stores/architectureStore';
import { DiagramPreview } from './DiagramPreview';
import { SystemContextForm } from './steps/SystemContextForm';
import { AsIsLandscapeForm } from './steps/AsIsLandscapeForm';
import { ToBeSolutionForm } from './steps/ToBeSolutionForm';
import { IntegrationBridgeForm } from './steps/IntegrationBridgeForm';
import { DeploymentArchitectureForm } from './steps/DeploymentArchitectureForm';
import { SecuritySizingForm } from './steps/SecuritySizingForm';

const STEPS = [
  {
    title: 'Business Context',
    description: 'Actors & external systems',
    component: SystemContextForm,
    help: 'Define the business stakeholders and external systems that will interact with your solution.'
  },
  {
    title: 'AS-IS Landscape',
    description: 'Current state',
    component: AsIsLandscapeForm,
    help: 'Document your current SAP modules, legacy systems, and existing integrations.'
  },
  {
    title: 'TO-BE Solution',
    description: 'Future state',
    component: ToBeSolutionForm,
    help: 'Define the planned SAP modules, cloud systems (BTP, Ariba, SuccessFactors), and new integrations.'
  },
  {
    title: 'Integration Bridge',
    description: 'AS-IS → TO-BE',
    component: IntegrationBridgeForm,
    help: 'Map how the TO-BE solution will connect to existing AS-IS systems.'
  },
  {
    title: 'Deployment',
    description: 'Infrastructure',
    component: DeploymentArchitectureForm,
    help: 'Define deployment environments and infrastructure specifications.'
  },
  {
    title: 'Security & Sizing',
    description: 'Auth, security, scalability',
    component: SecuritySizingForm,
    help: 'Document security controls, authentication methods, and sizing/scalability plans.'
  },
];

export function DiagramWizard() {
  const { currentStep, setStep, isStepComplete } = useArchitectureStore();
  const CurrentStepComponent = STEPS[currentStep].component;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SAP RFP Diagram Generator</h1>
          <p className="text-gray-600">
            Create production-ready architecture diagrams for SAP implementations.
            This wizard separates AS-IS (current state) from TO-BE (future state) to generate clear diagrams showing
            your current landscape, planned solution, integration bridge, and gap analysis.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <Steps
            current={currentStep}
            items={STEPS.map((step, idx) => ({
              title: step.title,
              description: step.description,
              status: isStepComplete(idx) ? 'finish' : idx === currentStep ? 'process' : 'wait',
              icon: isStepComplete(idx) ? <CheckCircleOutlined /> : undefined,
            }))}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-2xl font-semibold mb-2">{STEPS[currentStep].title}</h2>
              <p className="text-sm text-gray-600 mb-6">{STEPS[currentStep].help}</p>

              <CurrentStepComponent />

              <div className="mt-8 pt-6 border-t">
                <Space className="w-full" direction="vertical" size="middle">
                  <div className="text-sm text-gray-600">
                    Step {currentStep + 1} of {STEPS.length}
                  </div>
                  <Space className="w-full justify-between">
                    <Button
                      size="large"
                      disabled={currentStep === 0}
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleNext}
                      disabled={currentStep === STEPS.length - 1}
                    >
                      {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
                    </Button>
                  </Space>
                </Space>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <DiagramPreview currentStep={currentStep} />
          </div>
        </div>
      </div>
    </div>
  );
}
