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
  const last = useRef(JSON.stringify(snapshotTokens()));

  useEffect(() => {
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
  }, []);

  const snap = useMemo(() => snapshotTokens(), [ver]);
  const algorithm = snap.themeAttr === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return (
    <ConfigProvider theme={{ token: snap.token, algorithm }}>
      {children}
    </ConfigProvider>
  );
};
