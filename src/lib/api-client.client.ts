/**
 * クライアントサイドでClerk認証トークン付きでAPIを呼び出す
 *
 * 使用例：
 * import { useAuth } from '@clerk/nextjs';
 * const { getToken } = useAuth();
 * const response = await apiClientFetch('/api/seats', { method: 'GET' }, getToken);
 */
export async function apiClientFetch(
  endpoint: string,
  options: RequestInit = {},
  getToken: () => Promise<string | null>
): Promise<Response> {
  const token = await getToken()

  if (!token) {
    throw new Error('認証トークンが取得できません')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  })
}
