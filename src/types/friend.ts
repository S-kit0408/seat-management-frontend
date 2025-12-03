import { User, UserRole, AuthProvider, PrivacySetting } from './user'
export type { User, UserRole, AuthProvider, PrivacySetting }

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface FriendRequest {
  id: string
  requester_id: string
  addressee_id: string
  status: RequestStatus
  message?: string
  created_at: string
  updated_at: string
  requester?: User
  addressee?: User
}

export interface SendFriendRequestPayload {
  addressee_name: string
  message?: string
}

export interface ApiResponse {
  message: string
}

export interface ApiError {
  error: string
}

export interface FriendshipStatus {
  is_friend: boolean
}
