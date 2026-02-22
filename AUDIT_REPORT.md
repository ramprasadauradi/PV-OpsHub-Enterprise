# PV-OpsHub — Phase 1 System Audit Report

## STATUS REPORT

### ✅ COMPLETE (fully implemented, no stubs)
- **Infrastructure:** package.json, tsconfig.json, next.config.ts, .env.example, Dockerfile, docker-compose.yml
- **Prisma:** schema.prisma (all core models & enums), seed-data/constants.ts, seed-data/factories.ts
- **Lib core:** lib/auth.ts (NextAuth, 7 roles), lib/audit/logger.ts, lib/security/permissions.ts (full matrix), lib/allocation/engine.ts, lib/allocation/governance.ts, lib/cache/cache-manager.ts, lib/cache/redis.ts, lib/sla/calculator.ts, lib/sla/holiday-calendars.ts
- **Types:** types/index.ts (Zod schemas, APIResponse, SLAResult, etc.)
- **API routes:** app/api/health, app/api/cases (GET/POST), app/api/cases/[id], app/api/cases/[id]/allocate, stage, corrections, app/api/allocation/bulk, hold, suggest, app/api/dashboard/tl, manager, project, app/api/sla/calculate, forecast, app/api/audit, app/api/auth/[...nextauth]
- **UI:** app/(auth)/login/page.tsx, app/(dashboard)/layout.tsx, cases/page.tsx, allocation/page.tsx, dashboard/tl/page.tsx, dashboard/manager/page.tsx, dashboard/project/page.tsx, quality/corrections, sla, reports, admin/*, audit/page.tsx
- **Components:** components/layout/* (Sidebar, Topbar, TenantProvider, NotificationCenter, GlobalSearch), components/dashboard/widgets/KPICard
- **Constants:** constants/workflow-stages.ts
- **Hooks & stores:** hooks/useCases, useAllocation, useDashboard, useSLA; stores/filterStore, dashboardStore

### ⚠️ PARTIAL (exist but have gaps)
- **middleware.ts** — ROLE_ROUTES defined but never used; no session check (getToken), no redirect to /login for unauthenticated users; protected routes are not actually protected.
- **lib/prisma.ts** — No tenant-scoped middleware (Prisma extension to auto-inject tenantId); all tenant filtering is done manually in queries.
- **lib/security/permissions.ts** — PROCESSOR missing `dashboard:project` (spec: PROCESSOR sees project dashboard with anonymized names).
- **app/(auth)/login/page.tsx** — Demo accounts use acmecro.com and password Demo@1234; seed uses different domains (e.g. pharmacorp-india.example.com) and PvOps2025!; mismatch for non-coder user.
- **prisma/seed.ts & seed-data/constants.ts** — Tenant names/domains and user list don’t match spec (Indus PV Services, EuroSafe, PharmaSafety; 24 users per tenant; Demo@123456!; REF-2025-XXXXXX, etc.). Only 16 USER_TEMPLATES; report type distribution and case counts/config differ from spec.
- **lib/sla/holiday-calendars.ts** — Has IN, US, GB, DE, DEFAULT; missing FR, IT, ES, JP, CA, AU as separate keys (spec: US, DE, FR, GB, IT, ES, JP, IN, CA, AU).
- **app/page.tsx** — Redirects to /dashboard/tl with no auth; unauthenticated users see shell then 401s.
- **lib/sla/calculator.ts** — No exported getSLARiskColor(); risk formula differs from spec (spec: daysRemaining-based red/amber/green).
- **lib/allocation/engine.ts** — No applyHardRules/balanceLoad/Layer 1–2; no Pusher 'case:allocated' event; bulkAllocate doesn’t accept criteria object for audit.
- **TL dashboard (dashboard/tl/page.tsx)** — All 6 tabs implemented inline; no separate tab components (AllocationTab, HaVapTab, etc.); no D3 heatmap in Quality tab; Aging tab no direct action buttons (Escalate/Reassign/Add Note).

### ❌ MISSING (files or features not present)
- **lib/jobs/** — sla-monitor.ts, hold-auto-release.ts, alerts.ts (BullMQ job runners).
- **components/cases/** — CaseDrillDownModal.tsx (full case drawer with 5 tabs + direct actions).
- **components/allocation/** — AllocationPanel.tsx (3-panel as component), HoldBanner.tsx (standalone).
- **components/sla/** — SLAHeatmap.tsx (D3 heatmap by stage × country/team).
- **components/pipeline/** — PipelineKanban.tsx (6-column drag-and-drop).
- **components/quality/** — CorrectionsHeatmap.tsx (D3 user × category).
- **components/dashboard/tabs/** — AllocationTab, HaVapTab, AgingTab, QualityTab, ProductivityTab, HoldStatusTab (spec calls for separate tab components).
- **app/(dashboard)/cases/[id]/page.tsx** — Case detail page (and deep link to open CaseDrillDownModal).
- **app/(dashboard)/** — error.tsx and loading.tsx for route segments (and key pages).
- **prisma/schema.prisma** — Notification model (optional for MVP).
- **.env.local** — Not in repo (expected); .env.example is present.

### 🔴 BROKEN (errors or blocking issues)
- **middleware.ts** — `import { v4 as uuidv4 } from 'crypto'` — Node `crypto` does not export `v4`; this import will throw at runtime. `crypto.randomUUID()` is already used for requestId; remove the invalid import.

---

## CRITICAL BLOCKERS (must fix before app can run reliably)

1. **Middleware auth** — Unauthenticated users can hit any route; middleware does not call getToken() or redirect to /login. Fix: add NextAuth getToken(), protect non-public routes, redirect to /login when no session.
2. **Middleware import** — Remove `import { v4 as uuidv4 } from 'crypto'` (broken). Use only `crypto.randomUUID()`.
3. **Login credentials vs seed** — Align demo accounts and seed: same password (Demo@123456!), and seed tenants/users (Indus, EuroSafe, PharmaSafety; 24 users/tenant) so login page and README match.
4. **PROCESSOR dashboard:project** — Add `dashboard:project` to PROCESSOR in permissions so they can access project dashboard (anonymized).
5. **Root redirect** — Either redirect unauthenticated users at `/` to `/login` (via middleware or layout) or keep redirect to dashboard and let API 401s surface (current); prefer middleware redirect for clearer UX.
6. **Missing error/loading UI** — Add error.tsx and loading.tsx for (dashboard) and key routes so failures and loading states are handled.
7. **Case detail & drill-down** — No case detail page or CaseDrillDownModal; case row click does nothing. Add cases/[id] page and CaseDrillDownModal for full workflow/corrections/audit view.
8. **Seed data alignment** — Bring seed to spec: 3 named tenants, 24 users per tenant, 10k cases/tenant, REF-2025-XXXXXX, correct report type/seriousness/HA-VAP distribution, Demo@123456!, and documented login table.

---

## TOTAL WORK ESTIMATE

- **Repair:** ~8 files (middleware, auth redirect, permissions, login copy, seed + constants, holiday-calendars, root redirect, error/loading).
- **Create:** ~15+ files (CaseDrillDownModal, case detail page, SLAHeatmap, PipelineKanban, CorrectionsHeatmap, dashboard tab components, HoldBanner, jobs, optional Notification model and .env.local template).
- **Larger builds:** Seed rewrite (~30k cases to spec), full TL dashboard tab content (Aging actions, Quality D3 heatmap), allocation engine Layer 1/2 and Pusher.

---

*Audit completed. Proceeding to Phase 2 (repairs) then Phase 3 (missing files).*
