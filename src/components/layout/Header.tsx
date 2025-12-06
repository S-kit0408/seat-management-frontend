'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
} from '@clerk/nextjs'
import { MapPin, Users, User, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/api/users'
import { isAdmin } from '@/middleware/adminAuth'
import { User as UserType } from '@/types/user'

export function Header() {
  const pathname = usePathname()
  const { getToken } = useAuth()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setLoading(false)
          return
        }

        const userData = await getCurrentUser(getToken)
        setUser(userData)
      } catch (err) {
        console.error('ユーザー情報の取得に失敗:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [getToken])

  const isActive = (path: string) => {
    return pathname === path
      ? 'bg-blue-100 text-blue-900 font-medium'
      : 'text-gray-700 hover:bg-gray-100'
  }

  const userIsAdmin = isAdmin(user)

  // 管理者ページではヘッダーを表示しない
  const hideHeader = pathname?.startsWith('/admin')

  if (hideHeader) return null

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左側: タイトル */}
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <Link href="/seats" className="text-xl font-bold text-gray-900">
              座席管理システム
            </Link>
          </div>

          {/* 中央ナビ */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/seats"
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isActive('/seats')}`}
            >
              <MapPin className="w-4 h-4" />
              <span>座席表示</span>
            </Link>

            <Link
              href="/friends"
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isActive('/friends')}`}
            >
              <Users className="w-4 h-4" />
              <span>フレンド</span>
            </Link>

            <Link
              href="/profile"
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isActive('/profile')}`}
            >
              <User className="w-4 h-4" />
              <span>プロフィール</span>
            </Link>

            {/* 管理者のみ表示 */}
            {!loading && userIsAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isActive(
                  '/admin'
                )} bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200`}
              >
                <Shield className="w-4 h-4" />
                <span>管理者</span>
              </Link>
            )}
          </nav>

          {/* 右側: 認証 */}
          <div className="flex items-center gap-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  サインイン
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* モバイルナビ */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          <Link
            href="/seats"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm whitespace-nowrap ${isActive('/seats')}`}
          >
            <MapPin className="w-4 h-4" />
            <span>座席</span>
          </Link>

          <Link
            href="/friends"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm whitespace-nowrap ${isActive('/friends')}`}
          >
            <Users className="w-4 h-4" />
            <span>フレンド</span>
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm whitespace-nowrap ${isActive('/profile')}`}
          >
            <User className="w-4 h-4" />
            <span>プロフィール</span>
          </Link>

          {/* 管理者のみ表示（モバイル） */}
          {!loading && userIsAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm whitespace-nowrap ${isActive(
                '/admin'
              )} bg-purple-50 text-purple-700 border border-purple-200`}
            >
              <Shield className="w-4 h-4" />
              <span>管理</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
