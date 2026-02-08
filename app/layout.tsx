import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/navbar";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

import { StatusIndicatorStack } from "@/components/status-indicators";

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
          <StatusIndicatorStack />
          <NavBar />
          <div className="w-full">{children}</div>
          <Toaster />
        </ThemeProvider>

      </body>
    </html>
  );
}
