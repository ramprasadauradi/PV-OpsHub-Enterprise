import { Queue, Worker, type ConnectionOptions } from 'bullmq'

const connection: ConnectionOptions = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
}

// Parse REDIS_URL if set (e.g. redis://localhost:6379)
function getConnection(): ConnectionOptions {
    const url = process.env.REDIS_URL
    if (url) {
        try {
            const u = new URL(url)
            return {
                host: u.hostname,
                port: parseInt(u.port || '6379', 10),
                password: u.password || undefined,
            }
        } catch {
            return connection
        }
    }
    return connection
}

const conn = getConnection()

export const SLA_QUEUE_NAME = 'pv-opshub:sla-monitor'
export const HOLD_QUEUE_NAME = 'pv-opshub:hold-auto-release'
export const ALERTS_QUEUE_NAME = 'pv-opshub:alerts'

export function getSLAQueue(): Queue | null {
    try {
        return new Queue(SLA_QUEUE_NAME, { connection: conn })
    } catch (err) {
        console.warn('SLA queue unavailable (Redis?)', err)
        return null
    }
}

export function getHoldQueue(): Queue | null {
    try {
        return new Queue(HOLD_QUEUE_NAME, { connection: conn })
    } catch (err) {
        console.warn('Hold queue unavailable (Redis?)', err)
        return null
    }
}

export function getAlertsQueue(): Queue | null {
    try {
        return new Queue(ALERTS_QUEUE_NAME, { connection: conn })
    } catch (err) {
        console.warn('Alerts queue unavailable (Redis?)', err)
        return null
    }
}

export function createWorker(name: string, processor: (job: { id: string; data: Record<string, unknown> }) => Promise<void>): Worker | null {
    const queueName = name === 'sla' ? SLA_QUEUE_NAME : name === 'hold' ? HOLD_QUEUE_NAME : ALERTS_QUEUE_NAME
    try {
        return new Worker(
            queueName,
            async (job) => {
                await processor({ id: job.id ?? '', data: (job.data as Record<string, unknown>) ?? {} })
            },
            { connection: conn }
        )
    } catch (err) {
        console.warn(`Worker ${name} unavailable (Redis?)`, err)
        return null
    }
}
