'use client'

import React, { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Bell, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopbarProps {
    tenantName?: string
    userName?: string
    userRole?: string
    onRefresh?: () => void
}

export default function Topbar({
    tenantName = 'PV-OpsHub',
    userName = 'User',
    userRole = 'TEAM_LEAD',
    onRefresh,
}: TopbarProps) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const roleLabel = userRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const initials = userName.charAt(0).toUpperCase()

    // Static avatar shown during SSR and before hydration
    const staticAvatar = (
        <div className="flex items-center gap-2 ml-2 pl-2 border-l">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {initials}
            </div>
            <div className="hidden md:block">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
        </div>
    )

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold">{tenantName}</h1>
                <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {roleLabel}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh data">
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="relative" title="Notifications">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        3
                    </span>
                </Button>

                {/* User menu — only mount dropdown after hydration to prevent SSR mismatch */}
                {!mounted ? staticAvatar : (
                    <div className="ml-2 pl-2 border-l">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted outline-none">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                                        {initials}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium leading-none">{userName}</p>
                                        <p className="text-xs text-muted-foreground">{roleLabel}</p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{userName}</p>
                                        <p className="text-xs text-muted-foreground">{roleLabel} · {tenantName}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </header>
    )
}
