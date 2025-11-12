'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Button, Space, Spin, Select } from 'antd';
import { DownloadOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import mermaid from 'mermaid';
import { useArchitectureStore } from '../stores/architectureStore';
import {
  generateSystemContextDiagram,
  generateModuleArchitectureDiagram,
  generateIntegrationArchitectureDiagram,
  generateDeploymentArchitectureDiagram,
  generateSecurityArchitectureDiagram,
  generateSizingScalabilityDiagram,
} from '../generators/allGenerators';

const GENERATORS = [
  generateSystemContextDiagram,
  generateModuleArchitectureDiagram,
  generateIntegrationArchitectureDiagram,
  generateDeploymentArchitectureDiagram,
  generateSecurityArchitectureDiagram,
  generateSizingScalabilityDiagram,
];

const NAMES = ['System Context', 'Module Architecture', 'Integration', 'Deployment', 'Security', 'Sizing'];

export function DiagramPreview({ currentStep }: { currentStep: number }) {
  const { data } = useArchitectureStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [previewStep, setPreviewStep] = useState(currentStep);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'base' });
  }, []);

  useEffect(() => {
    setPreviewStep(currentStep);
  }, [currentStep]);

  useEffect(() => {
    renderDiagram();
  }, [data, previewStep]);

  const renderDiagram = async () => {
    if (!containerRef.current) return;
    setIsLoading(true);

    try {
      const code = GENERATORS[previewStep](data);
      if (!code) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full">
            <div class="text-center max-w-md px-6">
              <div style="font-size: 64px; opacity: 0.3; margin-bottom: 24px;">📊</div>
              <h3 style="font-size: 20px; font-weight: 600; color: #374151; margin-bottom: 12px;">
                Your diagram will appear here
              </h3>
              <p style="color: #6B7280; font-size: 15px; line-height: 1.6;">
                Add information in the form to see your architecture diagram visualized in real-time
              </p>
            </div>
          </div>
        `;
        setIsLoading(false);
        return;
      }

      try {
        const { svg } = await mermaid.render(`preview-${Date.now()}`, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (mermaidError) {
        console.error('Mermaid render error:', mermaidError);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div class="text-red-500 p-4">Error rendering diagram: ${mermaidError instanceof Error ? mermaidError.message : 'Unknown error'}</div>`;
        }
      }
    } catch (error) {
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div class="text-red-500 p-4">Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${NAMES[previewStep].toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title={
        <Space>
          <span>Preview</span>
          <Select
            size="small"
            value={previewStep}
            onChange={setPreviewStep}
            style={{ width: 180 }}
            options={NAMES.map((name, idx) => ({ label: name, value: idx }))}
          />
        </Space>
      }
      extra={
        <Space>
          <Button
            size="small"
            icon={<ZoomOutOutlined />}
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          />
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <Button
            size="small"
            icon={<ZoomInOutlined />}
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          />
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Export
          </Button>
        </Space>
      }
    >
      <div className="relative h-full min-h-[600px] overflow-auto bg-gray-50 rounded">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 z-10">
            <Spin size="large" />
          </div>
        )}
        <div
          ref={containerRef}
          className="p-4"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        />
      </div>
    </Card>
  );
}
