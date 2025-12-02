import { User } from '@/types/user'

/**
 * ユーザーが管理者権限を持っているかチェック
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

/**
 * ユーザーがモデレーター以上の権限を持っているかチェック
 */
export function isModerator(user: User | null): boolean {
  return user?.role === 'admin' || user?.role === 'moderator'
}
