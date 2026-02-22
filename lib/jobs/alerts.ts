import { logger } from '@/lib/monitoring/logger'

/**
 * Alerts job: send email (e.g. via Resend) for SLA breach, at-risk, hold release, etc.
 * Graceful degradation: if RESEND_API_KEY is placeholder or missing, log to console only.
 */
export async function sendAlert(params: {
    to: string[]
    subject: string
    body: string
    eventType?: string
}): Promise<{ sent: boolean }> {
    const key = process.env.RESEND_API_KEY ?? ''
    if (!key || key.startsWith('re_placeholder')) {
        logger.info('Alert (email skipped in dev)', { to: params.to, subject: params.subject, module: 'jobs:alerts' })
        console.log('[ALERT]', params.subject, '→', params.to.join(', '), '\n', params.body.slice(0, 200))
        return { sent: false }
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM ?? 'PV-OpsHub <alerts@example.com>',
                to: params.to,
                subject: params.subject,
                html: params.body.replace(/\n/g, '<br/>'),
            }),
        })
        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Resend API ${res.status}: ${text}`)
        }
        return { sent: true }
    } catch (err) {
        logger.error('Alert send failed', err as Error, { module: 'jobs:alerts' })
        return { sent: false }
    }
}

export async function runAlertsProcessor(jobData: { eventType: string; tenantId: string; payload?: Record<string, unknown> }): Promise<void> {
    const { eventType, tenantId, payload } = jobData
    // Resolve tenant admins / PMs to notify (would query User where tenantId and role in [TENANT_ADMIN, PROJECT_MANAGER])
    const to: string[] = (payload?.to as string[]) ?? []
    const subject = `PV-OpsHub: ${eventType}`
    const body = `Tenant: ${tenantId}\nEvent: ${eventType}\nPayload: ${JSON.stringify(payload ?? {})}`
    await sendAlert({ to: to.length ? to : ['no-reply@example.com'], subject, body, eventType })
}
