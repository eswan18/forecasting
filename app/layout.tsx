import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/navbar";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

import { StatusIndicatorStack } from "@/components/status-indicators";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class">
          <StatusIndicatorStack />
          <NavBar />
          <div className="w-full">{children}</div>
          <Toaster />
        </ThemeProvider>

      </body>
    </html>
  );
}
