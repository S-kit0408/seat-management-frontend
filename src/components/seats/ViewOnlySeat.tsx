'use client'

import { Seat } from '@/types/seat'
import { ReservationStatus } from '@/types/reservation'
import { SeatShapeRenderer } from './SeatShapeRenderer'

interface ViewOnlySeatProps {
  seat: Seat
  isSelected: boolean
  onSelect: (id: string) => void
  zoom: number
  isDimmed?: boolean
  reservationStatus?: ReservationStatus | null
}

export function ViewOnlySeat({
  seat,
  isSelected,
  onSelect,
  zoom,
  isDimmed = false,
  reservationStatus,
}: ViewOnlySeatProps) {
  // テキスト表示の文字と色を決定
  let displayText: string
  let displayColor: string

  if (reservationStatus === 'in_use') {
    displayText = '使用中'
    displayColor = isDimmed ? '#9ca3af' : '#ea580c'
  } else if (reservationStatus === 'reserved') {
    displayText = '予約済'
    displayColor = isDimmed ? '#9ca3af' : '#2563eb'
  } else if (isDimmed) {
    displayText = seat.is_active ? '可' : '不可'
    displayColor = '#9ca3af'
  } else {
    displayText = seat.is_active ? '可' : '不可'
    displayColor = seat.is_active ? '#16a34a' : '#dc2626'
  }

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
          isDimmed={isDimmed}
          reservationStatus={reservationStatus}
        />

        {/* 状態表示（可/不可/使用中/予約済） */}
        <text
          x={seat.width / 2}
          y={seat.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold pointer-events-none select-none"
          fill={displayColor}
          style={{ fontSize: `${14 / zoom}px` }}
        >
          {displayText}
        </text>
      </g>
    </g>
  )
}
