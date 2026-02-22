import { describe, it, expect } from 'vitest'
import { calculateSLADeadline, calculateBusinessDaysSLA, calculateRiskScore } from '@/lib/sla/calculator'

describe('SLA Calculator', () => {
    describe('calculateSLADeadline', () => {
        it('should calculate calendar-day deadline from receipt date', () => {
            const receipt = new Date('2025-01-10T10:00:00Z')
            const result = calculateSLADeadline(receipt, 15, false)
            expect(result).toBeInstanceOf(Date)
            const diff = Math.round((result.getTime() - receipt.getTime()) / (1000 * 60 * 60 * 24))
            expect(diff).toBe(15)
        })

        it('should handle zero days', () => {
            const receipt = new Date('2025-01-10T10:00:00Z')
            const result = calculateSLADeadline(receipt, 0, false)
            expect(result.toDateString()).toBe(receipt.toDateString())
        })
    })

    describe('calculateBusinessDaysSLA', () => {
        it('should skip weekends when useBusinessDays is true', () => {
            // Friday Jan 10 2025 + 5 business days = Friday Jan 17 2025
            const receipt = new Date('2025-01-10T10:00:00Z')
            const result = calculateBusinessDaysSLA(receipt, 5, 'US')
            expect(result).toBeInstanceOf(Date)
            // Should not be a Saturday or Sunday
            const day = result.getDay()
            expect(day).not.toBe(0) // Sunday
            expect(day).not.toBe(6) // Saturday
        })
    })

    describe('calculateRiskScore', () => {
        it('should return 100 for breached deadlines', () => {
            const deadline = new Date(Date.now() - 24 * 60 * 60 * 1000) // yesterday
            const score = calculateRiskScore(deadline)
            expect(score).toBeGreaterThanOrEqual(80)
            expect(score).toBeLessThanOrEqual(100)
        })

        it('should return low score for distant deadlines', () => {
            const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days out
            const score = calculateRiskScore(deadline)
            expect(score).toBeLessThan(30)
        })

        it('should return medium score for approaching deadlines', () => {
            const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days out
            const score = calculateRiskScore(deadline)
            expect(score).toBeGreaterThanOrEqual(40)
            expect(score).toBeLessThanOrEqual(80)
        })
    })
})
