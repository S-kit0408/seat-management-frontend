'use client'

import { ReservationStatus } from '@/types/reservation'

interface Props {
  status: ReservationStatus
  className?: string
}

// 予約ステータスを色付きバッジで表示するコンポーネント
export default function ReservationStatusBadge({
  status,
  className = '',
}: Props) {
  const getStatusConfig = (status: ReservationStatus) => {
    switch (status) {
      case 'reserved':
        return {
          label: '予約済',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
        }
      case 'in_use':
        return {
          label: '使用中',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
        }
      case 'completed':
        return {
          label: '完了',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
        }
      case 'cancelled':
        return {
          label: 'キャンセル',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
        }
      case 'no_show':
        return {
          label: '無断欠席',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200',
        }
      default:
        return {
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor}
   ${config.borderColor} ${className}`}
    >
      {config.label}
    </span>
  )
}
