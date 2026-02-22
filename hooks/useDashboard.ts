'use client'

import { useQuery } from '@tanstack/react-query'
import type { APIResponse } from '@/types'

export function useTLDashboard() {
    return useQuery({
        queryKey: ['dashboard', 'tl'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/tl')
            if (!res.ok) throw new Error('Failed to fetch TL dashboard')
            return res.json() as Promise<APIResponse<unknown>>
        },
        refetchInterval: 15000,
    })
}

export function useManagerDashboard(teamId?: string) {
    const params = new URLSearchParams()
    if (teamId) params.set('teamId', teamId)

    return useQuery({
        queryKey: ['dashboard', 'manager', teamId],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/manager?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch manager dashboard')
            return res.json() as Promise<APIResponse<unknown>>
        },
        refetchInterval: 15000,
    })
}

export function useProjectDashboard(period: 'week' | 'month' | 'ytd' = 'month') {
    return useQuery({
        queryKey: ['dashboard', 'project', period],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/project?period=${period}`)
            if (!res.ok) throw new Error('Failed to fetch project dashboard')
            return res.json() as Promise<APIResponse<unknown>>
        },
        refetchInterval: 30000,
    })
}
