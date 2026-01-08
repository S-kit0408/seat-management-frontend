'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Settings, Plus, AlertCircle } from 'lucide-react'
import { reservationSettingsApi } from '@/lib/api/reservationSettings'
import {
  ReservationSettings,
  CreateReservationSettingsRequest,
} from '@/types/reservationSettings'
import ReservationSettingDialog from '@/components/admin/settings/ReservationSettingDialog'
import { ReservationSettingsTable } from '@/components/admin/settings/ReservationSettingsTable'
import { ReservationSettingCard } from '@/components/admin/settings/ReservationSettingCard'

export default function ReservationSettingsPage() {
  const { getToken } = useAuth()
  const [settings, setSettings] = useState<ReservationSettings[]>([])
  const [activeSettings, setActiveSettings] =
    useState<ReservationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogState, setDialogState] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    editingSettings?: ReservationSettings | null
  }>({ open: false, mode: 'create' })

  // 設定一覧を取得
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reservationSettingsApi.getAllSettings(getToken)
      setSettings(data)

      // アクティブな設定を抽出
      const active = data.find((s) => s.is_active)
      setActiveSettings(active || null)
    } catch (err: any) {
      console.error('設定取得エラー:', err)
      setError(
        err.message || '予約設定の取得に失敗しました'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [getToken])

  // 新規作成ボタンをクリック
  const handleCreate = () => {
    setDialogState({ open: true, mode: 'create' })
  }

  // 編集ボタンをクリック
  const handleEdit = (setting: ReservationSettings) => {
    setDialogState({
      open: true,
      mode: 'edit',
      editingSettings: setting,
    })
  }

  // ダイアログの送信処理
  const handleDialogSubmit = async (
    data: CreateReservationSettingsRequest
  ) => {
    try {
      if (dialogState.mode === 'create') {
        await reservationSettingsApi.createSettings(getToken, data)
        alert('予約設定を作成しました')
      } else if (
        dialogState.mode === 'edit' &&
        dialogState.editingSettings
      ) {
        await reservationSettingsApi.updateSettings(
          getToken,
          dialogState.editingSettings.id,
          data
        )
        alert('予約設定を更新しました')
      }

      // 設定一覧を再取得
      await fetchSettings()
      setDialogState({ open: false, mode: 'create' })
    } catch (err: any) {
      throw err
    }
  }

  // 設定を有効化
  const handleActivate = async (id: string) => {
    const setting = settings.find((s) => s.id === id)
    if (
      !confirm(
        `「${setting?.description || '無名の設定'}」を有効化しますか？\n他の設定は自動的に無効化されます。`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      await reservationSettingsApi.activateSettings(getToken, id)
      alert('予約設定を有効化しました')
      await fetchSettings()
    } catch (err: any) {
      alert(
        err.message || '予約設定の有効化に失敗しました'
      )
    } finally {
      setLoading(false)
    }
  }

  // 設定を削除
  const handleDelete = async (id: string) => {
    const setting = settings.find((s) => s.id === id)
    if (
      !confirm(
        `本当に「${setting?.description || '無名の設定'}」を削除しますか？\nこの操作は取り消せません。`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      await reservationSettingsApi.deleteSettings(getToken, id)
      alert('予約設定を削除しました')
      await fetchSettings()
    } catch (err: any) {
      alert(
        err.message || '予約設定の削除に失敗しました'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading && settings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            予約設定管理
          </h1>
        </div>
        <p className="text-gray-600">
          システム全体の予約ルール（チェックイン、予約時間制限、延長ルール）を管理します。
          常に1つの設定がアクティブ（有効）な状態です。
        </p>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* アクティブな設定 */}
      <ReservationSettingCard setting={activeSettings} />

      {/* 新規作成ボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold shadow-md"
        >
          <Plus className="w-5 h-5" />
          新しい予約設定を作成
        </button>
      </div>

      {/* 設定一覧 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          全予約設定一覧
        </h2>
        <ReservationSettingsTable
          settings={settings}
          onEdit={handleEdit}
          onActivate={handleActivate}
          onDelete={handleDelete}
        />
      </div>

      {/* ダイアログ */}
      <ReservationSettingDialog
        open={dialogState.open}
        onOpenChange={(open) =>
          setDialogState((prev) => ({ ...prev, open }))
        }
        onSuccess={() => {
          // 成功時の処理は handleDialogSubmit で行われる
        }}
        onSubmit={handleDialogSubmit}
        editingSettings={dialogState.editingSettings || null}
      />
    </div>
  )
}
