'use client'

import { Reservation } from '@/types/reservation'
import ReservationStatusBadge from './ReservationStatusBadge'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  reservation: Reservation
  showActions?: boolean
  onShowQRCheckin?: (reservation: Reservation) => void
  onShowQRCheckout?: (reservation: Reservation) => void
  onCancel?: (id: string) => Promise<void>
}

// 予約情報を表示するカードコンポーネント
export default function ReservationCard({
  reservation,
  showActions = false,
  onShowQRCheckin,
  onShowQRCheckout,
  onCancel,
}: Props) {
  const router = useRouter()

  // 日時フォーマット関数
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    }).format(date)
  }

  // 時間のみフォーマット
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    }).format(date)
  }

  // 日付のみフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Tokyo',
    }).format(date)
  }

  // 予約タイプの日本語表示
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'instant':
        return '即時予約'
      case 'scheduled':
        return '通常予約'
      case 'recurring':
        return '定期予約'
      default:
        return type
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ReservationStatusBadge status={reservation.status} />
          <span className="text-xs text-gray-500">
            {getTypeLabel(reservation.type)}
          </span>
        </div>
        <button
          onClick={() => router.push(`/reservations/${reservation.id}`)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          詳細
        </button>
      </div>

      {/* 座席情報 */}
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">
          {reservation.seat?.seat_number ||
            `座席 ${reservation.seat_id.slice(0, 8)}`}
        </span>
        {reservation.seat?.description && (
          <span className="text-xs text-gray-500">
            - {reservation.seat.description}
          </span>
        )}
      </div>

      {/* 日時情報 */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {formatDate(reservation.start_time)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {formatTime(reservation.start_time)} -{' '}
            {formatTime(reservation.end_time)}
          </span>
        </div>
      </div>

      {/* チェックイン/チェックアウト情報 */}
      {(reservation.checked_in_at || reservation.checked_out_at) && (
        <div className="text-xs text-gray-500 space-y-1 mb-3 pl-6">
          {reservation.checked_in_at && (
            <div>チェックイン: {formatDateTime(reservation.checked_in_at)}</div>
          )}
          {reservation.checked_out_at && (
            <div>
              チェックアウト: {formatDateTime(reservation.checked_out_at)}
            </div>
          )}
        </div>
      )}

      {/* ユーザー情報（リレーションがある場合） */}
      {reservation.user && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <User className="w-4 h-4" />
          <span>{reservation.user.name}</span>
        </div>
      )}

      {/* メモ */}
      {reservation.notes && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-3">
          {reservation.notes}
        </div>
      )}

      {/* アクションボタン */}
      {showActions && (
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {reservation.status === 'reserved' && onShowQRCheckin && (
            <button
              onClick={() => onShowQRCheckin(reservation)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              チェックイン
            </button>
          )}

          {reservation.status === 'in_use' && onShowQRCheckout && (
            <button
              onClick={() => onShowQRCheckout(reservation)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              チェックアウト
            </button>
          )}

          {(reservation.status === 'reserved' ||
            reservation.status === 'in_use') &&
            onCancel && (
              <button
                onClick={() => onCancel(reservation.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
              >
                キャンセル
              </button>
            )}
        </div>
      )}

      {/* 延長回数表示 */}
      {reservation.extension_count > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          延長回数: {reservation.extension_count}回
        </div>
      )}
    </div>
  )
}
