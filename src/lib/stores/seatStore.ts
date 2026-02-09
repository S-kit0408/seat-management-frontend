import { create } from 'zustand'
import { Seat } from '@/types/seat'
import { Reservation } from '@/types/reservation'
import { SeatUpdateStatus } from '@/types/websocket'

interface SeatStore {
  seats: Seat[]
  selectedSeatIds: string[]
  currentFloorId: string | null
  reservationCache: Map<string, Reservation>

  setSeats: (seats: Seat[]) => void
  addSeat: (seat: Seat) => void
  updateSeat: (id: string, updates: Partial<Seat>) => void
  deleteSeat: (id: string) => void
  selectSeat: (id: string) => void
  deselectAll: () => void
  setCurrentFloor: (floorId: string | null) => void
  handleSeatUpdate: (
    seatId: string,
    status: SeatUpdateStatus,
    reservation?: Partial<Reservation>
  ) => void
  updateReservationCache: (seatId: string, reservation: Reservation | null) => void
}

export const useSeatStore = create<SeatStore>((set) => ({
  seats: [],
  selectedSeatIds: [],
  currentFloorId: null,
  reservationCache: new Map(),

  setSeats: (seats) => set({ seats }),
  addSeat: (seat) => set((state) => ({ seats: [...state.seats, seat] })),
  updateSeat: (id, updates) =>
    set((state) => ({
      seats: state.seats.map((seat) =>
        seat.id === id ? { ...seat, ...updates } : seat
      ),
    })),
  deleteSeat: (id) =>
    set((state) => ({
      seats: state.seats.filter((seat) => seat.id !== id),
    })),
  selectSeat: (id) =>
    set((state) => {
      // 選択済時は選択解除
      if (state.selectedSeatIds.includes(id)) {
        return { selectedSeatIds: [] }
      }
      // 未選択時は選択
      return { selectedSeatIds: [id] }
    }),
  deselectAll: () => set({ selectedSeatIds: [] }),
  setCurrentFloor: (floorId) => set({ currentFloorId: floorId }),

  // WebSocket更新ハンドラー
  handleSeatUpdate: (seatId, status, reservation) =>
    set((state) => {
      const newCache = new Map(state.reservationCache)

      if (status === 'available' || status === 'deleted') {
        // 座席が利用可能になった、または削除された
        newCache.delete(seatId)
      } else if (reservation) {
        // 予約情報を更新
        newCache.set(seatId, reservation as Reservation)
      }

      return { reservationCache: newCache }
    }),

  updateReservationCache: (seatId, reservation) =>
    set((state) => {
      const newCache = new Map(state.reservationCache)
      if (reservation) {
        newCache.set(seatId, reservation)
      } else {
        newCache.delete(seatId)
      }
      return { reservationCache: newCache }
    }),
}))
