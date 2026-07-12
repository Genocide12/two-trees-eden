import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Two Trees: Eden — A Game of God and Evil",
  description: "A stoic strategy game of two sides — Light and Darkness — across seven epochs of the world.",
  keywords: ["Two Trees", "Eden", "strategy game", "philosophy", "stoic", "Light vs Darkness"],
  authors: [{ name: "Two Trees" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Two Trees: Eden",
  },
  openGraph: {
    title: "Two Trees: Eden",
    description: "A stoic strategy game of God and Evil across seven epochs.",
    siteName: "Two Trees: Eden",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Two Trees: Eden",
    description: "A stoic strategy game of God and Evil across seven epochs.",
  },
};

export const viewport: Viewport = {
  themeColor: "#c9a85a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          async
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
