import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { reservationApi } from '@/lib/api/reservations'
import {
  Reservation,
  CreateReservationRequest,
  CreateInstantReservationRequest,
} from '@/types/reservation'

// 自分の予約一覧取得と予約操作を提供
export function useReservations() {
  const { getToken } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [activeReservations, setActiveReservations] = useState<Reservation[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 自分の全予約取得
  const fetchMyReservations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reservationApi.getMyReservations(getToken)
      setReservations(data)
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getToken])

  // 自分のアクティブな予約取得
  const fetchActiveReservations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reservationApi.getActiveReservations(getToken)
      setActiveReservations(data)
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getToken])

  // 通常予約作成
  const createReservation = useCallback(
    async (data: CreateReservationRequest) => {
      setLoading(true)
      setError(null)
      try {
        const newReservation = await reservationApi.createReservation(
          getToken,
          data
        )
        setReservations((prev) => [...prev, newReservation])
        setActiveReservations((prev) => [...prev, newReservation])
        return newReservation
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  // 即時予約作成
  const createInstantReservation = useCallback(
    async (data: CreateInstantReservationRequest) => {
      setLoading(true)
      setError(null)
      try {
        const newReservation = await reservationApi.createInstantReservation(
          getToken,
          data
        )
        setReservations((prev) => [...prev, newReservation])
        setActiveReservations((prev) => [...prev, newReservation])
        return newReservation
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  // チェックイン
  const checkin = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        const updatedReservation = await reservationApi.checkin(getToken, id)
        // 状態を更新
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? updatedReservation : r))
        )
        setActiveReservations((prev) =>
          prev.map((r) => (r.id === id ? updatedReservation : r))
        )
        return updatedReservation
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  // チェックアウト
  const checkout = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        const updatedReservation = await reservationApi.checkout(getToken, id)
        // 状態を更新（completedになるのでactiveReservationsからは削除）
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? updatedReservation : r))
        )
        setActiveReservations((prev) => prev.filter((r) => r.id !== id))
        return updatedReservation
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  // 予約キャンセル
  const cancel = useCallback(
    async (id: string, reason?: string) => {
      setLoading(true)
      setError(null)
      try {
        const updatedReservation = await reservationApi.cancel(
          getToken,
          id,
          reason
        )
        // 状態を更新（cancelledになるのでactiveReservationsからは削除）
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? updatedReservation : r))
        )
        setActiveReservations((prev) => prev.filter((r) => r.id !== id))
        return updatedReservation
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  // 予約延長
  const extend = useCallback(
    async (id: string, additionalMinutes: number) => {
      setLoading(true)
      setError(null)
      try {
        const updatedReservation = await reservationApi.extend(
          getToken,
          id,
          additionalMinutes
        )
        // 状態を更新
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? updatedReservation : r))
        )
        setActiveReservations((prev) =>
          prev.map((r) => (r.id === id ? updatedReservation : r))
        )
        return updatedReservation
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  return {
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
    extend,
  }
}

// 単一予約詳細フック 特定の予約の詳細情報を取得・管理
export function useReservation(initialId?: string) {
  const { getToken } = useAuth()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 予約詳細取得
  const fetchReservation = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        const data = await reservationApi.getReservation(getToken, id)
        setReservation(data)
        return data
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  // 初期IDが指定されている場合は自動取得
  useState(() => {
    if (initialId) {
      fetchReservation(initialId)
    }
  })

  return {
    reservation,
    loading,
    error,
    fetchReservation,
  }
}

// 公開予約取得フック　プライバシー設定に応じた予約一覧を取得（座席マップ用）
export function useVisibleReservations() {
  const { getToken } = useAuth()
  const [visibleReservations, setVisibleReservations] = useState<Reservation[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 公開予約取得
  const fetchVisibleReservations = useCallback(
    async (startTime?: string, endTime?: string) => {
      setLoading(true)
      setError(null)
      try {
        const data = await reservationApi.getVisibleReservations(
          getToken,
          startTime,
          endTime
        )
        setVisibleReservations(data)
        return data
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  return {
    visibleReservations,
    loading,
    error,
    fetchVisibleReservations,
  }
}
