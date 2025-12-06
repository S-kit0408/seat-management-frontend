'use client'

import { useSeatStore } from '@/lib/stores/seatStore'
import { ViewOnlySeat } from './ViewOnlySeat'
import { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'

const CANVAS_WIDTH = 3000
const CANVAS_HEIGHT = 1500

interface SeatViewerProps {
  filterFloorId?: string | null
}

export function SeatViewer({ filterFloorId }: SeatViewerProps = {}) {
  const { seats, selectSeat, deselectAll, selectedSeatIds } = useSeatStore()
  const [zoom, setZoom] = useState(0.5) // 初期50%表示

  // フロアでフィルタリング
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
            総座席数: <span className="font-semibold text-gray-900">{totalSeats}</span>
          </span>
          <span>
            利用可能: <span className="font-semibold text-green-600">{activeSeats}</span>
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
            {filteredSeats.map((seat) => (
              <ViewOnlySeat
                key={seat.id}
                seat={seat}
                isSelected={selectedSeatIds.includes(seat.id)}
                onSelect={handleSeatSelect}
                zoom={zoom}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* 凡例 */}
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-purple-100 border-2 border-purple-500 rounded" />
          <span>選択中</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-600 rounded" />
          <span>利用可能</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-600 rounded" />
          <span>利用不可</span>
        </div>
      </div>
    </div>
  )
}
