'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SentRequestsPage() {
  const router = useRouter()

  useEffect(() => {
    // SnÚü¸o /friends/requests g¿ÖhWfŸÅUŒfD‹_êÀ¤ì¯È
    router.replace('/friends/requests')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">êÀ¤ì¯È-...</div>
    </div>
  )
}
