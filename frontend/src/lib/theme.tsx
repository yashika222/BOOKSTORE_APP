'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';

export type ThemePreference = 'system' | 'light' | 'dark';
type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'bookstore_theme';

const ThemeContext = createContext<{
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  toggleTheme: () => void;
}>({
  mode: 'light',
  preference: 'system',
  setPreference: () => undefined,
  toggleTheme: () => undefined,
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

function systemIsDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveMode(preference: ThemePreference): ThemeMode {
  if (preference === 'system') return systemIsDark() ? 'dark' : 'light';
  return preference;
}

function applyDomTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.setAttribute('data-theme', mode);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const nextPref: ThemePreference =
      stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system';
    setPreferenceState(nextPref);
    const resolved = resolveMode(nextPref);
    setMode(resolved);
    applyDomTheme(resolved);
  }, []);

  useEffect(() => {
    applyDomTheme(mode);
  }, [mode]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (preference === 'system') {
        const resolved = media.matches ? 'dark' : 'light';
        setMode(resolved);
        applyDomTheme(resolved);
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = (value: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setPreferenceState(value);
    setMode(resolveMode(value));
  };

  const value = useMemo(
    () => ({
      mode,
      preference,
      setPreference,
      toggleTheme: () => setPreference(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode, preference]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#92202F',
            colorLink: '#92202F',
            colorBgBase: mode === 'dark' ? '#141414' : '#fafafa',
            colorBgContainer: mode === 'dark' ? '#1f1f1f' : '#ffffff',
            borderRadius: 4,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          components: {
            Button: { controlHeight: 40, borderRadius: 2 },
            Input: { controlHeight: 40, borderRadius: 2 },
            Card: { borderRadiusLG: 4 },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
