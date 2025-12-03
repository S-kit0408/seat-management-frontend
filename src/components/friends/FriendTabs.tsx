'use client'

import { Inbox, Send } from 'lucide-react'

interface Props {
  activeTab: 'received' | 'sent'
  receivedCount: number
  sentCount: number
  onTabChange: (tab: 'received' | 'sent') => void
}

export default function FriendTabs({
  activeTab,
  receivedCount,
  sentCount,
  onTabChange,
}: Props) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex">
        <button
          onClick={() => onTabChange('received')}
          className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'received'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Inbox className="w-4 h-4 inline mr-2" />
          ×áW_3Ë ({receivedCount})
        </button>
        <button
          onClick={() => onTabChange('sent')}
          className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sent'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          áW_3Ë ({sentCount})
        </button>
      </div>
    </div>
  )
}
