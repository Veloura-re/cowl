import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { QuillBackground } from "@/components/ui/QuillBackground";
import AppInitializer from "@/components/AppInitializer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LUCY | Business OS",
  description: "Manage your empire with precision.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "LUCY",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
      >
        <AppInitializer />
        <QuillBackground />

        <div className="relative z-10 w-full min-h-[100dvh] pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </body>
    </html>
  );
}
