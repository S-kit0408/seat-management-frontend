'use client'

import { useState } from 'react'
import { Floor } from '@/lib/api/floors'

interface FloorSelectorProps {
  floors: Floor[]
  selectedFloorId: string | null
  onFloorSelect: (floorId: string | null) => void
  onCreateFloor: () => void
  showAll?: boolean
}

export function FloorSelector({
  floors,
  selectedFloorId,
  onFloorSelect,
  onCreateFloor,
  showAll = true,
}: FloorSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">フロア選択</h2>
        <button
          onClick={onCreateFloor}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          + フロアを追加
        </button>
      </div>

      <div className="space-y-2">
        {showAll && (
          <button
            onClick={() => onFloorSelect(null)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              selectedFloorId === null
                ? 'bg-blue-100 text-blue-900 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            フロア未設定
          </button>
        )}

        {floors.map((floor) => (
          <button
            key={floor.id}
            onClick={() => onFloorSelect(floor.id)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              selectedFloorId === floor.id
                ? 'bg-blue-100 text-blue-900 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {floor.display_name || floor.name}
                </div>
                {floor.description && (
                  <div className="text-sm text-gray-500">
                    {floor.description}
                  </div>
                )}
              </div>
              {!floor.is_active && (
                <span className="text-xs text-gray-400">(非アクティブ)</span>
              )}
            </div>
          </button>
        ))}

        {floors.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            フロアがありません
          </div>
        )}
      </div>
    </div>
  )
}
