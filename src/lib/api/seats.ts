import { Seat } from '@/types/seat'
import { apiClientFetch } from '@/lib/api-client.client'

// 認証トークン取得関数の型
type GetToken = () => Promise<string | null>

// レスポンス型定義（バックエンド仕様に合わせる）
interface SeatsListResponse {
  seats: Seat[]
  count: number
}

interface UpdateSeatResponse {
  message: string
  seat: Seat
}

interface DeleteSeatResponse {
  message: string
}

export const seatApi = {
  // 座席一覧取得
  getSeats: async (
    getToken: GetToken,
    limit: number = 100,
    offset: number = 0
  ): Promise<SeatsListResponse> => {
    const response = await apiClientFetch(
      `/api/seats?limit=${limit}&offset=${offset}`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch seats')
    }
    return response.json()
  },

  // アクティブな座席一覧取得
  getActiveSeats: async (getToken: GetToken): Promise<SeatsListResponse> => {
    const response = await apiClientFetch(
      `/api/seats/active`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch active seats')
    }
    return response.json()
  },

  // 座席詳細取得
  getSeat: async (getToken: GetToken, id: string): Promise<Seat> => {
    const response = await apiClientFetch(
      `/api/seats/${id}`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch seat')
    }
    return response.json()
  },

  // 座席番号で検索
  searchBySeatNumber: async (
    getToken: GetToken,
    seatNumber: string
  ): Promise<Seat> => {
    const response = await apiClientFetch(
      `/api/seats/search?seat_number=${encodeURIComponent(seatNumber)}`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to search seat')
    }
    return response.json()
  },

  // フロア別座席取得
  getSeatsByFloor: async (
    getToken: GetToken,
    floorId: string
  ): Promise<SeatsListResponse> => {
    const response = await apiClientFetch(
      `/api/seats/floor?floor_id=${floorId}`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch seats by floor')
    }
    return response.json()
  },

  // スペース別座席取得
  getSeatsBySpace: async (
    getToken: GetToken,
    spaceId: string
  ): Promise<SeatsListResponse> => {
    const response = await apiClientFetch(
      `/api/seats/space?space_id=${spaceId}`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch seats by space')
    }
    return response.json()
  },

  // === 管理者専用エンドポイント ===

  // 座席作成（管理者のみ）
  createSeat: async (
    getToken: GetToken,
    seat: Omit<Seat, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Seat> => {
    const response = await apiClientFetch(
      `/api/admin/seats`,
      {
        method: 'POST',
        body: JSON.stringify(seat),
      },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create seat')
    }
    return response.json()
  },

  // 座席更新（管理者のみ）
  updateSeat: async (
    getToken: GetToken,
    id: string,
    updates: Partial<Seat>
  ): Promise<UpdateSeatResponse> => {
    const response = await apiClientFetch(
      `/api/admin/seats/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update seat')
    }
    return response.json()
  },

  // 座席削除（管理者のみ）
  deleteSeat: async (
    getToken: GetToken,
    id: string
  ): Promise<DeleteSeatResponse> => {
    const response = await apiClientFetch(
      `/api/admin/seats/${id}`,
      { method: 'DELETE' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete seat')
    }
    return response.json()
  },

  // フロア未設定の座席取得（管理者のみ）
  getUnassignedSeats: async (getToken: GetToken): Promise<SeatsListResponse> => {
    const response = await apiClientFetch(
      `/api/admin/seats/unassigned`,
      { method: 'GET' },
      getToken
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch unassigned seats')
    }
    return response.json()
  },
}
