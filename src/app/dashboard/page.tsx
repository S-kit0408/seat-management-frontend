'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useState } from 'react'

export default function DashboardPage() {
  const { getToken, signOut } = useAuth()
  const { user } = useUser()
  const [apiResponse, setApiResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testBackendAPI = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()

      if (!token) {
        throw new Error('トークンの取得に失敗しました')
      }

      // ⭐ まず GET /api/users/me を試す
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || `API呼び出しに失敗しました (${response.status})`
        )
      }

      const data = await response.json()
      setApiResponse(data)
      console.log('API Response:', data)
    } catch (err: any) {
      console.error('API Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">ダッシュボード</h1>

          {/* Clerkユーザー情報 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Clerkユーザー情報</h2>
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <p>
                <strong>名前:</strong> {user?.firstName} {user?.lastName}
              </p>
              <p>
                <strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}
              </p>
              <p>
                <strong>Clerk ID:</strong>{' '}
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                  {user?.id}
                </code>
              </p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={testBackendAPI}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '読み込み中...' : 'バックエンドAPIをテスト'}
            </button>

            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
            >
              サインアウト
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
              <strong>エラー:</strong> {error}
            </div>
          )}

          {/* APIレスポンス */}
          {apiResponse && (
            <div className="bg-gray-50 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">
                ✅ バックエンドAPIレスポンス
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                データベースに保存されているユーザー情報:
              </p>
              <pre className="bg-white p-4 rounded border overflow-auto text-sm">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
