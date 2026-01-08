export interface ReservationSettings {
  id: string

  // チェックイン制限
  check_in_minutes_before_start: number
  check_in_grace_period_minutes: number

  // 予約時間制限
  min_reservation_minutes: number
  max_reservation_minutes: number
  max_advance_booking_days: number

  // キャンセル・延長ルール
  cancellation_deadline_minutes: number
  max_extension_minutes: number
  max_extension_count: number
  allow_instant_reservation: boolean

  // メタ情報
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateReservationSettingsRequest {
  check_in_minutes_before_start: number
  check_in_grace_period_minutes: number
  min_reservation_minutes: number
  max_reservation_minutes: number
  max_advance_booking_days: number
  cancellation_deadline_minutes: number
  max_extension_minutes: number
  max_extension_count: number
  allow_instant_reservation: boolean
  description?: string
  is_active: boolean  // 必須フィールドに変更（新規作成時は false、編集時は元の値を保持）
}

export type UpdateReservationSettingsRequest = Partial<
  CreateReservationSettingsRequest
>
