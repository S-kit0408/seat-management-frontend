import { SeatShape } from '@/types/seat'
import { ReservationStatus } from '@/types/reservation'

interface SeatShapeRendererProps {
  shape: SeatShape
  width: number
  height: number
  rotationAngle: number
  isSelected: boolean
  isActive?: boolean
  isDimmed?: boolean
  reservationStatus?: ReservationStatus | null
  isFriendSeat?: boolean
}

export function SeatShapeRenderer({
  shape,
  width,
  height,
  rotationAngle,
  isSelected,
  isActive = true,
  isDimmed = false,
  reservationStatus,
  isFriendSeat = false,
}: SeatShapeRendererProps) {
  // 優先順位: 選択 > フレンド使用中 > 使用中 > 予約済 > 灰色表示 > 利用不可 > 利用可能
  let strokeColor: string
  let fillColor: string

  if (isSelected) {
    // 選択時は紫色
    strokeColor = '#8b5cf6'
    fillColor = '#ede9fe'
  } else if (isFriendSeat && reservationStatus === 'in_use') {
    // フレンド使用中は青色（新機能）
    strokeColor = '#2563eb' // blue-600
    fillColor = '#dbeafe' // blue-100
  } else if (reservationStatus === 'in_use') {
    // 使用中はオレンジ色
    strokeColor = '#ea580c'
    fillColor = '#ffedd5'
  } else if (reservationStatus === 'reserved') {
    // 予約済でも利用可の場合は緑色
    strokeColor = '#16a34a'
    fillColor = '#dcfce7'
  } else if (isDimmed) {
    // 検索条件に該当しない場合は灰色
    strokeColor = '#9ca3af'
    fillColor = '#f3f4f6'
  } else if (!isActive) {
    // 利用不可は赤色
    strokeColor = '#dc2626'
    fillColor = '#fee2e2'
  } else {
    // 利用可能は緑色
    strokeColor = '#16a34a'
    fillColor = '#dcfce7'
  }

  switch (shape) {
    case 'rectangle':
      return (
        <rect
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          rx={4}
        />
      )
    case 'circle':
      return (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
        />
      )
    case 'square':
      const size = Math.min(width, height)
      return (
        <rect
          width={size}
          height={size}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          rx={4} // 角を少し丸める
        />
      )
    case 'oval':
      // 楕円（width と height に応じた楕円形）
      return (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2} // 横半径
          ry={height / 2} // 縦半径
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
        />
      )
    default:
      return (
        <rect
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
        />
      )
  }
}
