'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Zap, MapPin, Clock, AlertCircle } from 'lucide-react'
import { CreateInstantReservationRequest } from '@/types/reservation'
import { floorApi, OperationHours } from '@/lib/api/floors'
import { seatApi } from '@/lib/api/seats'

// バリデーションスキーマ
const instantReservationSchema = z.object({
  seat_id: z
    .string()
    .min(1, '座席IDは必須です')
    .length(26, '座席IDは26文字のULIDである必要があります'),

  duration_minutes: z
    .number({ message: '利用時間は数値で入力してください' })
    .min(15, '利用時間は15分以上である必要があります')
    .max(720, '利用時間は12時間（720分）以内である必要があります'),
  notes: z.string().max(500, 'メモは500文字以内で入力してください').optional(),
})

type InstantReservationFormData = z.infer<typeof instantReservationSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (reservation: any) => void
  onSubmit: (data: CreateInstantReservationRequest) => Promise<void>
  defaultSeatId?: string
}

// 即時予約作成ダイアログコンポーネント 現在時刻から指定時間分の予約を作成
export default function InstantReservationDialog({
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
  const [operationHoursWarning, setOperationHoursWarning] = useState<
    string | null
  >(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<InstantReservationFormData>({
    resolver: zodResolver(instantReservationSchema),
    defaultValues: {
      seat_id: defaultSeatId,
      duration_minutes: 120, // デフォルト2時間
      notes: '',
    },
  })

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
        const hours = result.operation_hours || []
        setOperationHours(hours)
        // 初期状態で営業時間チェック
        checkOperationHours(hours, durationMinutes)
      } catch (err) {
        console.error('Failed to load operation hours:', err)
        setOperationHours([])
      } finally {
        setIsLoadingOperationHours(false)
      }
    }

    loadOperationHours()
  }, [open, defaultSeatId, getToken, isLoadingOperationHours])

  // 利用時間を監視して終了時刻を表示
  const durationMinutes = watch('duration_minutes')

  // 営業時間チェック（利用時間が変更されたときに呼び出される）
  useEffect(() => {
    if (operationHours && operationHours.length > 0 && durationMinutes) {
      checkOperationHours(operationHours, durationMinutes)
    }
  }, [durationMinutes, operationHours])

  // 営業時間チェック関数
  const checkOperationHours = (
    hours: OperationHours[],
    durationMinutes: number
  ) => {
    setOperationHoursWarning(null)

    if (!durationMinutes || !hours || hours.length === 0) {
      return
    }

    try {
      const now = new Date()
      const dayOfWeek = now.getDay()

      const dayHours = hours.find((oh) => oh.day_of_week === dayOfWeek)

      if (!dayHours) {
        setOperationHoursWarning('本日の営業時間情報が見つかりません')
        return
      }

      if (dayHours.is_closed) {
        setOperationHoursWarning(
          '本日は営業していないため、即時予約はできません'
        )
        return
      }

      // 現在時刻を HH:MM:SS に変換
      const currentHours = String(now.getHours()).padStart(2, '0')
      const currentMinutes = String(now.getMinutes()).padStart(2, '0')
      const currentSeconds = '00'
      const currentTime = `${currentHours}:${currentMinutes}:${currentSeconds}`

      // 現在時刻が営業時間外かチェック
      if (
        currentTime < dayHours.open_time ||
        currentTime >= dayHours.close_time
      ) {
        setOperationHoursWarning(
          `現在は営業時間外です。営業時間は ${dayHours.open_time.slice(0, 5)} ～ ${dayHours.close_time.slice(0, 5)} です`
        )
        return
      }

      // 終了時刻が営業時間内かチェック
      const endTime = new Date(now.getTime() + durationMinutes * 60000)
      const endHours = String(endTime.getHours()).padStart(2, '0')
      const endMinutes = String(endTime.getMinutes()).padStart(2, '0')
      const endSeconds = '00'
      const endTimeStr = `${endHours}:${endMinutes}:${endSeconds}`

      // 営業終了時刻と同じか、それより後ろの場合はエラー（バックエンドと同じロジック）
      if (endTimeStr >= dayHours.close_time) {
        setOperationHoursWarning(
          `指定された利用時間では営業時間を超えます。営業時間終了は ${dayHours.close_time.slice(0, 5)} です`
        )
        return
      }
    } catch (err) {
      console.error('Error checking operation hours:', err)
    }
  }

  // 終了時刻を計算
  const getEndTime = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return ''
    const endTime = new Date()
    endTime.setMinutes(endTime.getMinutes() + minutes)
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    }).format(endTime)
  }

  // エラーメッセージを解析・カスタマイズ
  const formatErrorMessage = (errorMessage: string): string => {
    // 営業時間関連のエラーをチェック
    if (
      errorMessage.includes('休館日') ||
      errorMessage.includes('ErrFloorClosed')
    ) {
      return '本日はフロアが休館日のため、即時予約はできません。別の日にお試しください。'
    }
    if (
      errorMessage.includes('営業時間外') ||
      errorMessage.includes('ErrOutsideOperatingHours')
    ) {
      return '現在は営業時間外です。または指定された利用時間では営業時間を超えてしまいます。営業時間内でのご予約をお願いします。'
    }
    return errorMessage
  }

  // フォーム送信処理
  const handleFormSubmit = async (data: InstantReservationFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const requestData: CreateInstantReservationRequest = {
        seat_id: data.seat_id,
        duration_minutes: data.duration_minutes,
        // 座席の使用状況は全員が知る必要があるため、デフォルトは「公開」
        privacy_setting: 'public',
      }

      // デバッグログ
      console.log('[InstantReservationDialog] Instant reservation request:', {
        request_privacy_setting: requestData.privacy_setting,
        requestData: requestData,
      })

      const reservation = await onSubmit(requestData)
      reset()
      // ダイアログを閉じる前にonSuccessコールバックを呼び出す
      onSuccess(reservation)
      onOpenChange(false)
    } catch (err: any) {
      const errorMsg = err.message || '即時予約の作成に失敗しました'
      setError(formatErrorMessage(errorMsg))
    } finally {
      setIsSubmitting(false)
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
    }
    onOpenChange(newOpen)
  }

  // よく使う時間のプリセット
  const presetDurations = [
    { label: '30分', value: 30 },
    { label: '1時間', value: 60 },
    { label: '2時間', value: 120 },
    { label: '3時間', value: 180 },
    { label: '4時間', value: 240 },
  ]

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        <Dialog.Content className="text-gray-600 fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              即時利用
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
            今すぐ座席を予約・利用します。開始時刻は現在時刻になります。
          </Dialog.Description>

          {/* 営業時間警告 */}
          {operationHoursWarning && (
            <div className="flex items-start gap-2 mb-4 text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{operationHoursWarning}</p>
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
                placeholder="01HXXX1234567890ABCDEFGHIJ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.seat_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.seat_id.message}
                </p>
              )}
            </div>

            {/* 利用時間プリセット */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                利用時間（クイック選択）
              </label>
              <div className="grid grid-cols-3 gap-2">
                {presetDurations.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setValue('duration_minutes', preset.value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 利用時間（分） */}
            <div>
              <label
                htmlFor="duration_minutes"
                className="block text-sm font-medium mb-1"
              >
                利用時間（分） <span className="text-red-500">*</span>
              </label>
              <input
                id="duration_minutes"
                type="number"
                {...register('duration_minutes', { valueAsNumber: true })}
                min={15}
                max={720}
                step={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.duration_minutes && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.duration_minutes.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                15分〜720分（12時間）の範囲で指定してください
              </p>
            </div>

            {/* 予約終了時刻のプレビュー */}
            {durationMinutes && !isNaN(durationMinutes) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <Clock className="w-4 h-4 inline mr-1" />
                  予約終了時刻:{' '}
                  <span className="font-semibold">
                    {getEndTime(durationMinutes)}
                  </span>
                </p>
              </div>
            )}

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
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {isSubmitting ? '作成中...' : '即時利用'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
