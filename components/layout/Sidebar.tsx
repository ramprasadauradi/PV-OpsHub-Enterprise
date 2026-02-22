'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard, FileText, Users, Settings, Shield,
    BarChart3, AlertTriangle, ClipboardList, ChevronLeft,
    ChevronRight, Kanban, Target, BookOpen, Download,
    Activity, Scale, LogOut, TrendingUp, Workflow,
} from 'lucide-react'

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    roles?: string[]
}

interface NavGroup {
    title: string
    items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: 'Operations',
        items: [
            { label: 'Pipeline View', href: '/cases/pipeline', icon: Kanban },
            { label: 'Case Management', href: '/cases', icon: FileText },
            { label: 'Allocation', href: '/allocation', icon: Target },
        ],
    },
    {
        title: 'Dashboards',
        items: [
            { label: 'Team Lead', href: '/dashboard/tl', icon: LayoutDashboard },
            { label: 'Manager', href: '/dashboard/manager', icon: BarChart3 },
            { label: 'Project', href: '/dashboard/project', icon: Activity },
        ],
    },
    {
        title: 'Quality',
        items: [
            { label: 'Corrections', href: '/quality/corrections', icon: AlertTriangle },
            { label: 'CAPA', href: '/quality/capa', icon: Shield },
        ],
    },
    {
        title: 'Analytics',
        items: [
            { label: 'Analytics', href: '/analytics', icon: TrendingUp },
            { label: 'SLA Management', href: '/sla', icon: Scale },
            { label: 'Reports & Export', href: '/reports', icon: Download },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'SLA Configuration', href: '/admin/sla-config', icon: Settings, roles: ['TENANT_ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'] },
            { label: 'Workflow Builder', href: '/admin/workflow', icon: Workflow, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
            { label: 'Report Types', href: '/admin/report-types', icon: ClipboardList, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
            { label: 'SLA Rules', href: '/admin/sla-rules', icon: Settings, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
            { label: 'Users', href: '/admin/users', icon: Users, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
            { label: 'Governance', href: '/admin/governance', icon: Shield, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
        ],
    },
    {
        title: 'Compliance',
        items: [
            { label: 'Audit Trail', href: '/audit', icon: BookOpen, roles: ['TENANT_ADMIN', 'PROJECT_MANAGER', 'QUALITY_MANAGER'] },
        ],
    },
]

interface SidebarProps {
    userRole?: string
}

export default function Sidebar({ userRole = 'TEAM_LEAD' }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Mobile bottom nav
    if (isMobile) {
        const mobileItems: NavItem[] = [
            { label: 'Pipeline', href: '/cases/pipeline', icon: Kanban },
            { label: 'Cases', href: '/cases', icon: FileText },
            { label: 'Dashboard', href: '/dashboard/tl', icon: LayoutDashboard },
            { label: 'Analytics', href: '/analytics', icon: TrendingUp },
            { label: 'More', href: '/sla', icon: BarChart3 },
        ]
        return (
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card flex items-center justify-around h-16 md:hidden">
                {mobileItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors',
                                isActive ? 'text-primary' : 'text-muted-foreground'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        )
    }

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 flex flex-col',
                collapsed ? 'w-[60px]' : 'w-[240px]'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                        PV
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-lg tracking-tight">OpsHub</span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                {NAV_GROUPS.map((group) => {
                    const visibleItems = group.items.filter(
                        (item) => !item.roles || item.roles.includes(userRole)
                    )
                    if (visibleItems.length === 0) return null

                    return (
                        <div key={group.title} className="mb-4">
                            {!collapsed && (
                                <h3 className="mb-1 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {group.title}
                                </h3>
                            )}
                            {visibleItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href + item.label}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                                            isActive && 'bg-accent text-accent-foreground border-r-2 border-primary',
                                            collapsed && 'justify-center px-2'
                                        )}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {!collapsed && <span>{item.label}</span>}
                                    </Link>
                                )
                            })}
                        </div>
                    )
                })}
            </nav>

            {/* Sign Out button */}
            <div className="border-t px-2 py-2">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className={cn(
                        'flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors',
                        collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? 'Sign Out' : undefined}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex h-12 items-center justify-center border-t text-muted-foreground hover:text-foreground transition-colors"
            >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
        </aside>
    )
}
