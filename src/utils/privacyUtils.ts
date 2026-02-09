import { PrivacySetting } from '@/types/user'

/**
 * プライバシー設定に基づいて、ユーザー情報を表示するかどうかを判定
 * @param privacySetting - プライバシー設定（public | friends | private）
 * @param isFriend - ビューアーが対象ユーザーのフレンドであるかどうか
 * @param isOwner - ビューアーが対象ユーザー本人であるかどうか
 * @returns ユーザー情報を表示するかどうか
 */
export const shouldShowUserInfo = (
  privacySetting: PrivacySetting | null | undefined,
  isFriend: boolean,
  isOwner: boolean
): boolean => {
  // 対象ユーザー本人は常に表示
  if (isOwner) return true

  // プライバシー設定が指定されていない場合はデフォルト（private）を適用
  const setting = privacySetting || 'private'

  // public: すべてのユーザーに表示
  if (setting === 'public') return true

  // friends: フレンドのみに表示
  if (setting === 'friends' && isFriend) return true

  // private: 対象ユーザー本人のみに表示（isOwner=true のみ）
  return false
}

/**
 * プライバシー設定のラベルを取得
 */
export const getPrivacyLabel = (privacy: PrivacySetting | null | undefined): string => {
  switch (privacy) {
    case 'public':
      return '🌐 公開'
    case 'friends':
      return '👥 友人のみ'
    case 'private':
    default:
      return '🔒 プライベート'
  }
}

/**
 * プライバシー設定の説明文を取得
 */
export const getPrivacyDescription = (privacy: PrivacySetting | null | undefined): string => {
  switch (privacy) {
    case 'public':
      return 'すべてのユーザーに表示されます'
    case 'friends':
      return '友人にのみ表示されます'
    case 'private':
    default:
      return 'あなたのみが閲覧できます'
  }
}

/**
 * 座席情報の表示制御
 * 座席の予約者情報をプライバシー設定に基づいて制御
 */
export const getSeatDisplayInfo = (
  userName: string | undefined,
  privacySetting: PrivacySetting | null | undefined,
  isFriend: boolean,
  isOwner: boolean
): {
  displayName: string
  showDetails: boolean
} => {
  const shouldShow = shouldShowUserInfo(privacySetting, isFriend, isOwner)

  if (!shouldShow) {
    return {
      displayName:
        privacySetting === 'friends' && !isFriend
          ? '友人の予約'
          : 'プライベート予約',
      showDetails: false,
    }
  }

  return {
    displayName: userName || '（名前なし）',
    showDetails: true,
  }
}

/**
 * フレンドリストから特定のユーザーがフレンドであるかを確認
 */
export const isFriendsWithUser = (
  userId: string | undefined,
  friendsList: Array<{ id: string }>
): boolean => {
  if (!userId) return false
  return friendsList.some((friend) => friend.id === userId)
}
