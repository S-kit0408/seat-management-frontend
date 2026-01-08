import { apiClientFetch } from '@/lib/api-client.client'
import {
  ReservationSettings,
  CreateReservationSettingsRequest,
  UpdateReservationSettingsRequest,
} from '@/types/reservationSettings'

type GetToken = () => Promise<string | null>

interface ReservationSettingsResponse {
  message?: string
  data?: ReservationSettings
  settings?: ReservationSettings
}

interface ReservationSettingsListResponse {
  settings?: ReservationSettings[]
  data?: ReservationSettings[]
  count?: number
}

export const reservationSettingsApi = {
  // 全設定取得（管理者のみ）
  getAllSettings: async (
    getToken: GetToken
  ): Promise<ReservationSettings[]> => {
    const response = await apiClientFetch(
      '/api/admin/settings/reservation',
      { method: 'GET' },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.error || '予約設定一覧の取得に失敗しました'
      )
    }

    const result: ReservationSettingsListResponse = await response.json()
    return result.settings || result.data || []
  },

  // アクティブな設定取得（認証済みユーザー）
  getActiveSettings: async (
    getToken: GetToken
  ): Promise<ReservationSettings> => {
    const response = await apiClientFetch(
      '/api/settings/reservation',
      { method: 'GET' },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.error || 'アクティブな予約設定の取得に失敗しました'
      )
    }

    const result: ReservationSettingsResponse = await response.json()
    return result.data || result.settings || (result as any)
  },

  // 設定作成（管理者のみ）
  createSettings: async (
    getToken: GetToken,
    data: CreateReservationSettingsRequest
  ): Promise<ReservationSettings> => {
    console.log('[API] createSettings - Request body:', JSON.stringify(data, null, 2))
    const response = await apiClientFetch(
      '/api/admin/settings/reservation',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '予約設定の作成に失敗しました')
    }

    const result: ReservationSettingsResponse = await response.json()
    return result.data || result.settings || (result as any)
  },

  // 設定更新（管理者のみ）
  updateSettings: async (
    getToken: GetToken,
    id: string,
    data: UpdateReservationSettingsRequest
  ): Promise<ReservationSettings> => {
    const response = await apiClientFetch(
      `/api/admin/settings/reservation/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '予約設定の更新に失敗しました')
    }

    const result: ReservationSettingsResponse = await response.json()
    return result.data || result.settings || (result as any)
  },

  // 設定有効化（管理者のみ）
  activateSettings: async (
    getToken: GetToken,
    id: string
  ): Promise<ReservationSettings> => {
    const response = await apiClientFetch(
      `/api/admin/settings/reservation/${id}/activate`,
      { method: 'POST' },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '予約設定の有効化に失敗しました')
    }

    const result: ReservationSettingsResponse = await response.json()
    return result.data || result.settings || (result as any)
  },

  // 設定削除（管理者のみ）
  deleteSettings: async (
    getToken: GetToken,
    id: string
  ): Promise<void> => {
    const response = await apiClientFetch(
      `/api/admin/settings/reservation/${id}`,
      { method: 'DELETE' },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '予約設定の削除に失敗しました')
    }
  },
}
