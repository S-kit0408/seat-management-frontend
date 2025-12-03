import { apiClientFetch } from '@/lib/api-client.client'
import { User } from '@/types/user'
import {
  FriendRequest,
  SendFriendRequestPayload,
  ApiResponse,
  FriendshipStatus,
} from '@/types/friend'

const BASE_URL = '/api/friends'

// ユーザーを名前で検索
export async function searchUsersByName(
  name: string,
  getToken: () => Promise<string | null>
): Promise<User[]> {
  const response = await apiClientFetch(
    `/api/users/search?name=${encodeURIComponent(name)}`,
    {},
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'ユーザー検索に失敗しました')
  }

  return response.json()
}

// フレンド申請
export async function sendFriendRequest(
  payload: SendFriendRequestPayload,
  getToken: () => Promise<string | null>
): Promise<ApiResponse> {
  const response = await apiClientFetch(
    `${BASE_URL}/requests`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'フレンド申請の送信に失敗しました')
  }

  return response.json()
}

// 受信した申請一覧を取得
export async function getReceivedRequests(
  getToken: () => Promise<string | null>
): Promise<FriendRequest[]> {
  const response = await apiClientFetch(
    `${BASE_URL}/requests/received`,
    {},
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || '受信申請の取得に失敗しました')
  }

  return response.json()
}

// 送信した申請一覧を取得
export async function getSentRequests(
  getToken: () => Promise<string | null>
): Promise<FriendRequest[]> {
  const response = await apiClientFetch(
    `${BASE_URL}/requests/sent`,
    {},
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || '送信申請の取得に失敗しました')
  }

  return response.json()
}

// 申請承認
export async function acceptFriendRequest(
  requestId: string,
  getToken: () => Promise<string | null>
): Promise<ApiResponse> {
  const response = await apiClientFetch(
    `${BASE_URL}/requests/${requestId}/accept`,
    { method: 'POST' },
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || '申請の承認に失敗しました')
  }

  return response.json()
}

// 申請拒否
export async function rejectFriendRequest(
  requestId: string,
  getToken: () => Promise<string | null>
): Promise<ApiResponse> {
  const response = await apiClientFetch(
    `${BASE_URL}/requests/${requestId}/reject`,
    { method: 'POST' },
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || '申請の拒否に失敗しました')
  }

  return response.json()
}

// 申請キャンセル
export async function cancelFriendRequest(
  requestId: string,
  getToken: () => Promise<string | null>
): Promise<ApiResponse> {
  const response = await apiClientFetch(
    `${BASE_URL}/requests/${requestId}`,
    { method: 'DELETE' },
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || '申請のキャンセルに失敗しました')
  }

  return response.json()
}

// フレンド一覧取得
export async function getFriends(
  getToken: () => Promise<string | null>
): Promise<User[]> {
  const response = await apiClientFetch(BASE_URL, {}, getToken)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'フレンドリストの取得に失敗しました')
  }

  return response.json()
}

// フレンド解除
export async function removeFriend(
  friendId: string,
  getToken: () => Promise<string | null>
): Promise<ApiResponse> {
  const response = await apiClientFetch(
    `${BASE_URL}/${friendId}`,
    { method: 'DELETE' },
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'フレンド解除に失敗しました')
  }

  return response.json()
}

// フレンド関係を確認
export async function checkFriendshipStatus(
  userId: string,
  getToken: () => Promise<string | null>
): Promise<FriendshipStatus> {
  const response = await apiClientFetch(
    `${BASE_URL}/${userId}/status`,
    {},
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'フレンド関係の確認に失敗しました')
  }

  return response.json()
}
