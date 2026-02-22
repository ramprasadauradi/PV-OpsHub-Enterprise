'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
    label: string
    value: string | number
    change?: number
    changeLabel?: string
    icon?: React.ReactNode
    color?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'default'
    size?: 'sm' | 'default' | 'lg'
}

const colorMap = {
    green: 'border-l-4 border-l-green-500',
    amber: 'border-l-4 border-l-amber-500',
    red: 'border-l-4 border-l-red-500',
    blue: 'border-l-4 border-l-blue-500',
    purple: 'border-l-4 border-l-purple-500',
    default: '',
}

const iconBgMap = {
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    default: 'bg-muted text-muted-foreground',
}

export default function KPICard({ label, value, change, changeLabel, icon, color = 'default', size = 'default' }: KPICardProps) {
    const TrendIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Minus
    const trendColor = change && change > 0 ? 'text-green-600' : change && change < 0 ? 'text-red-600' : 'text-muted-foreground'

    return (
        <Card className={cn('transition-shadow hover:shadow-md', colorMap[color])}>
            <CardContent className={cn('flex items-center justify-between', size === 'sm' ? 'p-4' : 'p-6')}>
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className={cn('font-bold', size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-xl' : 'text-2xl')}>{value}</p>
                    {change !== undefined && (
                        <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
                            <TrendIcon className="h-3 w-3" />
                            <span>{change > 0 ? '+' : ''}{change}%</span>
                            {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBgMap[color])}>
                        {icon}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
