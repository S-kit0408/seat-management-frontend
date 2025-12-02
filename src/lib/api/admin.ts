import { apiClientFetch } from '@/lib/api-client.client'
import { User, UpdateUserRoleRequest } from '@/types/user'

// 全ユーザーを取得（管理者のみ）
export async function getAllUsers(
  getToken: () => Promise<string | null>
): Promise<User[]> {
  const response = await apiClientFetch('/api/admin/users', {}, getToken)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'ユーザー一覧の取得に失敗しました')
  }

  const data = await response.json()
  return data.users
}

// 特定のユーザー情報を取得（管理者のみ）
export async function getUser(
  userId: string,
  getToken: () => Promise<string | null>
): Promise<User> {
  const response = await apiClientFetch(
    `/api/admin/users/${userId}`,
    {},
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'ユーザー情報の取得に失敗しました')
  }

  return response.json()
}

// ユーザーのロールを更新（管理者のみ）
export async function updateUserRole(
  userId: string,
  data: UpdateUserRoleRequest,
  getToken: () => Promise<string | null>
): Promise<User> {
  const response = await apiClientFetch(
    `/api/admin/users/${userId}/role`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'ロールの更新に失敗しました')
  }

  const result = await response.json()
  return result.user
}

// ユーザーを削除（管理者のみ）
export async function deleteUser(
  userId: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  const response = await apiClientFetch(
    `/api/admin/users/${userId}`,
    {
      method: 'DELETE',
    },
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'ユーザーの削除に失敗しました')
  }
}
