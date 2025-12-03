import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  getFriends,
  getReceivedRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  checkFriendshipStatus,
} from '@/lib/api/friends'
import { User } from '@/types/user'
import { FriendRequest, SendFriendRequestPayload } from '@/types/friend'

export function useFriends() {
  const { getToken } = useAuth()
  const [friends, setFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFriends = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getFriends(getToken)
      setFriends(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const handleRemoveFriend = useCallback(
    async (friendId: string) => {
      try {
        await removeFriend(friendId, getToken)
        setFriends((prev) => prev.filter((f) => f.id !== friendId))
      } catch (err: any) {
        throw new Error(err.message)
      }
    },
    [getToken]
  )

  return {
    friends,
    loading,
    error,
    fetchFriends,
    removeFriend: handleRemoveFriend,
  }
}

export function useFriendRequests() {
  const { getToken } = useAuth()
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReceivedRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getReceivedRequests(getToken)
      setReceivedRequests(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const fetchSentRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSentRequests(getToken)
      setSentRequests(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const handleSendRequest = useCallback(
    async (payload: SendFriendRequestPayload) => {
      try {
        await sendFriendRequest(payload, getToken)
        await fetchSentRequests()
      } catch (err: any) {
        throw new Error(err.message)
      }
    },
    [getToken, fetchSentRequests]
  )

  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      try {
        await acceptFriendRequest(requestId, getToken)
        await fetchReceivedRequests()
      } catch (err: any) {
        throw new Error(err.message)
      }
    },
    [getToken, fetchReceivedRequests]
  )

  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      try {
        await rejectFriendRequest(requestId, getToken)
        await fetchReceivedRequests()
      } catch (err: any) {
        throw new Error(err.message)
      }
    },
    [getToken, fetchReceivedRequests]
  )

  const handleCancelRequest = useCallback(
    async (requestId: string) => {
      try {
        await cancelFriendRequest(requestId, getToken)
        await fetchSentRequests()
      } catch (err: any) {
        throw new Error(err.message)
      }
    },
    [getToken, fetchSentRequests]
  )

  return {
    receivedRequests,
    sentRequests,
    loading,
    error,
    fetchReceivedRequests,
    fetchSentRequests,
    sendRequest: handleSendRequest,
    acceptRequest: handleAcceptRequest,
    rejectRequest: handleRejectRequest,
    cancelRequest: handleCancelRequest,
  }
}
