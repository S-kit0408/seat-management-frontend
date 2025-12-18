import { apiClientFetch } from '@/lib/api-client.client'
import { User, UpdateProfileRequest } from '@/types/user'

export async function getCurrentUser(
  getToken: () => Promise<string | null>
): Promise<User> {
  const response = await apiClientFetch('/api/users/me', {}, getToken)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('ユーザー情報取得エラー:', {
      status: response.status,
      statusText: response.statusText,
      error: error
    })

    // 404の場合は、より詳細なエラーメッセージを表示
    if (response.status === 404) {
      throw new Error('ユーザー情報が見つかりません。初回サインイン後、しばらくお待ちください。')
    }

    throw new Error(error.error || 'ユーザー情報の取得に失敗しました')
  }

  return response.json()
}

// 現在のユーザー情報を更新
export async function updateCurrentUser(
  data: UpdateProfileRequest,
  getToken: () => Promise<string | null>
): Promise<User> {
  const response = await apiClientFetch(
    '/api/users/me',
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    getToken
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'プロフィールの更新に失敗しました')
  }

  return response.json()
}
