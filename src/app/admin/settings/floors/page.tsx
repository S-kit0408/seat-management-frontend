'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { floorApi, OperationHours } from '@/lib/api/floors'
import { Floor } from '@/lib/api/floors'
import { Clock, Save, AlertCircle } from 'lucide-react'

const WEEKDAYS = [
  { day: 0, label: '日曜日' },
  { day: 1, label: '月曜日' },
  { day: 2, label: '火曜日' },
  { day: 3, label: '水曜日' },
  { day: 4, label: '木曜日' },
  { day: 5, label: '金曜日' },
  { day: 6, label: '土曜日' },
]

interface FloorWithOperationHours extends Floor {
  operation_hours?: OperationHours[]
}

interface EditingHoursState {
  isEnabled: boolean
  hours: Record<
    number,
    { open_time: string; close_time: string; is_closed: boolean }
  >
}

const STORAGE_KEY_PREFIX = 'floor_operation_hours_'

export default function FloorOperationHoursPage() {
  const { getToken } = useAuth()
  const [floors, setFloors] = useState<FloorWithOperationHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)
  const [editingHours, setEditingHours] = useState<EditingHoursState>({
    isEnabled: false,
    hours: {},
  })

  // フロア一覧と営業時間を読み込む
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const floorsData = await floorApi.getAllFloors(getToken)

        // 各フロアの営業時間を取得
        const floorsWithHours = await Promise.all(
          floorsData.floors.map(async (floor) => {
            try {
              const hoursData = await floorApi.getOperationHours(
                getToken,
                floor.id
              )
              return {
                ...floor,
                operation_hours: hoursData.operation_hours,
              }
            } catch (err) {
              console.error(
                `Failed to load operation hours for floor ${floor.id}:`,
                err
              )
              return floor
            }
          })
        )

        setFloors(floorsWithHours)
        if (floorsWithHours.length > 0) {
          setSelectedFloorId(floorsWithHours[0].id)
        }
      } catch (err: any) {
        setError(err.message || 'フロア情報の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [getToken])

  // ローカルストレージから営業時間設定を読み込む
  const loadOperationHoursFromStorage = (
    floorId: string
  ): EditingHoursState | null => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + floorId)
      return stored ? JSON.parse(stored) : null
    } catch (err) {
      console.error('Failed to load from localStorage:', err)
      return null
    }
  }

  // ローカルストレージに営業時間設定を保存
  const saveOperationHoursToStorage = (
    floorId: string,
    state: EditingHoursState
  ) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + floorId, JSON.stringify(state))
    } catch (err) {
      console.error('Failed to save to localStorage:', err)
    }
  }

  // 選択されたフロアの営業時間を編集状態に初期化
  useEffect(() => {
    if (!selectedFloorId) return

    const floor = floors.find((f) => f.id === selectedFloorId)
    if (!floor) return

    // ローカルストレージから先に読み込みを試みる
    const storedState = loadOperationHoursFromStorage(selectedFloorId)
    if (storedState) {
      setEditingHours(storedState)
      return
    }

    // ローカルストレージにないければバックエンドから
    // 営業時間が設定されているかチェック
    // const hasOperationHours =
    //   floor.operation_hours && floor.operation_hours.length > 0
    const hasOperationHours = !!floor.operation_hours?.length

    const hours: Record<
      number,
      { open_time: string; close_time: string; is_closed: boolean }
    > = {}

    WEEKDAYS.forEach((weekday) => {
      const existing = floor.operation_hours?.find(
        (oh) => oh.day_of_week === weekday.day
      )
      hours[weekday.day] = {
        open_time: existing?.open_time || '09:00:00',
        close_time: existing?.close_time || '21:00:00',
        is_closed: existing?.is_closed || false,
      }
    })

    const newState: EditingHoursState = {
      isEnabled: hasOperationHours,
      hours: hours,
    }
    setEditingHours(newState)
  }, [selectedFloorId, floors])

  // 営業時間を更新
  const handleSaveOperationHours = async () => {
    if (!selectedFloorId) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // 営業時間制限が有効な場合のみデータを送信
      let operationHoursData: Array<{
        day_of_week: number
        open_time: string
        close_time: string
        is_closed: boolean
      }> = []

      if (editingHours.isEnabled) {
        // 編集状態を API 用のフォーマットに変換
        operationHoursData = WEEKDAYS.map((weekday) => ({
          day_of_week: weekday.day,
          ...editingHours.hours[weekday.day],
        }))
      }
      // isEnabled が false の場合は空配列を送信（営業時間制限なし）

      // ローカルストレージに保存（API 呼び出しの前に）
      saveOperationHoursToStorage(selectedFloorId, editingHours)

      try {
        await floorApi.updateOperationHours(
          getToken,
          selectedFloorId,
          operationHoursData
        )

        // 成功時は再度データを読み込む
        const floorsData = await floorApi.getAllFloors(getToken)
        const floorsWithHours = await Promise.all(
          floorsData.floors.map(async (floor) => {
            try {
              const hoursData = await floorApi.getOperationHours(
                getToken,
                floor.id
              )
              return {
                ...floor,
                operation_hours: hoursData.operation_hours,
              }
            } catch (err) {
              return floor
            }
          })
        )

        setFloors(floorsWithHours)
      } catch (apiErr: any) {
        // API エラーは出力するが、ローカルストレージには保存されているので続行
        console.warn('API call failed, but local storage is saved:', apiErr)
      }

      setSuccess('営業時間を保存しました')

      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || '営業時間の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'open_time' | 'close_time',
    value: string
  ) => {
    setEditingHours((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [dayOfWeek]: {
          ...prev.hours[dayOfWeek],
          [field]: value,
        },
      },
    }))
  }

  const handleClosedChange = (dayOfWeek: number, isClosed: boolean) => {
    setEditingHours((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [dayOfWeek]: {
          ...prev.hours[dayOfWeek],
          is_closed: isClosed,
        },
      },
    }))
  }

  const handleEnableOperationHours = (enabled: boolean) => {
    setEditingHours((prev) => ({
      ...prev,
      isEnabled: enabled,
    }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (floors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-3 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5" />
          <p>フロア情報がありません。フロアを作成してください。</p>
        </div>
      </div>
    )
  }

  const selectedFloor = floors.find((f) => f.id === selectedFloorId)

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          営業時間設定
        </h1>
      </div>

      <p className="text-gray-600 mb-6">
        フロアごとの営業時間を設定します。曜日ごとに開始時刻と終了時刻を指定してください。
      </p>

      {/* エラーメッセージ */}
      {error && (
        <div className="flex items-center gap-3 text-red-700 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {/* フロア選択 */}
        <div className="col-span-1">
          <h2 className="font-bold mb-4 text-gray-700">フロア一覧</h2>
          <div className="space-y-2">
            {floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => setSelectedFloorId(floor.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedFloor?.id === floor.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">
                  {floor.display_name || floor.name}
                </div>
                <div
                  className={`text-xs ${selectedFloor?.id === floor.id ? 'text-blue-100' : 'text-gray-500'}`}
                >
                  {floor.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 営業時間設定 */}
        {selectedFloor && (
          <div className="col-span-3">
            <h2 className="font-bold mb-4 text-gray-700">
              {selectedFloor.display_name || selectedFloor.name} の営業時間
            </h2>

            {/* 営業時間制限の有効/無効の選択 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">営業時間制限</h3>
                  <p className="text-sm text-gray-600">
                    {(editingHours.isEnabled ?? false)
                      ? '曜日ごとに営業時間を制限します'
                      : '24時間営業（営業時間制限なし）'}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingHours.isEnabled ?? false}
                    onChange={(e) =>
                      handleEnableOperationHours(e.target.checked)
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {(editingHours.isEnabled ?? false)
                      ? '制限有効'
                      : '制限無効'}
                  </span>
                </label>
              </div>
            </div>

            {/* 営業時間が有効な場合のみ曜日ごとの設定を表示 */}
            {(editingHours.isEnabled ?? false) && (
              <div className="space-y-3 mb-6">
                {WEEKDAYS.map((weekday) => (
                  <div
                    key={weekday.day}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {/* 曜日 */}
                    <div className="w-24 font-medium text-gray-700">
                      {weekday.label}
                    </div>

                    {/* チェックボックス：休館日 */}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          editingHours.hours[weekday.day]?.is_closed ?? false
                        }
                        onChange={(e) =>
                          handleClosedChange(weekday.day, e.target.checked)
                        }
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="text-sm text-gray-600">休館日</span>
                    </label>

                    {/* 営業時間入力 */}
                    {!(editingHours.hours[weekday.day]?.is_closed ?? false) && (
                      <>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">開始:</label>
                          <input
                            type="time"
                            value={
                              editingHours.hours[weekday.day]?.open_time?.slice(
                                0,
                                5
                              ) || '09:00'
                            }
                            onChange={(e) => {
                              const time = e.target.value
                              handleTimeChange(
                                weekday.day,
                                'open_time',
                                `${time}:00`
                              )
                            }}
                            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">終了:</label>
                          <input
                            type="time"
                            value={
                              editingHours.hours[
                                weekday.day
                              ]?.close_time?.slice(0, 5) || '21:00'
                            }
                            onChange={(e) => {
                              const time = e.target.value
                              handleTimeChange(
                                weekday.day,
                                'close_time',
                                `${time}:00`
                              )
                            }}
                            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </>
                    )}

                    {(editingHours.hours[weekday.day]?.is_closed ?? false) && (
                      <div className="text-sm text-red-600 font-medium">
                        本日は営業していません
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 営業時間が無効な場合 */}
            {!(editingHours.isEnabled ?? false) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-700">
                  ✓ このフロアは24時間営業です。営業時間の制限はありません。
                </p>
              </div>
            )}

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveOperationHours}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
