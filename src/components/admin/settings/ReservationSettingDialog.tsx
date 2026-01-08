'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Settings } from 'lucide-react'
import {
  ReservationSettings,
  CreateReservationSettingsRequest,
} from '@/types/reservationSettings'

// バリデーションスキーマ
const reservationSettingSchema = z
  .object({
    description: z
      .string()
      .max(500, '説明は500文字以内で入力してください')
      .optional(),

    // チェックイン制限
    check_in_minutes_before_start: z
      .number()
      .int('整数で入力してください')
      .min(0, '0分以上で入力してください')
      .max(1440, '1440分以下で入力してください'),
    check_in_grace_period_minutes: z
      .number()
      .int('整数で入力してください')
      .min(0, '0分以上で入力してください')
      .max(1440, '1440分以下で入力してください'),

    // 予約時間制限
    min_reservation_minutes: z
      .number()
      .int('整数で入力してください')
      .min(15, '15分以上で入力してください')
      .max(1440, '1440分以下で入力してください'),
    max_reservation_minutes: z
      .number()
      .int('整数で入力してください')
      .min(30, '30分以上で入力してください')
      .max(1440, '1440分以下で入力してください'),
    max_advance_booking_days: z
      .number()
      .int('整数で入力してください')
      .min(1, '1日以上で入力してください')
      .max(90, '90日以下で入力してください'),

    // キャンセル・延長ルール
    cancellation_deadline_minutes: z
      .number()
      .int('整数で入力してください')
      .min(0, '0分以上で入力してください')
      .max(1440, '1440分以下で入力してください'),
    max_extension_minutes: z
      .number()
      .int('整数で入力してください')
      .min(15, '15分以上で入力してください')
      .max(1440, '1440分以下で入力してください'),
    max_extension_count: z
      .number()
      .int('整数で入力してください')
      .min(0, '0回以上で入力してください')
      .max(10, '10回以下で入力してください'),
    allow_instant_reservation: z.boolean(),
  })
  .refine(
    (data) => data.min_reservation_minutes <= data.max_reservation_minutes,
    {
      message: '最小予約時間は最大予約時間以下である必要があります',
      path: ['max_reservation_minutes'],
    }
  )

type ReservationSettingFormData = z.infer<typeof reservationSettingSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (setting: ReservationSettings) => void
  onSubmit: (data: CreateReservationSettingsRequest) => Promise<void>
  editingSettings?: ReservationSettings | null
}

export default function ReservationSettingDialog({
  open,
  onOpenChange,
  onSuccess,
  onSubmit,
  editingSettings,
}: Props) {
  const { getToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReservationSettingFormData>({
    resolver: zodResolver(reservationSettingSchema),
    defaultValues: editingSettings
      ? {
          description: editingSettings.description,
          check_in_minutes_before_start:
            editingSettings.check_in_minutes_before_start,
          check_in_grace_period_minutes:
            editingSettings.check_in_grace_period_minutes,
          min_reservation_minutes:
            editingSettings.min_reservation_minutes,
          max_reservation_minutes:
            editingSettings.max_reservation_minutes,
          max_advance_booking_days:
            editingSettings.max_advance_booking_days,
          cancellation_deadline_minutes:
            editingSettings.cancellation_deadline_minutes,
          max_extension_minutes: editingSettings.max_extension_minutes,
          max_extension_count: editingSettings.max_extension_count,
          allow_instant_reservation:
            editingSettings.allow_instant_reservation,
        }
      : {
          description: '',
          check_in_minutes_before_start: 15,
          check_in_grace_period_minutes: 15,
          min_reservation_minutes: 30,
          max_reservation_minutes: 480,
          max_advance_booking_days: 14,
          cancellation_deadline_minutes: 60,
          max_extension_minutes: 120,
          max_extension_count: 2,
          allow_instant_reservation: true,
        },
  })

  const minReservation = watch('min_reservation_minutes')
  const maxReservation = watch('max_reservation_minutes')

  // フォーム送信処理
  const handleFormSubmit = async (
    data: ReservationSettingFormData
  ) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const requestData: CreateReservationSettingsRequest = {
        description: data.description || undefined,
        check_in_minutes_before_start: data.check_in_minutes_before_start,
        check_in_grace_period_minutes: data.check_in_grace_period_minutes,
        min_reservation_minutes: data.min_reservation_minutes,
        max_reservation_minutes: data.max_reservation_minutes,
        max_advance_booking_days: data.max_advance_booking_days,
        cancellation_deadline_minutes: data.cancellation_deadline_minutes,
        max_extension_minutes: data.max_extension_minutes,
        max_extension_count: data.max_extension_count,
        allow_instant_reservation: data.allow_instant_reservation,
        is_active: editingSettings ? editingSettings.is_active : false,
      }

      console.log('[Dialog] handleFormSubmit - requestData:', requestData)
      await onSubmit(requestData)
      reset()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || '予約設定の保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ダイアログを閉じる際にフォームをリセット
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        <Dialog.Content className="text-gray-600 fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              {editingSettings ? '予約設定を編集' : '新しい予約設定を作成'}
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
            システムの予約ルールを設定します
          </Dialog.Description>

          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            {/* 説明 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                説明（設定の用途や特徴）
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={2}
                placeholder="例：デフォルト設定、週末用設定など"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* チェックイン制限 */}
            <fieldset className="border border-gray-200 rounded-lg p-4">
              <legend className="text-sm font-semibold text-gray-900 mb-3">
                チェックイン制限
              </legend>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="check_in_minutes_before_start"
                      className="block text-sm font-medium mb-1"
                    >
                      チェックイン可能時間（分前）
                    </label>
                    <input
                      id="check_in_minutes_before_start"
                      type="number"
                      {...register('check_in_minutes_before_start', {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.check_in_minutes_before_start && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.check_in_minutes_before_start.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="check_in_grace_period_minutes"
                      className="block text-sm font-medium mb-1"
                    >
                      チェックイン猶予時間（分）
                    </label>
                    <input
                      id="check_in_grace_period_minutes"
                      type="number"
                      {...register('check_in_grace_period_minutes', {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.check_in_grace_period_minutes && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.check_in_grace_period_minutes.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </fieldset>

            {/* 予約時間制限 */}
            <fieldset className="border border-gray-200 rounded-lg p-4">
              <legend className="text-sm font-semibold text-gray-900 mb-3">
                予約時間制限
              </legend>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="min_reservation_minutes"
                      className="block text-sm font-medium mb-1"
                    >
                      最小予約時間（分）
                    </label>
                    <input
                      id="min_reservation_minutes"
                      type="number"
                      {...register('min_reservation_minutes', {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.min_reservation_minutes && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.min_reservation_minutes.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="max_reservation_minutes"
                      className="block text-sm font-medium mb-1"
                    >
                      最大予約時間（分）
                    </label>
                    <input
                      id="max_reservation_minutes"
                      type="number"
                      {...register('max_reservation_minutes', {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.max_reservation_minutes && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.max_reservation_minutes.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  予約時間の範囲: {minReservation}分 ～ {maxReservation}分
                </div>

                <div>
                  <label
                    htmlFor="max_advance_booking_days"
                    className="block text-sm font-medium mb-1"
                  >
                    最大事前予約日数（日）
                  </label>
                  <input
                    id="max_advance_booking_days"
                    type="number"
                    {...register('max_advance_booking_days', {
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.max_advance_booking_days && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.max_advance_booking_days.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* キャンセル・延長ルール */}
            <fieldset className="border border-gray-200 rounded-lg p-4">
              <legend className="text-sm font-semibold text-gray-900 mb-3">
                キャンセル・延長ルール
              </legend>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="cancellation_deadline_minutes"
                    className="block text-sm font-medium mb-1"
                  >
                    キャンセル期限（分前）
                  </label>
                  <input
                    id="cancellation_deadline_minutes"
                    type="number"
                    {...register('cancellation_deadline_minutes', {
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.cancellation_deadline_minutes && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cancellation_deadline_minutes.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="max_extension_minutes"
                      className="block text-sm font-medium mb-1"
                    >
                      最大延長時間/回（分）
                    </label>
                    <input
                      id="max_extension_minutes"
                      type="number"
                      {...register('max_extension_minutes', {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.max_extension_minutes && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.max_extension_minutes.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="max_extension_count"
                      className="block text-sm font-medium mb-1"
                    >
                      最大延長回数（回）
                    </label>
                    <input
                      id="max_extension_count"
                      type="number"
                      {...register('max_extension_count', {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.max_extension_count && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.max_extension_count.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="allow_instant_reservation"
                    type="checkbox"
                    {...register('allow_instant_reservation')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label
                    htmlFor="allow_instant_reservation"
                    className="text-sm font-medium text-gray-900"
                  >
                    即時予約を許可する
                  </label>
                </div>
              </div>
            </fieldset>

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
                {isSubmitting
                  ? '保存中...'
                  : editingSettings
                    ? '更新する'
                    : '作成する'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
