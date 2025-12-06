'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  Edit,
  UserCog,
  KeyRound,
} from 'lucide-react'
import { User } from '@/types/user'
import { getCurrentUser } from '@/lib/api/users'
import ProfileEditDialog from '@/components/profile/ProfileEditDialog'

const privacyMap = {
  public: '公開',
  friends: 'フレンドのみ',
  private: '非公開',
}

const roleMap = {
  user: '一般ユーザー',
  admin: '管理者',
  moderator: 'モデレーター',
}

const authProviderMap = {
  email: 'メールアドレス',
  google: 'googleアカウント',
  unknown: '不明',
}

export default function ProfilePage() {
  const { getToken, signOut } = useAuth()
  const { user: clerkUser, isLoaded } = useUser()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // ユーザー情報を取得
  const fetchUser = async () => {
    console.log('🔄 fetchUser開始')
    setLoading(true)
    setError(null)

    try {
      console.log('Clerkユーザー情報:', clerkUser)
      console.log('トークン取得中...')

      const token = await getToken()
      console.log('トークン取得成功:', token ? 'あり' : 'なし')

      if (!token) {
        throw new Error('認証トークンが取得できませんでした')
      }

      console.log('API呼び出し中...')
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)

      const data = await getCurrentUser(getToken)
      console.log('ユーザー情報取得成功:', data)

      setUser(data)
    } catch (err: any) {
      console.error('エラー発生:', err)
      console.error('エラーメッセージ:', err.message)
      console.error('エラー詳細:', err)
      setError(err.message || 'ユーザー情報の取得に失敗しました')
    } finally {
      setLoading(false)
      console.log('fetchUser完了')
    }
  }

  useEffect(() => {
    console.log('ProfilePage マウント', { isLoaded, clerkUser: !!clerkUser })

    // Clerkのユーザー情報がロードされるまで待機
    if (!isLoaded || !clerkUser) {
      return
    }

    fetchUser()
  }, [isLoaded, clerkUser?.id, getToken])

  const handleUpdateSuccess = (updatedUser: User) => {
    console.log('プロフィール更新成功:', updatedUser)
    setUser(updatedUser)
  }

  console.log('現在の状態:', { loading, error, user })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-2">読み込み中...</div>
          <div className="text-sm text-gray-500">
            コンソールを確認してください（F12）
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="font-bold mb-2">エラーが発生しました</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchUser}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              再試行
            </button>
          </div>

          {/* デバッグ情報 */}
          <div className="mt-4 bg-gray-100 p-4 rounded text-xs">
            <p className="font-bold mb-2">デバッグ情報:</p>
            <p>API URL: {process.env.NEXT_PUBLIC_API_URL || '未設定'}</p>
            <p>Clerkユーザー: {clerkUser?.id || 'なし'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg">
          <p>ユーザー情報が見つかりません</p>
          <button
            onClick={fetchUser}
            className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  const provider =
    user.primary_auth_provider &&
    authProviderMap[user.primary_auth_provider as keyof typeof authProviderMap]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-gray-600 text-3xl font-bold text-gray-900">
            プロフィール
          </h1>
          <p className="text-gray-600 mt-1">あなたのアカウント情報</p>
        </div>

        {/* プロフィールカード */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* アバター＆基本情報 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
            <div className="flex items-center gap-6">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border border-white object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border border-white bg-white flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              </div>
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                編集
              </button>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  メールアドレス
                </p>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserCog className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  ユーザー権限
                </p>
                <p className="text-gray-900">{roleMap[user.role]}</p>
                <p className="text-xs text-gray-400 mt-1">
                  権限により操作できる機能が異なります
                </p>
              </div>
            </div>

            {/* 認証方式（primary_auth_provider） */}
            <div className="flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">認証方式</p>
                <p className="text-gray-900">{provider ?? '不明'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  このアカウントのログイン方法
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  デフォルトプライバシー設定
                </p>
                <p className="text-gray-900">
                  {privacyMap[user.default_privacy_setting]}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  座席予約時のデフォルト設定
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  アカウント作成日
                </p>
                <p className="text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">最終更新日</p>
                <p className="text-gray-900">
                  {new Date(user.updated_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Clerk情報 */}
          {/*<div className="bg-gray-50 px-6 py-4 border-t border-gray-200">*/}
          {/*  <p className="text-gray-500 ">デバッグ用</p>*/}
          {/*  <p className="text-xs text-gray-500">*/}
          {/*    Clerk ID:{' '}*/}
          {/*    <code className="bg-gray-200 px-2 py-1 rounded">*/}
          {/*      {user.clerk_user_id}*/}
          {/*    </code>*/}
          {/*  </p>*/}
          {/*  <p className="text-xs text-gray-500 mt-1">*/}
          {/*    ユーザーID:{' '}*/}
          {/*    <code className="bg-gray-200 px-2 py-1 rounded">{user.id}</code>*/}
          {/*  </p>*/}
          {/*</div>*/}
        </div>
      </div>

      {/* 編集ダイアログ */}
      {user && (
        <ProfileEditDialog
          user={user}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  )
}
