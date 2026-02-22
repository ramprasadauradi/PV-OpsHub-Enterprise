-- ═══════════════════════════════════════════
-- PV-OpsHub — Performance & Analytics Indexes
-- Run after initial Prisma migration
-- ═══════════════════════════════════════════

-- ─── SLA Risk Score Ranking ─────────────
-- Dashboard leaderboard, risk-first allocation sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_case_sla_risk_desc ON "Case" ("tenantId", "slaRiskScore" DESC)
  WHERE "currentStatus" NOT IN ('COMPLETED');

-- ─── Upcoming Deadline Window ───────────
-- SLA heatmap, forecast queries (next 7 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_case_deadline_window ON "Case" ("tenantId", "slaDeadline")
  WHERE "currentStatus" NOT IN ('COMPLETED');

-- ─── Active Cases per Processor ─────────
-- Capacity computation, workload distribution
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_allocation_active_user ON "CaseAllocation" ("tenantId", "assignedToId")
  WHERE "isActive" = true;

-- ─── Hold Auto-Release Scanner ──────────
-- Background job: find holds past auto-release time
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_hold_auto_release ON "HoldEvent" ("tenantId", "autoReleaseAt")
  WHERE "releasedAt" IS NULL AND "autoReleaseAt" IS NOT NULL;

-- ─── Correction CAPA Trigger ────────────
-- Quality dashboard: unresolved corrections by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_correction_unresolved ON "Correction" ("tenantId", "correctedById")
  WHERE "isResolved" = false;

-- ─── Stage Events for Cycle Time ────────
-- Cycle time analysis per case per stage
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_stage_event_case_time ON "CaseStageEvent" ("caseId", "createdAt");

-- ─── Audit Trail Temporal Queries ───────
-- Compliance audits: entity history over date ranges
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_audit_entity_time ON "AuditLog" ("tenantId", "entityType", "entityId", "createdAt" DESC);

-- ─── Report Type Quick Lookup ───────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_report_type_active ON "ReportTypeConfig" ("tenantId")
  WHERE "isEnabled" = true;

-- ─── SLA Rules Effective Range ──────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_sla_rule_lookup ON "SLARuleConfig" ("tenantId", "country", "reportType", "seriousness")
  WHERE "isActive" = true;

-- ─── Full-Text Search on Cases ──────────
-- Powers the global search feature (Cmd+K)
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_case_fts ON "Case"
  USING GIN (to_tsvector('english',
    coalesce("referenceId",'') || ' ' ||
    coalesce("caseNumber",'') || ' ' ||
    coalesce("productName",'') || ' ' ||
    coalesce("therapeuticArea",'') || ' ' ||
    coalesce("country",'')
  ));

-- ─── Analyze all tables after index creation ──
ANALYZE "Case";
ANALYZE "CaseAllocation";
ANALYZE "CaseStageEvent";
ANALYZE "Correction";
ANALYZE "CAPARecord";
ANALYZE "HoldEvent";
ANALYZE "AuditLog";
ANALYZE "SLARuleConfig";
ANALYZE "ReportTypeConfig";
