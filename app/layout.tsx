import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "streamdown/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gemini Style AI Chat",
  description: "A minimalist, high-fidelity AI chat interface inspired by Google Gemini.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Providers } from "./providers";
import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  console.log('[Server Layout] Session:', {
    isLoggedIn: !!session,
    userName: session?.user?.name,
    email: session?.user?.email
  });

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
    >
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300`}
        suppressHydrationWarning
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
