# PV-OpsHub Architecture

## System Overview

```mermaid
graph TB
    subgraph Client["Browser"]
        UI["Next.js App Router (React 19)"]
        RQ["React Query + Zustand"]
        PUSH["Pusher.js (WebSocket)"]
    end
    
    subgraph Edge["Edge Runtime"]
        MW["Middleware (Auth + Security + Rate Limit)"]
    end
    
    subgraph Server["Node.js Server"]
        API["API Routes"]
        AUTH["NextAuth v5"]
        SLA["SLA Engine"]
        ALLOC["Allocation Engine"]
        AUDIT["Audit Logger"]
        CACHE["Cache Manager"]
    end
    
    subgraph Data["Data Layer"]
        PG["PostgreSQL 16 (Prisma)"]
        RD["Redis 7"]
        PU["Pusher Channels"]
    end
    
    subgraph Infra["Infrastructure"]
        NGX["nginx (TLS + Rate Limit)"]
        DOCKER["Docker Compose"]
        GHA["GitHub Actions CI/CD"]
    end
    
    UI --> MW --> API
    API --> AUTH
    API --> SLA
    API --> ALLOC
    API --> AUDIT
    API --> CACHE
    CACHE --> RD
    API --> PG
    API --> PU
    PUSH --> PU
```

## Multi-Tenancy

- Row Level Security via Prisma middleware injection
- All queries scoped by `tenantId`
- Tenant-specific configuration (branding, SLA rules, allocation rules)

## Security

| Layer | Implementation |
|-------|----------------|
| Auth | NextAuth v5 + bcrypt + session tokens |
| RBAC | 7 roles × 30 permissions matrix |
| Encryption | AES-256-GCM (audit data at rest) |
| CSRF | httpOnly cookie + timing-safe comparison |
| Input | XSS/injection sanitization |
| Transport | TLS 1.2+ via nginx |
| Headers | CSP, HSTS, X-Frame-Options |

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|-------------|
| Dashboards | 30s | On case/allocation mutation |
| Case lists | 15s | On case create/update |
| SLA rules | 1hr | On admin config change |
| Leaderboards | 5min | Periodic refresh |

## Database Indexes

- 11 composite indexes (including partial and GIN FTS)
- All critical queries use index-only scans
- Full-text search on cases via PostgreSQL GIN
