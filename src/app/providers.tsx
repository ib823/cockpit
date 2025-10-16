'use client';
import { ConfigProvider, App } from 'antd';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { antdTheme } from '@/config/theme';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && (
        args[0].includes('antd: compatible') ||
        args[0].includes('[next-auth][error][CLIENT_FETCH_ERROR]')
      )) {
        return;
      }
      originalError.apply(console, args);
    };
  }, []);

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ConfigProvider theme={antdTheme}>
            <App>
              <OnboardingProvider>
                {children}
              </OnboardingProvider>
            </App>
          </ConfigProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
