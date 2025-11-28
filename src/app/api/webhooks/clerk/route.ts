import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRETが設定されていません')
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  // イベントタイプに応じた処理
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    // バックエンドAPIにユーザー情報を送信
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Webhook署名またはAPI Keyでバックエンド認証
          'X-Webhook-Secret': process.env.BACKEND_API_SECRET || '',
        },
        body: JSON.stringify({
          clerkUserId: id,
          email: email_addresses[0]?.email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown',
          avatarUrl: image_url,
          primaryAuthProvider: email_addresses[0]?.verification?.strategy || 'unknown',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Backend API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to sync user to backend:', error)
      return new Response('Error: Failed to sync user', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    // ユーザー更新処理
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Webhook署名またはAPI Keyでバックエンド認証
          'X-Webhook-Secret': process.env.BACKEND_API_SECRET || '',
        },
        body: JSON.stringify({
          email: email_addresses[0]?.email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim(),
          avatarUrl: image_url,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Backend API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to update user in backend:', error)
      return new Response('Error: Failed to update user', { status: 500 })
    }
  }

  return new Response('Webhook processed successfully', { status: 200 })
}