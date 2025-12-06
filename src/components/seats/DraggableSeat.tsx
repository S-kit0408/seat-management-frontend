'use client'

import { useDraggable } from '@dnd-kit/core'
import { Seat } from '@/types/seat'
import { SeatShapeRenderer } from './SeatShapeRenderer'

interface DraggableSeatProps {
  seat: Seat
  isSelected: boolean
  onSelect: (id: string) => void
}

export function DraggableSeat({
  seat,
  isSelected,
  onSelect,
}: DraggableSeatProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: seat.id,
    data: {
      seat,
    },
  })

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  }

  return (
    <g
      ref={setNodeRef as any}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(seat.id)}
      className="cursor-move"
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
        />
        <text
          x={seat.width / 2}
          y={seat.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-700 pointer-events-none select-none"
        >
          {seat.seat_number}
        </text>
      </g>
    </g>
  )
}
