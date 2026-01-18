import { Seat } from '@/types/seat'
import { apiClientFetch } from '@/lib/api-client.client'

// 認証トークン取得関数の型
type GetToken = () => Promise<string | null>

// AI検索レスポンス型定義（バックエンド仕様に合わせる）
interface AISearchResponseExactOnly {
  seats: Seat[]
  count: number
}

interface AISearchResponseWithPartial {
  seats: {
    exact_matches: Seat[]
    partial_matches: Seat[]
  }
  count: number
  exact_match_count: number
  partial_match_count: number
}

type AISearchResponse = AISearchResponseExactOnly | AISearchResponseWithPartial

export const searchApi = {
  // 自然言語クエリで座席検索（Gemini AI）
  searchSeats: async (
    getToken: GetToken,
    query: string,
    exactMatchOnly: boolean = false
  ): Promise<AISearchResponse> => {
    if (!query.trim()) {
      throw new Error('検索クエリが空です')
    }

    if (query.length > 500) {
      throw new Error('検索クエリは500文字以内にしてください')
    }

    const response = await apiClientFetch(
      `/api/search/seats`,
      {
        method: 'POST',
        body: JSON.stringify({
          query,
          exact_match_only: exactMatchOnly,
        }),
      },
      getToken
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '座席検索に失敗しました')
    }

    return response.json()
  },
}
