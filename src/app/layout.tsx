import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ['400', '500'],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Dashboard — Éllus · ÁUREA Tech",
  description: "Sistema de gestão inteligente. Especialista em gestão de associações e benefícios. [Build v2.0]",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
