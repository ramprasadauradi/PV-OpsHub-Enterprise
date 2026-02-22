import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface HealthCheck {
    name: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    latencyMs: number
    message?: string
}

async function checkDatabase(): Promise<HealthCheck> {
    const start = Date.now()
    try {
        await prisma.$queryRaw`SELECT 1`
        return {
            name: 'database',
            status: 'healthy',
            latencyMs: Date.now() - start,
        }
    } catch (error) {
        return {
            name: 'database',
            status: 'unhealthy',
            latencyMs: Date.now() - start,
            message: error instanceof Error ? error.message : 'Database connection failed',
        }
    }
}

async function checkRedis(): Promise<HealthCheck> {
    const start = Date.now()
    try {
        const redisUrl = process.env.REDIS_URL
        if (!redisUrl) {
            return {
                name: 'redis',
                status: 'degraded',
                latencyMs: 0,
                message: 'REDIS_URL not configured',
            }
        }
        const { getRedisClient } = await import('@/lib/cache/redis')
        const client = getRedisClient()
        if (!client) {
            return {
                name: 'redis',
                status: 'degraded',
                latencyMs: 0,
                message: 'Redis client not initialized',
            }
        }
        const pong = await client.ping()
        return {
            name: 'redis',
            status: pong === 'PONG' ? 'healthy' : 'degraded',
            latencyMs: Date.now() - start,
        }
    } catch (error) {
        return {
            name: 'redis',
            status: 'degraded',
            latencyMs: Date.now() - start,
            message: error instanceof Error ? error.message : 'Redis connection failed',
        }
    }
}

function checkMemory(): HealthCheck {
    const start = Date.now()
    const { heapUsed, heapTotal } = process.memoryUsage()
    const usagePercent = (heapUsed / heapTotal) * 100

    return {
        name: 'memory',
        status: usagePercent < 90 ? 'healthy' : 'degraded',
        latencyMs: Date.now() - start,
        message: `${usagePercent.toFixed(1)}% heap used (${(heapUsed / 1024 / 1024).toFixed(0)}MB / ${(heapTotal / 1024 / 1024).toFixed(0)}MB)`,
    }
}

export async function GET() {
    const timeout = 2000
    const startTime = Date.now()

    const checkWithTimeout = async (check: Promise<HealthCheck>): Promise<HealthCheck> => {
        return Promise.race([
            check,
            new Promise<HealthCheck>((resolve) =>
                setTimeout(
                    () =>
                        resolve({
                            name: 'timeout',
                            status: 'unhealthy',
                            latencyMs: timeout,
                            message: `Health check timed out after ${timeout}ms`,
                        }),
                    timeout
                )
            ),
        ])
    }

    const [dbCheck, redisCheck] = await Promise.all([
        checkWithTimeout(checkDatabase()),
        checkWithTimeout(checkRedis()),
    ])
    const memCheck = checkMemory()

    const checks = [dbCheck, redisCheck, memCheck]
    const hasUnhealthy = checks.some((c) => c.status === 'unhealthy')
    const hasDegraded = checks.some((c) => c.status === 'degraded')

    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy'

    const response = {
        status: overallStatus,
        version: process.env.APP_VERSION || '1.0.0',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startTime,
        checks: Object.fromEntries(checks.map((c) => [c.name, c])),
    }

    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200

    return NextResponse.json(response, {
        status: httpStatus,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
    })
}
