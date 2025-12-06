// 15度刻みに正規化
export const normalizeRotation = (angle: number): number => {
  const normalized = angle % 360
  return Math.round(normalized / 15) * 15
}

// グリッドにスナップ
export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize
}

// 座席の中心座標を計算
export const getSeatCenter = (seat: {
  position_x: number
  position_y: number
  width: number
  height: number
}) => {
  return {
    x: seat.position_x + seat.width / 2,
    y: seat.position_y + seat.height / 2,
  }
}
