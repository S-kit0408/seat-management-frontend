'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSeatStore } from '@/lib/stores/seatStore'
import { seatApi } from '@/lib/api/seats'
import { floorApi, Floor } from '@/lib/api/floors'
import { SeatViewer } from '@/components/seats/SeatViewer'
import { SeatInfoPanel } from '@/components/seats/SeatInfoPanel'
import { MapPin, Info, Building2 } from 'lucide-react'
import { AttributeSearch } from '@/components/seats/AttributeSearch'

export default function SeatsPage() {
  const { getToken } = useAuth()
  const { seats, setSeats, selectedSeatIds } = useSeatStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [floors, setFloors] = useState<Floor[]>([])
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)

  // 検索用
  const [searchMode, setSearchMode] = useState<'attribute' | 'natural'>(
    'attribute'
  )
  const [naturalText, setNaturalText] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])

  // データの取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // フロア一覧を取得
        const floorsResponse = await floorApi.getActiveFloors(getToken)
        setFloors(floorsResponse.floors)

        // 最初のフロアを自動選択
        if (floorsResponse.floors.length > 0) {
          setSelectedFloorId(floorsResponse.floors[0].id)
        }

        // 座席データを取得
        const seatsResponse = await seatApi.getSeats(getToken)
        setSeats(seatsResponse.seats)
      } catch (err: any) {
        setError(err.message || 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getToken, setSeats])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">座席情報を読み込んでいます...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <Info className="w-5 h-5" />
            エラーが発生しました
          </h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">座席マップ</h1>
                <p className="text-blue-200 text-xs">Seat Map</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* 説明カード */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              座席を選択して詳細を確認
            </h2>
            <p className="text-gray-600">
              フロアを選択して、キャンバス上の座席をクリックすると詳細情報を確認できます。
            </p>
          </div>

          {/* フロア選択 */}
          {floors.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">フロア選択</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {floors.map((floor) => (
                  <button
                    key={floor.id}
                    onClick={() => setSelectedFloorId(floor.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedFloorId === floor.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {floor.display_name || floor.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 検索タブ */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-red-600">検索機能は今後実装</p>
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`px-4 py-2 font-medium ${
                  searchMode === 'attribute'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500'
                }`}
                onClick={() => setSearchMode('attribute')}
              >
                属性検索
              </button>

              <button
                className={`px-4 py-2 font-medium ${
                  searchMode === 'natural'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500'
                }`}
                onClick={() => setSearchMode('natural')}
              >
                自然言語で検索
              </button>
            </div>

            {/* 属性検索 or 自然言語検索の切替 */}
            {searchMode === 'attribute' && (
              <AttributeSearch
                searchKeyword={searchKeyword}
                onSearchChange={setSearchKeyword}
                selectedAttributes={selectedAttributes}
                onAttributesChange={setSelectedAttributes}
              />
            )}

            {/* 今後コンポーネントで管理・機能実装 */}
            {searchMode === 'natural' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="例：静かで窓際の席を探したい"
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                />

                <button
                  onClick={() => alert(`検索: ${naturalText}`)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg"
                >
                  検索する
                </button>
              </div>
            )}
          </div>

          {/* キャンバスと情報パネル */}
          <div className="relative">
            <div className="bg-white rounded-lg shadow-md p-4">
              <SeatViewer filterFloorId={selectedFloorId} />
            </div>

            {/* 座席情報パネル（フローティング表示） */}
            {selectedSeatIds.length > 0 && (
              <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto z-10">
                <SeatInfoPanel selectedSeatId={selectedSeatIds[0] || null} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
