'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { WebSocketManager } from '@/lib/websocket/WebSocketManager'
import { WebSocketMessage } from '@/types/websocket'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function useWebSocket(
  onMessage: (message: WebSocketMessage) => void
) {
  const { getToken } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const wsManagerRef = useRef<WebSocketManager | null>(null)

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/ws'
    const manager = new WebSocketManager({
      url: wsUrl,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
    })

    wsManagerRef.current = manager

    // 接続開始
    setConnectionStatus('connecting')
    manager
      .connect(getToken)
      .then(() => {
        setConnectionStatus('connected')
        setError(null)
      })
      .catch((err: any) => {
        setError(err.message || 'WebSocket接続に失敗しました')
        setConnectionStatus('disconnected')
      })

    // メッセージハンドラー登録
    const unsubscribe = manager.onMessage((message) => {
      try {
        onMessage(message)
      } catch (err) {
        console.error('[useWebSocket] メッセージハンドラーでエラー:', err)
      }
    })

    // クリーンアップ
    return () => {
      unsubscribe()
      manager.disconnect()
      setConnectionStatus('disconnected')
    }
  }, [getToken, onMessage])

  // 手動再接続
  const reconnect = useCallback(() => {
    if (wsManagerRef.current && getToken) {
      setConnectionStatus('connecting')
      wsManagerRef.current.connect(getToken)
        .then(() => {
          setConnectionStatus('connected')
          setError(null)
        })
        .catch((err: any) => {
          setError(err.message || 'WebSocket再接続に失敗しました')
          setConnectionStatus('disconnected')
        })
    }
  }, [getToken])

  // バックグラウンドタブでの接続管理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // ページがフォアグラウンドに復帰
        if (connectionStatus !== 'connected' && wsManagerRef.current) {
          console.log('[useWebSocket] ページがフォアグラウンドに復帰 - 再接続を試みます')
          reconnect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [connectionStatus, reconnect])

  // ネットワーク状態の監視
  useEffect(() => {
    const handleOnline = () => {
      console.log('[useWebSocket] ネットワーク復旧')
      if (connectionStatus !== 'connected' && wsManagerRef.current) {
        reconnect()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [connectionStatus, reconnect])

  return { connectionStatus, isConnected: connectionStatus === 'connected', error, reconnect }
}
