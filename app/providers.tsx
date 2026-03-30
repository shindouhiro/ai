'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import React from 'react';

/**
 * 针对 React 19 + Next.js 16 的 Providers
 */
export function Providers({ children, session }: { children: React.ReactNode, session?: any }) {
  console.log('[Providers] Received Session Prop:', !!session);
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
