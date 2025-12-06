'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface AttributeSearchProps {
  searchKeyword: string
  onSearchChange: (keyword: string) => void
  selectedAttributes: string[]
  onAttributesChange: (attributes: string[]) => void
}

// よく使う属性リスト
const COMMON_ATTRIBUTES = [
  '窓際',
  '静か',
  '充電器あり',
  '一人向け',
  '複数人向け',
  'モニターあり',
  '明るい',
  '暗め',
]

export function AttributeSearch({
  searchKeyword,
  onSearchChange,
  selectedAttributes,
  onAttributesChange,
}: AttributeSearchProps) {
  // 属性のトグル処理
  const handleAttributeToggle = (attr: string) => {
    if (selectedAttributes.includes(attr)) {
      // 既に選択されている場合は除外
      onAttributesChange(selectedAttributes.filter((a) => a !== attr))
    } else {
      // 選択されていない場合は追加
      onAttributesChange([...selectedAttributes, attr])
    }
  }

  // すべてクリア
  const handleClearAll = () => {
    onAttributesChange([])
    onSearchChange('')
  }

  // 選択中の属性があるか
  const hasActiveFilters =
    selectedAttributes.length > 0 || searchKeyword.length > 0

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">属性で検索</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            すべてクリア
          </button>
        )}
      </div>

      {/* キーワード検索欄 */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="キーワードを入力（例: 窓際、静か）"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          {searchKeyword && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* よく使う属性 */}
      <div>
        <p className="text-sm text-gray-600 mb-2">よく使う属性:</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_ATTRIBUTES.map((attr) => {
            const isSelected = selectedAttributes.includes(attr)
            return (
              <button
                key={attr}
                onClick={() => handleAttributeToggle(attr)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelected && <span className="mr-1">✓</span>}
                {attr}
              </button>
            )
          })}
        </div>
      </div>

      {/* 選択中の属性表示 */}
      {selectedAttributes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            選択中の属性 ({selectedAttributes.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAttributes.map((attr) => (
              <span
                key={attr}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
              >
                {attr}
                <button
                  onClick={() => handleAttributeToggle(attr)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  title="削除"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 検索結果の説明（準備中） */}
      {hasActiveFilters && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">
            検索機能は準備中です。現在は表示のみです。
          </p>
        </div>
      )}
    </div>
  )
}
