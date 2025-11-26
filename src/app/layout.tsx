import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '座席管理システム',
  description: 'AI搭載座席予約システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
        <html lang="ja">
          <body className={inter.className}>
            {children}
          </body>
        </html>
    </ClerkProvider>
  );
}
