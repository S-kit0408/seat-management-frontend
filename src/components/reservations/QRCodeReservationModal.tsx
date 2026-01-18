'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, QrCode, MapPin, Clock } from 'lucide-react'
import { Reservation } from '@/types/reservation'

interface QRCodeReservationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation: Reservation | null
  context?: 'creation' | 'checkin' | 'checkout' | 'detail'
  onAction?: () => Promise<void>
}

export default function QRCodeReservationModal({
  open,
  onOpenChange,
  reservation,
  context = 'detail',
  onAction,
}: QRCodeReservationModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!reservation) {
    console.log('[QRCodeReservationModal] Reservation is null - returning')
    return null
  }

  console.log(`[QRCodeReservationModal] Rendering - open: ${open}, context: ${context}, onAction: ${onAction ? 'defined' : 'undefined'}`)
  console.log(`[QRCodeReservationModal] Reservation ID: ${reservation.id}`)

  const qrValue = `RES:${reservation.id}`

  const getInstructions = () => {
    switch (context) {
      case 'creation':
        return 'この QR コードを保存し、入室時にスキャンしてください。'
      case 'checkin':
        return 'この QR コードを入口でスキャンしてチェックインしてください。'
      case 'checkout':
        return 'この QR コードを出口でスキャンしてチェックアウトしてください。'
      default:
        return 'この QR コードを入退室時にスキャンしてください。'
    }
  }

  const handleAction = async () => {
    if (!onAction) return
    setIsLoading(true)
    try {
      await onAction()
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-2xl font-bold flex items-center gap-2">
              <QrCode className="w-6 h-6 text-indigo-600" />
              予約 QR コード
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

          {/* 説明文 */}
          <Dialog.Description className="text-sm text-gray-600 mb-6">
            {getInstructions()}
          </Dialog.Description>

          {/* QR コード */}
          <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-lg border-2 border-gray-200 mb-6">
            <QRCodeSVG
              value={qrValue}
              size={256}
              level="M"
              includeMargin={true}
            />
            <p className="text-xs text-gray-500 mt-4">
              予約ID: {reservation.id.slice(0, 8)}...
            </p>
          </div>

          {/* 予約情報 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                座席
              </span>
              <span className="font-semibold text-gray-900">
                {reservation.seat?.seat_number || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                開始
              </span>
              <span className="text-sm text-gray-900">
                {formatDateTime(reservation.start_time)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                終了
              </span>
              <span className="text-sm text-gray-900">
                {formatDateTime(reservation.end_time)}
              </span>
            </div>
          </div>

          {/* アクション */}
          {context === 'creation' || context === 'detail' ? (
            // 作成後または詳細表示時は「閉じる」ボタンのみ
            <Dialog.Close asChild>
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                閉じる
              </button>
            </Dialog.Close>
          ) : (
            // チェックイン/チェックアウト時は「実行」ボタン
            <div className="space-y-2">
              <button
                onClick={handleAction}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? '処理中...'
                  : context === 'checkin'
                    ? 'チェックインを実行'
                    : 'チェックアウトを実行'}
              </button>
              <Dialog.Close asChild>
                <button className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors">
                  キャンセル
                </button>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
