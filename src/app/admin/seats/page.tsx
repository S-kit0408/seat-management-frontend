'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSeatStore } from '@/lib/stores/seatStore'
import { seatApi } from '@/lib/api/seats'
import { floorApi, Floor } from '@/lib/api/floors'
import { SeatCanvas } from '@/components/seats/SeatCanvas'
import { Toolbar } from '@/components/seats/Toolbar'
import { PropertiesPanel } from '@/components/seats/PropertiesPanel'
import { FloorSelector } from '@/components/seats/FloorSelector'
import { FloorCreateDialog } from '@/components/seats/FloorCreateDialog'
import { Seat } from '@/types/seat'

export default function AdminSeatsPage() {
  const { getToken } = useAuth()
  const { seats, setSeats, selectedSeatIds, addSeat, deleteSeat } =
    useSeatStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [floors, setFloors] = useState<Floor[]>([])
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // 初期データの取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // フロア一覧を取得
        const floorsResponse = await floorApi.getAllFloors(getToken)
        setFloors(floorsResponse.floors)

        // 座席データを取得
        const seatsResponse = await seatApi.getSeats(getToken)
        setSeats(seatsResponse.seats)

        // フロア未設定の座席数を取得
        const unassignedResponse = await seatApi.getUnassignedSeats(getToken)
        setUnassignedCount(unassignedResponse.count)
      } catch (err: any) {
        setError(err.message || 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getToken, setSeats])

  // 新規座席追加
  const handleAddSeat = async () => {
    try {
      const newSeat: Omit<Seat, 'id' | 'created_at' | 'updated_at'> = {
        seat_number: `SEAT-${Date.now()}`,
        description: '',
        position_x: 100,
        position_y: 100,
        rotation_angle: 0,
        width: 100,
        height: 100,
        shape: 'rectangle',
        attributes: {},
        floor_id: selectedFloorId || undefined,
        is_active: true,
      }

      const createdSeat = await seatApi.createSeat(getToken, newSeat)
      addSeat(createdSeat)
    } catch (err: any) {
      alert(err.message || '座席の追加に失敗しました')
    }
  }

  // 座席削除
  const handleDelete = async () => {
    if (selectedSeatIds.length === 0) return

    if (!confirm('選択した座席を削除しますか？')) return

    try {
      for (const seatId of selectedSeatIds) {
        await seatApi.deleteSeat(getToken, seatId)
        deleteSeat(seatId)
      }
    } catch (err: any) {
      alert(err.message || '座席の削除に失敗しました')
    }
  }

  // フロア作成
  const handleCreateFloor = async (floorData: {
    name: string
    display_name?: string
    description?: string
    sort_order: number
    is_active: boolean
  }) => {
    try {
      const newFloor = await floorApi.createFloor(getToken, floorData)
      setFloors([...floors, newFloor])
    } catch (err: any) {
      throw err
    }
  }

  // 変更を保存
  const handleSave = async () => {
    try {
      setSaving(true)
      // 全座席の情報を更新
      for (const seat of seats) {
        await seatApi.updateSeat(getToken, seat.id, {
          seat_number: seat.seat_number,
          description: seat.description,
          position_x: seat.position_x,
          position_y: seat.position_y,
          rotation_angle: seat.rotation_angle,
          width: seat.width,
          height: seat.height,
          shape: seat.shape,
          attributes: seat.attributes,
          floor_id: seat.floor_id,
          is_active: seat.is_active,
        })
      }

      // フロア未設定座席数を再取得
      const unassignedResponse = await seatApi.getUnassignedSeats(getToken)
      setUnassignedCount(unassignedResponse.count)

      alert('変更を保存しました')
    } catch (err: any) {
      alert(err.message || '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 表示する座席をカウント（統計用）
  const displayedSeatsCount = selectedFloorId
    ? seats.filter((seat) => seat.floor_id === selectedFloorId).length
    : seats.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">座席配置管理</h1>
        <p className="text-gray-600">座席をドラッグして自由に配置できます</p>
      </div>

      {/* フロア未設定の警告 */}
      {unassignedCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">
                フロア未設定の座席が {unassignedCount} 件あります
              </p>
              <p className="text-sm text-amber-700 mt-1">
                座席を選択してプロパティパネルからフロアを設定してください
              </p>
            </div>
          </div>
        </div>
      )}

      <Toolbar
        onAddSeat={handleAddSeat}
        onSave={handleSave}
        onDelete={handleDelete}
        hasSelection={selectedSeatIds.length > 0}
        isSaving={saving}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* フロアセレクタ */}
        <div className="col-span-3">
          <FloorSelector
            floors={floors}
            selectedFloorId={selectedFloorId}
            onFloorSelect={setSelectedFloorId}
            onCreateFloor={() => setIsCreateDialogOpen(true)}
            showAll={true}
          />

          {/* 座席統計 */}
          <div className="bg-white rounded-lg shadow-md p-4 mt-4">
            <h3 className="font-semibold text-gray-900 mb-2">統計</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">全座席数:</span>
                <span className="font-medium">{seats.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">表示中:</span>
                <span className="font-medium">{displayedSeatsCount}</span>
              </div>
              {selectedFloorId && (
                <div className="flex justify-between text-blue-600">
                  <span>選択フロア:</span>
                  <span className="font-medium">
                    {floors.find((f) => f.id === selectedFloorId)
                      ?.display_name ||
                      floors.find((f) => f.id === selectedFloorId)?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 座席キャンバス */}
        <div className="col-span-6">
          <SeatCanvas filterFloorId={selectedFloorId} />
        </div>

        {/* プロパティパネル */}
        <div className="col-span-3">
          <PropertiesPanel
            selectedSeatId={selectedSeatIds[0] || null}
            floors={floors}
          />
        </div>
      </div>

      {/* フロア作成ダイアログ */}
      <FloorCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateFloor}
        maxSortOrder={
          floors.length > 0 ? Math.max(...floors.map((f) => f.sort_order)) : 0
        }
      />
    </div>
  )
}
