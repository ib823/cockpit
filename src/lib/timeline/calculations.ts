// @ts-nocheck
// Temporary mock data - will be replaced with actual catalog
const SAP_PACKAGES: Record<string, { effort: number }> = {
  'FI_1': { effort: 80 },
  'HR_1': { effort: 60 },
  'SCM_1': { effort: 100 }
};

export function calculateEffort(
  packages: string[],
  complexity: 'standard' | 'complex' | 'extreme'
): number {
  const baseEffort = packages.reduce((sum, pkg) => {
    const pkgData = SAP_PACKAGES[pkg];
    return sum + (pkgData?.effort || 0);
  }, 0);
  
  const multiplier = {
    standard: 1.0,
    complex: 1.3,
    extreme: 1.6
  }[complexity];
  
  return Math.ceil(baseEffort * multiplier);
}

export function sequencePhases(phases: any[]): any[] {
  const nodes = new Map<string, any>();
  const indegree = new Map<string, number>();
  
  phases.forEach(p => {
    nodes.set(p.id, p);
    indegree.set(p.id, 0);
  });
  
  phases.forEach(p => {
    p.dependencies?.forEach(() => {
      indegree.set(p.id, (indegree.get(p.id) || 0) + 1);
    });
  });
  
  const queue: string[] = [];
  indegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });
  
  const result: any[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const phase = nodes.get(id)!;
    result.push(phase);
    
    phases.forEach(p => {
      if (p.dependencies?.includes(id)) {
        const newDegree = (indegree.get(p.id) || 0) - 1;
        indegree.set(p.id, newDegree);
        if (newDegree === 0) queue.push(p.id);
      }
    });
  }
  
  return result;
}
