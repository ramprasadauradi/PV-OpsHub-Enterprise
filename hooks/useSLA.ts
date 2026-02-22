'use client'

import { useQuery } from '@tanstack/react-query'
import type { APIResponse } from '@/types'

export function useSLAHeatmap() {
    return useQuery({
        queryKey: ['sla', 'heatmap'],
        queryFn: async () => {
            const res = await fetch('/api/sla/calculate')
            if (!res.ok) throw new Error('Failed to fetch SLA data')
            return res.json() as Promise<APIResponse<unknown>>
        },
        refetchInterval: 15000,
    })
}

export function useBreachForecast() {
    return useQuery({
        queryKey: ['sla', 'forecast'],
        queryFn: async () => {
            const res = await fetch('/api/sla/forecast')
            if (!res.ok) throw new Error('Failed to fetch SLA forecast')
            return res.json() as Promise<APIResponse<unknown>>
        },
        refetchInterval: 60000,
    })
}
