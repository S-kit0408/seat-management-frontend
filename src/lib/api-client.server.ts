import { auth } from '@clerk/nextjs/server'

// サーバーサイドでClerk認証トークン付きでAPIを呼び出す
export async function apiServerFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const { getToken } = await auth()
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
