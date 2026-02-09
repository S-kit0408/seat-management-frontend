export type WebSocketMessageType = 'seat_status_update' | 'connection_established' | 'error'

export type SeatUpdateStatus = 'reserved' | 'occupied' | 'available' | 'updated' | 'deleted'

export interface SeatStatusUpdateData {
  seat_id: string
  status: SeatUpdateStatus
  reservation_id?: string
  user_id?: string
  user_name?: string
  start_time?: string
  end_time?: string
  privacy_setting?: 'public' | 'friends' | 'private'
}

export interface WebSocketMessage {
  type: WebSocketMessageType
  data: SeatStatusUpdateData | any
  timestamp: string
}

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
}
