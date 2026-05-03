import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { I18nProvider } from "@/app/i18n/I18nProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Move Prague — Know your district before you move",
  description: "Data-driven district reports for Prague apartment hunters. Safety, rent trends, schools, transit, noise, air quality — 37 categories, 22 districts.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <I18nProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
