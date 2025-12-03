export type UserRole = 'user' | 'admin' | 'moderator'
export type AuthProvider = 'email' | 'google' | 'unknown'
export type PrivacySetting = 'public' | 'friends' | 'private'

export interface User {
  id: string
  clerk_user_id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  primary_auth_provider?: AuthProvider
  default_privacy_setting: PrivacySetting
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  name?: string
  avatar_url?: string
  default_privacy_setting?: PrivacySetting
}

export interface UpdateUserRoleRequest {
  role: UserRole
}

// export interface AdminUser extends User {
//   // 管理画面用の追加情報
// }
