'use client'

import { Seat } from '@/types/seat'
import { useSeatStore } from '@/lib/stores/seatStore'
import { CheckCircle, XCircle, MapPin, Tag } from 'lucide-react'

interface SeatInfoPanelProps {
  selectedSeatId: string | null
}

export function SeatInfoPanel({ selectedSeatId }: SeatInfoPanelProps) {
  const { seats } = useSeatStore()

  const seat = seats.find((s) => s.id === selectedSeatId)

  if (!seat) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">
          座席情報
        </h3>
        <div className="flex flex-col items-center justify-center py-8">
          <MapPin className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">座席を選択してください</p>
          <p className="text-gray-400 text-sm text-center mt-2">
            キャンバス上の座席をクリックすると
            <br />
            詳細情報を確認できます
          </p>
        </div>
      </div>
    )
  }

  // 形状の日本語表示
  const shapeLabel = {
    rectangle: '長方形',
    circle: '円',
    square: '正方形',
    oval: '楕円',
  }[seat.shape]

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-3 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">
        座席情報
      </h3>

      {/* 座席番号 */}
      <div className="bg-gray-50 border border-blue-100 rounded-lg p-4 text-center">
        <div className="text-sm text-blue-600 mb-1">座席番号</div>
        <div className="text-xl font-normal text-blue-900">
          {seat.seat_number}
        </div>
      </div>

      {/* ステータス */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">ステータス</span>
        <div className="flex items-center gap-2">
          {seat.is_active ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-semibold text-green-700">
                利用可能
              </span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-700">
                利用不可
              </span>
            </>
          )}
        </div>
      </div>

      {/* 説明 */}
      {seat.description && (
        <div className="py-2 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-1">説明</div>
          <p className="text-sm text-gray-600">{seat.description}</p>
        </div>
      )}

      {/* 属性 */}
      {seat.attributes?.free_attributes &&
        seat.attributes.free_attributes.length > 0 && (
          <div className="py-2 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Tag className="w-4 h-4" />
              属性
            </div>
            <div className="flex flex-wrap gap-2">
              {seat.attributes.free_attributes.map(
                (attr: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200"
                  >
                    {attr}
                  </span>
                )
              )}
            </div>
          </div>
        )}

      {/* 詳細情報 */}
      <div className="py-2 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">詳細情報</div>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>形状:</span>
            <span className="font-medium">{shapeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>サイズ:</span>
            <span className="font-medium">
              {seat.width} × {seat.height} px
            </span>
          </div>
          <div className="flex justify-between">
            <span>角度:</span>
            <span className="font-medium">{seat.rotation_angle}°</span>
          </div>
        </div>
      </div>

      {/* 予約ボタン（まだ機能しない） */}
      <div className="pt-2">
        <button
          disabled={!seat.is_active}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            seat.is_active
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {seat.is_active ? 'この座席を予約・利用する' : '利用できません'}
        </button>
        <p className="text-base text-red-500 text-center mt-2">
          ※ 予約機能は未実装
        </p>
      </div>
    </div>
  )
}
