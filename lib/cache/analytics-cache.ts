/**
 * Analytics Cache Layer
 * Uses in-memory cache for quick access and DB snapshots as backing store.
 * Redis can be optionally used when available.
 */

import prisma from '@/lib/prisma'

type CacheEntry = {
    data: unknown
    expiresAt: number
}

const memoryCache = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

function cacheKey(tenantId: string, chartType: string, period?: string): string {
    return `analytics:${tenantId}:${chartType}${period ? `:${period}` : ''}`
}

export async function getCachedAnalytics(
    tenantId: string,
    chartType: string,
    period?: string,
): Promise<unknown | null> {
    const key = cacheKey(tenantId, chartType, period)

    // Check memory cache
    const memEntry = memoryCache.get(key)
    if (memEntry && memEntry.expiresAt > Date.now()) {
        return memEntry.data
    }

    // Check DB snapshot
    const snapshot = await prisma.analyticsSnapshot.findFirst({
        where: {
            tenantId,
            snapshotType: chartType,
            ...(period ? { period } : {}),
            expiresAt: { gt: new Date() },
        },
        orderBy: { computedAt: 'desc' },
    })

    if (snapshot) {
        memoryCache.set(key, { data: snapshot.data, expiresAt: Date.now() + DEFAULT_TTL_MS })
        return snapshot.data
    }

    return null
}

export async function setCachedAnalytics(
    tenantId: string,
    chartType: string,
    data: unknown,
    period?: string,
    ttlMs = DEFAULT_TTL_MS,
): Promise<void> {
    const key = cacheKey(tenantId, chartType, period)
    memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs })

    // Store in DB
    await prisma.analyticsSnapshot.create({
        data: {
            tenantId,
            snapshotType: chartType,
            period: period ?? new Date().toISOString().slice(0, 7),
            data: data as object,
            expiresAt: new Date(Date.now() + ttlMs),
        },
    }).catch(() => {
        // Silently fail if DB write fails
    })
}

export function invalidateCache(tenantId: string, chartType?: string): void {
    if (chartType) {
        for (const key of memoryCache.keys()) {
            if (key.startsWith(`analytics:${tenantId}:${chartType}`)) {
                memoryCache.delete(key)
            }
        }
    } else {
        for (const key of memoryCache.keys()) {
            if (key.startsWith(`analytics:${tenantId}`)) {
                memoryCache.delete(key)
            }
        }
    }
}
