'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { User, UserRole } from '@/types/user'
import { getAllUsers, updateUserRole, deleteUser } from '@/lib/api/admin'
import {
  Users,
  Mail,
  Calendar,
  Shield,
  Edit,
  Trash2,
  Search,
} from 'lucide-react'

export default function AdminUsersPage() {
  const { getToken } = useAuth()
  const { isLoaded, user: clerkUser } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('user')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      if (!token) {
        throw new Error('認証トークンが取得できませんでした')
      }

      const data = await getAllUsers(getToken)
      setUsers(data)
      setFilteredUsers(data)
    } catch (err: any) {
      console.error('ユーザー一覧取得エラー:', err)
      setError(err.message || 'ユーザー一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Clerkのユーザー情報がロードされるまで待機
    if (!isLoaded || !clerkUser) {
      return
    }

    fetchUsers()
  }, [isLoaded, clerkUser?.id, getToken])

  // 検索フィルター
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, users])

  // ロール更新処理
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, { role: newRole }, getToken)
      // ユーザー一覧を再取得
      await fetchUsers()
      setEditingUserId(null)
    } catch (err: any) {
      alert(err.message || 'ロールの更新に失敗しました')
    }
  }

  // ユーザー削除処理
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `本当に「${userName}」を削除しますか？\nこの操作は取り消せません。`
      )
    ) {
      return
    }

    try {
      await deleteUser(userId, getToken)
      // ユーザー一覧を再取得
      await fetchUsers()
    } catch (err: any) {
      alert(err.message || 'ユーザーの削除に失敗しました')
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'moderator':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '管理者'
      case 'moderator':
        return 'モデレーター'
      default:
        return '一般ユーザー'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <h2 className="font-bold mb-2">エラーが発生しました</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ユーザー管理</h2>
          <p className="text-gray-600 mt-1">
            全ユーザーの一覧と権限管理
          </p>
        </div>
        <div className="bg-purple-100 px-4 py-2 rounded-lg">
          <p className="text-sm text-purple-700 font-medium">
            総ユーザー数: {users.length}
          </p>
        </div>
      </div>

      {/* 検索バー */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="名前またはメールアドレスで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* ユーザーテーブル */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ロール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  {/* ユーザー情報 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* メール */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </div>
                  </td>

                  {/* ロール */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={(e) =>
                            setSelectedRole(e.target.value as UserRole)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="user">一般ユーザー</option>
                          <option value="moderator">モデレーター</option>
                          <option value="admin">管理者</option>
                        </select>
                        <button
                          onClick={() =>
                            handleUpdateRole(user.id, selectedRole)
                          }
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    )}
                  </td>

                  {/* 登録日 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(user.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </td>

                  {/* 操作ボタン */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUserId(user.id)
                          setSelectedRole(user.role)
                        }}
                        className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded"
                        title="ロールを編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                        title="ユーザーを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 検索結果が0件の場合 */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery
                ? '該当するユーザーが見つかりませんでした'
                : 'ユーザーが登録されていません'}
            </p>
          </div>
        )}
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-700 font-medium">管理者</p>
              <p className="text-2xl font-bold text-purple-900">
                {users.filter((u) => u.role === 'admin').length}人
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-700 font-medium">
                モデレーター
              </p>
              <p className="text-2xl font-bold text-green-900">
                {users.filter((u) => u.role === 'moderator').length}人
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-700 font-medium">
                一般ユーザー
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === 'user').length}人
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
