'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Reservation } from '@/types/reservation'
import { Calendar, Clock, User, Lock, Globe, Users, AlertCircle } from 'lucide-react'

interface ReservationCardComponentProps {
  reservation: Reservation
  isOwner: boolean
  isFriend: boolean
  onCheckIn?: (reservationId: string) => void
  onCheckOut?: (reservationId: string) => void
  onCancel?: (reservationId: string) => void
}

export function ReservationCardComponent({
  reservation,
  isOwner,
  isFriend,
  onCheckIn,
  onCheckOut,
  onCancel,
}: ReservationCardComponentProps) {
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getStatusLabel = (status: string): string => {
    const labels: { [key: string]: string } = {
      reserved: '予約済み',
      in_use: '使用中',
      completed: '完了',
      cancelled: 'キャンセル',
      no_show: 'no-show',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'reserved':
        return 'bg-blue-50 border-blue-200'
      case 'in_use':
        return 'bg-orange-50 border-orange-200'
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'cancelled':
        return 'bg-red-50 border-red-200'
      case 'no_show':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'reserved':
        return 'bg-blue-100 text-blue-800'
      case 'in_use':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrivacyIcon = (privacy?: string | null) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4 text-blue-600" />
      case 'friends':
        return <Users className="w-4 h-4 text-purple-600" />
      case 'private':
      default:
        return <Lock className="w-4 h-4 text-red-600" />
    }
  }

  const handleCheckIn = async () => {
    if (!isOwner) {
      setError('チェックインはこの予約の所有者のみが行えます')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const token = await getToken()
      if (!token) {
        setError('認証トークンが取得できません')
        return
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservation.id}/checkin`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'チェックインに失敗しました')
      }

      console.log('[ReservationCard] チェックイン成功:', reservation.id)
      onCheckIn?.(reservation.id)
    } catch (err: any) {
      console.error('[ReservationCard] チェックインエラー:', err)
      setError(err.message || 'チェックインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!isOwner) {
      setError('チェックアウトはこの予約の所有者のみが行えます')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const token = await getToken()
      if (!token) {
        setError('認証トークンが取得できません')
        return
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservation.id}/checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'チェックアウトに失敗しました')
      }

      console.log('[ReservationCard] チェックアウト成功:', reservation.id)
      onCheckOut?.(reservation.id)
    } catch (err: any) {
      console.error('[ReservationCard] チェックアウトエラー:', err)
      setError(err.message || 'チェックアウトに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!isOwner) {
      setError('キャンセルはこの予約の所有者のみが行えます')
      return
    }

    if (!confirm('この予約をキャンセルしますか？')) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const token = await getToken()
      if (!token) {
        setError('認証トークンが取得できません')
        return
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservation.id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: 'ユーザーによるキャンセル',
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'キャンセルに失敗しました')
      }

      console.log('[ReservationCard] キャンセル成功:', reservation.id)
      onCancel?.(reservation.id)
    } catch (err: any) {
      console.error('[ReservationCard] キャンセルエラー:', err)
      setError(err.message || 'キャンセルに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const startTime = new Date(reservation.start_time)
  const endTime = new Date(reservation.end_time)
  const now = new Date()
  const isCurrent = startTime <= now && now < endTime

  return (
    <div className={`border-2 rounded-lg p-4 ${getStatusColor(reservation.status)}`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">
            座席 {reservation.seat?.seat_number || 'N/A'}
          </h3>
          {isCurrent && (
            <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-bold rounded">
              現在実行中
            </span>
          )}
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded ${getStatusBadgeColor(reservation.status)}`}>
          {getStatusLabel(reservation.status)}
        </span>
      </div>

      {/* 時間情報 */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>
            {startTime.toLocaleDateString('ja-JP', {
              month: '2-digit',
              day: '2-digit',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="w-4 h-4" />
          <span>
            {startTime.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            -{' '}
            {endTime.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* ユーザー情報 */}
      {reservation.user && (
        <div className="mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {isOwner ? (
                  <span className="font-bold text-blue-700">{reservation.user.name} (あなた)</span>
                ) : isFriend ? (
                  <span className="text-purple-700">{reservation.user.name} (友人)</span>
                ) : (
                  <span>{reservation.user.name}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getPrivacyIcon(reservation.privacy_setting)}
            </div>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-3 bg-red-100 border border-red-200 text-red-800 px-3 py-2 rounded text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* アクションボタン */}
      {isOwner && (
        <div className="flex items-center gap-2">
          {reservation.status === 'reserved' && (
            <>
              <button
                onClick={handleCheckIn}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors disabled:opacity-50 text-sm"
              >
                {isLoading ? 'チェックイン中...' : 'チェックイン'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors disabled:opacity-50 text-sm"
              >
                キャンセル
              </button>
            </>
          )}

          {reservation.status === 'in_use' && (
            <>
              <button
                onClick={handleCheckOut}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50 text-sm"
              >
                {isLoading ? 'チェックアウト中...' : 'チェックアウト'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors disabled:opacity-50 text-sm"
              >
                キャンセル
              </button>
            </>
          )}

          {(reservation.status === 'completed' ||
            reservation.status === 'cancelled' ||
            reservation.status === 'no_show') && (
            <div className="w-full text-center py-2 text-gray-600 text-sm">
              完了
            </div>
          )}
        </div>
      )}

      {!isOwner && (
        <div className="text-xs text-gray-500 text-center py-2">
          このアクションはこの予約の所有者のみが実行できます
        </div>
      )}
    </div>
  )
}
