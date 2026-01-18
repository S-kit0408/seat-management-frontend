import { apiClientFetch } from '@/lib/api-client.client'
import {
  Reservation,
  CreateReservationRequest,
  CreateInstantReservationRequest,
  ExtendReservationRequest,
  CancelReservationRequest,
} from '@/types/reservation'

type GetToken = () => Promise<string | null>

interface ReservationResponse {
  message?: string
  data?: Reservation
  reservation?: Reservation // バックエンドの仕様に応じて調整
}

interface ReservationsListResponse {
  reservations?: Reservation[]
  data?: Reservation[]
}

interface MessageResponse {
  message: string
}

export const reservationApi = {
  // ==================== 予約作成 ====================

  // 通常予約作成（Scheduled Reservation）
  createReservation: async (
    getToken: GetToken,
    data: CreateReservationRequest
  ): Promise<Reservation> => {
    console.log('[API] createReservation request body:', {
      privacy_setting: data.privacy_setting,
      data: data,
    })

    const response = await apiClientFetch(
      `/api/reservations`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '予約の作成に失敗しました')
    }

    const result: ReservationResponse = await response.json()
    console.log('[API] createReservation response:', {
      privacy_setting: result.data?.privacy_setting || result.reservation?.privacy_setting,
      result: result,
    })
    return result.data || result.reservation || (result as any)
  },

  // 即時予約作成（Instant Reservation）
  createInstantReservation: async (
    getToken: GetToken,
    data: CreateInstantReservationRequest
  ): Promise<Reservation> => {
    console.log('[API] createInstantReservation request body:', {
      privacy_setting: data.privacy_setting,
      data: data,
    })

    const response = await apiClientFetch(
      `/api/reservations/instant`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '即時予約の作成に失敗しました')
    }

    const result: ReservationResponse = await response.json()
    console.log('[API] createInstantReservation response:', {
      privacy_setting: result.data?.privacy_setting || result.reservation?.privacy_setting,
      result: result,
    })
    return result.data || result.reservation || (result as any)
  },

  // ==================== 予約取得 ====================

  // 予約詳細取得（ID指定）
  getReservation: async (
    getToken: GetToken,
    id: string
  ): Promise<Reservation> => {
    const response = await apiClientFetch(
      `/api/reservations/${id}`,
      { method: 'GET' },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '予約の取得に失敗しました')
    }

    const result: ReservationResponse = await response.json()
    return result.data || result.reservation || (result as any)
  },

  // 自分の全予約取得
  getMyReservations: async (getToken: GetToken): Promise<Reservation[]> => {
    const response = await apiClientFetch(
      `/api/reservations/my`,
      { method: 'GET' },
      getToken
    )

    // 404の場合は空配列を返す（予約が存在しない場合）
    if (response.status === 404) {
      console.log('予約が見つかりません。空配列を返します。')
      return []
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('予約一覧の取得エラー:', error)
      throw new Error(error.error || '予約一覧の取得に失敗しました')
    }

    const result: ReservationsListResponse = await response.json()
    return result.reservations || result.data || (result as any)
  },

  // 自分のアクティブな予約取得
  getActiveReservations: async (getToken: GetToken): Promise<Reservation[]> => {
    const response = await apiClientFetch(
      `/api/reservations/active`,
      { method: 'GET' },
      getToken
    )

    // 404の場合は空配列を返す（予約が存在しない場合）
    if (response.status === 404) {
      console.log('アクティブな予約が見つかりません。空配列を返します。')
      return []
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('アクティブな予約の取得エラー:', error)
      throw new Error(error.error || 'アクティブな予約の取得に失敗しました')
    }

    const result: ReservationsListResponse = await response.json()
    return result.reservations || result.data || (result as any)
  },

  // 公開予約取得（プライバシー対応）
  getVisibleReservations: async (
    getToken: GetToken,
    startTime?: string,
    endTime?: string
  ): Promise<Reservation[]> => {
    let url = `/api/reservations/visible`
    const params = new URLSearchParams()

    if (startTime) params.append('start_time', startTime)
    if (endTime) params.append('end_time', endTime)

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await apiClientFetch(url, { method: 'GET' }, getToken)

    // 404の場合は空配列を返す（予約が存在しない場合）
    if (response.status === 404) {
      console.log('公開予約が見つかりません。空配列を返します。')
      return []
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('公開予約の取得エラー:', error)
      throw new Error(error.error || '公開予約の取得に失敗しました')
    }

    const result: ReservationsListResponse = await response.json()
    return result.reservations || result.data || (result as any)
  },

  // ==================== 予約操作 ====================

  // チェックイン
  checkin: async (getToken: GetToken, id: string): Promise<Reservation> => {
    const response = await apiClientFetch(
      `/api/reservations/${id}/checkin`,
      { method: 'POST' },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'チェックインに失敗しました')
    }

    const result: ReservationResponse = await response.json()
    return result.data || result.reservation || (result as any)
  },

  // チェックアウト
  checkout: async (getToken: GetToken, id: string): Promise<Reservation> => {
    const response = await apiClientFetch(
      `/api/reservations/${id}/checkout`,
      { method: 'POST' },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'チェックアウトに失敗しました')
    }

    const result: ReservationResponse = await response.json()
    return result.data || result.reservation || (result as any)
  },

  // 予約キャンセル
  cancel: async (
    getToken: GetToken,
    id: string,
    reason?: string
  ): Promise<Reservation> => {
    const body: CancelReservationRequest = {}
    if (reason) body.reason = reason

    const response = await apiClientFetch(
      `/api/reservations/${id}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '予約のキャンセルに失敗しました')
    }

    const result: ReservationResponse = await response.json()
    return result.data || result.reservation || (result as any)
  },

  // 予約延長
  extend: async (
    getToken: GetToken,
    id: string,
    additionalMinutes: number
  ): Promise<Reservation> => {
    const body: ExtendReservationRequest = {
      additional_minutes: additionalMinutes,
    }

    const response = await apiClientFetch(
      `/api/reservations/${id}/extend`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '予約の延長に失敗しました')
    }

    const result: ReservationResponse = await response.json()
    return result.data || result.reservation || (result as any)
  },
}
