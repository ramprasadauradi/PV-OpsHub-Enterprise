import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TenantState {
    tenantId: string
    tenantName: string
    timezone: string
    refreshIntervalSec: number
    setTenant: (id: string, name: string, tz: string) => void
    setRefreshInterval: (sec: number) => void
}

export const useTenantStore = create<TenantState>()(
    persist(
        (set) => ({
            tenantId: '',
            tenantName: '',
            timezone: 'UTC',
            refreshIntervalSec: 15,
            setTenant: (id, name, tz) =>
                set({ tenantId: id, tenantName: name, timezone: tz }),
            setRefreshInterval: (sec) =>
                set({ refreshIntervalSec: sec }),
        }),
        { name: 'pv-opshub-tenant' }
    )
)
