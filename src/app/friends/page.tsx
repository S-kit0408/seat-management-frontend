'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Users, UserPlus, Clock } from 'lucide-react'
import { useFriends } from '@/hooks/useFriends'
import FriendCard from '@/components/friends/FriendCard'
import SendRequestDialog from '@/components/friends/SendRequestDialog'
import Link from 'next/link'

export default function FriendsPage() {
  const { friends, loading, error, fetchFriends, removeFriend } = useFriends()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8" />
              フレンド
            </h1>
            <p className="text-gray-600 mt-1">
              {friends?.length ?? 0}人のフレンド
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/friends/requests"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              申請管理
            </Link>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              フレンド追加
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* フレンドリスト */}
        {friends?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              まだフレンドがいません
            </h3>
            <p className="text-gray-600 mb-4">
              フレンドを追加して、スケジュールを共有しましょう
            </p>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              フレンドを追加
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends?.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onRemove={removeFriend}
              />
            ))}
          </div>
        )}
      </div>

      {/* フレンド追加ダイアログ */}
      <SendRequestDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}
