import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { WebSocketProvider } from '@/context/WebSocketContext';
import { WatchlistProvider } from '@/context/WatchlistContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Financial Advisor SaaS",
  description: "AI-driven financial insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 antialiased`}>
        <WebSocketProvider>
          <WatchlistProvider>
            <PortfolioProvider>
              {children}
            </PortfolioProvider>
          </WatchlistProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}
