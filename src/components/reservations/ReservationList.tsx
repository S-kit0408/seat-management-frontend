'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Reservation } from '@/types/reservation'
import { User } from '@/types/user'
import { ReservationCardComponent } from './ReservationCardComponent'
import { reservationApi } from '@/lib/api/reservations'
import { getFriends } from '@/lib/api/friends'
import { getCurrentUser } from '@/lib/api/users'
import { AlertCircle, Loader } from 'lucide-react'

type TabType = 'active' | 'history' | 'noshow'

export function ReservationList() {
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [friends, setFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ユーザー情報とフレンド一覧を読み込み
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setLoading(true)
        const [user, friendsList] = await Promise.all([
          getCurrentUser(getToken),
          getFriends(getToken),
        ])

        setCurrentUser(user)
        setFriends(friendsList)
      } catch (err: any) {
        console.error('[ReservationList] ユーザー情報取得エラー:', err)
        // エラーを無視して続行
      }
    }

    loadUserInfo()
  }, [getToken])

  // 予約データを読み込み
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await reservationApi.getMyReservations(getToken)
        setReservations(data)
      } catch (err: any) {
        console.error('[ReservationList] 予約取得エラー:', err)
        setError('予約データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [getToken])

  // タブごとに予約をフィルタリング
  const getFilteredReservations = useCallback(
    (tab: TabType): Reservation[] => {
      const now = new Date()

      switch (tab) {
        case 'active':
          return reservations.filter((r) => {
            // キャンセル済みや完了済み、no-showは除外
            if (['cancelled', 'completed', 'no_show'].includes(r.status))
              return false

            const startTime = new Date(r.start_time)
            const endTime = new Date(r.end_time)

            // 現在進行中か、これからの予約
            return endTime > now
          })

        case 'history':
          return reservations.filter((r) => {
            // 完了済みの予約
            return r.status === 'completed'
          })

        case 'noshow':
          return reservations.filter((r) => {
            // no-show予約
            return r.status === 'no_show'
          })

        default:
          return []
      }
    },
    [reservations]
  )

  const activeReservations = getFilteredReservations('active')
  const historyReservations = getFilteredReservations('history')
  const noShowReservations = getFilteredReservations('noshow')

  const handleCheckIn = (reservationId: string) => {
    // 予約リストを再読み込み
    const reloadReservations = async () => {
      try {
        const data = await reservationApi.getMyReservations(getToken)
        setReservations(data)
      } catch (err) {
        console.error('[ReservationList] 再読み込みエラー:', err)
      }
    }
    reloadReservations()
  }

  const handleCheckOut = (reservationId: string) => {
    // 予約リストを再読み込み
    const reloadReservations = async () => {
      try {
        const data = await reservationApi.getMyReservations(getToken)
        setReservations(data)
      } catch (err) {
        console.error('[ReservationList] 再読み込みエラー:', err)
      }
    }
    reloadReservations()
  }

  const handleCancel = (reservationId: string) => {
    // 予約リストを再読み込み
    const reloadReservations = async () => {
      try {
        const data = await reservationApi.getMyReservations(getToken)
        setReservations(data)
      } catch (err) {
        console.error('[ReservationList] 再読み込みエラー:', err)
      }
    }
    reloadReservations()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">予約情報を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold mb-1">エラーが発生しました</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* タブナビゲーション */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          アクティブ
          {activeReservations.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
              {activeReservations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          履歴
          {historyReservations.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
              {historyReservations.length}
            </span>
          )}
        </button>

        {noShowReservations.length > 0 && (
          <button
            onClick={() => setActiveTab('noshow')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'noshow'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            no-show
            <span className="ml-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
              {noShowReservations.length}
            </span>
          </button>
        )}
      </div>

      {/* タブのコンテンツ */}
      <div className="space-y-4">
        {activeTab === 'active' && (
          <>
            {activeReservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>アクティブな予約がありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeReservations.map((reservation) => {
                  const isOwner = currentUser?.id === reservation.user_id
                  const isFriend = friends.some((f) => f.id === reservation.user_id)

                  return (
                    <ReservationCardComponent
                      key={reservation.id}
                      reservation={reservation}
                      isOwner={isOwner}
                      isFriend={isFriend}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      onCancel={handleCancel}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {historyReservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>完了した予約がありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyReservations.map((reservation) => {
                  const isOwner = currentUser?.id === reservation.user_id
                  const isFriend = friends.some((f) => f.id === reservation.user_id)

                  return (
                    <ReservationCardComponent
                      key={reservation.id}
                      reservation={reservation}
                      isOwner={isOwner}
                      isFriend={isFriend}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'noshow' && (
          <>
            {noShowReservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>no-show予約がありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {noShowReservations.map((reservation) => {
                  const isOwner = currentUser?.id === reservation.user_id
                  const isFriend = friends.some((f) => f.id === reservation.user_id)

                  return (
                    <ReservationCardComponent
                      key={reservation.id}
                      reservation={reservation}
                      isOwner={isOwner}
                      isFriend={isFriend}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
