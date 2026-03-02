import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { InAppNotificationProvider } from "@/components/InAppNotificationProvider";
import { NotificationPoller } from "@/components/NotificationPoller";
import { PromoPopup } from "@/components/PromoPopup";
import { AppEntranceWrapper } from "@/components/mobile/AppEntranceWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobPool - Task Marketplace",
  description: "Connect with skilled taskers for home services, repairs, and more. Post tasks or find work opportunities.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JobPool",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "JobPool",
    title: "JobPool - Task Marketplace",
    description: "Connect with skilled taskers for home services, repairs, and more.",
  },
  twitter: {
    card: "summary",
    title: "JobPool - Task Marketplace",
    description: "Connect with skilled taskers for home services, repairs, and more.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#1e3a8a" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
        <InAppNotificationProvider />
        <NotificationPoller />
        <PromoPopup imageSrc="/images/promo-popup.png" />
        <MobileLayout>
          <AppEntranceWrapper>
            <MainHeader />
            <main className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
              {children}
            </main>
            <Footer />
          </AppEntranceWrapper>
          <MobileBottomNav />
        </MobileLayout>
        <Toaster />
      </body>
    </html>
  );
}
