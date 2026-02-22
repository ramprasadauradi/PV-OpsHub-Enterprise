// lib/utils.ts — shadcn/ui utility
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function daysRemaining(deadline: Date | string): number {
    const now = new Date()
    const dl = new Date(deadline)
    const diff = dl.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function slaColor(daysLeft: number): 'green' | 'amber' | 'red' {
    if (daysLeft < 3) return 'red'
    if (daysLeft <= 7) return 'amber'
    return 'green'
}

export function generateReferenceId(year: number, seq: number): string {
    return `REF-${year}-${String(seq).padStart(6, '0')}`
}

export function generateCaseNumber(year: number, seq: number): string {
    return `PV-${year}-${String(seq).padStart(4, '0')}`
}

export function getSLAColor(riskScore: number): 'green' | 'amber' | 'red' {
    if (riskScore >= 75) return 'red'
    if (riskScore >= 50) return 'amber'
    return 'green'
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
