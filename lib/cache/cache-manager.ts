import { getRedisClient } from './redis'
import { logger } from '@/lib/monitoring/logger'

const log = logger.child({ module: 'cache' })

export async function cacheGet<T>(key: string): Promise<T | null> {
    const client = getRedisClient()
    if (!client) return null

    try {
        const raw = await client.get(key)
        if (!raw) return null
        return JSON.parse(raw) as T
    } catch (error) {
        log.error(`Cache get failed: ${key}`, error)
        return null
    }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const client = getRedisClient()
    if (!client) return

    try {
        const serialized = JSON.stringify(value)
        await client.set(key, serialized, 'EX', ttlSeconds)
    } catch (error) {
        log.error(`Cache set failed: ${key}`, error)
    }
}

export async function cacheGetOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
): Promise<T> {
    const cached = await cacheGet<T>(key)
    if (cached !== null) {
        return cached
    }

    const fresh = await fetcher()
    await cacheSet(key, fresh, ttlSeconds)
    return fresh
}

export async function cacheInvalidate(key: string): Promise<void> {
    const client = getRedisClient()
    if (!client) return

    try {
        await client.del(key)
        log.debug(`Cache invalidated: ${key}`)
    } catch (error) {
        log.error(`Cache invalidate failed: ${key}`, error)
    }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
    const client = getRedisClient()
    if (!client) return

    try {
        let cursor = '0'
        let totalDeleted = 0

        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
            cursor = nextCursor

            if (keys.length > 0) {
                await client.del(...keys)
                totalDeleted += keys.length
            }
        } while (cursor !== '0')

        if (totalDeleted > 0) {
            log.debug(`Cache invalidated ${totalDeleted} keys matching: ${pattern}`)
        }
    } catch (error) {
        log.error(`Cache invalidate pattern failed: ${pattern}`, error)
    }
}

export async function cacheInvalidateTenant(tenantId: string): Promise<void> {
    await Promise.all([
        cacheInvalidatePattern(`*:${tenantId}*`),
        cacheInvalidatePattern(`*:${tenantId}`),
    ])
    log.info(`Cache purged for tenant: ${tenantId}`)
}
