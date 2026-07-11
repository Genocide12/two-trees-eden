import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
