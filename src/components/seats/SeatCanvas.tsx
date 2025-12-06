'use client'

import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useSeatStore } from '@/lib/stores/seatStore'
import { DraggableSeat } from './DraggableSeat'
import { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'

const CANVAS_WIDTH = 1500
const CANVAS_HEIGHT = 1500

interface SeatCanvasProps {
  filterFloorId?: string | null
}

export function SeatCanvas({ filterFloorId }: SeatCanvasProps = {}) {
  const { seats, selectedSeatIds, updateSeat, selectSeat, deselectAll } =
    useSeatStore()
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1) // ズームレベル（1 = 100%）

  // フロアでフィルタリング
  const filteredSeats = filterFloorId
    ? // ? seats.filter((seat) => seat.floor_id === filterFloorId)
      // : seats
      seats.filter((seat) => seat.floor_id === filterFloorId)
    : seats.filter((seat) => !seat.floor_id)

  // 全体表示のズームレベルを計算
  const calculateFitZoom = () => {
    const container = document.querySelector('.canvas-container')
    if (!container) return 1

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight - 50 // ツールバー分を除く

    const zoomX = containerWidth / CANVAS_WIDTH
    const zoomY = containerHeight / CANVAS_HEIGHT

    // 縦横どちらも収まる最大のズーム率
    return Math.min(zoomX, zoomY, 1) // 最大100%まで
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2)) // 最大200%
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.1)) // 最小10%
  }

  const handleFitToWindow = () => {
    setZoom(calculateFitZoom())
  }

  const handleResetZoom = () => {
    setZoom(1) // 100%に戻す
  }

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true)
    const seatId = event.active.id as string
    selectSeat(seatId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false)
    const { active, delta } = event
    const seatId = active.id as string

    const seat = filteredSeats.find((s) => s.id === seatId)
    if (seat) {
      // ズームを考慮した移動量
      let newX = seat.position_x + delta.x / zoom
      let newY = seat.position_y + delta.y / zoom

      // 境界チェック
      newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - seat.width))
      newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - seat.height))

      updateSeat(seatId, {
        position_x: newX,
        position_y: newY,
      })
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === e.currentTarget) {
      deselectAll()
    }
  }

  return (
    <div className="canvas-container">
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

        <div className="text-xs text-gray-500">
          キャンバス: {CANVAS_WIDTH} × {CANVAS_HEIGHT} px
        </div>
      </div>

      {/* キャンバス */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="w-full h-[600px] border-2 border-gray-300 rounded-lg overflow-auto bg-gray-50">
          <svg
            width={CANVAS_WIDTH * zoom}
            height={CANVAS_HEIGHT * zoom}
            className="bg-white"
            onClick={handleCanvasClick}
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
          >
            {/* グリッド線 */}
            <defs>
              <pattern
                id="grid"
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
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* ズームを適用したグループ */}
            <g transform={`scale(${zoom})`}>
              {filteredSeats.map((seat) => (
                <DraggableSeat
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeatIds.includes(seat.id)}
                  onSelect={selectSeat}
                />
              ))}
            </g>
          </svg>
        </div>
      </DndContext>
    </div>
  )
}
