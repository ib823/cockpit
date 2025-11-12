// app/architecture/generators/allGenerators.ts
// TODO: Rewrite generators for new AS-IS/TO-BE structure

import type { ArchitectureData } from '../types';

// Placeholder generators - returning empty strings for now
// Will be rewritten to generate:
// 1. AS-IS diagram (current state only)
// 2. TO-BE diagram (future state only)
// 3. Integration Bridge diagram (how TO-BE connects to AS-IS)
// 4. Gap Analysis diagram

export function generateSystemContextDiagram(data: Partial<ArchitectureData>): string {
  // TODO: Rewrite
  return '';
}

export function generateModuleArchitectureDiagram(data: Partial<ArchitectureData>): string {
  // TODO: Rewrite for AS-IS landscape
  return '';
}

export function generateIntegrationArchitectureDiagram(data: Partial<ArchitectureData>): string {
  // TODO: Rewrite for TO-BE integrations
  return '';
}

export function generateDeploymentArchitectureDiagram(data: Partial<ArchitectureData>): string {
  const { environments, infrastructure } = data;

  if (!environments?.length || !infrastructure?.deploymentModel) return '';

  // Keep deployment generator as-is for now
  const envBlocks = environments
    .map((env, idx) => {
      const servers = env.servers
        .map((srv, srvIdx) => {
          const id = `env${idx}srv${srvIdx}`;
          const shape =
            srv.type.toLowerCase().includes('database') || srv.type.toLowerCase().includes('db')
              ? `[(${srv.type}<br/>${srv.count}x ${srv.specs})]`
              : `[${srv.type}<br/>${srv.count}x ${srv.specs}]`;
          return `        ${id}${shape}`;
        })
        .join('\n');

      return `    subgraph env${idx}["${env.name}"]\n${servers}\n    end`;
    })
    .join('\n\n');

  const infraInfo = `    infraInfo["📍 ${infrastructure.location}<br/>📦 ${infrastructure.deploymentModel}"]`;

  return `graph TB\n${envBlocks}\n\n    ${infraInfo}\n\n    style infraInfo fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#000`;
}

export function generateSecurityArchitectureDiagram(data: Partial<ArchitectureData>): string {
  // TODO: Keep security as-is for now
  return '';
}

export function generateSizingScalabilityDiagram(data: Partial<ArchitectureData>): string {
  // TODO: Keep sizing as-is for now
  return '';
}
