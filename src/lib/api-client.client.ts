// クライアントサイドでClerk認証トークン付きでAPIを呼び出す
export async function apiClientFetch(
  endpoint: string,
  options: RequestInit = {},
  getToken: () => Promise<string | null>
): Promise<Response> {
  // JWT Templateを指定してトークンを取得
  const token = await getToken()

  console.log('API Request Debug:', {
    endpoint,
    hasToken: !!token,
    tokenPrefix: token?.substring(0, 20) + '...',
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  })

  if (!token) {
    throw new Error('認証トークンが取得できません')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')

  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`
  console.log('Fetching:', url)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  console.log('Response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  })

  return response
}
