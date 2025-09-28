export interface ModuleDependency {
  moduleId: string;
  dependencies: string[];
  mandatory: boolean;
  criticalPath: boolean;
}

export class DependencyResolver {
  private adjacencyList: Map<string, Set<string>> = new Map();
  private modules: Map<string, ModuleDependency> = new Map();

  loadModules(modules: ModuleDependency[]) {
    modules.forEach(module => {
      this.modules.set(module.moduleId, module);
      this.adjacencyList.set(module.moduleId, new Set(module.dependencies));
    });
  }

  resolve(selectedModules: string[]): string[] {
    const resolved = new Set<string>();
    const visited = new Set<string>();
    
    // Add all dependencies recursively
    selectedModules.forEach(moduleId => {
      this.collectDependencies(moduleId, resolved, visited);
    });

    // Perform topological sort
    return this.topologicalSort(Array.from(resolved));
  }

  private collectDependencies(
    moduleId: string, 
    resolved: Set<string>, 
    visited: Set<string>
  ): void {
    if (visited.has(moduleId)) return;
    visited.add(moduleId);
    resolved.add(moduleId);

    const deps = this.adjacencyList.get(moduleId) || new Set();
    deps.forEach(dep => this.collectDependencies(dep, resolved, visited));
  }

  private topologicalSort(modules: string[]): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Calculate in-degrees
    modules.forEach(module => {
      inDegree.set(module, 0);
    });

    modules.forEach(module => {
      const deps = this.adjacencyList.get(module) || new Set();
      deps.forEach(dep => {
        if (inDegree.has(dep)) {
          inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
        }
      });
    });

    // Find modules with no dependencies
    modules.forEach(module => {
      if (inDegree.get(module) === 0) {
        queue.push(module);
      }
    });

    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      modules.forEach(module => {
        const deps = this.adjacencyList.get(module) || new Set();
        if (deps.has(current)) {
          const degree = (inDegree.get(module) || 1) - 1;
          inDegree.set(module, degree);
          if (degree === 0) {
            queue.push(module);
          }
        }
      });
    }

    if (result.length !== modules.length) {
      throw new Error('Circular dependency detected');
    }

    return result;
  }

  detectConflicts(modules: string[]): string[] {
    const conflicts: string[] = [];
    
    // Define incompatible combinations
    const incompatible: Record<string, string[]> = {
      'Finance_1': ['Finance_Legacy'],
      'SCM_Cloud': ['SCM_OnPrem'],
      'HCM_SuccessFactors': ['HCM_OnPrem']
    };

    modules.forEach(module => {
      const incompatibleModules = incompatible[module] || [];
      incompatibleModules.forEach(incomp => {
        if (modules.includes(incomp)) {
          conflicts.push(`${module} conflicts with ${incomp}`);
        }
      });
    });

    return conflicts;
  }
}