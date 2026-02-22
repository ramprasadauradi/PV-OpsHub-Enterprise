export const CacheKeys = {
    dashboard: {
        tl: (tenantId: string, tlId: string, tab: string) => `tl:${tenantId}:${tlId}:${tab}`,
        manager: (tenantId: string) => `mgr:${tenantId}`,
        project: (tenantId: string, period: string) => `proj:${tenantId}:${period}`,
    },
    cases: {
        list: (tenantId: string, filterHash: string) => `cases:${tenantId}:${filterHash}`,
        detail: (tenantId: string, caseId: string) => `case:${tenantId}:${caseId}`,
        counts: (tenantId: string) => `counts:${tenantId}`,
    },
    sla: {
        heatmap: (tenantId: string) => `sla:heatmap:${tenantId}`,
        forecast: (tenantId: string) => `sla:forecast:${tenantId}`,
        rules: (tenantId: string) => `sla:rules:${tenantId}`,
    },
    leaderboard: {
        week: (tenantId: string) => `lb:week:${tenantId}`,
        month: (tenantId: string) => `lb:month:${tenantId}`,
        ytd: (tenantId: string) => `lb:ytd:${tenantId}`,
    },
    allocation: {
        suggestions: (tenantId: string, caseId: string) => `alloc:suggest:${tenantId}:${caseId}`,
        holdStatus: (tenantId: string) => `hold:${tenantId}`,
        capacity: (tenantId: string) => `capacity:${tenantId}`,
    },
    notifications: {
        unreadCount: (tenantId: string, userId: string) => `notif:unread:${tenantId}:${userId}`,
    },
} as const

export const TTL = {
    DASHBOARD: 30,
    CASE_LIST: 15,
    CASE_DETAIL: 60,
    CASE_COUNTS: 20,
    SLA_HEATMAP: 30,
    SLA_FORECAST: 30,
    SLA_RULES: 3600,
    LEADERBOARD: 300,
    SUGGESTIONS: 120,
    HOLD_STATUS: 5,
    CAPACITY: 10,
    NOTIFICATIONS: 60,
} as const
