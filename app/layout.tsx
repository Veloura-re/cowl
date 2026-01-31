import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { RouteThemeHandler } from "@/components/RouteThemeHandler";
import { CyberGridBackground } from "@/components/ui/CyberGridBackground";
import AppInitializer from "@/components/AppInitializer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
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
