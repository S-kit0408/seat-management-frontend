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

// レスポンス型定義
interface FloorsListResponse {
  floors: Floor[]
  count: number
}

interface FloorResponse {
  message: string
  floor: Floor
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
}
