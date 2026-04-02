import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Atelier Market",
    template: "%s | Atelier Market",
  },
  description: "BOOTH-like digital goods marketplace built with Next.js 14.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="text-foreground">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
