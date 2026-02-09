'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { X } from 'lucide-react'

interface ReservationDialogProps {
  seatId: string
  seatNumber: string
  onClose: () => void
  onReserved: (reservation: any) => void
}

export function ReservationDialog({
  seatId,
  seatNumber,
  onClose,
  onReserved,
}: ReservationDialogProps) {
  const { getToken } = useAuth()
  const [reservationType, setReservationType] = useState<'instant' | 'scheduled'>(
    'instant'
  )
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [privacySetting, setPrivacySetting] = useState<'public' | 'friends' | 'private'>(
    'public'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReserve = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = await getToken()
      if (!token) {
        setError('認証トークンが取得できません')
        return
      }

      const endpoint =
        reservationType === 'instant'
          ? '/api/reservations/instant'
          : '/api/reservations'

      const body =
        reservationType === 'instant'
          ? {
              seat_id: seatId,
              duration_minutes: durationMinutes,
              privacy_setting: privacySetting,
            }
          : {
              seat_id: seatId,
              start_time: startTime,
              end_time: endTime,
              privacy_setting: privacySetting,
            }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `予約に失敗しました (${res.status})`)
      }

      const reservation = await res.json()
      console.log('[ReservationDialog] 予約成功:', reservation)
      onReserved(reservation)
      onClose()
    } catch (err: any) {
      console.error('[ReservationDialog] 予約エラー:', err)
      setError(err.message || '予約に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const isValidForm =
    reservationType === 'instant'
      ? durationMinutes > 0
      : startTime && endTime && new Date(startTime) < new Date(endTime)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">座席 {seatNumber} を予約</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 予約タイプ選択 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              予約タイプ
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="reservationType"
                  value="instant"
                  checked={reservationType === 'instant'}
                  onChange={() => setReservationType('instant')}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">即座に予約（分単位）</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="reservationType"
                  value="scheduled"
                  checked={reservationType === 'scheduled'}
                  onChange={() => setReservationType('scheduled')}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">日時を指定して予約</span>
              </label>
            </div>
          </div>

          {/* 即座予約: 時間入力 */}
          {reservationType === 'instant' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                利用時間（分）
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(15, Number(e.target.value)))}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">分</span>
              </div>
              <p className="text-xs text-gray-500">
                最小15分、15分単位で設定できます
              </p>
            </div>
          )}

          {/* 日時指定予約 */}
          {reservationType === 'scheduled' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始時刻
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了時刻
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* プライバシー設定 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              プライバシー設定
            </label>
            <select
              value={privacySetting}
              onChange={(e) => setPrivacySetting(e.target.value as any)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">🌐 公開（全員に表示）</option>
              <option value="friends">👥 友人のみ</option>
              <option value="private">🔒 プライベート（自分だけ）</option>
            </select>
            <p className="text-xs text-gray-500">
              {privacySetting === 'public' && 'すべてのユーザーに予約情報が表示されます'}
              {privacySetting === 'friends' && '友人にのみ予約情報が表示されます'}
              {privacySetting === 'private' && 'あなたのみが予約情報を閲覧できます'}
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleReserve}
            disabled={!isValidForm || isLoading}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? '予約中...' : '予約する'}
          </button>
        </div>
      </div>
    </div>
  )
}
