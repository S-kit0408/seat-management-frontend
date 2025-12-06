'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types/user'
import { getCurrentUser } from '@/lib/api/users'
import { isAdmin } from '@/middleware/adminAuth'
import { Users, LayoutDashboard, Shield } from 'lucide-react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { getToken } = useAuth()
  const { user: clerkUser, isLoaded } = useUser()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('認証トークンが取得できませんでした')
        }

        const data = await getCurrentUser(getToken)
        setUser(data)

        // 管理者権限がない場合はダッシュボードにリダイレクト
        if (!isAdmin(data)) {
          router.push('/dashboard')
        }
      } catch (err: any) {
        console.error('ユーザー情報取得エラー:', err)
        setError(err.message || 'ユーザー情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    // Clerkのユーザー情報がロードされるまで待機
    if (!isLoaded || !clerkUser) {
      return
    }

    fetchUser()
  }, [isLoaded, clerkUser?.id, getToken, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="font-bold mb-2">エラーが発生しました</h2>
          <p>{error || 'ユーザー情報が取得できませんでした'}</p>
        </div>
      </div>
    )
  }

  if (!isAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg">
          <h2 className="font-bold mb-2">アクセス権限がありません</h2>
          <p>このページは管理者のみアクセスできます</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 管理者ヘッダー */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">管理者ダッシュボード</h1>
                <p className="text-purple-200 text-xs">Admin Panel</p>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-purple-200">ログイン中:</span>{' '}
              <span className="font-semibold">{user.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* サイドバー */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">ダッシュボード</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">ユーザー管理</span>
              </Link>

              <Link
                href="/admin/seats"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors"
              >
                <MapPin className="w-5 h-5" />
                <span className="font-medium">座席管理</span>
              </Link>
              <div className="border-t border-gray-200 my-4"></div>
              <Link
                href="/seats"
                className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-md transition-colors text-sm"
              >
                ← 座席ページへ戻る
                <br />
                （一般ユーザー画面）
              </Link>
            </nav>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
