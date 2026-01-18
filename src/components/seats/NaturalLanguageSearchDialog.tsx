'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search, Loader, AlertCircle, Check } from 'lucide-react'
import { Seat } from '@/types/seat'
import { searchApi } from '@/lib/api/search'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearchResults: (seats: Seat[]) => void
}

interface SearchResults {
  exactMatches: Seat[]
  partialMatches: Seat[]
}

export default function NaturalLanguageSearchDialog({
  open,
  onOpenChange,
  onSearchResults,
}: Props) {
  const { getToken } = useAuth()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResults>({
    exactMatches: [],
    partialMatches: [],
  })
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [exactMatchOnly, setExactMatchOnly] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setError('検索クエリが空です')
      return
    }

    setIsSearching(true)
    setError(null)
    setResults({ exactMatches: [], partialMatches: [] })

    try {
      const token = await getToken()
      if (!token) {
        setError('認証エラーが発生しました。再度ログインしてください。')
        return
      }

      const response = await searchApi.searchSeats(
        getToken,
        query,
        exactMatchOnly
      )

      if (exactMatchOnly) {
        // exact_match_only=true の場合、seatsは配列
        const exactMatches = 'exact_match_count' in response ? [] : (response.seats as Seat[])
        setResults({ exactMatches, partialMatches: [] })
        onSearchResults(exactMatches)
      } else {
        // exact_match_only=false の場合、seatsは {exact_matches, partial_matches}
        const exactMatches = 'exact_matches' in response.seats ? response.seats.exact_matches : []
        const partialMatches = 'partial_matches' in response.seats ? response.seats.partial_matches : []
        setResults({ exactMatches, partialMatches })
        onSearchResults([...exactMatches, ...partialMatches])
      }

      setSearchPerformed(true)
    } catch (err: any) {
      const errorMessage = err.message || '座席検索に失敗しました'
      setError(errorMessage)
      setSearchPerformed(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuery('')
      setError(null)
      setResults({ exactMatches: [], partialMatches: [] })
      setSearchPerformed(false)
      setExactMatchOnly(false)
    }
    onOpenChange(newOpen)
  }

  const totalResults = results.exactMatches.length + results.partialMatches.length

  const renderSeatAttributes = (seat: Seat) => {
    if (!seat.attributes) return null

    const freeAttributes = seat.attributes.free_attributes
    if (!Array.isArray(freeAttributes)) return null

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {freeAttributes.map((attr: string) => (
          <span
            key={attr}
            className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
          >
            {attr}
          </span>
        ))}
      </div>
    )
  }

  const renderSeatCard = (seat: Seat, isExactMatch: boolean = false) => (
    <div
      key={seat.id}
      className="p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{seat.seat_number}</p>
            {isExactMatch && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                <Check className="w-3 h-3" />
                完全一致
              </span>
            )}
          </div>
          {seat.description && (
            <p className="text-sm text-gray-600 mt-1">{seat.description}</p>
          )}
          {renderSeatAttributes(seat)}
        </div>
      </div>
    </div>
  )

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        <Dialog.Content className="text-gray-600 fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-2xl font-bold flex items-center gap-2">
              <Search className="w-6 h-6" />
              AI座席検索
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-600 mb-6">
            Gemini AIが自然言語を解析して座席を検索します
          </Dialog.Description>

          <form onSubmit={handleSearch} className="space-y-4">
            {/* 検索クエリ入力 */}
            <div>
              <label htmlFor="query" className="block text-sm font-medium mb-2">
                検索クエリ <span className="text-red-500">*</span>
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例：静かな座席が欲しい&#10;例：電源付きで窓側の個人用座席&#10;例：グループ作業用座席"
                rows={3}
                maxLength={500}
                disabled={isSearching}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {query.length}/500文字
              </p>
            </div>

            {/* 検索オプション */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exactMatchOnly}
                  onChange={(e) => setExactMatchOnly(e.target.checked)}
                  disabled={isSearching}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">
                  完全一致のみを表示
                  <span className="text-xs text-gray-500 ml-1">
                    (OFF：部分一致も含む)
                  </span>
                </span>
              </label>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* 検索結果表示 */}
            {searchPerformed && !isSearching && (
              <>
                {totalResults > 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ {totalResults}件の座席が見つかりました
                    </p>
                    {results.exactMatches.length > 0 &&
                      results.partialMatches.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          完全一致: {results.exactMatches.length}件、
                          部分一致: {results.partialMatches.length}件
                        </p>
                      )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="text-sm text-amber-700">
                      条件に合う座席が見つかりませんでした
                    </p>
                  </div>
                )}

                {/* 完全一致結果 */}
                {results.exactMatches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      完全一致 ({results.exactMatches.length}件):
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {results.exactMatches.map((seat) =>
                        renderSeatCard(seat, true)
                      )}
                    </div>
                  </div>
                )}

                {/* 部分一致結果 */}
                {results.partialMatches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      部分一致 ({results.partialMatches.length}件):
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {results.partialMatches.map((seat) =>
                        renderSeatCard(seat, false)
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ボタン */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={isSearching}
                >
                  閉じる
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSearching && <Loader className="w-4 h-4 animate-spin" />}
                {isSearching ? '検索中...' : '検索'}
              </button>
            </div>
          </form>

          {/* クエリ例 */}
          {!searchPerformed && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">
                クエリ例（AIが自動解析）:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 「静かな座席が欲しい」→ キーワード: 静か</li>
                <li>• 「電源付きの座席」→ キーワード: 充電器あり</li>
                <li>• 「個人用の座席」→ キーワード: 一人向け</li>
                <li>• 「明るい場所で作業したい」→ キーワード: 明るい</li>
              </ul>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
