/**
 * Reference Diagram Page
 *
 * Displays SAP Activate methodology diagram and phase descriptions
 * (Renamed from "SAP Activate" button)
 */

"use client";

import React from "react";
import { ResponsiveShell, ResponsiveStack, ResponsiveCard } from "@/components/ui/ResponsiveShell";
import { Heading, Text } from "@/components/ui/Typography";
import { Container } from "@/components/ui/Container";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReferenceDiagram() {
  const router = useRouter();

  const phases = [
    {
      name: "Prepare",
      duration: "2-4 weeks",
      color: "bg-blue-500",
      description: "Project kickoff, team formation, infrastructure setup, and planning.",
      keyActivities: [
        "Project charter creation",
        "Team onboarding",
        "Environment provisioning",
        "Initial planning workshops",
      ],
    },
    {
      name: "Explore",
      duration: "4-8 weeks",
      color: "bg-green-500",
      description: "Fit-to-standard workshops, gap analysis, and solution design.",
      keyActivities: [
        "Business process workshops",
        "Fit-gap analysis",
        "Solution architecture design",
        "Data migration strategy",
      ],
    },
    {
      name: "Realize",
      duration: "8-16 weeks",
      color: "bg-yellow-500",
      description: "System configuration, development, and integration.",
      keyActivities: [
        "System configuration",
        "Custom development (RICEFW)",
        "Integration setup",
        "Unit testing",
      ],
    },
    {
      name: "Deploy",
      duration: "4-8 weeks",
      color: "bg-orange-500",
      description: "User acceptance testing, training, cutover, and go-live.",
      keyActivities: [
        "UAT execution",
        "End-user training",
        "Data migration execution",
        "Go-live cutover",
      ],
    },
    {
      name: "Run",
      duration: "4-8 weeks",
      color: "bg-purple-500",
      description: "Hypercare support, stabilization, and continuous improvement.",
      keyActivities: [
        "Hypercare support (24/7)",
        "Issue resolution",
        "Performance optimization",
        "Knowledge transfer",
      ],
    },
  ];

  return (
    <ResponsiveShell maxWidth="2xl" padding="lg">
      <Container>
        <ResponsiveStack spacing="lg">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={() => router.back()}
              className="print:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex gap-2 print:hidden">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <a
                href="https://support.sap.com/en/tools/software-logistics-tools/sap-activate.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                SAP Docs
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Title */}
          <div>
            <Heading as="h1" className="mb-4">
              SAP Activate Methodology Reference
            </Heading>
            <Text size="lg" color="muted">
              A structured approach to SAP S/4HANA implementation with five core phases
            </Text>
          </div>

          {/* Diagram Placeholder */}
          <ResponsiveCard padding="lg">
            <div className="relative w-full h-96 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">📊</div>
                <div>
                  <Heading as="h3" size="xl">
                    SAP Activate Methodology Diagram
                  </Heading>
                  <Text color="muted" className="mt-2">
                    Visual representation of the five-phase approach
                  </Text>
                </div>
              </div>
            </div>
          </ResponsiveCard>

          {/* Phase Details */}
          <div>
            <Heading as="h2" className="mb-6">
              Phase Breakdown
            </Heading>

            <ResponsiveStack spacing="md">
              {phases.map((phase, index) => (
                <ResponsiveCard key={phase.name} padding="lg">
                  <div className="flex items-start gap-4">
                    {/* Phase Number */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full ${phase.color} flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {index + 1}
                    </div>

                    {/* Phase Content */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Heading as="h3" size="xl">
                            {phase.name}
                          </Heading>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {phase.duration}
                          </span>
                        </div>
                        <Text color="muted" className="mt-1">
                          {phase.description}
                        </Text>
                      </div>

                      <div>
                        <Text weight="semibold" className="mb-2">
                          Key Activities:
                        </Text>
                        <ul className="space-y-1 ml-5">
                          {phase.keyActivities.map((activity) => (
                            <li key={activity} className="text-sm text-muted-foreground">
                              • {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </ResponsiveCard>
              ))}
            </ResponsiveStack>
          </div>

          {/* Best Practices */}
          <ResponsiveCard padding="lg">
            <Heading as="h2" className="mb-4">
              Best Practices
            </Heading>
            <ResponsiveStack spacing="sm">
              <Text>
                • <strong>Fit-to-Standard First:</strong> Minimize customizations by adopting SAP
                best practices
              </Text>
              <Text>
                • <strong>Agile Iterations:</strong> Use iterative sprints within each phase for
                continuous feedback
              </Text>
              <Text>
                • <strong>Change Management:</strong> Engage stakeholders early and maintain
                communication throughout
              </Text>
              <Text>
                • <strong>Data Quality:</strong> Cleanse and validate data before migration
              </Text>
              <Text>
                • <strong>Testing Rigor:</strong> Conduct thorough testing at every stage to catch
                issues early
              </Text>
            </ResponsiveStack>
          </ResponsiveCard>

          {/* Footer Note */}
          <div className="border-t border-border pt-6 print:hidden">
            <Text size="sm" color="muted" className="text-center">
              This reference diagram is based on the official SAP Activate methodology. For the
              latest updates, visit{" "}
              <a
                href="https://support.sap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                SAP Support Portal
              </a>
            </Text>
          </div>
        </ResponsiveStack>
      </Container>
    </ResponsiveShell>
  );
}
