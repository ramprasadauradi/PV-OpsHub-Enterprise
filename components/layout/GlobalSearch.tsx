'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, Users, BarChart3, Shield, Command } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface SearchResult {
    id: string
    type: 'case' | 'user' | 'report' | 'page'
    title: string
    subtitle: string
    url: string
}

const QUICK_LINKS: SearchResult[] = [
    { id: 'ql-1', type: 'page', title: 'Dashboard', subtitle: 'Team Lead Dashboard', url: '/dashboard' },
    { id: 'ql-2', type: 'page', title: 'Cases', subtitle: 'Case Management', url: '/cases' },
    { id: 'ql-3', type: 'page', title: 'Allocation', subtitle: 'Smart Allocation Engine', url: '/allocation' },
    { id: 'ql-4', type: 'page', title: 'SLA Monitor', subtitle: 'SLA Heatmap & Forecast', url: '/sla' },
    { id: 'ql-5', type: 'page', title: 'Quality', subtitle: 'Corrections & CAPA', url: '/quality' },
    { id: 'ql-6', type: 'page', title: 'Reports', subtitle: 'Export Center', url: '/reports' },
    { id: 'ql-7', type: 'page', title: 'Audit Trail', subtitle: '21 CFR Part 11', url: '/audit' },
    { id: 'ql-8', type: 'page', title: 'Admin', subtitle: 'Tenant Configuration', url: '/admin/users' },
]

const TYPE_ICONS = {
    case: FileText,
    user: Users,
    report: BarChart3,
    page: Shield,
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100)
            setQuery('')
            setResults([])
            setSelectedIndex(0)
        }
    }, [open])

    // Search with debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const timer = setTimeout(async () => {
            setIsLoading(true)
            try {
                // Filter quick links first
                const localResults = QUICK_LINKS.filter(
                    (ql) =>
                        ql.title.toLowerCase().includes(query.toLowerCase()) ||
                        ql.subtitle.toLowerCase().includes(query.toLowerCase())
                )

                // API search for cases
                if (query.length >= 2) {
                    try {
                        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
                        if (res.ok) {
                            const data = await res.json()
                            const apiResults: SearchResult[] = (data.results || []).map((r: any) => ({
                                id: r.id,
                                type: r.type || 'case',
                                title: r.title || r.referenceId || r.caseNumber,
                                subtitle: r.subtitle || `${r.productName} — ${r.currentStage}`,
                                url: r.url || `/cases/${r.id}`,
                            }))
                            setResults([...localResults, ...apiResults].slice(0, 10))
                        } else {
                            setResults(localResults)
                        }
                    } catch {
                        setResults(localResults)
                    }
                } else {
                    setResults(localResults)
                }
            } finally {
                setIsLoading(false)
            }
        }, 200)

        return () => clearTimeout(timer)
    }, [query])

    const navigate = useCallback(
        (result: SearchResult) => {
            setOpen(false)
            router.push(result.url)
        },
        [router]
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const displayResults = query.trim() ? results : QUICK_LINKS
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex((i) => Math.min(i + 1, displayResults.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
                e.preventDefault()
                const selected = displayResults[selectedIndex]
                if (selected) navigate(selected)
            } else if (e.key === 'Escape') {
                setOpen(false)
            }
        },
        [query, results, selectedIndex, navigate]
    )

    const displayResults = query.trim() ? results : QUICK_LINKS

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground w-64"
            >
                <Search className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Search cases, pages...</span>
                <kbd className="pointer-events-none flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
                    <Command className="h-3 w-3" />K
                </kbd>
            </button>

            {/* Search Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden p-0 sm:max-w-[540px] gap-0" hideCloseButton>
                    <div className="flex items-center border-b px-4">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setSelectedIndex(0)
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search cases, users, or navigate..."
                            className="flex-1 h-12 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                        {!query.trim() && (
                            <div className="px-3 py-2">
                                <p className="text-xs font-medium text-muted-foreground px-2 py-1">Quick Links</p>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex items-center justify-center py-6">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        )}

                        {!isLoading && query.trim() && results.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Search className="h-8 w-8 mb-2 opacity-40" />
                                <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
                            </div>
                        )}

                        {!isLoading &&
                            displayResults.map((result, index) => {
                                const Icon = TYPE_ICONS[result.type]
                                return (
                                    <button
                                        key={result.id}
                                        className={cn(
                                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                            index === selectedIndex
                                                ? 'bg-accent text-accent-foreground'
                                                : 'hover:bg-muted/50'
                                        )}
                                        onClick={() => navigate(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{result.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                        </div>
                                        <span className="text-[10px] uppercase text-muted-foreground font-medium">
                                            {result.type}
                                        </span>
                                    </button>
                                )
                            })}
                    </div>

                    <div className="flex items-center justify-between border-t px-4 py-2 text-[10px] text-muted-foreground">
                        <div className="flex gap-3">
                            <span>↑↓ Navigate</span>
                            <span>↵ Select</span>
                            <span>Esc Close</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
