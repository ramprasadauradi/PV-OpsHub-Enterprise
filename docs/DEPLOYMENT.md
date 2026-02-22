# PV-OpsHub Deployment Guide

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or via Docker)
- Redis 7 (or via Docker)

## Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with real values
```

## Local Development

```bash
# Start database + redis
pnpm docker:dev

# Install dependencies + generate Prisma client
pnpm install

# Run migrations
pnpm db:push

# Seed demo data
pnpm db:seed

# Start dev server
pnpm dev
```

## Docker Production

```bash
# Build image
docker build -t pv-opshub:latest .

# Start full stack
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed production data
docker-compose exec app pnpm db:seed
```

## Vercel Deployment

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Build command: `prisma generate && next build`
4. Output directory: `.next`
5. PostgreSQL: Use Railway/Supabase/Neon
6. Redis: Use Upstash

## CI/CD Pipeline

```
Push → Quality Checks → Security Scan → E2E Tests → Staging Deploy → Production Deploy
```

Triggers: push to `main`/`develop`/`release/**`

## Health Checks

- `GET /api/health` — Database + Redis + Memory checks
- `GET /api/metrics` — Prometheus metrics (requires `x-metrics-secret` header)

## Monitoring

| Service | Purpose |
|---------|---------|
| `/api/health` | Uptime monitoring |
| `/api/metrics` | Prometheus + Grafana |
| Structured logs (JSON) | Log aggregation |
| Sentry | Error tracking |
