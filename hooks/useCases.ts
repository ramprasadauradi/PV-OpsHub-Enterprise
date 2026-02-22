'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { APIResponse, CaseFilterInput } from '@/types'

export function useCases(filters: Partial<CaseFilterInput> = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            params.set(key, String(value))
        }
    })

    return useQuery({
        queryKey: ['cases', filters],
        queryFn: async () => {
            const res = await fetch(`/api/cases?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch cases')
            return res.json() as Promise<APIResponse<unknown>>
        },
        refetchInterval: 15000,
    })
}

export function useCase(id: string) {
    return useQuery({
        queryKey: ['case', id],
        queryFn: async () => {
            const res = await fetch(`/api/cases/${id}`)
            if (!res.ok) throw new Error('Failed to fetch case')
            return res.json() as Promise<APIResponse<unknown>>
        },
        enabled: !!id,
    })
}

export function useCreateCase() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: Record<string, unknown>) => {
            const res = await fetch('/api/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create case')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] })
        },
    })
}

export function useAllocateCase() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: { caseIds: string[]; assignToUserId: string }) => {
            const res = await fetch('/api/allocation/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to allocate cases')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}

export function useAdvanceStage() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: { caseId: string; toStage: string; notes?: string }) => {
            const res = await fetch(`/api/cases/${data.caseId}/stage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to advance stage')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}
