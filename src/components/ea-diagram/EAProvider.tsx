'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

interface EAContextType {
  isPanelOpen: boolean;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  highlightedModules: string[]; // IDs of modules to highlight
  setHighlightedModules: (ids: string[]) => void;
}

const EAContext = createContext<EAContextType | undefined>(undefined);

export function EAProvider({ children }: { children: ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [highlightedModules, setHighlightedModules] = useState<string[]>([]);

  const togglePanel = () => setIsPanelOpen(!isPanelOpen);
  const openPanel = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);

  return (
    <EAContext.Provider
      value={{
        isPanelOpen,
        togglePanel,
        openPanel,
        closePanel,
        highlightedModules,
        setHighlightedModules,
      }}
    >
      {children}
    </EAContext.Provider>
  );
}

export function useEAContext() {
  const context = useContext(EAContext);
  if (!context) {
    throw new Error('useEAContext must be used within EAProvider');
  }
  return context;
}