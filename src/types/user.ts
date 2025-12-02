export type UserRole = 'user' | 'admin' | 'moderator'

export interface User {
  id: string
  clerk_user_id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  default_privacy_setting: 'public' | 'private' | 'friends'
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  name?: string
  avatar_url?: string
  default_privacy_setting?: 'public' | 'private' | 'friends'
}

export interface UpdateUserRoleRequest {
  role: UserRole
}

// export interface AdminUser extends User {
//   // 管理画面用の追加情報があればここに追加
// }
