'use client'

import { Edit, Trash2, CheckCircle, Circle } from 'lucide-react'
import { ReservationSettings } from '@/types/reservationSettings'

interface Props {
  settings: ReservationSettings[]
  onEdit: (setting: ReservationSettings) => void
  onActivate: (id: string) => void
  onDelete: (id: string) => void
}

export function ReservationSettingsTable({
  settings,
  onEdit,
  onActivate,
  onDelete,
}: Props) {
  if (settings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">予約設定がまだ作成されていません</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                説明
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                チェックイン
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                予約時間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                最大事前予約
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {settings.map((setting) => (
              <tr key={setting.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {setting.description || '（説明なし）'}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {setting.id.slice(0, 8)}...
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div>
                    <p>
                      {setting.check_in_minutes_before_start}分前から
                    </p>
                    <p className="text-xs text-gray-500">
                      猶予: {setting.check_in_grace_period_minutes}分
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {setting.min_reservation_minutes} 〜{' '}
                  {setting.max_reservation_minutes} 分
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {setting.max_advance_booking_days} 日
                </td>
                <td className="px-6 py-4">
                  {setting.is_active ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                        アクティブ
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-gray-400" />
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full border border-gray-200">
                        非アクティブ
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(setting)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="編集"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {!setting.is_active && (
                      <button
                        onClick={() => onActivate(setting.id)}
                        className="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                        title="有効化"
                      >
                        有効化
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(setting.id)}
                      disabled={setting.is_active}
                      className={`p-2 rounded-md transition-colors ${
                        setting.is_active
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={
                        setting.is_active
                          ? 'アクティブな設定は削除できません'
                          : '削除'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
