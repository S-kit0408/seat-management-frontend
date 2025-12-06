import { SeatShape } from '@/types/seat'

interface SeatShapeRendererProps {
  shape: SeatShape
  width: number
  height: number
  rotationAngle: number
  isSelected: boolean
  isActive?: boolean
}

export function SeatShapeRenderer({
  shape,
  width,
  height,
  rotationAngle,
  isSelected,
  isActive = true,
}: SeatShapeRendererProps) {
  // 利用可能/不可に応じて色を変更
  let strokeColor: string
  let fillColor: string

  if (isSelected) {
    // 選択時は紫色
    strokeColor = '#8b5cf6'
    fillColor = '#ede9fe'
  } else if (isActive) {
    // 利用可能は緑色
    strokeColor = '#16a34a'
    fillColor = '#dcfce7'
  } else {
    // 利用不可は赤色
    strokeColor = '#dc2626'
    fillColor = '#fee2e2'
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
