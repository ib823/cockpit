// @ts-nocheck
import { Phase, Holiday } from '@/types/chip-override';
import { SAP_CATALOG } from '@/data/sap-catalog';

export function generatePhases(
  selectedPackages: string[],
  complexity: string,
  holidays: Holiday[] = []
): Phase[] {
  const phases: Phase[] = [];
  let currentBusinessDay = 0;
  
  // Complexity multipliers
  const complexityMultipliers: Record<string, number> = {
    simple: 0.8,
    standard: 1.0,
    complex: 1.3,
    very_complex: 1.6,
  };
  
  const multiplier = complexityMultipliers[complexity] || 1.0;
  
  // Generate phases for each selected package
  selectedPackages.forEach((packageId) => {
    const pkg = SAP_CATALOG[packageId];
    if (!pkg) return;
    
    // Standard phases for each package
    const phaseTemplates = [
      { name: 'Prepare', percentage: 0.15 },
      { name: 'Explore', percentage: 0.25 },
      { name: 'Realize', percentage: 0.40 },
      { name: 'Deploy', percentage: 0.15 },
      { name: 'Run', percentage: 0.05 },
    ];
    
    phaseTemplates.forEach((template, index) => {
      const baseDuration = Math.ceil(pkg.baseEffort * template.percentage * multiplier);
      
      phases.push({
        id: `phase_${packageId}_${index}`,
        name: `${pkg.name} - ${template.name}`,
        startBusinessDay: currentBusinessDay,
        workingDays: baseDuration,
        dependencies: index > 0 ? [`phase_${packageId}_${index - 1}`] : [],
        packageId,
        skipHolidays: true,
        resources: [],
      });
      
      currentBusinessDay += baseDuration;
    });
  });
  
  return phases;
}
