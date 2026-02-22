import { headers } from 'next/headers'

export interface TenantContext {
    tenantId: string
    userId: string
    userRole: string
    userName: string
    userEmail: string
}

export async function getTenantFromHeaders(): Promise<TenantContext | null> {
    const headersList = await headers()
    const tenantId = headersList.get('x-tenant-id')
    const userId = headersList.get('x-user-id')
    const userRole = headersList.get('x-user-role')
    const userName = headersList.get('x-user-name')
    const userEmail = headersList.get('x-user-email')

    if (!tenantId || !userId || !userRole) {
        return null
    }

    return {
        tenantId,
        userId,
        userRole,
        userName: userName ?? 'Unknown',
        userEmail: userEmail ?? '',
    }
}

export function buildTenantWhere(tenantId: string): { tenantId: string } {
    return { tenantId }
}

export function injectTenantId<T extends Record<string, unknown>>(
    data: T,
    tenantId: string
): T & { tenantId: string } {
    return { ...data, tenantId }
}
