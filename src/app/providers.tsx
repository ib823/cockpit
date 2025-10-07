'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <OnboardingProvider>
          {children}
          <Toaster />
        </OnboardingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}