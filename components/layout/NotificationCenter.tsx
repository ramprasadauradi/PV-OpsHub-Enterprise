'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, AlertTriangle, Clock, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'critical' | 'success'
    read: boolean
    createdAt: string
    entityType?: string
    entityId?: string
}

const TYPE_ICONS = {
    info: Info,
    warning: AlertTriangle,
    critical: AlertTriangle,
    success: Check,
}

const TYPE_COLORS = {
    info: 'text-blue-500 bg-blue-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    critical: 'text-red-500 bg-red-500/10',
    success: 'text-emerald-500 bg-emerald-500/10',
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const unreadCount = notifications.filter((n) => !n.read).length

    // Load mock notifications (replace with real API call + Pusher subscription)
    useEffect(() => {
        const mockNotifications: Notification[] = [
            {
                id: '1',
                title: 'SLA Breach Alert',
                message: '3 cases approaching SLA deadline in next 4 hours',
                type: 'critical',
                read: false,
                createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            },
            {
                id: '2',
                title: 'New Cases Allocated',
                message: '12 new cases allocated to your team',
                type: 'info',
                read: false,
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
            {
                id: '3',
                title: 'CAPA Triggered',
                message: 'Correction threshold exceeded for Processor Kavitha — CAPA initiated',
                type: 'warning',
                read: false,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: '4',
                title: 'Hold Auto-Released',
                message: '5 cases auto-released after 24-hour hold window expired',
                type: 'success',
                read: true,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: '5',
                title: 'Weekly Report Ready',
                message: 'Scheduled PV Operations Weekly Summary is ready for download',
                type: 'info',
                read: true,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
        ]
        setNotifications(mockNotifications)
    }, [])

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
    }, [])

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }, [])

    const dismiss = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, [])

    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-9 w-9 rounded-lg"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0" sideOffset={8}>
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={markAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="max-h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => {
                                const Icon = TYPE_ICONS[notification.type]
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            'flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer group',
                                            !notification.read && 'bg-muted/30'
                                        )}
                                        onClick={() => markAsRead(notification.id)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div
                                            className={cn(
                                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                                TYPE_COLORS[notification.type]
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <p
                                                    className={cn(
                                                        'text-sm line-clamp-1',
                                                        !notification.read ? 'font-semibold' : 'font-medium'
                                                    )}
                                                >
                                                    {notification.title}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 shrink-0 ml-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        dismiss(notification.id)
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                                {!notification.read && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 ml-1" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
