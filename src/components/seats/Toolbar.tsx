'use client'

import { Plus, Save, Trash2 } from 'lucide-react'

interface ToolbarProps {
  onAddSeat: () => void
  onSave: () => void
  onDelete: () => void
  hasSelection: boolean
  isSaving: boolean
}

export function Toolbar({
  onAddSeat,
  onSave,
  onDelete,
  hasSelection,
  isSaving,
}: ToolbarProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 flex items-center gap-4">
      <button
        onClick={onAddSeat}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        座席を追加
      </button>

      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? '保存中...' : '変更を保存'}
      </button>

      <button
        onClick={onDelete}
        disabled={!hasSelection}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
        削除
      </button>
    </div>
  )
}
