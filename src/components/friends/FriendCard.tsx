'use client'

import { User } from '@/types/user'
import { UserMinus } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  friend: User
  onRemove: (friendId: string) => Promise<void>
}

export default function FriendCard({ friend, onRemove }: Props) {
  const router = useRouter()
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!confirm(`${friend.name}をフレンドから削除しますか?`)) return

    setRemoving(true)
    try {
      await onRemove(friend.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push(`/friends/${friend.id}`)}
          className="flex-1 text-left"
        >
          <div className="flex items-center gap-3">
            {friend.avatar_url ? (
              <img
                src={friend.avatar_url}
                alt={friend.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium text-lg">
                  {friend.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{friend.name}</h3>
              <p className="text-sm text-gray-600">{friend.email}</p>
            </div>
          </div>
        </button>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
          title="フレンド解除"
        >
          <UserMinus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
