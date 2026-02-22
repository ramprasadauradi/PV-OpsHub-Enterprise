'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTenantStore } from '@/stores/tenantStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface TenantContextType {
    tenantId: string
    tenantName: string
    userId: string
    userName: string
    userRole: string
    timezone: string
    isLoading: boolean
}

const TenantContext = createContext<TenantContextType>({
    tenantId: '',
    tenantName: '',
    userId: '',
    userName: '',
    userRole: '',
    timezone: 'UTC',
    isLoading: true,
})

export function useTenant() {
    return useContext(TenantContext)
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10000,
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
})

export default function TenantProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const setTenant = useTenantStore((s) => s.setTenant)

    useEffect(() => {
        if (session?.user) {
            setTenant(
                session.user.tenantId,
                session.user.tenantName,
                session.user.timezone
            )
        }
    }, [session, setTenant])

    const value: TenantContextType = {
        tenantId: session?.user?.tenantId ?? '',
        tenantName: session?.user?.tenantName ?? '',
        userId: session?.user?.id ?? '',
        userName: session?.user?.name ?? '',
        userRole: session?.user?.role ?? '',
        timezone: session?.user?.timezone ?? 'UTC',
        isLoading: status === 'loading',
    }

    return (
        <QueryClientProvider client={queryClient}>
            <TenantContext.Provider value={value}>
                {children}
            </TenantContext.Provider>
        </QueryClientProvider>
    )
}
