'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Calendar, MapPin, AlertCircle } from 'lucide-react'
import { CreateReservationRequest } from '@/types/reservation'
import { PrivacySetting } from '@/types/user'
import { floorApi, OperationHours } from '@/lib/api/floors'
import { seatApi } from '@/lib/api/seats'

// バリデーションスキーマ
const reservationSchema = z
  .object({
    seat_id: z
      .string()
      .min(1, '座席IDは必須です')
      .length(26, '座席IDは26文字のULIDである必要があります'),
    start_time: z.string().min(1, '開始日時は必須です'),
    end_time: z.string().min(1, '終了日時は必須です'),
    privacy_setting: z.enum(['public', 'private', 'friends']).optional(),
    notes: z
      .string()
      .max(500, 'メモは500文字以内で入力してください')
      .optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_time)
      const end = new Date(data.end_time)
      return end > start
    },
    {
      message: '終了日時は開始日時より後である必要があります',
      path: ['end_time'],
    }
  )

type ReservationFormData = z.infer<typeof reservationSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (reservation: any) => void
  onSubmit: (data: CreateReservationRequest) => Promise<void>
  defaultSeatId?: string
}

// 通常予約作成ダイアログコンポーネント
export default function CreateReservationDialog({
  open,
  onOpenChange,
  onSuccess,
  onSubmit,
  defaultSeatId = '',
}: Props) {
  const { getToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [floorId, setFloorId] = useState<string | null>(null)
  const [operationHours, setOperationHours] = useState<OperationHours[]>([])
  const [isLoadingOperationHours, setIsLoadingOperationHours] = useState(false)
  const [selectedStartTime, setSelectedStartTime] = useState<string>('')
  const [operationHoursWarning, setOperationHoursWarning] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      seat_id: defaultSeatId,
      start_time: '',
      end_time: '',
      privacy_setting: undefined,
      notes: '',
    },
  })

  // エラーメッセージを解析・カスタマイズ
  const formatErrorMessage = (errorMessage: string): string => {
    // 営業時間関連のエラーをチェック
    if (
      errorMessage.includes('休館日') ||
      errorMessage.includes('ErrFloorClosed')
    ) {
      return '指定された日時はフロアが休館日です。別の日付をお選びください。'
    }
    if (
      errorMessage.includes('営業時間外') ||
      errorMessage.includes('ErrOutsideOperatingHours')
    ) {
      return '指定された時刻は営業時間外です。営業時間内の時刻をお選びください。'
    }
    return errorMessage
  }

  // フォーム送信処理
  const handleFormSubmit = async (data: ReservationFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // datetime-local形式からISO 8601形式に変換
      const startDate = new Date(data.start_time)
      const endDate = new Date(data.end_time)

      const requestData: CreateReservationRequest = {
        seat_id: data.seat_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        ...(data.privacy_setting && { privacy_setting: data.privacy_setting }),
      }

      // notesが空文字列でない場合のみ追加
      if (data.notes && data.notes.trim() !== '') {
        requestData.notes = data.notes.trim()
      }

      // デバッグログ
      console.log('[CreateReservationDialog] Form data:', {
        form_privacy_setting: data.privacy_setting,
        request_privacy_setting: requestData.privacy_setting,
        requestData: requestData,
      })

      const reservation = await onSubmit(requestData)
      reset()
      // ダイアログを閉じる前にonSuccessコールバックを呼び出す
      onSuccess(reservation)
      onOpenChange(false)
    } catch (err: any) {
      const errorMsg = err.message || '予約の作成に失敗しました'
      setError(formatErrorMessage(errorMsg))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 営業時間を読み込む
  useEffect(() => {
    if (!open || !defaultSeatId || isLoadingOperationHours) {
      return
    }

    const loadOperationHours = async () => {
      try {
        setIsLoadingOperationHours(true)
        const token = await getToken()
        if (!token) return

        // 座席情報を取得してフロアIDを得る
        const seat = await seatApi.getSeat(getToken, defaultSeatId)
        if (!seat.floor_id) {
          setFloorId(null)
          setOperationHours([])
          return
        }

        setFloorId(seat.floor_id)

        // フロアの営業時間を取得
        const result = await floorApi.getOperationHours(getToken, seat.floor_id)
        setOperationHours(result.operation_hours || [])
      } catch (err) {
        console.error('Failed to load operation hours:', err)
        // エラーがあっても予約フォームは表示し続ける
        setOperationHours([])
      } finally {
        setIsLoadingOperationHours(false)
      }
    }

    loadOperationHours()
  }, [open, defaultSeatId, getToken, isLoadingOperationHours])

  // 選択された日時が営業時間内かチェック
  const checkOperationHours = (startTimeStr: string) => {
    setOperationHoursWarning(null)

    if (!startTimeStr || !operationHours || operationHours.length === 0) {
      return
    }

    try {
      const startDate = new Date(startTimeStr)
      const dayOfWeek = startDate.getDay()

      const dayHours = operationHours.find((oh) => oh.day_of_week === dayOfWeek)

      if (!dayHours) {
        setOperationHoursWarning('指定された曜日の営業時間情報が見つかりません')
        return
      }

      if (dayHours.is_closed) {
        setOperationHoursWarning('本日は営業していないため、予約できません')
        return
      }

      // 選択された時刻を HH:MM:SS に変換
      const hours = String(startDate.getHours()).padStart(2, '0')
      const minutes = String(startDate.getMinutes()).padStart(2, '0')
      const seconds = '00'
      const selectedTime = `${hours}:${minutes}:${seconds}`

      // 営業時間内かチェック
      if (selectedTime < dayHours.open_time || selectedTime >= dayHours.close_time) {
        setOperationHoursWarning(
          `営業時間外です。営業時間は ${dayHours.open_time.slice(0, 5)} ～ ${dayHours.close_time.slice(0, 5)} です`
        )
        return
      }
    } catch (err) {
      console.error('Error checking operation hours:', err)
    }
  }

  // ダイアログを閉じる際にフォームをリセット
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
      setOperationHoursWarning(null)
      setFloorId(null)
      setOperationHours([])
      setSelectedStartTime('')
    }
    onOpenChange(newOpen)
  }

  // 現在時刻を "YYYY-MM-DDTHH:mm" 形式で取得（datetime-local用）
  const getCurrentDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  // 営業時間を表示用に フォーマット
  const getOperationHoursDisplay = () => {
    if (operationHours.length === 0) {
      return null
    }

    const today = new Date().getDay()
    const todayHours = operationHours.find((oh) => oh.day_of_week === today)

    if (!todayHours) {
      return null
    }

    if (todayHours.is_closed) {
      return <span className="text-red-600">本日は営業していません</span>
    }

    return (
      <span className="text-green-600">
        本日の営業時間: {todayHours.open_time.slice(0, 5)} ～{' '}
        {todayHours.close_time.slice(0, 5)}
      </span>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        <Dialog.Content className="text-gray-600 fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              予約作成
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
            座席を指定して予約を作成します
          </Dialog.Description>

          {/* 営業時間表示 */}
          {getOperationHoursDisplay() && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm">{getOperationHoursDisplay()}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* 座席ID */}
            <div>
              <label
                htmlFor="seat_id"
                className="block text-sm font-medium mb-1"
              >
                <MapPin className="w-4 h-4 inline mr-1" />
                座席ID <span className="text-red-500">*</span>
              </label>
              <input
                id="seat_id"
                type="text"
                {...register('seat_id')}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.seat_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.seat_id.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                26文字のULID形式の座席IDを入力してください
              </p>
            </div>

            {/* 開始日時 */}
            <div>
              <label
                htmlFor="start_time"
                className="block text-sm font-medium mb-1"
              >
                開始日時 <span className="text-red-500">*</span>
              </label>
              <input
                id="start_time"
                type="datetime-local"
                {...register('start_time', {
                  onChange: (e) => {
                    setSelectedStartTime(e.target.value)
                    checkOperationHours(e.target.value)
                  },
                })}
                min={getCurrentDateTime()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.start_time && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.start_time.message}
                </p>
              )}
              {operationHoursWarning && (
                <div className="flex items-start gap-2 mt-2 text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{operationHoursWarning}</p>
                </div>
              )}
            </div>

            {/* 終了日時 */}
            <div>
              <label
                htmlFor="end_time"
                className="block text-sm font-medium mb-1"
              >
                終了日時 <span className="text-red-500">*</span>
              </label>
              <input
                id="end_time"
                type="datetime-local"
                {...register('end_time')}
                min={getCurrentDateTime()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.end_time && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.end_time.message}
                </p>
              )}
            </div>

            {/* プライバシー設定（オプション） */}
            <div>
              <label
                htmlFor="privacy_setting"
                className="block text-sm font-medium mb-1"
              >
                プライバシー設定
              </label>
              <select
                id="privacy_setting"
                {...register('privacy_setting', {
                  setValueAs: (v) => (v === '' ? undefined : v),
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">デフォルト設定を使用</option>
                <option value="public">公開</option>
                <option value="friends">フレンドのみ</option>
                <option value="private">非公開</option>
              </select>
              {errors.privacy_setting && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.privacy_setting.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                空欄の場合、アカウントのデフォルト設定が適用されます
              </p>
            </div>

            {/* メモ（オプション） */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                メモ
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                placeholder="予約に関するメモを入力できます（任意）"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {errors.notes && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* ボタン */}
            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '作成中...' : '予約を作成'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
