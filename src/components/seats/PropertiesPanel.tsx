'use client'

import { Seat, SeatShape } from '@/types/seat'
import { Floor } from '@/lib/api/floors'
import { useSeatStore } from '@/lib/stores/seatStore'
import { useState } from 'react'
import { X, Plus } from 'lucide-react'

interface PropertiesPanelProps {
  selectedSeatId: string | null
  floors?: Floor[]
}

const commonAttributes = [
  '窓際',
  '静か',
  '充電器あり',
  '一人向け',
  '複数人向け',
  'モニターあり',
  '明るい',
  '暗め',
]

export function PropertiesPanel({
  selectedSeatId,
  floors = [],
}: PropertiesPanelProps) {
  const { seats, updateSeat } = useSeatStore()
  const [newAttribute, setNewAttribute] = useState('')

  const seat = seats.find((s) => s.id === selectedSeatId)

  if (!seat) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">
          座席プロパティ
        </h3>
        <div className="flex flex-col items-center justify-center py-8">
          <svg
            className="w-16 h-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500 text-center">座席を選択してください</p>
          <p className="text-gray-400 text-sm text-center mt-2">
            キャンバス上の座席をクリックすると
            <br />
            プロパティを編集できます
          </p>
        </div>
      </div>
    )
  }

  // 形状に応じた更新処理
  const handleChange = (field: keyof Seat, value: any) => {
    // 円または正方形の場合、幅と高さを連動させる
    if (seat.shape === 'circle' || seat.shape === 'square') {
      if (field === 'width') {
        updateSeat(seat.id, {
          width: value,
          height: value,
        })
        return
      } else if (field === 'height') {
        updateSeat(seat.id, {
          width: value,
          height: value,
        })
        return
      }
    }

    updateSeat(seat.id, { [field]: value })
  }

  // 属性追加
  const handleAddAttribute = () => {
    if (!newAttribute.trim()) return

    const currentAttributes = seat.attributes?.free_attributes || []

    if (currentAttributes.length > 10) {
      alert('属性は最大10個まで登録できます')
      return
    }

    // 重複チェック
    if (currentAttributes.includes(newAttribute.trim())) {
      alert('この属性は既に登録されています')
      return
    }

    handleChange('attributes', {
      ...seat.attributes,
      free_attributes: [...currentAttributes, newAttribute.trim()],
    })
    setNewAttribute('')
  }

  // 属性削除
  const handleRemoveAttribute = (index: number) => {
    const currentAttributes = seat.attributes?.free_attributes || []
    handleChange('attributes', {
      ...seat.attributes,
      free_attributes: currentAttributes.filter(
        (_: string, i: number) => i !== index
      ),
    })
  }

  // Enterキーで追加
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddAttribute()
    }
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-3 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
        座席プロパティ
      </h3>

      {/* 座席番号 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          座席番号<span className="text-gray-400">(編集不可)</span>
        </label>
        <input
          type="text"
          value={seat.seat_number}
          disabled
          onChange={(e) => handleChange('seat_number', e.target.value)}
          className="w-full px-3 py-2 text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* 説明 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          説明
        </label>
        <textarea
          value={seat.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
          placeholder="例: 窓際の静かな席"
        />
      </div>

      {/* フロア選択 */}
      {floors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            フロア
          </label>
          <select
            value={seat.floor_id || ''}
            onChange={(e) =>
              handleChange('floor_id', e.target.value || undefined)
            }
            className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">未設定</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.display_name || floor.name}
              </option>
            ))}
          </select>
          {!seat.floor_id && (
            <p className="text-xs text-amber-600 mt-1">
              フロアを設定してください
            </p>
          )}
        </div>
      )}

      {/* 属性入力セクション */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          属性
        </label>

        {/* 入力欄と登録ボタン */}
        <div className="flex flex-col gap-2 mb-2">
          <input
            type="text"
            value={newAttribute}
            onChange={(e) => setNewAttribute(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例: 窓際、静か"
            className="w-full px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleAddAttribute}
            className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            登録
          </button>
        </div>

        {/* よく使う属性の候補 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {commonAttributes.map((attr) => (
            <button
              key={attr}
              onClick={() => setNewAttribute(attr)}
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
            >
              {attr}
            </button>
          ))}
        </div>

        {/* 登録済み属性の一覧表示 */}
        <div className="min-h-[60px] border border-gray-200 rounded-md p-3 bg-gray-50">
          {seat.attributes?.free_attributes &&
          seat.attributes.free_attributes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {seat.attributes.free_attributes.map(
                (attr: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
                  >
                    {attr}
                    <button
                      onClick={() => handleRemoveAttribute(index)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      title="削除"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-2">
              属性が登録されていません
            </p>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-1">
          Enterキーまたは登録ボタンで追加できます
        </p>
      </div>

      {/* 形状 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          形状
        </label>
        <select
          value={seat.shape}
          onChange={(e) => {
            const newShape = e.target.value as SeatShape
            // 円または正方形に変更した場合、幅と高さを揃える
            if (newShape === 'circle' || newShape === 'square') {
              const size = Math.min(seat.width, seat.height)
              updateSeat(seat.id, {
                shape: newShape,
                width: size,
                height: size,
              })
            } else {
              handleChange('shape', newShape)
            }
          }}
          className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="rectangle">長方形</option>
          <option value="circle">円</option>
          <option value="square">正方形</option>
          <option value="oval">楕円</option>
        </select>
      </div>

      {/* 円・正方形の場合の注意書き */}
      {(seat.shape === 'circle' || seat.shape === 'square') && (
        <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-2 flex items-start gap-2">
          <span className="flex-shrink-0">ℹ️</span>
          <span>
            {seat.shape === 'circle' ? '円' : '正方形'}
            を選択中：幅と高さは自動で同じ値になります
          </span>
        </div>
      )}

      {/* 幅と高さ */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            幅 (px)
          </label>
          <input
            type="number"
            value={seat.width}
            onChange={(e) => {
              const value = parseFloat(e.target.value)
              if (value > 0) {
                handleChange('width', value)
              }
            }}
            min="1"
            step="1"
            className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            高さ (px)
          </label>
          <input
            type="number"
            value={seat.height}
            onChange={(e) => {
              const value = parseFloat(e.target.value)
              if (value > 0) {
                handleChange('height', value)
              }
            }}
            min="1"
            step="1"
            className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* 回転角度 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          回転角度（15度刻み）
        </label>
        <input
          type="range"
          min="0"
          max="345"
          step="15"
          value={seat.rotation_angle}
          onChange={(e) =>
            handleChange('rotation_angle', parseInt(e.target.value))
          }
          className="w-full"
        />
        <div className="text-center text-sm text-gray-600 mt-1">
          {seat.rotation_angle}°
        </div>
      </div>

      {/* アクティブ状態 */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={seat.is_active}
          onChange={(e) => handleChange('is_active', e.target.checked)}
          className="mr-2"
          id="is_active"
        />
        <label
          htmlFor="is_active"
          className="text-sm font-medium text-gray-700"
        >
          アクティブ
        </label>
      </div>
    </div>
  )
}
