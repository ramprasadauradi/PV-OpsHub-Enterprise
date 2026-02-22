'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import TenantProvider, { useTenant } from '@/components/layout/TenantProvider'

function DashboardShell({ children }: { children: React.ReactNode }) {
    const { tenantName, userName, userRole } = useTenant()

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar userRole={userRole} />
            <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
                <Topbar
                    tenantName={tenantName || 'PV-OpsHub'}
                    userName={userName || 'User'}
                    userRole={userRole || 'TEAM_LEAD'}
                />
                <main className="flex-1 overflow-y-auto p-6 bg-background">
                    <div className="mx-auto max-w-[1440px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default function DashboardLayoutClient({
    session,
    children,
}: {
    session: Session | null
    children: React.ReactNode
}) {
    return (
        <SessionProvider session={session}>
            <TenantProvider>
                <DashboardShell>{children}</DashboardShell>
            </TenantProvider>
        </SessionProvider>
    )
}
