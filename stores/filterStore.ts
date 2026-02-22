import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilterState {
    caseFilters: Record<string, string | string[] | undefined>
    setCaseFilter: (key: string, value: string | string[] | undefined) => void
    clearCaseFilters: () => void
    allocationFilters: Record<string, string | string[] | undefined>
    setAllocationFilter: (key: string, value: string | string[] | undefined) => void
    clearAllocationFilters: () => void
}

export const useFilterStore = create<FilterState>()(
    persist(
        (set) => ({
            caseFilters: {},
            setCaseFilter: (key, value) =>
                set((state) => ({
                    caseFilters: { ...state.caseFilters, [key]: value },
                })),
            clearCaseFilters: () => set({ caseFilters: {} }),
            allocationFilters: {},
            setAllocationFilter: (key, value) =>
                set((state) => ({
                    allocationFilters: { ...state.allocationFilters, [key]: value },
                })),
            clearAllocationFilters: () => set({ allocationFilters: {} }),
        }),
        { name: 'pv-opshub-filters' }
    )
)
