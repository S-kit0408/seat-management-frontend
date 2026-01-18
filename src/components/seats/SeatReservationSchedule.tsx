'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Reservation } from '@/types/reservation'
import { User } from '@/types/user'
import { reservationApi } from '@/lib/api/reservations'
import { getCurrentUser } from '@/lib/api/users'
import { getFriends } from '@/lib/api/friends'
import { Calendar, Lock, Globe, Users } from 'lucide-react'

interface SeatReservationScheduleProps {
  seatId: string | null
  seatNumber?: string
  showPrivacyInfo?: boolean
  refreshTrigger?: number // 予約作成後にこの値を変更して再フェッチをトリガー
}

export function SeatReservationSchedule({
  seatId,
  seatNumber,
  showPrivacyInfo = true,
  refreshTrigger = 0,
}: SeatReservationScheduleProps) {
  const { getToken } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userFriends, setUserFriends] = useState<User[]>([])

  // 現在のユーザー情報とフレンド一覧を取得
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const user = await getCurrentUser(getToken)
        setCurrentUser(user)

        const friends = await getFriends(getToken)
        setUserFriends(friends)
      } catch (err) {
        console.error('ユーザー情報取得エラー:', err)
      }
    }

    loadUserInfo()
  }, [getToken])

  // ユーザー名を表示できるかチェック
  const canShowUserName = (
    reservation: Reservation,
    currentUser: User | null,
    userFriends: User[]
  ): boolean => {
    if (!currentUser) return false

    // 自分の予約なら常に表示
    if (reservation.user_id === currentUser.id) return true

    const privacySetting =
      reservation.privacy_setting ||
      currentUser.default_privacy_setting ||
      'private'

    // 公開なら全員に表示
    if (privacySetting === 'public') return true

    // フレンドのみなら、フレンド同士の場合に表示
    if (privacySetting === 'friends') {
      return userFriends.some((friend) => friend.id === reservation.user_id)
    }

    // プライベートなら表示しない
    return false
  }

  // 座席の全予約を取得
  useEffect(() => {
    if (!seatId || !getToken) {
      setReservations([])
      return
    }

    const fetchReservations = async () => {
      try {
        setLoading(true)
        const data = await reservationApi.getVisibleReservations(getToken)
        // 選択座席 かつ 未完了の予約でフィルタリング
        const filtered = data
          .filter((r) => r.seat_id === seatId && r.status !== 'completed')
          .sort(
            (a, b) =>
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime()
          )
        setReservations(filtered)
        setError(null)
      } catch (err: any) {
        console.error('予約情報取得エラー:', err)
        setError('予約情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [seatId, getToken, refreshTrigger])

  if (!seatId) {
    return null
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'in_use':
        return '使用中'
      case 'reserved':
        return '予約済'
      case 'completed':
        return '完了'
      case 'cancelled':
        return 'キャンセル'
      case 'no_show':
        return '欠席'
      default:
        return status
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in_use':
        return 'bg-orange-50 border-orange-200'
      case 'reserved':
        return 'bg-blue-50 border-blue-200'
      case 'completed':
        return 'bg-gray-50 border-gray-200'
      case 'cancelled':
      case 'no_show':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'in_use':
        return 'bg-orange-100 text-orange-800'
      case 'reserved':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
      case 'no_show':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrivacyIcon = (privacy: string | null | undefined) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4" />
      case 'friends':
        return <Users className="w-4 h-4" />
      case 'private':
      default:
        return <Lock className="w-4 h-4" />
    }
  }

  const getPrivacyLabel = (privacy: string | null | undefined): string => {
    switch (privacy) {
      case 'public':
        return '公開予約'
      case 'friends':
        return 'フレンドのみ公開'
      case 'private':
      default:
        return 'プライベート予約'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mt-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          予約スケジュール
        </h3>
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mt-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          予約スケジュール（使用中含む）
        </h3>
        <div className="text-center py-8 text-red-500 text-sm">{error}</div>
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mt-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          予約スケジュール（使用中含む）
        </h3>
        <div className="text-center py-8 text-gray-500">
          この座席に予約はありません
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          予約スケジュール（使用中含む）
        </h3>
        <span className="text-sm text-gray-500">{reservations.length} 件</span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {reservations.map((reservation) => {
          const startTime = new Date(reservation.start_time)
          const endTime = new Date(reservation.end_time)
          const now = new Date()
          const isCurrent =
            startTime <= now && now < endTime && reservation.status === 'in_use'

          return (
            <div
              key={reservation.id}
              className={`border rounded-lg p-3 ${getStatusColor(reservation.status)} ${
                isCurrent ? 'ring-2 ring-orange-400' : ''
              }`}
            >
              {/* 時間表示 */}
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">
                  {startTime.toLocaleTimeString('ja-JP', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {endTime.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${getStatusBadgeColor(reservation.status)}`}
                >
                  {getStatusLabel(reservation.status)}
                </span>
              </div>

              {/* プライバシー情報 */}
              {showPrivacyInfo && (
                <>
                  {/* プライバシー設定 */}
                  <div className="flex items-center gap-2 mb-1 text-sm">
                    <span className="text-gray-600">
                      {getPrivacyIcon(reservation.privacy_setting)}
                    </span>
                    <span className="text-gray-700 font-medium">
                      {getPrivacyLabel(reservation.privacy_setting)}
                    </span>
                  </div>

                  {/* 予約者情報（プライバシー設定に応じた表示制御） */}
                  {reservation.user && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">予約者</div>
                      {(() => {
                        const privacySetting =
                          reservation.privacy_setting ||
                          currentUser?.default_privacy_setting ||
                          'private'
                        const isOwnReservation =
                          reservation.user_id === currentUser?.id

                        // 自分の予約の場合は常に表示
                        if (isOwnReservation) {
                          return (
                            <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                              {reservation.user.name} (自分)
                            </div>
                          )
                        }

                        // 公開の場合は全員に表示
                        if (privacySetting === 'public') {
                          return (
                            <div className="text-sm font-semibold text-gray-800 bg-green-50 px-2 py-1 rounded">
                              {reservation.user.name}
                            </div>
                          )
                        }

                        // フレンドの場合、フレンド同士なら表示
                        if (privacySetting === 'friends') {
                          const isFriend = userFriends.some(
                            (friend) => friend.id === reservation.user_id
                          )
                          return (
                            <div
                              className={`text-sm font-semibold px-2 py-1 rounded ${
                                isFriend
                                  ? 'text-purple-700 bg-purple-50'
                                  : 'text-gray-600 bg-gray-50'
                              }`}
                            >
                              {isFriend
                                ? `${reservation.user.name} (フレンド)`
                                : 'フレンドの予約'}
                            </div>
                          )
                        }

                        // プライベートの場合は名前を表示しない
                        return (
                          <div className="text-sm font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            プライベートな予約
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* メモ（public のみ表示） */}
                  {reservation.privacy_setting === 'public' &&
                    reservation.notes && (
                      <div className="text-xs text-gray-600 bg-gray-100 p-1 rounded mt-2">
                        📝 {reservation.notes}
                      </div>
                    )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
