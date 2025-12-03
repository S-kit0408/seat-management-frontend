'use client'

import { FriendRequest } from '@/types/friend'
import { Check, X, Clock } from 'lucide-react'
import { useState } from 'react'

interface Props {
  request: FriendRequest
  type: 'received' | 'sent'
  onAccept?: (requestId: string) => Promise<void>
  onReject?: (requestId: string) => Promise<void>
  onCancel?: (requestId: string) => Promise<void>
}

export default function FriendRequestCard({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
}: Props) {
  const [processing, setProcessing] = useState(false)
  const user = type === 'received' ? request.requester : request.addressee

  const handleAccept = async () => {
    if (!onAccept) return
    setProcessing(true)
    try {
      await onAccept(request.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return
    setProcessing(true)
    try {
      await onReject(request.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!onCancel) return
    if (!confirm('申請をキャンセルしますか?')) return

    setProcessing(true)
    try {
      await onCancel(request.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {user?.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{user?.name}</h4>
          {request.message && (
            <p className="text-sm text-gray-600 mt-1">{request.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(request.updated_at).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {type === 'received' ? (
          <>
            <button
              onClick={handleAccept}
              disabled={processing}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              承認
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              拒否
            </button>
          </>
        ) : (
          <button
            onClick={handleCancel}
            disabled={processing}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 disabled:opacity-50 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            キャンセル
          </button>
        )}
      </div>
    </div>
  )
}
