'use client'

import { User } from '@/types/user'
import FriendCard from './FriendCard'
import { Users } from 'lucide-react'

interface Props {
  friends: User[]
  onRemove: (friendId: string) => Promise<void>
  onAddClick: () => void
}

export default function FriendListView({
  friends,
  onRemove,
  onAddClick,
}: Props) {
  if (friends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ~`����LD~[�
        </h3>
        <p className="text-gray-600 mb-4">
          ���ɒ��Wf������q	W~W�F
        </p>
        <button
          onClick={onAddClick}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          ���ɒ��
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {friends.map((friend) => (
        <FriendCard key={friend.id} friend={friend} onRemove={onRemove} />
      ))}
    </div>
  )
}
