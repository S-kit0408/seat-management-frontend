'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, Inbox, Send } from 'lucide-react'
import { useFriends, useFriendRequests } from '@/hooks/useFriends'
import FriendCard from '@/components/friends/FriendCard'
import FriendRequestCard from '@/components/friends/FriendRequestCard'
import SendRequestDialog from '@/components/friends/SendRequestDialog'

export default function FriendsPage() {
  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
    fetchFriends,
    removeFriend,
  } = useFriends()

  const {
    receivedRequests,
    sentRequests,
    loading: requestLoading,
    error: requestError,
    fetchReceivedRequests,
    fetchSentRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
  } = useFriendRequests()

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')
  const [requestTab, setRequestTab] = useState<'received' | 'sent'>('received')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchFriends()
    fetchReceivedRequests()
    fetchSentRequests()
  }, [])

  const loading = friendsLoading || requestLoading

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
        {/* Header */}
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

          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            フレンド追加
          </button>
        </div>

        {/* Top Tabs */}
        <div className="border-b border-gray-200 mb-4 flex gap-4">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'friends'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            フレンド一覧
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'requests'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            申請管理
          </button>
        </div>

        {/* Error */}
        {(friendsError || requestError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {friendsError || requestError}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'friends' ? (
          // ---- フレンド一覧 ----
          friends?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onRemove={removeFriend}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                まだフレンドがいません
              </h3>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                フレンドを追加
              </button>
            </div>
          )
        ) : (
          // ---- 申請管理 ----
          <div className="bg-white rounded-lg shadow-sm">
            {/* Sub Tabs */}
            <div className="border-b border-gray-200 flex">
              <button
                onClick={() => setRequestTab('received')}
                className={`flex-1 px-6 py-3 text-sm border-b-2 ${
                  requestTab === 'received'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                <Inbox className="w-4 h-4 inline mr-2" />
                受信した申請 ({receivedRequests.length})
              </button>
              <button
                onClick={() => setRequestTab('sent')}
                className={`flex-1 px-6 py-3 text-sm border-b-2 ${
                  requestTab === 'sent'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                <Send className="w-4 h-4 inline mr-2" />
                送信した申請 ({sentRequests.length})
              </button>
            </div>

            <div className="p-6">
              {requestTab === 'received' ? (
                receivedRequests.length ? (
                  <div className="space-y-3">
                    {receivedRequests.map((r) => (
                      <FriendRequestCard
                        key={r.id}
                        request={r}
                        type="received"
                        onAccept={acceptRequest}
                        onReject={rejectRequest}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600">
                    受信した申請はありません
                  </p>
                )
              ) : sentRequests.length ? (
                <div className="space-y-3">
                  {sentRequests.map((r) => (
                    <FriendRequestCard
                      key={r.id}
                      request={r}
                      type="sent"
                      onCancel={cancelRequest}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600">
                  送信した申請はありません
                </p>
              )}
            </div>
          </div>
        )}

        <SendRequestDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSent={fetchSentRequests}
        />
      </div>
    </div>
  )
}
