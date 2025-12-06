export type SeatShape = 'rectangle' | 'circle' | 'square' | 'oval'

export interface Seat {
  id: string
  seat_number: string
  description?: string
  position_x: number
  position_y: number
  rotation_angle: number
  width: number
  height: number
  shape: SeatShape
  attributes: Record<string, any>
  floor_id?: string
  space_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DragData {
  id: string
  initialX: number
  initialY: number
}
