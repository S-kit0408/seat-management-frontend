'use client'

import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'

interface CreateReservationParams {
    seatId: string
    startTime: string
}

export function useReservation() {
    const { getToken } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createReservation = async (params: CreateReservationParams) => {
        setIsLoading(true)
        setError(null)

        try {
            const token = await getToken({ template: 'backend-api' })

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(params),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || '予約に失敗しました')
            }

            const data = await response.json()
            return data
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '予約エラーが発生しました'
            setError(errorMessage)
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    return {
        createReservation,
        isLoading,
        error,
    }
}