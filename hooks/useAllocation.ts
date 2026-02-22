'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { APIResponse } from '@/types'

export function useHoldStatus() {
    return useQuery({
        queryKey: ['allocation', 'hold'],
        queryFn: async () => {
            const res = await fetch('/api/allocation/hold')
            if (!res.ok) throw new Error('Failed to fetch hold status')
            return res.json() as Promise<APIResponse<unknown>>
        },
        refetchInterval: 10000,
    })
}

export function useInitiateHold() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: { holdType: string; caseIds?: string[]; notes?: string; autoReleaseHours?: number }) => {
            const res = await fetch('/api/allocation/hold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to initiate hold')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allocation'] })
            queryClient.invalidateQueries({ queryKey: ['cases'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}

export function useReleaseHold() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (holdId: string) => {
            const res = await fetch('/api/allocation/hold', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ holdId, action: 'release' }),
            })
            if (!res.ok) throw new Error('Failed to release hold')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allocation'] })
            queryClient.invalidateQueries({ queryKey: ['cases'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}

export function useAvailableProcessors() {
    return useQuery({
        queryKey: ['allocation', 'processors'],
        queryFn: async () => {
            const res = await fetch('/api/allocation/suggest')
            if (!res.ok) throw new Error('Failed to fetch processors')
            return res.json() as Promise<APIResponse<unknown>>
        },
    })
}
