'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Seat } from '@/types/seat'
import { Reservation } from '@/types/reservation'
import { useSeatStore } from '@/lib/stores/seatStore'
import {
  CheckCircle,
  XCircle,
  MapPin,
  Tag,
  Calendar,
  Zap,
  Clock,
  AlertCircle,
} from 'lucide-react'
import CreateReservationDialog from '@/components/reservations/CreateReservationDialog'
import InstantReservationDialog from '@/components/reservations/InstantReservationDialog'
import QRCodeReservationModal from '@/components/reservations/QRCodeReservationModal'
import { useReservations, useVisibleReservations } from '@/hooks/useReservation'
import { reservationApi } from '@/lib/api/reservations'
import { getCurrentUser } from '@/lib/api/users'
import { checkFriendshipStatus, getFriends } from '@/lib/api/friends'
import {
  CreateReservationRequest,
  CreateInstantReservationRequest,
} from '@/types/reservation'
import { User } from '@/types/user'

interface SeatInfoPanelProps {
  selectedSeatId: string | null
  onReservationCreated?: () => void
}

export function SeatInfoPanel({
  selectedSeatId,
  onReservationCreated,
}: SeatInfoPanelProps) {
  const { getToken } = useAuth()
  const { seats } = useSeatStore()
  const { createReservation, createInstantReservation } = useReservations()
  const { fetchVisibleReservations } = useVisibleReservations()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [instantDialogOpen, setInstantDialogOpen] = useState(false)
  const [currentReservation, setCurrentReservation] =
    useState<Reservation | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isFriend, setIsFriend] = useState(false)
  const [userFriends, setUserFriends] = useState<User[]>([])
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrReservation, setQrReservation] = useState<Reservation | null>(null)

  const seat = seats.find((s) => s.id === selectedSeatId)

  // 現在のユーザー情報とフレンド一覧を取得
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const user = await getCurrentUser(getToken)
        setCurrentUser(user)

        // フレンド一覧を取得
        const friends = await getFriends(getToken)
        setUserFriends(friends)
      } catch (err) {
        console.error('ユーザー情報取得エラー:', err)
      }
    }

    loadUserInfo()
  }, [getToken])

  // 座席の現在の予約を取得（リフレッシュ可能）
  const fetchSeatReservation = async () => {
    if (!selectedSeatId || !getToken) {
      setCurrentReservation(null)
      setIsFriend(false)
      return
    }

    try {
      const data = await reservationApi.getVisibleReservations(getToken)
      const now = new Date()

      const reservation = data.find((r) => {
        // 座席IDが一致していない場合はスキップ
        if (r.seat_id !== selectedSeatId) return false

        // キャンセル済みや完了済みは表示しない
        if (r.status === 'cancelled' || r.status === 'completed') return false

        // in_use または reserved なら対象
        if (r.status === 'in_use' || r.status === 'reserved') return true

        return false
      })

      setCurrentReservation(reservation || null)

      // フレンド関係を確認
      if (reservation && reservation.user_id && currentUser) {
        const isFriendCheck = userFriends.some(
          (friend) => friend.id === reservation.user_id
        )
        setIsFriend(isFriendCheck)
      } else {
        setIsFriend(false)
      }
    } catch (err: any) {
      console.error('予約情報取得エラー:', err)
      setCurrentReservation(null)
      setIsFriend(false)
    }
  }

  // 選択された座席の現在の予約を取得
  useEffect(() => {
    fetchSeatReservation()
  }, [selectedSeatId, getToken, userFriends, currentUser])

  if (!seat) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">
          座席情報
        </h3>
        <div className="flex flex-col items-center justify-center py-8">
          <MapPin className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">座席を選択してください</p>
          <p className="text-gray-400 text-sm text-center mt-2">
            キャンバス上の座席をクリックすると
            <br />
            詳細情報を確認できます
          </p>
        </div>
      </div>
    )
  }

  // この座席が使用中か
  const isInUse =
    !!currentReservation &&
    (() => {
      // 明示的に使用中
      if (currentReservation.status === 'in_use') return true

      // 予約中だが時間的に使用中
      if (currentReservation.status === 'reserved') {
        const now = new Date()
        const start = new Date(currentReservation.start_time)
        const end = new Date(currentReservation.end_time)
        return start <= now && now < end
      }

      return false
    })()

  // 形状の日本語表示
  const shapeLabel = {
    rectangle: '長方形',
    circle: '円',
    square: '正方形',
    oval: '楕円',
  }[seat.shape]

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-3 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">
        座席情報
      </h3>

      {/* 座席番号 */}
      <div className="bg-gray-50 border border-blue-100 rounded-lg p-4 text-center">
        <div className="text-sm text-blue-600 mb-1">座席番号</div>
        <div className="text-xl font-normal text-blue-900">
          {seat.seat_number}
        </div>
      </div>

      {/* ステータス */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">ステータス</span>
        <div className="flex items-center gap-2">
          {seat.is_active ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-semibold text-green-700">
                利用可能
              </span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-700">
                利用不可
              </span>
            </>
          )}
        </div>
      </div>

      {/* 予約状態 */}
      {/*{currentReservation && (*/}
      {/*  <div className="py-2 border-b border-gray-200">*/}
      {/*    <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">*/}
      {/*      <Clock className="w-4 h-4" />*/}
      {/*      現在の予約状態*/}
      {/*    </div>*/}
      {/*    <div className="space-y-2">*/}
      {/*      <div className="flex items-center gap-2 text-sm">*/}
      {/*        {(() => {*/}
      {/*          // status が 'in_use' なら使用中*/}
      {/*          if (currentReservation.status === 'in_use') {*/}
      {/*            return (*/}
      {/*              <>*/}
      {/*                <AlertCircle className="w-4 h-4 text-orange-600" />*/}
      {/*                <span className="font-semibold text-orange-700">*/}
      {/*                  使用中*/}
      {/*                </span>*/}
      {/*              </>*/}
      {/*            )*/}
      {/*          }*/}

      {/*          // status が 'reserved' で開始時刻 <= 現在時刻 < 終了時刻 なら使用中*/}
      {/*          if (currentReservation.status === 'reserved') {*/}
      {/*            const now = new Date()*/}
      {/*            const startTime = new Date(currentReservation.start_time)*/}
      {/*            const endTime = new Date(currentReservation.end_time)*/}
      {/*            if (startTime <= now && now < endTime) {*/}
      {/*              return (*/}
      {/*                <>*/}
      {/*                  <AlertCircle className="w-4 h-4 text-orange-600" />*/}
      {/*                  <span className="font-semibold text-orange-700">*/}
      {/*                    使用中*/}
      {/*                  </span>*/}
      {/*                </>*/}
      {/*              )*/}
      {/*            }*/}
      {/*          }*/}

      {/*          // それ以外は予約済*/}
      {/*          return (*/}
      {/*            <>*/}
      {/*              <Calendar className="w-4 h-4 text-blue-600" />*/}
      {/*              <span className="font-semibold text-blue-700">予約済</span>*/}
      {/*            </>*/}
      {/*          )*/}
      {/*        })()}*/}
      {/*      </div>*/}
      {/*      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">*/}
      {/*        <div>*/}
      {/*          開始:{' '}*/}
      {/*          {new Date(currentReservation.start_time).toLocaleString(*/}
      {/*            'ja-JP'*/}
      {/*          )}*/}
      {/*        </div>*/}
      {/*        <div>*/}
      {/*          終了:{' '}*/}
      {/*          {new Date(currentReservation.end_time).toLocaleString('ja-JP')}*/}
      {/*        </div>*/}
      {/*      </div>*/}

      {/*      /!* 使用者情報（プライバシー設定に応じた表示制御） *!/*/}
      {/*      {currentReservation.user && (*/}
      {/*        <div className="mt-2 pt-2 border-t border-gray-200">*/}
      {/*          <div className="text-xs text-gray-600 mb-1">使用者</div>*/}
      {/*          {(() => {*/}
      {/*            const privacySetting =*/}
      {/*              currentReservation.privacy_setting ||*/}
      {/*              currentUser?.default_privacy_setting ||*/}
      {/*              'private'*/}
      {/*            const isOwnReservation =*/}
      {/*              currentReservation.user_id === currentUser?.id*/}

      {/*            // 自分の予約の場合は常に表示*/}
      {/*            if (isOwnReservation) {*/}
      {/*              return (*/}
      {/*                <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">*/}
      {/*                  {currentReservation.user.name} (自分)*/}
      {/*                </div>*/}
      {/*              )*/}
      {/*            }*/}

      {/*            // 公開の場合は全員に表示*/}
      {/*            if (privacySetting === 'public') {*/}
      {/*              return (*/}
      {/*                <div className="text-sm font-semibold text-gray-800 bg-green-50 px-2 py-1 rounded">*/}
      {/*                  {currentReservation.user.name}*/}
      {/*                </div>*/}
      {/*              )*/}
      {/*            }*/}

      {/*            // フレンドの場合、フレンド同士なら表示*/}
      {/*            if (privacySetting === 'friends') {*/}
      {/*              return (*/}
      {/*                <div*/}
      {/*                  className={`text-sm font-semibold px-2 py-1 rounded ${*/}
      {/*                    isFriend*/}
      {/*                      ? 'text-purple-700 bg-purple-50'*/}
      {/*                      : 'text-gray-600 bg-gray-50'*/}
      {/*                  }`}*/}
      {/*                >*/}
      {/*                  {isFriend*/}
      {/*                    ? `${currentReservation.user.name} (フレンド)`*/}
      {/*                    : 'フレンドの使用中'}*/}
      {/*                </div>*/}
      {/*              )*/}
      {/*            }*/}

      {/*            // プライベートの場合は名前を表示しない*/}
      {/*            return (*/}
      {/*              <div className="text-sm font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">*/}
      {/*                プライベートな予約*/}
      {/*              </div>*/}
      {/*            )*/}
      {/*          })()}*/}
      {/*        </div>*/}
      {/*      )}*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* 説明 */}
      {seat.description && (
        <div className="py-2 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-1">説明</div>
          <p className="text-sm text-gray-600">{seat.description}</p>
        </div>
      )}

      {/* 属性 */}
      {seat.attributes?.free_attributes &&
        seat.attributes.free_attributes.length > 0 && (
          <div className="py-2 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Tag className="w-4 h-4" />
              属性
            </div>
            <div className="flex flex-wrap gap-2">
              {seat.attributes.free_attributes.map(
                (attr: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200"
                  >
                    {attr}
                  </span>
                )
              )}
            </div>
          </div>
        )}

      {/* 詳細情報 */}
      <div className="py-2 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">詳細情報</div>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>形状:</span>
            <span className="font-medium">{shapeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>サイズ:</span>
            <span className="font-medium">
              {seat.width} × {seat.height} px
            </span>
          </div>
          <div className="flex justify-between">
            <span>角度:</span>
            <span className="font-medium">{seat.rotation_angle}°</span>
          </div>
        </div>
      </div>

      {/* 予約ボタン */}
      <div className="pt-2 space-y-2">
        <button
          disabled={!seat.is_active || isInUse}
          onClick={() => setInstantDialogOpen(true)}
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            !seat.is_active || isInUse
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          {!seat.is_active || isInUse ? '利用できません' : '今すぐ利用'}
        </button>

        <button
          disabled={!seat.is_active}
          onClick={() => setCreateDialogOpen(true)}
          className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            seat.is_active
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Calendar className="w-4 h-4" />
          {seat.is_active ? '日時を指定して予約' : '利用できません'}
        </button>
      </div>

      {/* 予約ダイアログ */}
      <InstantReservationDialog
        open={instantDialogOpen}
        onOpenChange={setInstantDialogOpen}
        onSuccess={async (reservation) => {
          // alert の代わりに QR モーダルを表示
          setQrReservation(reservation)
          setQrModalOpen(true)
          setInstantDialogOpen(false)
          // 予約情報を再フェッチして最新の状態を表示
          await fetchSeatReservation()
          onReservationCreated?.()
        }}
        onSubmit={async (data: CreateInstantReservationRequest) => {
          await createInstantReservation(data)
        }}
        defaultSeatId={seat.id}
      />

      <CreateReservationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={async (reservation) => {
          // alert の代わりに QR モーダルを表示
          setQrReservation(reservation)
          setQrModalOpen(true)
          setCreateDialogOpen(false)
          // 予約情報を再フェッチして最新の状態を表示
          await fetchSeatReservation()
          onReservationCreated?.()
        }}
        onSubmit={async (data: CreateReservationRequest) => {
          await createReservation(data)
        }}
        defaultSeatId={seat.id}
      />

      {/* QR コード表示モーダル */}
      <QRCodeReservationModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        reservation={qrReservation}
        context="creation"
      />
    </div>
  )
}
