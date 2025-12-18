'use client'

import { useEffect, useState } from 'react'
import { Calendar, Zap, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useReservations } from '@/hooks/useReservation'
import ReservationCard from '@/components/reservations/ReservationCard'
import CreateReservationDialog from '@/components/reservations/CreateReservationDialog'
import InstantReservationDialog from '@/components/reservations/InstantReservationDialog'
import {
  CreateReservationRequest,
  CreateInstantReservationRequest,
} from '@/types/reservation'

export default function ReservationsPage() {
  const {
    reservations,
    activeReservations,
    loading,
    error,
    fetchMyReservations,
    fetchActiveReservations,
    createReservation,
    createInstantReservation,
    checkin,
    checkout,
    cancel,
  } = useReservations()

  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [instantDialogOpen, setInstantDialogOpen] = useState(false)

  useEffect(() => {
    fetchMyReservations()
    fetchActiveReservations()
  }, [fetchMyReservations, fetchActiveReservations])

  // アクションハンドラー
  const handleCheckin = async (id: string) => {
    try {
      await checkin(id)
      alert('チェックインしました')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleCheckout = async (id: string) => {
    try {
      await checkout(id)
      alert('チェックアウトしました')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('この予約をキャンセルしますか？')) return

    try {
      await cancel(id)
      alert('予約をキャンセルしました')
    } catch (err: any) {
      alert(err.message)
    }
  }

  // 予約作成ハンドラー
  const handleCreateReservation = async (data: CreateReservationRequest) => {
    await createReservation(data)
  }

  const handleCreateInstantReservation = async (
    data: CreateInstantReservationRequest
  ) => {
    await createInstantReservation(data)
  }

  // ローディング状態
  if (loading && reservations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-8 h-8" />
                予約管理
              </h1>
              <p className="text-gray-600 mt-1">
                アクティブな予約: {activeReservations.length}件 / 全予約:{' '}
                {reservations.length}件
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setInstantDialogOpen(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 flex items-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4" />
                即時予約
              </button>
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                予約作成
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            アクティブな予約 ({activeReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            全ての予約 ({reservations.length})
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'active' ? (
          // ---- アクティブな予約 ----
          activeReservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  showActions={true}
                  onCheckin={handleCheckin}
                  onCheckout={handleCheckout}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                アクティブな予約がありません
              </h3>
              <p className="text-gray-600 mb-6">
                座席を予約して作業を始めましょう
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setInstantDialogOpen(true)}
                  className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  即時予約
                </button>
                <button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  予約作成
                </button>
              </div>
            </div>
          )
        ) : // ---- 全ての予約 ----
        reservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                showActions={
                  reservation.status === 'reserved' ||
                  reservation.status === 'in_use'
                }
                onCheckin={handleCheckin}
                onCheckout={handleCheckout}
                onCancel={handleCancel}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              まだ予約がありません
            </h3>
            <p className="text-gray-600 mb-6">最初の予約を作成しましょう</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setInstantDialogOpen(true)}
                className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                即時予約
              </button>
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                予約作成
              </button>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <CreateReservationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={(reservation) => {
            console.log('予約作成成功', reservation)
            fetchMyReservations()
            fetchActiveReservations()
          }}
          onSubmit={handleCreateReservation}
        />

        <InstantReservationDialog
          open={instantDialogOpen}
          onOpenChange={setInstantDialogOpen}
          onSuccess={(reservation) => {
            console.log('即時予約成功', reservation)
            fetchMyReservations()
            fetchActiveReservations()
          }}
          onSubmit={handleCreateInstantReservation}
        />
      </div>
    </div>
  )
}
