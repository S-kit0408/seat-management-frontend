'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Users, Activity, Shield, TrendingUp, MapPin } from 'lucide-react'
import { getAllUsers } from '@/lib/api/admin'
import { User } from '@/types/user'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { getToken } = useAuth()
  const { isLoaded, user: clerkUser } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('認証トークンが取得できませんでした')
        }

        const data = await getAllUsers(getToken)
        setUsers(data)
      } catch (err: any) {
        console.error('ユーザー一覧取得エラー:', err)
        setError(err.message || 'ユーザー一覧の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    // Clerkのユーザー情報がロードされるまで待機
    if (!isLoaded || !clerkUser) {
      return
    }

    fetchUsers()
  }, [isLoaded, clerkUser?.id, getToken])

  // 統計情報を計算
  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter((u) => u.role === 'admin').length,
    moderatorUsers: users.filter((u) => u.role === 'moderator').length,
    regularUsers: users.filter((u) => u.role === 'user').length,
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <h2 className="font-bold mb-2">エラーが発生しました</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-600 mt-1">システム全体の概要</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 総ユーザー数 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalUsers}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 管理者数 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">管理者</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.adminUsers}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* モデレーター数 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">モデレーター</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.moderatorUsers}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* 一般ユーザー数 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">一般ユーザー</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.regularUsers}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          クイックアクション
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">ユーザー管理</p>
              <p className="text-sm text-gray-600">
                ユーザーの一覧表示、権限変更、削除
              </p>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">座席管理</p>
              <p className="text-sm text-gray-600">
                フロアの作成、座席の新規配置・編集・削除
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 最近のユーザー */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          最近登録されたユーザー
        </h3>
        <div className="space-y-3">
          {users
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .slice(0, 5)
            .map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'moderator'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.role === 'admin'
                      ? '管理者'
                      : user.role === 'moderator'
                        ? 'モデレーター'
                        : '一般'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
