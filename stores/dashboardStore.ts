import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardTabConfig } from '@/types'

const DEFAULT_TABS: DashboardTabConfig[] = [
    { id: 'allocation', label: 'Allocation Status', order: 0, isVisible: true },
    { id: 'havap', label: 'HA/VAP Cases', order: 1, isVisible: true },
    { id: 'aging', label: 'Case Aging', order: 2, isVisible: true },
    { id: 'quality', label: 'Quality', order: 3, isVisible: true },
    { id: 'productivity', label: 'Productivity', order: 4, isVisible: true },
    { id: 'holdstatus', label: 'Hold Status', order: 5, isVisible: true },
]

interface DashboardState {
    activeTab: string
    tabs: DashboardTabConfig[]
    refreshInterval: number
    setActiveTab: (tab: string) => void
    reorderTabs: (tabs: DashboardTabConfig[]) => void
    setRefreshInterval: (ms: number) => void
    resetTabs: () => void
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            activeTab: 'allocation',
            tabs: DEFAULT_TABS,
            refreshInterval: 15000,
            setActiveTab: (tab) => set({ activeTab: tab }),
            reorderTabs: (tabs) => set({ tabs }),
            setRefreshInterval: (ms) => set({ refreshInterval: ms }),
            resetTabs: () => set({ tabs: DEFAULT_TABS, activeTab: 'allocation' }),
        }),
        { name: 'pv-opshub-dashboard' }
    )
)
