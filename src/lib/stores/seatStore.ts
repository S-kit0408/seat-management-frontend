import { create } from 'zustand'
import { Seat } from '@/types/seat'

interface SeatStore {
  seats: Seat[]
  selectedSeatIds: string[]
  currentFloorId: string | null

  setSeats: (seats: Seat[]) => void
  addSeat: (seat: Seat) => void
  updateSeat: (id: string, updates: Partial<Seat>) => void
  deleteSeat: (id: string) => void
  selectSeat: (id: string) => void
  deselectAll: () => void
  setCurrentFloor: (floorId: string | null) => void
}

export const useSeatStore = create<SeatStore>((set) => ({
  seats: [],
  selectedSeatIds: [],
  currentFloorId: null,

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
}))
