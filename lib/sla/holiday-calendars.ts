/**
 * Country holiday calendars for SLA business day calculations.
 * Dates for 2025-2026. In production, would be loaded from a config service.
 */
export const COUNTRY_HOLIDAYS: Record<string, Date[]> = {
    IN: [
        // India 2025
        new Date('2025-01-26'), // Republic Day
        new Date('2025-03-14'), // Holi
        new Date('2025-04-14'), // Ambedkar Jayanti
        new Date('2025-04-18'), // Good Friday
        new Date('2025-05-01'), // May Day
        new Date('2025-08-15'), // Independence Day
        new Date('2025-10-02'), // Gandhi Jayanti
        new Date('2025-10-20'), // Dussehra
        new Date('2025-11-05'), // Diwali
        new Date('2025-12-25'), // Christmas
        // India 2026
        new Date('2026-01-26'),
        new Date('2026-03-03'),
        new Date('2026-04-14'),
        new Date('2026-04-03'),
        new Date('2026-05-01'),
        new Date('2026-08-15'),
        new Date('2026-10-02'),
        new Date('2026-10-09'),
        new Date('2026-10-24'),
        new Date('2026-12-25'),
    ],
    US: [
        // US 2025
        new Date('2025-01-01'), // New Year
        new Date('2025-01-20'), // MLK Day
        new Date('2025-02-17'), // Presidents Day
        new Date('2025-05-26'), // Memorial Day
        new Date('2025-06-19'), // Juneteenth
        new Date('2025-07-04'), // Independence Day
        new Date('2025-09-01'), // Labor Day
        new Date('2025-11-27'), // Thanksgiving
        new Date('2025-12-25'), // Christmas
        // US 2026
        new Date('2026-01-01'),
        new Date('2026-01-19'),
        new Date('2026-02-16'),
        new Date('2026-05-25'),
        new Date('2026-06-19'),
        new Date('2026-07-04'),
        new Date('2026-09-07'),
        new Date('2026-11-26'),
        new Date('2026-12-25'),
    ],
    GB: [
        // UK 2025
        new Date('2025-01-01'),
        new Date('2025-04-18'),
        new Date('2025-04-21'),
        new Date('2025-05-05'),
        new Date('2025-05-26'),
        new Date('2025-08-25'),
        new Date('2025-12-25'),
        new Date('2025-12-26'),
    ],
    DE: [
        new Date('2025-01-01'),
        new Date('2025-04-18'),
        new Date('2025-04-21'),
        new Date('2025-05-01'),
        new Date('2025-05-29'),
        new Date('2025-06-09'),
        new Date('2025-10-03'),
        new Date('2025-12-25'),
        new Date('2025-12-26'),
    ],
    // Full names (case.country from seed/factories)
    INDIA: [
        new Date('2025-01-26'), new Date('2025-03-14'), new Date('2025-04-14'), new Date('2025-04-18'),
        new Date('2025-05-01'), new Date('2025-08-15'), new Date('2025-10-02'), new Date('2025-10-20'),
        new Date('2025-11-05'), new Date('2025-12-25'),
        new Date('2026-01-26'), new Date('2026-03-03'), new Date('2026-04-14'), new Date('2026-05-01'),
        new Date('2026-08-15'), new Date('2026-10-02'), new Date('2026-12-25'),
    ],
    'UNITED STATES': [
        new Date('2025-01-01'), new Date('2025-01-20'), new Date('2025-02-17'), new Date('2025-05-26'),
        new Date('2025-06-19'), new Date('2025-07-04'), new Date('2025-09-01'), new Date('2025-11-27'),
        new Date('2025-12-25'),
        new Date('2026-01-01'), new Date('2026-01-19'), new Date('2026-02-16'), new Date('2026-05-25'),
        new Date('2026-06-19'), new Date('2026-07-04'), new Date('2026-09-07'), new Date('2026-11-26'),
        new Date('2026-12-25'),
    ],
    FRANCE: [
        new Date('2025-01-01'), new Date('2025-04-21'), new Date('2025-05-01'), new Date('2025-05-08'),
        new Date('2025-05-29'), new Date('2025-06-09'), new Date('2025-07-14'), new Date('2025-08-15'),
        new Date('2025-11-01'), new Date('2025-11-11'), new Date('2025-12-25'),
    ],
    ITALY: [
        new Date('2025-01-01'), new Date('2025-04-21'), new Date('2025-04-25'), new Date('2025-05-01'),
        new Date('2025-06-02'), new Date('2025-08-15'), new Date('2025-11-01'), new Date('2025-12-08'),
        new Date('2025-12-25'), new Date('2025-12-26'),
    ],
    SPAIN: [
        new Date('2025-01-01'), new Date('2025-04-18'), new Date('2025-04-21'), new Date('2025-05-01'),
        new Date('2025-08-15'), new Date('2025-10-12'), new Date('2025-11-01'), new Date('2025-12-06'),
        new Date('2025-12-08'), new Date('2025-12-25'),
    ],
    JAPAN: [
        new Date('2025-01-01'), new Date('2025-01-13'), new Date('2025-02-11'), new Date('2025-02-24'),
        new Date('2025-03-20'), new Date('2025-04-29'), new Date('2025-05-03'), new Date('2025-05-04'),
        new Date('2025-05-05'), new Date('2025-07-21'), new Date('2025-08-11'), new Date('2025-09-15'),
        new Date('2025-09-23'), new Date('2025-10-13'), new Date('2025-11-03'), new Date('2025-11-23'),
        new Date('2025-12-23'),
    ],
    AUSTRALIA: [
        new Date('2025-01-01'), new Date('2025-01-26'), new Date('2025-03-10'), new Date('2025-04-18'),
        new Date('2025-04-21'), new Date('2025-04-25'), new Date('2025-06-09'), new Date('2025-12-25'),
        new Date('2025-12-26'),
    ],
    CANADA: [
        new Date('2025-01-01'), new Date('2025-02-17'), new Date('2025-04-18'), new Date('2025-05-19'),
        new Date('2025-06-24'), new Date('2025-07-01'), new Date('2025-08-04'), new Date('2025-09-01'),
        new Date('2025-10-13'), new Date('2025-11-11'), new Date('2025-12-25'),
    ],
    'UNITED KINGDOM': [
        new Date('2025-01-01'), new Date('2025-04-18'), new Date('2025-04-21'), new Date('2025-05-05'),
        new Date('2025-05-26'), new Date('2025-08-25'), new Date('2025-12-25'), new Date('2025-12-26'),
    ],
    GERMANY: [
        new Date('2025-01-01'), new Date('2025-04-18'), new Date('2025-04-21'), new Date('2025-05-01'),
        new Date('2025-05-29'), new Date('2025-06-09'), new Date('2025-10-03'), new Date('2025-12-25'),
        new Date('2025-12-26'),
    ],
    DEFAULT: [],
}
