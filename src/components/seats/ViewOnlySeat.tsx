'use client'

import { Seat } from '@/types/seat'
import { SeatShapeRenderer } from './SeatShapeRenderer'

interface ViewOnlySeatProps {
  seat: Seat
  isSelected: boolean
  onSelect: (id: string) => void
  zoom: number
}

export function ViewOnlySeat({ seat, isSelected, onSelect, zoom }: ViewOnlySeatProps) {
  return (
    <g
      onClick={() => onSelect(seat.id)}
      className="cursor-pointer hover:opacity-80 transition-opacity"
    >
      <g
        transform={`translate(${seat.position_x}, ${seat.position_y}) rotate(${seat.rotation_angle}, ${seat.width / 2}, ${seat.height / 2})`}
      >
        <SeatShapeRenderer
          shape={seat.shape}
          width={seat.width}
          height={seat.height}
          rotationAngle={seat.rotation_angle}
          isSelected={isSelected}
          isActive={seat.is_active}
        />

        {/* 利用可能/不可のテキスト表示 */}
        <text
          x={seat.width / 2}
          y={seat.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`font-bold pointer-events-none select-none ${
            seat.is_active ? 'fill-green-700' : 'fill-red-700'
          }`}
          style={{ fontSize: `${14 / zoom}px` }}
        >
          {seat.is_active ? '可' : '不可'}
        </text>
      </g>
    </g>
  )
}
