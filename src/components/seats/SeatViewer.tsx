'use client'

import { useSeatStore } from '@/lib/stores/seatStore'
import { ViewOnlySeat } from './ViewOnlySeat'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'
import { Seat } from '@/types/seat'
import { Reservation, ReservationStatus } from '@/types/reservation'
import { reservationApi } from '@/lib/api/reservations'
import { getFriends } from '@/lib/api/friends'
import { User } from '@/types/user'

const CANVAS_WIDTH = 3000
const CANVAS_HEIGHT = 1500

interface SeatViewerProps {
  filterFloorId?: string | null
  searchKeyword?: string
  selectedAttributes?: string[]
  aiSearchResultIds?: string[] | null
}

export function SeatViewer({
  filterFloorId,
  searchKeyword = '',
  selectedAttributes = [],
  aiSearchResultIds = null,
}: SeatViewerProps = {}) {
  const { getToken } = useAuth()
  const { seats, selectSeat, deselectAll, selectedSeatIds } = useSeatStore()
  const [zoom, setZoom] = useState(0.5) // 初期50%表示
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [friends, setFriends] = useState<User[]>([])

  // 予約データを取得
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const data = await reservationApi.getVisibleReservations(getToken)
        setReservations(data)
      } catch (err: any) {
        console.error('[SeatViewer] 予約データ取得エラー:', err)
        // エラーは無視して、空配列のまま続行
        setReservations([])
      }
    }

    fetchReservations()
  }, [getToken])

  // フレンド一覧を取得
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendsList = await getFriends(getToken)
        setFriends(friendsList)
      } catch (err) {
        console.error('[SeatViewer] フレンド取得エラー:', err)
        setFriends([])
      }
    }

    fetchFriends()
  }, [getToken])

  // フレンドが使用中の座席IDをメモ化
  const friendSeatIds = useMemo(() => {
    const seatIds = new Set<string>()

    if (friends.length === 0) return seatIds

    const friendIds = new Set(friends.map((f) => f.id))

    reservations.forEach((reservation) => {
      // キャンセル済みや完了済みは除外
      if (
        reservation.status === 'cancelled' ||
        reservation.status === 'completed'
      ) {
        return
      }

      // 予約のユーザーがフレンドなら座席IDを追加
      if (
        reservation.user_id &&
        friendIds.has(reservation.user_id) &&
        reservation.status === 'in_use'
      ) {
        seatIds.add(reservation.seat_id)
      }
    })

    return seatIds
  }, [friends, reservations])

  // 座席IDから予約状態を取得する関数
  const getReservationStatusForSeat = (
    seatId: string
  ): ReservationStatus | null => {
    const now = new Date()

    const reservation = reservations.find((r) => {
      // 座席IDが一致していない場合はスキップ
      if (r.seat_id !== seatId) return false

      // キャンセル済みや完了済みは表示しない
      if (r.status === 'cancelled' || r.status === 'completed') return false

      // in_use なら対象
      if (r.status === 'in_use') return true

      // reserved（予約済み）なら対象
      if (r.status === 'reserved') return true

      return false
    })

    // 予約が見つかった場合、状態を返す
    if (reservation) {
      // reserved で開始時刻 <= 現在時刻 < 終了時刻 の場合、in_use として扱う
      if (reservation.status === 'reserved') {
        const startTime = new Date(reservation.start_time)
        const endTime = new Date(reservation.end_time)
        if (startTime <= now && now < endTime) {
          return 'in_use'
        }
      }
      return reservation.status
    }

    return null
  }

  // 検索条件が設定されているかチェック
  const hasSearchConditions =
    selectedAttributes.length > 0 ||
    searchKeyword.trim().length > 0 ||
    aiSearchResultIds !== null

  // 座席が検索条件に該当するかチェックする関数
  const matchesSearchCriteria = (seat: Seat): boolean => {
    // AI検索結果が設定されている場合、それに該当するかチェック
    if (aiSearchResultIds !== null) {
      return aiSearchResultIds.includes(seat.id)
    }

    // 検索条件がない場合は常にtrue
    if (!hasSearchConditions) return true

    // 属性フィルタ（AND検索：選択した属性すべてを含む席のみ）
    if (selectedAttributes.length > 0) {
      const seatAttrs = seat.attributes || {}
      const hasAllAttributes = selectedAttributes.every((attr) => {
        // attributesオブジェクトのキーまたは値に属性が含まれているかチェック
        return Object.entries(seatAttrs).some(([key, value]) => {
          // キーが一致する場合、値がtrueまたは存在する
          if (key === attr && value) return true
          // 値が文字列の場合、部分一致
          if (typeof value === 'string' && value.includes(attr)) return true
          // 配列の場合、要素に含まれるか
          if (Array.isArray(value) && value.includes(attr)) return true
          return false
        })
      })
      if (!hasAllAttributes) return false
    }

    // キーワード検索（attributes、seat_number、descriptionから検索）
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      const seatAttrs = seat.attributes || {}

      // seat_numberでの検索
      if (seat.seat_number?.toLowerCase().includes(keyword)) return true

      // descriptionでの検索
      if (seat.description?.toLowerCase().includes(keyword)) return true

      // attributesでの検索
      const matchesAttributes = Object.entries(seatAttrs).some(
        ([key, value]) => {
          if (key.toLowerCase().includes(keyword)) return true
          if (
            typeof value === 'string' &&
            value.toLowerCase().includes(keyword)
          )
            return true
          if (Array.isArray(value)) {
            return value.some(
              (v) => typeof v === 'string' && v.toLowerCase().includes(keyword)
            )
          }
          return false
        }
      )

      if (!matchesAttributes) return false
    }

    return true
  }

  // フロアフィルタのみ適用（全座席を表示）
  const filteredSeats = filterFloorId
    ? seats.filter((seat) => seat.floor_id === filterFloorId)
    : seats

  // 全体表示のズームレベルを計算
  const calculateFitZoom = () => {
    const container = document.querySelector('.viewer-container')
    if (!container) return 0.5

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight - 50

    const zoomX = containerWidth / CANVAS_WIDTH
    const zoomY = containerHeight / CANVAS_HEIGHT

    return Math.min(zoomX, zoomY, 1)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.1))
  }

  const handleFitToWindow = () => {
    setZoom(calculateFitZoom())
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === e.currentTarget) {
      deselectAll()
    }
  }

  const handleSeatSelect = (seatId: string) => {
    selectSeat(seatId)
  }

  // 座席の統計
  const totalSeats = filteredSeats.length
  const activeSeats = filteredSeats.filter((s) => s.is_active).length

  return (
    <div className="viewer-container">
      {/* ズームコントロール */}
      <div className="flex items-center justify-between mb-2 bg-white border border-gray-300 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="ズームアウト"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="ズームイン"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <button
            onClick={handleFitToWindow}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
            title="全体表示"
          >
            <Maximize2 className="w-4 h-4" />
            全体表示
          </button>

          <button
            onClick={handleResetZoom}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="100%表示"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            総座席数:{' '}
            <span className="font-semibold text-gray-900">{totalSeats}</span>
          </span>
          <span>
            利用可能:{' '}
            <span className="font-semibold text-green-600">{activeSeats}</span>
          </span>
        </div>
      </div>

      {/* キャンバス */}
      <div className="w-full h-[600px] border-2 border-gray-300 rounded-lg overflow-auto bg-gray-50">
        <svg
          width={CANVAS_WIDTH * zoom}
          height={CANVAS_HEIGHT * zoom}
          className="bg-white"
          onClick={handleCanvasClick}
          style={{ cursor: 'default' }}
        >
          {/* グリッド線 */}
          <defs>
            <pattern
              id="grid-viewer"
              width={50 * zoom}
              height={50 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${50 * zoom} 0 L 0 0 0 ${50 * zoom}`}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-viewer)" />

          {/* ズームを適用したグループ */}
          <g transform={`scale(${zoom})`}>
            {filteredSeats.map((seat) => {
              const isDimmed =
                hasSearchConditions && !matchesSearchCriteria(seat)
              const reservationStatus = getReservationStatusForSeat(seat.id)
              const isFriendSeat = friendSeatIds.has(seat.id)
              return (
                <ViewOnlySeat
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeatIds.includes(seat.id)}
                  onSelect={handleSeatSelect}
                  zoom={zoom}
                  isDimmed={isDimmed}
                  reservationStatus={reservationStatus}
                  isFriendSeat={isFriendSeat}
                />
              )
            })}
          </g>
        </svg>
      </div>

      {/* 凡例 */}
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-purple-100 border-2 border-purple-500 rounded" />
          <span>選択中</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-100 border-2 border-orange-600 rounded" />
          <span>使用中</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-600 rounded" />
          <span>フレンド使用中</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-600 rounded" />
          <span>利用可能</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-600 rounded" />
          <span>利用不可</span>
        </div>
        {hasSearchConditions && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-400 rounded" />
            <span>検索条件外</span>
          </div>
        )}
      </div>
    </div>
  )
}
