import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RouteThemeHandler } from "@/components/RouteThemeHandler";
import { CyberGridBackground } from "@/components/ui/CyberGridBackground";
import AppInitializer from "@/components/AppInitializer";

export const metadata: Metadata = {
  title: "Claire",
  description: "Manage your empire with precision.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Claire",
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

import { Providers } from "@/components/Providers";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${inter.className} antialiased bg-background text-foreground`}
      >
        <Providers>
          <RouteThemeHandler />
          <AppInitializer />
          <CyberGridBackground />

          <div className="relative z-10 w-full min-h-[100dvh] pb-[env(safe-area-inset-bottom)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
