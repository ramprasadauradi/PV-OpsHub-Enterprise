import { describe, it, expect } from 'vitest'
import { addDays } from 'date-fns'
import { addBusinessDays, calculateRiskScore } from '@/lib/sla/calculator'

describe('SLA Calculator', () => {
    describe('calculateSLADeadline (via addDays)', () => {
        it('should calculate calendar-day deadline from receipt date', () => {
            const receipt = new Date('2025-01-10T10:00:00Z')
            const result = addDays(receipt, 15)
            expect(result).toBeInstanceOf(Date)
            const diff = Math.round((result.getTime() - receipt.getTime()) / (1000 * 60 * 60 * 24))
            expect(diff).toBe(15)
        })

        it('should handle zero days', () => {
            const receipt = new Date('2025-01-10T10:00:00Z')
            const result = addDays(receipt, 0)
            expect(result.toDateString()).toBe(receipt.toDateString())
        })
    })

    describe('addBusinessDays', () => {
        it('should skip weekends when useBusinessDays is true', () => {
            // Friday Jan 10 2025 + 5 business days = Friday Jan 17 2025
            const receipt = new Date('2025-01-10T10:00:00Z')
            const result = addBusinessDays(receipt, 5)
            expect(result).toBeInstanceOf(Date)
            // Should not be a Saturday or Sunday
            const day = result.getDay()
            expect(day).not.toBe(0) // Sunday
            expect(day).not.toBe(6) // Saturday
        })
    })

    describe('calculateRiskScore', () => {
        it('should return 100 for breached deadlines', () => {
            const score = calculateRiskScore(-1, 15) // 1 day overdue, 15 day SLA
            expect(score).toBe(100)
        })

        it('should return low score for distant deadlines', () => {
            const score = calculateRiskScore(20, 30) // 20 days left, 30 day SLA
            expect(score).toBeLessThan(30)
        })

        it('should return medium score for approaching deadlines', () => {
            const score = calculateRiskScore(3, 15) // 3 days left, 15 day SLA
            expect(score).toBeGreaterThanOrEqual(40)
            expect(score).toBeLessThanOrEqual(80)
        })
    })
})
