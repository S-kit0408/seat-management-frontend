'use client'

import { useEffect, useState } from 'react'
import { useFriendRequests } from '@/hooks/useFriends'
import FriendRequestCard from '@/components/friends/FriendRequestCard'
import { Inbox, Send } from 'lucide-react'
import Link from 'next/link'

export default function RequestsPage() {
  const {
    receivedRequests,
    sentRequests,
    loading,
    error,
    fetchReceivedRequests,
    fetchSentRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
  } = useFriendRequests()

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')

  useEffect(() => {
    fetchReceivedRequests()
    fetchSentRequests()
  }, [fetchReceivedRequests, fetchSentRequests])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/friends"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← フレンド一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">申請管理</h1>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'received'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Inbox className="w-4 h-4 inline mr-2" />
                受信した申請 ({receivedRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sent'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Send className="w-4 h-4 inline mr-2" />
                送信した申請 ({sentRequests.length})
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-600">
                読み込み中...
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : activeTab === 'received' ? (
              receivedRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  受信した申請はありません
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedRequests.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      type="received"
                      onAccept={acceptRequest}
                      onReject={rejectRequest}
                    />
                  ))}
                </div>
              )
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                送信した申請はありません
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    type="sent"
                    onCancel={cancelRequest}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
