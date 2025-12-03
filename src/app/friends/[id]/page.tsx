'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { User } from '@/types/user'
import { apiClientFetch } from '@/lib/api-client.client'
import { Mail, Calendar, ArrowLeft } from 'lucide-react'

export default function FriendDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getToken } = useAuth()
  const [friend, setFriend] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFriend = async () => {
      try {
        // 個別のユーザー情報取得APIがあれば使用
        // ここではフレンドリストから該当ユーザーを取得する例
        const response = await apiClientFetch('/api/friends', {}, getToken)

        if (!response.ok) {
          throw new Error('フレンド情報の取得に失敗しました')
        }

        const friends: User[] = await response.json()
        const targetFriend = friends.find((f) => f.id === params.id)

        if (!targetFriend) {
          throw new Error('フレンドが見つかりません')
        }

        setFriend(targetFriend)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchFriend()
    }
  }, [params.id, getToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error || !friend) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error || 'フレンドが見つかりません'}
          </div>
          <button
            onClick={() => router.push('/friends')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← フレンド一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* 戻るボタン */}
        <button
          onClick={() => router.push('/friends')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          フレンド一覧に戻る
        </button>

        {/* プロフィールカード */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
            <div className="flex items-center gap-6">
              {friend.avatar_url ? (
                <img
                  src={friend.avatar_url}
                  alt={friend.name}
                  className="w-20 h-20 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white bg-white flex items-center justify-center">
                  <span className="text-3xl text-gray-400">
                    {friend.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{friend.name}</h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  メールアドレス
                </p>
                <p className="text-gray-900">{friend.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  最終ログイン
                </p>
                <p className="text-gray-900">
                  {friend.last_login_at
                    ? new Date(friend.last_login_at).toLocaleString('ja-JP')
                    : '不明'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
