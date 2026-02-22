'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'

interface UserRow {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    dailyCaseLimit: number
    createdAt: string
}

const roleColors: Record<string, string> = {
    SUPER_ADMIN: '#DC2626', TENANT_ADMIN: '#9333EA', PROJECT_MANAGER: '#2563EB',
    QUALITY_MANAGER: '#059669', OPS_MANAGER: '#0891B2', TEAM_LEAD: '#D97706', PROCESSOR: '#6B7280',
}

export default function UsersPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const res = await fetch('/api/admin/users')
            if (!res.ok) throw new Error('Failed to fetch users')
            return res.json() as Promise<{ data: UserRow[] }>
        },
    })

    const users: UserRow[] = (data?.data ?? []) as UserRow[]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        {isLoading ? 'Loading...' : `${users.length} users in this tenant`}
                    </p>
                </div>
                <Button><UserPlus className="h-4 w-4 mr-2" /> Add User</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="p-3 text-left font-medium">Name</th>
                                    <th className="p-3 text-left font-medium">Email</th>
                                    <th className="p-3 text-center font-medium">Role</th>
                                    <th className="p-3 text-center font-medium">Daily Limit</th>
                                    <th className="p-3 text-center font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-medium flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                            </div>
                                            {u.name}
                                        </td>
                                        <td className="p-3 text-muted-foreground">{u.email}</td>
                                        <td className="p-3 text-center">
                                            <Badge style={{ backgroundColor: `${roleColors[u.role] ?? '#6B7280'}15`, color: roleColors[u.role] ?? '#6B7280', borderColor: `${roleColors[u.role] ?? '#6B7280'}30` }}>
                                                {u.role.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-center font-mono text-muted-foreground">
                                            {u.dailyCaseLimit > 0 ? u.dailyCaseLimit : '—'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Badge variant={u.isActive ? 'success' : 'secondary'} className="text-xs">
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            <Users className="mx-auto h-8 w-8 mb-2" />
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
