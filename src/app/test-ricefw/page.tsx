/**
 * RICEFW Components Test Page
 *
 * Interactive test page for RICEFW components
 */

"use client";

import React, { useState } from "react";
import { RicefwPanel } from "@/components/estimation/RicefwPanel";
import { RicefwSummary } from "@/components/estimation/RicefwSummary";
import { FormPanel } from "@/components/estimation/FormPanel";
import { IntegrationPanel } from "@/components/estimation/IntegrationPanel";
import { ResponsiveCard, ResponsiveStack } from "@/components/ui/ResponsiveShell";
import { Heading, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RicefwItem, FormItem, IntegrationItem } from "@/lib/ricefw/model";
import { getRicefwRecommendations } from "@/lib/ricefw/calculator";

export default function TestRicefwPage() {
  const [ricefwItems, setRicefwItems] = useState<RicefwItem[]>([]);
  const [formItems, setFormItems] = useState<FormItem[]>([]);
  const [integrationItems, setIntegrationItems] = useState<IntegrationItem[]>([]);

  // Mock project ID
  const projectId = "test-project-001";

  // Test scenario: Multi-country manufacturing
  const loadSampleScenario = () => {
    const recommendations = getRicefwRecommendations({
      countries: 3,
      legalEntities: 5,
      modules: ["finance", "supply-chain", "manufacturing"],
      industry: "manufacturing",
    });

    const sampleItems: RicefwItem[] = recommendations.map((rec, index) => ({
      id: `ricefw-${index}`,
      projectId,
      type: rec.type,
      name: rec.name,
      description: rec.rationale,
      complexity: rec.complexity,
      count: rec.count,
      effortPerItem: 0, // Will be calculated
      totalEffort: 0, // Will be calculated
      phase: "realize",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    setRicefwItems(sampleItems);
  };

  const clearAll = () => {
    setRicefwItems([]);
    setFormItems([]);
    setIntegrationItems([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        <ResponsiveStack spacing="lg">
          {/* Header */}
          <ResponsiveCard padding="lg" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <Heading as="h1" size="3xl">
                  RICEFW Components Test Page
                </Heading>
                <Text color="muted" className="mt-2">
                  Interactive testing environment for RICEFW, Forms, and Integrations
                </Text>
              </div>

              <div className="flex gap-2">
                <Button onClick={loadSampleScenario} variant="default">
                  Load Sample Scenario
                </Button>
                <Button onClick={clearAll} variant="outline">
                  Clear All
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <Text size="sm" color="muted">
                  RICEFW Items
                </Text>
                <Text size="2xl" weight="bold">
                  {ricefwItems.length}
                </Text>
              </div>
              <div className="text-center">
                <Text size="sm" color="muted">
                  Forms
                </Text>
                <Text size="2xl" weight="bold">
                  {formItems.length}
                </Text>
              </div>
              <div className="text-center">
                <Text size="sm" color="muted">
                  Integrations
                </Text>
                <Text size="2xl" weight="bold">
                  {integrationItems.length}
                </Text>
              </div>
            </div>
          </ResponsiveCard>

          {/* RICEFW Summary */}
          {ricefwItems.length > 0 && <RicefwSummary items={ricefwItems} />}

          {/* RICEFW Panel */}
          <RicefwPanel
            projectId={projectId}
            items={ricefwItems}
            onChange={setRicefwItems}
            readonly={false}
          />

          {/* Form Panel */}
          <FormPanel
            projectId={projectId}
            forms={formItems}
            onChange={setFormItems}
            readonly={false}
          />

          {/* Integration Panel */}
          <IntegrationPanel
            projectId={projectId}
            integrations={integrationItems}
            onChange={setIntegrationItems}
            readonly={false}
          />

          {/* Debug Info */}
          <ResponsiveCard padding="md" className="bg-gray-100 dark:bg-gray-900">
            <details>
              <summary className="cursor-pointer font-semibold mb-2">
                <Text weight="semibold">Debug Information</Text>
              </summary>
              <div className="space-y-4">
                <div>
                  <Text size="sm" weight="semibold" className="mb-1">
                    RICEFW Items ({ricefwItems.length})
                  </Text>
                  <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-auto max-h-60">
                    {JSON.stringify(ricefwItems, null, 2)}
                  </pre>
                </div>
                <div>
                  <Text size="sm" weight="semibold" className="mb-1">
                    Form Items ({formItems.length})
                  </Text>
                  <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-auto max-h-60">
                    {JSON.stringify(formItems, null, 2)}
                  </pre>
                </div>
                <div>
                  <Text size="sm" weight="semibold" className="mb-1">
                    Integration Items ({integrationItems.length})
                  </Text>
                  <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-auto max-h-60">
                    {JSON.stringify(integrationItems, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          </ResponsiveCard>

          {/* Testing Instructions */}
          <ResponsiveCard padding="lg" className="bg-blue-50 dark:bg-blue-900/20">
            <Heading as="h3" size="lg" className="mb-4">
              Testing Instructions
            </Heading>
            <ResponsiveStack spacing="sm">
              <div>
                <Text weight="semibold">1. Load Sample Scenario</Text>
                <Text size="sm" color="muted">
                  Click &quot;Load Sample Scenario&quot; to populate with recommended RICEFW items
                  for a multi-country manufacturing implementation
                </Text>
              </div>
              <div>
                <Text weight="semibold">2. Create New Items</Text>
                <Text size="sm" color="muted">
                  Click &quot;Add RICEFW Item&quot; to create custom reports, interfaces,
                  conversions, etc.
                </Text>
              </div>
              <div>
                <Text weight="semibold">3. Edit Items</Text>
                <Text size="sm" color="muted">
                  Click the edit icon on any item to modify its properties
                </Text>
              </div>
              <div>
                <Text weight="semibold">4. Delete Items</Text>
                <Text size="sm" color="muted">
                  Click the trash icon to remove items
                </Text>
              </div>
              <div>
                <Text weight="semibold">5. View Calculations</Text>
                <Text size="sm" color="muted">
                  Observe real-time effort calculations, phase impact, and cost estimates
                </Text>
              </div>
              <div>
                <Text weight="semibold">6. Adjust Hourly Rate</Text>
                <Text size="sm" color="muted">
                  Change the average hourly rate in the header to see cost recalculations
                </Text>
              </div>
              <div>
                <Text weight="semibold">7. Check Debug Info</Text>
                <Text size="sm" color="muted">
                  Expand the &quot;Debug Information&quot; section to see the raw data structures
                </Text>
              </div>
            </ResponsiveStack>
          </ResponsiveCard>
        </ResponsiveStack>
      </div>
    </div>
  );
}
