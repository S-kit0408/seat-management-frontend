export interface User {
  id: string
  clerk_user_id: string
  email: string
  name: string
  avatar_url?: string
  default_privacy_setting: 'public' | 'private'
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  name?: string
  avatar_url?: string
  default_privacy_setting?: 'public' | 'private'
}
