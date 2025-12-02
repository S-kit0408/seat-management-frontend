'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { User, UpdateProfileRequest } from '@/types/user'
import { updateCurrentUser } from '@/lib/api/users'

const profileSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください'),
  avatar_url: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  default_privacy_setting: z.enum(['public', 'private', 'friends']),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (updatedUser: User) => void
}

export default function ProfileEditDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ProfileEditDialogProps) {
  const { getToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    // 修正: user が存在しない場合のデフォルト値を設定
    defaultValues: {
      name: user?.name || '',
      avatar_url: user?.avatar_url || '',
      default_privacy_setting: user?.default_privacy_setting || 'private',
    },
  })

  // 修正: user が変更されたとき、またはダイアログが開いたときにフォームをリセット
  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name,
        avatar_url: user.avatar_url || '',
        default_privacy_setting: user.default_privacy_setting,
      })
    }
  }, [open, user, reset])

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const updateData: UpdateProfileRequest = {
        name: data.name,
        avatar_url: data.avatar_url || undefined,
        default_privacy_setting: data.default_privacy_setting,
      }

      const updatedUser = await updateCurrentUser(updateData, getToken)
      onSuccess(updatedUser)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'プロフィールの更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 修正: user が存在しない場合は何も表示しない
  if (!user) {
    return null
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        <Dialog.Content className="text-gray-600 fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-2xl font-bold">
              プロフィール編集
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
            プロフィール情報を編集できます
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 名前 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* アバターURL */}
            <div>
              <label
                htmlFor="avatar_url"
                className="block text-sm font-medium mb-1"
              >
                アバターURL
              </label>
              <input
                id="avatar_url"
                type="text"
                {...register('avatar_url')}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.avatar_url && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.avatar_url.message}
                </p>
              )}
            </div>

            {/* プライバシー設定 */}
            <div>
              <label
                htmlFor="privacy"
                className="block text-sm font-medium mb-1"
              >
                デフォルトプライバシー設定{' '}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="privacy"
                {...register('default_privacy_setting')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">公開</option>
                <option value="friends">フレンドのみ</option>
                <option value="private">非公開</option>
              </select>
              {errors.default_privacy_setting && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.default_privacy_setting.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                座席予約時のデフォルトプライバシー設定
              </p>
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
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
