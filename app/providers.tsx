'use client';

import { SessionProvider } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

/**
 * 自定义轻量级 ThemeProvider
 * 专门解决 React 19 + Next.js 16 下 next-themes 注入脚本导致的 "Encountered a script tag" 错误
 */
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  themes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

function CustomThemeProvider({ children, defaultTheme = 'dark' }: { children: React.ReactNode, defaultTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let current: 'light' | 'dark' = 'dark';
      if (theme === 'system') {
        current = mediaQuery.matches ? 'dark' : 'light';
      } else {
        current = theme as 'light' | 'dark';
      }

      setResolvedTheme(current);
      root.classList.remove('light', 'dark');
      root.classList.add(current);
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    resolvedTheme,
    themes: ['light', 'dark', 'system']
  }), [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 针对 React 19 + Next.js 16 的 Providers
 */
export function Providers({ children, session }: { children: React.ReactNode, session?: any }) {
  return (
    <SessionProvider session={session}>
      <CustomThemeProvider defaultTheme="dark">
        {children}
      </CustomThemeProvider>
    </SessionProvider>
  );
}
