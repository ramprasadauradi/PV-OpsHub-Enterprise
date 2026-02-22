'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Lock, Mail, Shield } from 'lucide-react'

const DEMO_ACCOUNTS = [
    { email: 'admin@induspv.com', role: 'Admin' },
    { email: 'pm1@induspv.com', role: 'Project Manager' },
    { email: 'qm1@induspv.com', role: 'Quality Manager' },
    { email: 'tl1@induspv.com', role: 'Team Lead' },
    { email: 'proc01@induspv.com', role: 'Processor' },
]
const DEMO_PASSWORD = 'Demo@123456!'
const DEMO_HINT = 'Demo Accounts (password: Demo@123456!)'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push('/')
                router.refresh()
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleQuickLogin = (demoEmail: string) => {
        setEmail(demoEmail)
        setPassword(DEMO_PASSWORD)
    }

    return (
        <div className="w-full max-w-md mx-auto px-4">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4 shadow-lg">
                    PV
                </div>
                <h1 className="text-3xl font-bold tracking-tight">PV-OpsHub</h1>
                <p className="text-muted-foreground mt-1">Pharmacovigilance Operations Platform</p>
            </div>

            <Card className="shadow-xl border-0">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Sign In
                    </CardTitle>
                    <CardDescription>
                        Enter your credentials to access the platform
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                    <div className="w-full">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1" suppressHydrationWarning>
                            <Shield className="h-3 w-3" />
                            {DEMO_HINT}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {DEMO_ACCOUNTS.map((demo) => (
                                <button
                                    key={demo.email}
                                    onClick={() => handleQuickLogin(demo.email)}
                                    className="rounded-md border bg-muted/50 px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                                >
                                    <span className="font-medium">{demo.role}</span>
                                    <br />
                                    <span className="text-muted-foreground">{demo.email.split('@')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </CardFooter>
            </Card>

            <p className="text-center text-xs text-muted-foreground mt-6">
                21 CFR Part 11 Compliant • AES-256 Encrypted • Multi-Tenant Isolated
            </p>
        </div>
    )
}
