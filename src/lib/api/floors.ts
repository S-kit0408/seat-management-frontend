import { apiClientFetch } from '@/lib/api-client.client'

// 認証トークン取得関数の型
type GetToken = () => Promise<string | null>

// Floor型定義
export interface Floor {
  id: string
  name: string
  display_name?: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 営業時間型定義
export interface OperationHours {
  id: string
  floor_id: string
  day_of_week: number // 0=日曜～6=土曜
  open_time: string // "HH:MM:SS"
  close_time: string // "HH:MM:SS"
  is_closed: boolean
  created_at: string
  updated_at: string
}

// レスポンス型定義
interface FloorsListResponse {
  floors: Floor[]
  count: number
}

interface FloorResponse {
  message: string
  floor: Floor
}

interface OperationHoursResponse {
  operation_hours: OperationHours[]
  count: number
}

// フロアAPI
export const floorApi = {
  // アクティブなフロア一覧取得（全ユーザー）
  getActiveFloors: async (getToken: GetToken): Promise<FloorsListResponse> => {
    const response = await apiClientFetch(
      `/api/floors/active`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch active floors')
    }
    return response.json()
  },

  // === 管理者専用エンドポイント ===

  // 全フロア一覧取得（管理者のみ）
  getAllFloors: async (getToken: GetToken): Promise<FloorsListResponse> => {
    const response = await apiClientFetch(
      `/api/admin/floors`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch all floors')
    }
    return response.json()
  },

  // フロア作成（管理者のみ）
  createFloor: async (
    getToken: GetToken,
    floor: {
      name: string
      display_name?: string
      description?: string
      sort_order: number
      is_active?: boolean
    }
  ): Promise<Floor> => {
    const response = await apiClientFetch(
      `/api/admin/floors`,
      {
        method: 'POST',
        body: JSON.stringify(floor),
      },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create floor')
    }
    return response.json()
  },

  // フロア更新（管理者のみ）
  updateFloor: async (
    getToken: GetToken,
    id: string,
    updates: {
      name?: string
      display_name?: string
      description?: string
      sort_order?: number
      is_active?: boolean
    }
  ): Promise<FloorResponse> => {
    const response = await apiClientFetch(
      `/api/admin/floors/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update floor')
    }
    return response.json()
  },

  // フロア削除（管理者のみ）
  deleteFloor: async (
    getToken: GetToken,
    id: string
  ): Promise<{ message: string }> => {
    const response = await apiClientFetch(
      `/api/admin/floors/${id}`,
      { method: 'DELETE' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete floor')
    }
    return response.json()
  },

  // === 営業時間API ===

  // フロアの営業時間一覧取得（全ユーザー）
  getOperationHours: async (
    getToken: GetToken,
    floorId: string
  ): Promise<OperationHoursResponse> => {
    const response = await apiClientFetch(
      `/api/floors/${floorId}/operation-hours`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch operation hours')
    }
    return response.json()
  },

  // 特定の曜日の営業時間を取得（全ユーザー）
  getOperationHoursByDay: async (
    getToken: GetToken,
    floorId: string,
    day: number
  ): Promise<OperationHours> => {
    const response = await apiClientFetch(
      `/api/floors/${floorId}/operation-hours/${day}`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch operation hours for day')
    }
    return response.json()
  },

  // 営業時間を更新（管理者のみ）
  updateOperationHours: async (
    getToken: GetToken,
    floorId: string,
    operationHours: Array<{
      day_of_week: number
      open_time: string
      close_time: string
      is_closed: boolean
    }>
  ): Promise<OperationHoursResponse> => {
    const response = await apiClientFetch(
      `/api/admin/floors/${floorId}/operation-hours`,
      {
        method: 'PUT',
        body: JSON.stringify({ operation_hours: operationHours }),
      },
      getToken
    )
    if (!response.ok) {
      try {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update operation hours')
      } catch (parseError) {
        // JSON パースに失敗した場合
        throw new Error(
          `営業時間の更新に失敗しました (HTTP ${response.status})`
        )
      }
    }
    return response.json()
  },
}
