'use client'

import { useState, useEffect } from 'react'
import { useFriendRequests } from '@/hooks/useFriends'
import { searchUsersByName } from '@/lib/api/friends'
import { useAuth } from '@clerk/nextjs'
import { User } from '@/types/user'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search, Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SendRequestDialog({ open, onOpenChange }: Props) {
  const { sendRequest } = useFriendRequests()
  const { getToken } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)

  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 検索処理（デバウンス付き）
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      setError(null)
      try {
        const results = await searchUsersByName(searchQuery, getToken)
        setSearchResults(results)
      } catch (err: any) {
        console.error('検索エラー:', err)
        setError(err.message)
      } finally {
        setSearching(false)
      }
    }, 300) // 300ms のデバウンス

    return () => clearTimeout(timer)
  }, [searchQuery, getToken])

  // ユーザーを選択
  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setSearchQuery('') // 検索欄をクリア
    setSearchResults([]) // 検索結果を非表示
  }

  // 選択解除
  const handleDeselectUser = () => {
    setSelectedUser(null)
  }

  // 申請送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) {
      setError('ユーザーを選択してください')
      return
    }

    setError(null)
    setSending(true)

    try {
      await sendRequest({
        addressee_name: selectedUser.name,
        message,
      })

      // 成功したらリセット
      setSelectedUser(null)
      setMessage('')
      setSearchQuery('')
      onOpenChange(false)
      alert('フレンド申請を送信しました')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  // ダイアログを閉じる時にリセット
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
      setMessage('')
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold">
              フレンド申請を送信
            </Dialog.Title>
            <Dialog.Close className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* ユーザー検索または選択済みユーザー表示 */}
              {!selectedUser ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ユーザーを検索
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="名前で検索..."
                      autoFocus
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {/* 検索結果 */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {user.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 &&
                    !searching &&
                    searchResults.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500 text-center py-3">
                        ユーザーが見つかりませんでした
                      </p>
                    )}

                  <p className="mt-2 text-xs text-gray-500">
                    ※ 2文字以上入力すると検索されます
                  </p>
                </div>
              ) : (
                /* 選択済みユーザー表示 */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    送信先
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {selectedUser.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {selectedUser.name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeselectUser}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* メッセージ入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メッセージ (任意)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="よろしくお願いします!"
                  disabled={!selectedUser}
                />
              </div>

              {/* エラー表示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* ボタン */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending || !selectedUser}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '送信中...' : '送信'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
