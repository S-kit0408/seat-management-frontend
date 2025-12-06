import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { jaJP } from '@clerk/localizations'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '座席管理システム',
  description: 'AI搭載座席予約システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja">
        <body className={inter.className}>
          <Header />
          <main className="min-h-screen bg-gray-50">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}
