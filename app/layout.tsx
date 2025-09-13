import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/navbar";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { EnvironmentBanner } from "@/components/environment-banner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forecasting Tournament",
  description: "So you think you can forecast?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class">
          <EnvironmentBanner />
          <NavBar />
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
