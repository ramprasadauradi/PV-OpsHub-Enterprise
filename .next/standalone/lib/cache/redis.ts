import Redis from 'ioredis'
import { logger } from '@/lib/monitoring/logger'

let redisClient: Redis | null = null

function createRedisClient(): Redis | null {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
        logger.warn('REDIS_URL not configured — caching disabled', { module: 'redis' })
        return null
    }

    try {
        const client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            retryStrategy(times: number) {
                if (times > 10) {
                    logger.error('Redis max retries exceeded — giving up', undefined, { module: 'redis', retries: times })
                    return null
                }
                const delay = Math.min(times * 200, 5000)
                return delay
            },
            reconnectOnError(err: Error) {
                const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT']
                return targetErrors.some((e) => err.message.includes(e))
            },
            lazyConnect: true,
        })

        client.on('connect', () => {
            logger.info('Redis connected', { module: 'redis' })
        })

        client.on('error', (err: Error) => {
            logger.error('Redis connection error', err, { module: 'redis' })
        })

        client.on('close', () => {
            logger.warn('Redis connection closed', { module: 'redis' })
        })

        client.connect().catch((err: Error) => {
            logger.error('Redis initial connection failed', err, { module: 'redis' })
        })

        return client
    } catch (error) {
        logger.error('Failed to create Redis client', error, { module: 'redis' })
        return null
    }
}

export function getRedisClient(): Redis | null {
    if (!redisClient) {
        redisClient = createRedisClient()
    }
    return redisClient
}

export async function closeRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
        logger.info('Redis connection closed gracefully', { module: 'redis' })
    }
}

if (typeof process !== 'undefined') {
    const shutdown = () => {
        closeRedis().catch(() => { })
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
}
