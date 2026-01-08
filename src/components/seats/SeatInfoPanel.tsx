'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Seat } from '@/types/seat'
import { Reservation } from '@/types/reservation'
import { useSeatStore } from '@/lib/stores/seatStore'
import { CheckCircle, XCircle, MapPin, Tag, Calendar, Zap, Clock, AlertCircle } from 'lucide-react'
import CreateReservationDialog from '@/components/reservations/CreateReservationDialog'
import InstantReservationDialog from '@/components/reservations/InstantReservationDialog'
import { useReservations } from '@/hooks/useReservation'
import { reservationApi } from '@/lib/api/reservations'
import {
  CreateReservationRequest,
  CreateInstantReservationRequest,
} from '@/types/reservation'

interface SeatInfoPanelProps {
  selectedSeatId: string | null
}

export function SeatInfoPanel({ selectedSeatId }: SeatInfoPanelProps) {
  const { getToken } = useAuth()
  const { seats } = useSeatStore()
  const { createReservation, createInstantReservation } = useReservations()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [instantDialogOpen, setInstantDialogOpen] = useState(false)
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null)

  const seat = seats.find((s) => s.id === selectedSeatId)

  // 選択された座席の現在の予約を取得
  useEffect(() => {
    if (!selectedSeatId || !getToken) {
      setCurrentReservation(null)
      return
    }

    const fetchReservation = async () => {
      try {
        const data = await reservationApi.getVisibleReservations(getToken)
        const now = new Date()

        const reservation = data.find((r) => {
          // 座席IDが一致していない場合はスキップ
          if (r.seat_id !== selectedSeatId) return false

          // キャンセル済みや完了済みは表示しない
          if (r.status === 'cancelled' || r.status === 'completed') return false

          // in_use または reserved なら対象
          if (r.status === 'in_use' || r.status === 'reserved') return true

          return false
        })

        setCurrentReservation(reservation || null)
      } catch (err: any) {
        console.error('予約情報取得エラー:', err)
        setCurrentReservation(null)
      }
    }

    fetchReservation()
  }, [selectedSeatId, getToken])

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

      {/* 予約状態 */}
      {currentReservation && (
        <div className="py-2 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            現在の予約状態
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {(() => {
                // status が 'in_use' なら使用中
                if (currentReservation.status === 'in_use') {
                  return (
                    <>
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-orange-700">使用中</span>
                    </>
                  )
                }

                // status が 'reserved' で開始時刻 <= 現在時刻 < 終了時刻 なら使用中
                if (currentReservation.status === 'reserved') {
                  const now = new Date()
                  const startTime = new Date(currentReservation.start_time)
                  const endTime = new Date(currentReservation.end_time)
                  if (startTime <= now && now < endTime) {
                    return (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-orange-700">使用中</span>
                      </>
                    )
                  }
                }

                // それ以外は予約済
                return (
                  <>
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-700">予約済</span>
                  </>
                )
              })()}
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <div>
                開始: {new Date(currentReservation.start_time).toLocaleString('ja-JP')}
              </div>
              <div>
                終了: {new Date(currentReservation.end_time).toLocaleString('ja-JP')}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* 予約ボタン */}
      <div className="pt-2 space-y-2">
        <button
          disabled={!seat.is_active}
          onClick={() => setInstantDialogOpen(true)}
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            seat.is_active
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Zap className="w-4 h-4" />
          {seat.is_active ? '今すぐ利用' : '利用できません'}
        </button>

        <button
          disabled={!seat.is_active}
          onClick={() => setCreateDialogOpen(true)}
          className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            seat.is_active
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Calendar className="w-4 h-4" />
          {seat.is_active ? '日時を指定して予約' : '利用できません'}
        </button>
      </div>

      {/* 予約ダイアログ */}
      <InstantReservationDialog
        open={instantDialogOpen}
        onOpenChange={setInstantDialogOpen}
        onSuccess={(reservation) => {
          alert(`予約が完了しました！\n座席: ${seat.seat_number}`)
          setInstantDialogOpen(false)
        }}
        onSubmit={async (data: CreateInstantReservationRequest) => {
          await createInstantReservation(data)
        }}
        defaultSeatId={seat.id}
      />

      <CreateReservationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={(reservation) => {
          alert(`予約が完了しました！\n座席: ${seat.seat_number}`)
          setCreateDialogOpen(false)
        }}
        onSubmit={async (data: CreateReservationRequest) => {
          await createReservation(data)
        }}
        defaultSeatId={seat.id}
      />
    </div>
  )
}
