'use client'

import { WebSocketConfig, WebSocketMessage } from '@/types/websocket'

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageHandlers: Set<(message: WebSocketMessage) => void> = new Set()
  private getTokenFunc: (() => Promise<string | null>) | null = null

  constructor(private config: WebSocketConfig) {}

  async connect(getToken: () => Promise<string | null>): Promise<void> {
    this.getTokenFunc = getToken

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('認証トークンが取得できません')
      }

      // トークンをURLクエリパラメータで送信（URLエンコード）
      const wsUrl = `${this.config.url}?token=${encodeURIComponent(token)}`
      this.ws = new WebSocket(wsUrl)

      // イベントハンドラーをバインド
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
    } catch (err) {
      console.error('[WebSocket] 接続エラー:', err)
      throw err
    }
  }

  private handleOpen(): void {
    console.log('[WebSocket] 接続成功')
    this.reconnectAttempts = 0
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage

      // メッセージのバリデーション
      if (!message.type || !message.timestamp) {
        console.warn('[WebSocket] 無効なメッセージ形式:', message)
        return
      }

      console.log('[WebSocket] メッセージ受信:', message.type)

      // すべてのメッセージハンドラーに通知
      this.messageHandlers.forEach((handler) => {
        try {
          handler(message)
        } catch (err) {
          console.error('[WebSocket] メッセージハンドラーでエラー:', err)
        }
      })
    } catch (err) {
      console.error('[WebSocket] メッセージのパースに失敗:', err)
    }
  }

  private handleError(event: Event): void {
    console.error('[WebSocket] エラーが発生しました:', event)
  }

  private handleClose(): void {
    console.log('[WebSocket] 接続が閉じられました')

    // 再接続ロジック（指数バックオフ）
    if (this.reconnectAttempts < this.config.maxReconnectAttempts && this.getTokenFunc) {
      const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts)
      console.log(
        `[WebSocket] 再接続試行 (${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts}) - ${delay}ms後`
      )

      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++
        this.connect(this.getTokenFunc!)
      }, delay)
    } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocket] 最大再接続回数に達しました')
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.add(handler)

    // アンサブスクライブ関数を返す
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  disconnect(): void {
    console.log('[WebSocket] 切断処理を開始します')

    // 再接続タイマーをクリア
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    // WebSocket接続を閉じる
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // ハンドラーをクリア
    this.messageHandlers.clear()
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }
}
