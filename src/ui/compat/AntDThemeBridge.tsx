'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';

function readVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function snapshotTokens() {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      themeAttr: 'light',
      token: {
        colorPrimary: '#2563eb',
        colorInfo: '#2563eb',
        colorSuccess: '#16a34a',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        colorBgBase: '#ffffff',
        colorTextBase: '#0f172a',
        colorBorder: '#e5e7eb',
        borderRadius: 10,
        fontFamily: `-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Helvetica Neue,sans-serif`,
      },
    } as const;
  }

  const themeAttr = document.documentElement.getAttribute('data-theme') ??
                    (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  // Prefer your tokens; provide fallbacks
  const colorPrimary = readVar('--accent', readVar('--brand-primary', '#2563eb'));
  const colorBgBase  = readVar('--surface', '#ffffff');
  const colorText    = readVar('--ink', '#0f172a');
  const colorBorder  = readVar('--line', '#e5e7eb');

  return {
    themeAttr,
    token: {
      colorPrimary,
      colorInfo: colorPrimary,
      colorSuccess: readVar('--success', '#16a34a'),
      colorWarning: readVar('--warning', readVar('--warn', '#f59e0b')),
      colorError:   readVar('--error', readVar('--danger', '#ef4444')),
      colorBgBase,
      colorTextBase: colorText,
      colorBorder,
      borderRadius: Number.parseInt(readVar('--r-md', '10px')) || 10,
      fontFamily: readVar('--font-sans', `-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Helvetica Neue,sans-serif`),
    },
  } as const;
}

export const AntDThemeBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ver, setVer] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const last = useRef(JSON.stringify(snapshotTokens()));

  // Prevent hydration mismatch by using server-side values until mounted
  useEffect(() => {
    setIsMounted(true);
    // Trigger initial update after mount to sync with actual DOM
    const snap = JSON.stringify(snapshotTokens());
    if (snap !== last.current) {
      last.current = snap;
      setVer((v) => v + 1);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let rafId = 0;
    const obs = new MutationObserver((mutations) => {
      const relevant = mutations.some((m) =>
        m.type === 'attributes' && m.target === document.documentElement && (
          m.attributeName === 'data-theme' ||
          m.attributeName === 'class' ||
          m.attributeName === 'style'
        )
      );
      if (!relevant) return;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const snap = JSON.stringify(snapshotTokens());
        if (snap !== last.current) {
          last.current = snap;
          setVer((v) => v + 1);
        }
      });
    });

    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style']
    });

    return () => {
      obs.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [isMounted]);

  // Always use server-side fallback until mounted to prevent hydration mismatch
  const snap = useMemo(() => {
    if (!isMounted) {
      // Return server-side fallback
      return {
        themeAttr: 'light' as const,
        token: {
          colorPrimary: '#2563eb',
          colorInfo: '#2563eb',
          colorSuccess: '#16a34a',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorBgBase: '#ffffff',
          colorTextBase: '#0f172a',
          colorBorder: '#e5e7eb',
          borderRadius: 10,
          fontFamily: `-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Helvetica Neue,sans-serif`,
        },
      };
    }
    return snapshotTokens();
  }, [ver, isMounted]);

  const algorithm = snap.themeAttr === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return (
    <ConfigProvider
      theme={{
        token: snap.token,
        algorithm,
        components: {
          // Modal enhancements - professional polish
          Modal: {
            borderRadiusLG: 16,  // Larger border radius (design system: 16px)
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',  // Elevation 4
            contentBg: snap.token.colorBgBase,
            headerBg: snap.token.colorBgBase,
            padding: 24,  // Consistent padding (design system spacing[6])
            paddingLG: 24,
            paddingMD: 20,
          },
          // Dropdown enhancements - better shadows
          Dropdown: {
            borderRadiusLG: 12,  // Rounded corners
            boxShadowSecondary: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',  // Elevation 3
            paddingBlock: 8,
          },
          // Select dropdown enhancements
          Select: {
            borderRadius: 12,
            boxShadowSecondary: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            controlHeight: 40,  // Standard height (design system)
            controlHeightLG: 48,  // Large height
            controlHeightSM: 32,  // Small height
          },
          // Input enhancements - consistent heights and focus states
          Input: {
            controlHeight: 40,  // Standard input height (design system)
            controlHeightLG: 48,
            controlHeightSM: 32,
            borderRadius: 8,  // Rounded corners
            paddingBlock: 8,
            paddingInline: 12,
          },
          // InputNumber enhancements
          InputNumber: {
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
            borderRadius: 8,
            paddingBlock: 8,
            paddingInline: 12,
          },
          // DatePicker enhancements
          DatePicker: {
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
            borderRadius: 8,
          },
          // Form enhancements
          Form: {
            labelFontSize: 14,
            labelHeight: 22,
            labelColor: '#374151',  // Gray-700
            verticalLabelPadding: 8,
          },
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
};
