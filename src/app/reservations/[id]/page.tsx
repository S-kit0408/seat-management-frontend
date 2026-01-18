'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useReservations, useReservation } from '@/hooks/useReservation'
import ReservationStatusBadge from '@/components/reservations/ReservationStatusBadge'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Tag,
  FileText,
  AlertCircle,
  QrCode,
} from 'lucide-react'
import { Reservation } from '@/types/reservation'
import QRCodeReservationModal from '@/components/reservations/QRCodeReservationModal'

export default function ReservationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reservationId = params.id as string

  const { reservation, loading, error, fetchReservation } = useReservation()
  const { checkin, checkout, cancel, extend } = useReservations()

  const [actionLoading, setActionLoading] = useState(false)
  const [extendMinutes, setExtendMinutes] = useState(30)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrAction, setQrAction] = useState<'checkin' | 'checkout' | null>(null)

  useEffect(() => {
    if (reservationId) {
      fetchReservation(reservationId)
    }
  }, [reservationId, fetchReservation])

  // Render時にデバッグログを出力
  useEffect(() => {
    console.log(
      '[ReservationDetailPage] Render - reservation status:',
      reservation?.status
    )
    console.log('[ReservationDetailPage] showQRModal:', showQRModal)
    console.log('[ReservationDetailPage] qrAction:', qrAction)
  }, [reservation?.status, showQRModal, qrAction])

  // 日時フォーマット
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    }).format(date)
  }

  // 利用時間を計算（分）
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return hours > 0
      ? `${hours}時間${minutes > 0 ? minutes + '分' : ''}`
      : `${minutes}分`
  }

  // QRコード下のボタン押下時にチェックイン実行
  const handleQRCheckinAction = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      await checkin(reservation.id)
      alert('チェックインしました')
      setShowQRModal(false)
      setQrAction(null)
      fetchReservation(reservationId)
    } catch (err: any) {
      alert(err.message)
      setActionLoading(false)
    }
  }

  // QRコード下のボタン押下時にチェックアウト実行
  const handleQRCheckoutAction = async () => {
    if (!reservation) return
    setActionLoading(true)
    try {
      await checkout(reservation.id)
      alert('チェックアウトしました')
      setShowQRModal(false)
      setQrAction(null)
      fetchReservation(reservationId)
    } catch (err: any) {
      alert(err.message)
      setActionLoading(false)
    }
  }

  // キャンセルハンドラー
  const handleCancel = async () => {
    if (!reservation) return

    setActionLoading(true)
    try {
      await cancel(reservation.id, cancelReason || undefined)
      alert('予約をキャンセルしました')
      setShowCancelDialog(false)
      fetchReservation(reservationId)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // 延長ハンドラー
  const handleExtend = async () => {
    if (!reservation) return

    setActionLoading(true)
    try {
      await extend(reservation.id, extendMinutes)
      alert(`予約を${extendMinutes}分延長しました`)
      setShowExtendDialog(false)
      fetchReservation(reservationId)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // 予約タイプの日本語表示
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'instant':
        return '即時予約'
      case 'scheduled':
        return '通常予約'
      case 'recurring':
        return '定期予約'
      default:
        return type
    }
  }

  // ローディング
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">予約情報を読み込んでいます...</div>
        </div>
      </div>
    )
  }

  // エラーまたは予約が見つからない
  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error || '予約が見つかりません'}
          </div>
          <button
            onClick={() => router.push('/reservations')}
            className="mt-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            予約一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 戻るボタン */}
        <button
          onClick={() => router.push('/reservations')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          予約一覧に戻る
        </button>

        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-7 h-7 text-blue-600" />
                予約詳細
              </h1>
              <p className="text-gray-600 mt-1">
                予約ID: {reservation.id.slice(0, 8)}...
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ReservationStatusBadge status={reservation.status} />
              <span className="text-sm text-gray-500">
                {getTypeLabel(reservation.type)}
              </span>
            </div>
          </div>
        </div>

        {/* 座席情報 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            座席情報
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">座席番号</span>
              <span className="font-semibold text-gray-900">
                {reservation.seat?.seat_number ||
                  `座席 ${reservation.seat_id.slice(0, 8)}`}
              </span>
            </div>
            {reservation.seat?.description && (
              <div className="flex items-start justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">説明</span>
                <span className="text-gray-900 text-right max-w-xs">
                  {reservation.seat.description}
                </span>
              </div>
            )}
            {reservation.seat?.attributes?.free_attributes &&
              reservation.seat.attributes.free_attributes.length > 0 && (
                <div className="py-2">
                  <span className="text-gray-600 flex items-center gap-1 mb-2">
                    <Tag className="w-4 h-4" />
                    属性
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {reservation.seat.attributes.free_attributes.map(
                      (attr: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                        >
                          {attr}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* 予約日時 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            予約日時
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">開始日時</span>
              <span className="font-semibold text-gray-900">
                {formatDateTime(reservation.start_time)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">終了日時</span>
              <span className="font-semibold text-gray-900">
                {formatDateTime(reservation.end_time)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">利用時間</span>
              <span className="font-semibold text-blue-600">
                {calculateDuration(
                  reservation.start_time,
                  reservation.end_time
                )}
              </span>
            </div>
          </div>
        </div>

        {/* チェックイン情報 */}
        {(reservation.checked_in_at ||
          reservation.checked_out_at ||
          reservation.extension_count > 0) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              チェックイン情報
            </h2>
            <div className="space-y-3">
              {reservation.checked_in_at && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">チェックイン</span>
                  <span className="font-semibold text-gray-900">
                    {formatDateTime(reservation.checked_in_at)}
                  </span>
                </div>
              )}
              {reservation.checked_out_at && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">チェックアウト</span>
                  <span className="font-semibold text-gray-900">
                    {formatDateTime(reservation.checked_out_at)}
                  </span>
                </div>
              )}
              {reservation.extension_count > 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">延長回数</span>
                  <span className="font-semibold text-orange-600">
                    {reservation.extension_count}回
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* メモ */}
        {reservation.notes && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              メモ
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {reservation.notes}
            </p>
          </div>
        )}

        {/* キャンセル情報 */}
        {reservation.status === 'cancelled' && reservation.cancelled_at && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-red-900 flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5" />
              キャンセル情報
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-red-700">キャンセル日時</span>
                <span className="font-semibold text-red-900">
                  {formatDateTime(reservation.cancelled_at)}
                </span>
              </div>
              {reservation.cancellation_reason && (
                <div className="mt-3">
                  <span className="text-red-700 block mb-1">
                    キャンセル理由
                  </span>
                  <p className="text-red-900 bg-white p-3 rounded">
                    {reservation.cancellation_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        {(reservation.status === 'reserved' ||
          reservation.status === 'in_use') && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">アクション</h2>
            {/* デバッグ情報 */}
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
              Status: {reservation.status} | showQRModal: {String(showQRModal)}{' '}
              | qrAction: {qrAction || 'null'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* QR コード表示ボタン */}
              {/*<button*/}
              {/*  onClick={() => {*/}
              {/*    console.log('[QR Display Button] Clicked')*/}
              {/*    setQrAction(null)*/}
              {/*    setShowQRModal(true)*/}
              {/*  }}*/}
              {/*  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"*/}
              {/*>*/}
              {/*  <QrCode className="w-5 h-5" />*/}
              {/*  QRコードを表示*/}
              {/*</button>*/}

              {reservation.status === 'reserved' && (
                <button
                  onClick={() => {
                    console.log(
                      '[Checkin Button] Clicked - setting state to checkin'
                    )
                    setQrAction('checkin')
                    setShowQRModal(true)
                  }}
                  disabled={actionLoading}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  チェックイン
                </button>
              )}

              {reservation.status === 'in_use' && (
                <>
                  <button
                    onClick={() => {
                      console.log(
                        '[Checkout Button] Clicked - setting state to checkout'
                      )
                      setQrAction('checkout')
                      setShowQRModal(true)
                    }}
                    disabled={actionLoading}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    チェックアウト
                  </button>

                  <button
                    onClick={() => setShowExtendDialog(true)}
                    disabled={actionLoading}
                    className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    延長
                  </button>
                </>
              )}

              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={actionLoading}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 延長ダイアログ */}
        {showExtendDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                予約を延長
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  延長時間（分）
                </label>
                <input
                  type="number"
                  value={extendMinutes}
                  onChange={(e) => setExtendMinutes(Number(e.target.value))}
                  min={15}
                  max={240}
                  step={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  15分〜240分（4時間）の範囲で指定してください
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExtendDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleExtend}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:bg-gray-400"
                >
                  {actionLoading ? '延長中...' : '延長する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* キャンセルダイアログ */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                予約をキャンセル
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  キャンセル理由（任意）
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="キャンセルの理由を入力できます"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  この操作は取り消せません。本当にキャンセルしますか？
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
                >
                  戻る
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:bg-gray-400"
                >
                  {actionLoading ? 'キャンセル中...' : 'キャンセルする'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR コード表示モーダル */}
        {reservation && (
          <QRCodeReservationModal
            open={showQRModal}
            onOpenChange={setShowQRModal}
            reservation={reservation}
            context={qrAction || 'detail'}
            onAction={
              qrAction === 'checkin'
                ? handleQRCheckinAction
                : qrAction === 'checkout'
                  ? handleQRCheckoutAction
                  : undefined
            }
          />
        )}

        {/* メタ情報 */}
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>作成日時: {formatDateTime(reservation.created_at)}</span>
            <span>更新日時: {formatDateTime(reservation.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
