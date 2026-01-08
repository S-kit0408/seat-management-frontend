import { User, PrivacySetting } from './user'
import { Seat } from './seat'

export type { User, PrivacySetting }

export type ReservationType = 'instant' | 'scheduled' | 'recurring'
export type ReservationStatus =
  | 'reserved'
  | 'in_use'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Reservation {
  id: string
  user_id: string
  seat_id: string
  type: ReservationType
  start_time: string
  end_time: string
  checked_in_at?: string | null
  checked_out_at?: string | null
  status: ReservationStatus
  privacy_setting?: PrivacySetting | null // nullの場合はユーザーのdefault_privacy_settingを適用
  recurring_reservation_id?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  auto_extend: boolean
  extension_count: number
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  user?: User
  seat?: Seat
}

export interface CreateReservationRequest {
  seat_id: string
  start_time: string
  end_time: string
  privacy_setting?: PrivacySetting
  notes?: string
}

export interface CreateInstantReservationRequest {
  seat_id: string
  duration_minutes: number
  privacy_setting?: PrivacySetting
}

export interface ExtendReservationRequest {
  additional_minutes: number // 必須、追加時間（分）
}

export interface CancelReservationRequest {
  reason?: string
}
