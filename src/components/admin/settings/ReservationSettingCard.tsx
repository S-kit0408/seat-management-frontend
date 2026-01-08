'use client'

import { CheckCircle, Clock, Calendar } from 'lucide-react'
import { ReservationSettings } from '@/types/reservationSettings'

interface Props {
  setting: ReservationSettings | null
}

export function ReservationSettingCard({ setting }: Props) {
  if (!setting) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-dashed border-blue-200">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-gray-600">アクティブな予約設定が見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-green-600 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">
              アクティブな予約設定
            </h3>
          </div>
          {setting.description && (
            <p className="text-sm text-gray-600 mt-2">{setting.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* チェックイン制限 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
            チェックイン可能
          </div>
          <div className="text-lg font-bold text-gray-900">
            {setting.check_in_minutes_before_start}分前
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
            チェックイン猶予
          </div>
          <div className="text-lg font-bold text-gray-900">
            {setting.check_in_grace_period_minutes}分
          </div>
        </div>

        {/* 予約時間制限 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
            予約時間範囲
          </div>
          <div className="text-lg font-bold text-gray-900">
            {setting.min_reservation_minutes}〜{setting.max_reservation_minutes}
            分
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
            最大事前予約
          </div>
          <div className="text-lg font-bold text-gray-900">
            {setting.max_advance_booking_days}日
          </div>
        </div>

        {/* キャンセル・延長ルール */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
            キャンセル期限
          </div>
          <div className="text-lg font-bold text-gray-900">
            {setting.cancellation_deadline_minutes}分前
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
            延長ルール
          </div>
          <div className="text-lg font-bold text-gray-900">
            {setting.max_extension_minutes}分×
            {setting.max_extension_count}回
          </div>
        </div>
      </div>

      {/* 即時予約フラグ */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {setting.allow_instant_reservation ? (
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span>即時予約: <strong>許可</strong></span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              <span>即時予約: <strong>禁止</strong></span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
