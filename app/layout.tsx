import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Roboto_Mono } from "next/font/google";
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

// The print faces. Loaded once here rather than per page, so the navbar can use
// them and the sheets stop instantiating their own copies.
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Haruspex",
  description: "Put a number on it.",
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
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${robotoMono.variable}`}
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
