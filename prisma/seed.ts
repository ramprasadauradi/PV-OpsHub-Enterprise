/**
 * PV-OpsHub — Production Seed (30,000 cases, 3 tenants, 24 users/tenant)
 * Password for ALL users: Demo@123456!
 * Run: pnpm db:seed or npx tsx prisma/seed.ts
 */

import { PrismaClient, Role , Prisma} from '@prisma/client'
import { hashSync } from 'bcryptjs'
import {
    TENANTS,
    USER_TEMPLATES,
    REPORT_TYPES_CONFIG,
    CORRECTION_CATEGORIES,
    CORRECTION_DESCRIPTIONS,
    CAPA_ROOT_CAUSES,
    AT_RISK_PROCESSOR_INDICES,
} from './seed-data/constants'
import { createCase, createStageEvents, createCorrection, createAuditEntry } from './seed-data/factories'

const prisma = new PrismaClient()
const BATCH_SIZE = 500
const CASES_PER_TENANT = parseInt(process.env.SEED_CASE_COUNT || '10000', 10)
const PASSWORD = 'Demo@123456!'

function log(msg: string) {
    console.log(`[${new Date().toISOString()}] ${msg}`)
}

function generateSnapshotData(snType: string, month: string): Prisma.InputJsonValue {
    const monthNum = parseInt(month.split('-')[1])
    const base = 800 + Math.floor(Math.random() * 400)
    if (snType === 'volumeTrend') {
        return { month, initial: Math.floor(base * 0.7), followUp: Math.floor(base * 0.3), total: base }
    }
    if (snType === 'slaCompliance') {
        const rate = 92 + Math.random() * 6
        return { month, total: base, onTime: Math.floor(base * rate / 100), breached: Math.floor(base * (1 - rate / 100)), rate: Math.round(rate * 100) / 100 }
    }
    if (snType === 'fpqTrend') {
        const fpq = 90 + Math.random() * 8
        return { month, total: base, withCorrections: Math.floor(base * (1 - fpq / 100)), fpq: Math.round(fpq * 100) / 100 }
    }
    return { month, value: monthNum * 100 }
}

async function main() {
    log(`Starting seed: ${CASES_PER_TENANT} cases × 3 tenants = ${CASES_PER_TENANT * 3} total`)
    const passwordHash = hashSync(PASSWORD, 12)

    for (const tenantDef of TENANTS) {
        let tenant = await prisma.tenant.findFirst({ where: { name: tenantDef.name } })
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    name: tenantDef.name,
                    region: tenantDef.region,
                    timezone: tenantDef.timezone,
                    holdAutoReleaseHours: tenantDef.holdAutoReleaseHours,
                    maxReassignments: tenantDef.maxReassignments,
                },
            })
        }

        const tenantId = tenant.id
        log(`Tenant: ${tenant.name} (${tenantId})`)

        await prisma.tenantConfig.upsert({
            where: { tenantId },
            update: {},
            create: {
                tenantId,
                primaryColor: tenantDef.region === 'INDIA' ? '#6366F1' : tenantDef.region === 'EU' ? '#059669' : '#2563EB',
                notificationEmail: `ops@${tenantDef.domain}`,
            },
        })

        const users: { id: string; role: Role; emailPrefix: string }[] = []
        for (const tpl of USER_TEMPLATES) {
            const email = `${tpl.emailPrefix}@${tenantDef.domain}`
            const user = await prisma.user.upsert({
                where: { tenantId_email: { tenantId, email } },
                update: { passwordHash },
                create: {
                    tenantId,
                    name: tpl.name,
                    email,
                    role: tpl.role as Role,
                    passwordHash,
                    dailyCaseLimit: tpl.dailyCaseLimit,
                    timezone: tenantDef.timezone,
                    isActive: (tpl as { isActive?: boolean }).isActive !== false,
                },
            })
            users.push({ id: user.id, role: user.role, emailPrefix: tpl.emailPrefix })
        }

        const processors = users.filter((u) => u.role === 'PROCESSOR' && users.find((x) => x.id === u.id && (USER_TEMPLATES[users.indexOf(x)] as { isActive?: boolean })?.isActive !== false))
        const teamLeads = users.filter((u) => u.role === 'TEAM_LEAD')
        const managers = users.filter((u) => ['OPS_MANAGER', 'PROJECT_MANAGER', 'TENANT_ADMIN'].includes(u.role))
        const allAllocators = [...teamLeads, ...managers]
        const processorIds = users.filter((u) => u.role === 'PROCESSOR').map((u) => u.id)
        const activeProcessorIds = users.filter((u, i) => u.role === 'PROCESSOR' && (USER_TEMPLATES[i] as { isActive?: boolean })?.isActive !== false).map((u) => u.id)

        log(`  Users: ${users.length} (${activeProcessorIds.length} active processors) — password: ${PASSWORD}`)

        const existingCases = await prisma.case.count({ where: { tenantId } })
        if (existingCases >= CASES_PER_TENANT) {
            log(`  Skipping case seed (already ${existingCases} cases).`)
        } else {

            for (const rt of REPORT_TYPES_CONFIG) {
                await prisma.reportTypeConfig.upsert({
                    where: { tenantId_code: { tenantId, code: rt.code } },
                    update: {},
                    create: {
                        tenantId,
                        code: rt.code,
                        label: rt.label,
                        isEnabled: true,
                        isCustom: (rt as { isCustom?: boolean }).isCustom ?? false,
                        effectiveDate: new Date('2024-01-01'),
                    },
                })
            }

            const countries = tenantDef.region === 'INDIA' ? ['IN'] : tenantDef.region === 'EU' ? ['DE', 'FR', 'GB', 'IT', 'ES'] : ['US', 'CA']
            for (const country of [...countries, 'DEFAULT']) {
                await prisma.sLARuleConfig.create({
                    data: {
                        tenantId,
                        country,
                        submissionDays: country === 'IN' || country === 'US' ? 7 : 15,
                        useBusinessDays: country !== 'IN',
                        isHACase: false,
                        effectiveDate: new Date('2024-01-01'),
                        isActive: true,
                    },
                }).catch(() => { })
            }

            const caseIds: string[] = []
            const now = new Date()

            for (let batch = 0; batch < CASES_PER_TENANT; batch += BATCH_SIZE) {
                const batchEnd = Math.min(batch + BATCH_SIZE, CASES_PER_TENANT)
                const caseBatch: Array<Record<string, unknown> & { assignedToId?: string | null }> = []

                for (let i = batch; i < batchEnd; i++) {
                    const caseData = createCase(tenantId, tenantDef.region, i + 1, now) as Record<string, unknown>
                    const status = caseData.currentStatus as string
                    const assignee = activeProcessorIds.length > 0 ? activeProcessorIds[i % activeProcessorIds.length] : null
                    caseBatch.push({
                        ...caseData,
                        assignedToId: status !== 'UNALLOCATED' && assignee ? assignee : null,
                    })
                }

                const created = await prisma.$transaction(
                    caseBatch.map((c) => prisma.case.create({ data: c as Parameters<typeof prisma.case.create>[0]['data'], select: { id: true, currentStage: true, currentStatus: true, createdAt: true } }))
                )
                caseIds.push(...created.map((c) => c.id))

                const allocations = created
                    .map((c, idx) => {
                        const assignedToId = caseBatch[idx].assignedToId as string | null | undefined
                        if (!assignedToId) return null
                        const allocator = allAllocators[idx % allAllocators.length]
                        return {
                            tenantId,
                            caseId: c.id,
                            assignedToId,
                            allocatedById: allocator?.id ?? users[0].id,
                            allocatorRole: (allocator?.role ?? 'TEAM_LEAD') as Role,
                            allocationNum: 1,
                            criteria: {},
                            isActive: true,
                        }
                    })
                    .filter((a): a is NonNullable<typeof a> => a !== null)
                if (allocations.length > 0) {
                    await prisma.caseAllocation.createMany({
                        data: allocations,
                    })
                }

                for (let i = 0; i < created.length; i += 5) {
                    const c = created[i]
                    const events = createStageEvents(tenantId, c.id, c.currentStage, processorIds, c.createdAt)
                    if (events.length > 0) {
                        await prisma.caseStageEvent.createMany({ data: events as never })
                    }
                }

                if ((batch + BATCH_SIZE) % 2000 === 0 || batchEnd === CASES_PER_TENANT) {
                    log(`  Batch ${Math.floor(batch / BATCH_SIZE) + 1}/${Math.ceil(CASES_PER_TENANT / BATCH_SIZE)} (${batchEnd} cases)`)
                }
            }

            const correctionCount = Math.floor(caseIds.length * 0.35)
            const qm = users.find((u) => u.role === 'QUALITY_MANAGER') ?? users[0]
            const corrections: Array<Record<string, unknown>> = []
            const atRiskIds = AT_RISK_PROCESSOR_INDICES.map((idx) => users[idx]?.id).filter(Boolean) as string[]

            for (let i = 0; i < correctionCount; i++) {
                const caseIdx = Math.floor(Math.random() * caseIds.length)
                const caseId = caseIds[caseIdx]
                const isAtRiskCase = Math.random() < 0.4 && atRiskIds.length > 0
                const correctedById = isAtRiskCase ? atRiskIds[Math.floor(Math.random() * atRiskIds.length)]! : (activeProcessorIds[caseIdx % activeProcessorIds.length] ?? qm.id)
                const numCorrections = Math.random() < 0.5 ? 1 : Math.random() < 0.8 ? 2 : Math.random() < 0.95 ? 3 : 4
                for (let j = 0; j < numCorrections; j++) {
                    corrections.push(createCorrection(tenantId, caseId, correctedById, 'QC'))
                }
            }

            for (let b = 0; b < corrections.length; b += BATCH_SIZE) {
                await prisma.correction.createMany({
                    data: corrections.slice(b, b + BATCH_SIZE) as never,
                })
            }
            log(`  Corrections: ${corrections.length}`)

            const capaTriggered = corrections.filter((c) => c.capaTriggered)
            for (const corr of capaTriggered.slice(0, 100)) {
                await prisma.cAPARecord.create({
                    data: {
                        tenantId,
                        triggeredById: qm.id,
                        triggerCategory: corr.category as Parameters<typeof prisma.cAPARecord.create>[0]['data']['triggerCategory'],
                        description: `CAPA: ${corr.category}`,
                        rootCause: CAPA_ROOT_CAUSES[Math.floor(Math.random() * CAPA_ROOT_CAUSES.length)],
                        targetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                        isResolved: Math.random() < 0.4,
                    },
                })
            }

            const pm = users.find((u) => u.role === 'PROJECT_MANAGER') ?? users[0]
            for (let h = 0; h < 3; h++) {
                await prisma.holdEvent.create({
                    data: {
                        tenantId,
                        initiatedById: pm.id,
                        holdType: 'ALL',
                        heldAt: new Date(now.getTime() - (h + 1) * 24 * 60 * 60 * 1000),
                        releasedAt: new Date(now.getTime() - h * 24 * 60 * 60 * 1000),
                        releaseMethod: h === 0 ? 'AUTO' : 'MANUAL',
                        notes: 'Seed past hold',
                    },
                })
            }

            const autoReleaseAt = new Date(now.getTime() + 18 * 60 * 60 * 1000)
            await prisma.holdEvent.create({
                data: {
                    tenantId,
                    initiatedById: pm.id,
                    holdType: 'ALL',
                    heldAt: now,
                    autoReleaseAt,
                    notes: 'Active hold seed',
                },
            })

            const heldCaseIds = caseIds.slice(0, 20)
            await prisma.case.updateMany({
                where: { id: { in: heldCaseIds } },
                data: { isHeld: true, heldAt: now, holdReason: 'Allocation hold' },
            })

            const auditCount = Math.min(5000, Math.floor(caseIds.length * 0.15))
            const audits = []
            const auditActions = ['CASE_CREATED', 'CASE_ALLOCATED', 'STAGE_ADVANCED', 'CORRECTION_ADDED']
            for (let i = 0; i < auditCount; i++) {
                audits.push(createAuditEntry(tenantId, users[i % users.length].id, auditActions[i % auditActions.length], 'Case', caseIds[i % caseIds.length]))
            }
            for (let b = 0; b < audits.length; b += BATCH_SIZE) {
                await prisma.auditLog.createMany({
                    data: audits.slice(b, b + BATCH_SIZE) as never,
                })
            }

            log(`  ✅ ${tenant.name} cases complete`)
        }

        // ═══════════════════════════════════════════
        // ENTERPRISE EXPANSION SEEDING
        // ═══════════════════════════════════════════

        // ClientProfile
        const clientConfig = {
            'INDIA': { clientCode: 'INDUS-PV', therapeuticFocus: ['Oncology', 'Neurology', 'Cardiology'], totalAnnualCases: 12000 },
            'EU': { clientCode: 'EURO-SAFE', therapeuticFocus: ['Immunology', 'Rare Disease', 'Vaccines'], totalAnnualCases: 15000 },
            'US': { clientCode: 'PHARMA-US', therapeuticFocus: ['Diabetes', 'Respiratory', 'Ophthalmology'], totalAnnualCases: 18000 },
            'APAC': { clientCode: 'ASIA-PV', therapeuticFocus: ['Oncology', 'Infectious Disease'], totalAnnualCases: 8000 },
            'GLOBAL': { clientCode: 'GLOBAL-SAFE', therapeuticFocus: ['Consumer Health', 'Neurology'], totalAnnualCases: 10000 },
        } as const

        const region = tenantDef.region as keyof typeof clientConfig
        const cc = clientConfig[region] ?? clientConfig['GLOBAL']

        await prisma.clientProfile.upsert({
            where: { tenantId },
            update: {},
            create: {
                tenantId,
                clientCode: cc.clientCode,
                therapeuticFocus: [...cc.therapeuticFocus],
                contractStart: new Date('2024-01-01'),
                totalAnnualCases: cc.totalAnnualCases,
                region: tenantDef.region,
                primaryContact: `ops-lead@${tenantDef.domain}`,
            },
        })

        // Project
        const project = await prisma.project.upsert({
            where: { id: `project-${tenantId}` },
            update: {},
            create: {
                id: `project-${tenantId}`,
                tenantId,
                name: `${tenantDef.name} — Primary`,
                clientCode: cc.clientCode,
                isActive: true,
                startDate: new Date('2024-01-01'),
            },
        })

        // ProjectMembers
        const seniorityByRole: Record<string, 'SENIOR' | 'MID' | 'JUNIOR'> = {
            TENANT_ADMIN: 'SENIOR', PROJECT_MANAGER: 'SENIOR', QUALITY_MANAGER: 'SENIOR',
            OPS_MANAGER: 'SENIOR', TEAM_LEAD: 'MID', PROCESSOR: 'JUNIOR',
        }
        const teamRoleByRole: Record<string, 'BOOKING_LEAD' | 'PROCESSING_LEAD' | 'MR_LEAD' | 'SENIOR_PROCESSOR' | 'JUNIOR_PROCESSOR' | 'MID_PROCESSOR'> = {
            TENANT_ADMIN: 'BOOKING_LEAD', PROJECT_MANAGER: 'PROCESSING_LEAD', QUALITY_MANAGER: 'MR_LEAD',
            OPS_MANAGER: 'BOOKING_LEAD', TEAM_LEAD: 'SENIOR_PROCESSOR', PROCESSOR: 'MID_PROCESSOR',
        }

        for (const u of users) {
            await prisma.projectMember.upsert({
                where: { projectId_userId: { projectId: project.id, userId: u.id } },
                update: {},
                create: {
                    tenantId,
                    projectId: project.id,
                    userId: u.id,
                    teamRole: teamRoleByRole[u.role] ?? 'MID_PROCESSOR',
                    teamName: u.role === 'PROCESSOR' ? 'Processing' : 'Management',
                    seniority: seniorityByRole[u.role] ?? 'MID',
                },
            })
        }

        // WorkflowConfig
        const defaultStages = [
            { stageCode: 'INTAKE', stageLabel: 'Intake', stageOrder: 1, color: '#6366f1', isRequired: true, description: 'Case intake and triage' },
            { stageCode: 'DE', stageLabel: 'Data Entry', stageOrder: 2, color: '#3b82f6', isRequired: true, description: 'Data entry and coding' },
            { stageCode: 'QC', stageLabel: 'Quality Check', stageOrder: 3, color: '#f59e0b', isRequired: true, description: 'Quality check and review' },
            { stageCode: 'MR', stageLabel: 'Medical Review', stageOrder: 4, color: '#10b981', isRequired: true, description: 'Medical review by clinician' },
            { stageCode: 'SUBMISSION', stageLabel: 'Submission', stageOrder: 5, color: '#8b5cf6', isRequired: true, description: 'Regulatory submission' },
            { stageCode: 'COMPLETED', stageLabel: 'Completed', stageOrder: 6, color: '#22c55e', isRequired: true, description: 'Case completed' },
        ]
        for (const s of defaultStages) {
            await prisma.workflowConfig.upsert({
                where: { tenantId_stageCode: { tenantId, stageCode: s.stageCode } },
                update: {},
                create: { tenantId, ...s },
            })
        }

        // SLAConfig
        const slaConfigs = [
            { configName: `${tenantDef.region} Serious Default`, country: 'DEFAULT', seriousness: 'SERIOUS', haVapIndicator: 'ALL', submissionDays: 15, priority: 10 },
            { configName: `${tenantDef.region} Non-Serious Default`, country: 'DEFAULT', seriousness: 'NON_SERIOUS', haVapIndicator: 'ALL', submissionDays: 90, priority: 5 },
            { configName: `${tenantDef.region} Fatal/LT`, country: 'DEFAULT', seriousness: 'FATAL', haVapIndicator: 'ALL', submissionDays: 7, priority: 50 },
            { configName: `${tenantDef.region} HA Cases`, country: 'DEFAULT', seriousness: 'ALL', haVapIndicator: 'HA', submissionDays: 7, priority: 100 },
            { configName: `${tenantDef.region} VAP Cases`, country: 'DEFAULT', seriousness: 'ALL', haVapIndicator: 'VAP', submissionDays: 10, priority: 80 },
        ]
        for (const c of slaConfigs) {
            await prisma.sLAConfig.create({
                data: { tenantId, ...c, effectiveDate: new Date('2024-01-01'), clockStopAllowed: true, maxClockStops: 3 },
            }).catch(() => { })
        }

        // AnalyticsSnapshot (pre-computed data for fast dashboard)
        const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
            '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12']
        const snapshotTypes = ['volumeTrend', 'slaCompliance', 'fpqTrend']
        for (const snType of snapshotTypes) {
            for (const month of months) {
                await prisma.analyticsSnapshot.create({
                    data: {
                        tenantId,
                        snapshotType: snType,
                        period: month,
                        data: generateSnapshotData(snType, month),
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                }).catch(() => { })
            }
        }

        log(`  ✅ ${tenant.name} enterprise data complete`)
    }

    const totalCases = await prisma.case.count()
    const totalUsers = await prisma.user.count()
    const totalCorrections = await prisma.correction.count()
    const totalAudits = await prisma.auditLog.count()
    const totalHolds = await prisma.holdEvent.count({ where: { releasedAt: null } })

    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('✅ PV-OpsHub Seed Complete')
    console.log('   Tenants: 3')
    console.log('   Users: 72 (24 per tenant)')
    console.log(`   Cases: ${totalCases} (10,000 per tenant)`)
    console.log(`   Corrections: ~${totalCorrections}`)
    console.log(`   Audit entries: ~${totalAudits}`)
    console.log(`   Active holds: ${totalHolds} (one per tenant)`)
    console.log('═══════════════════════════════════════════')
    console.log('')
    console.log('🔑 LOGIN CREDENTIALS (all tenants use same password):')
    console.log('   Password for ALL users: Demo@123456!')
    console.log('')
    console.log('TENANT 1 — Indus PV Services (India):')
    console.log('   Admin:      admin@induspv.com')
    console.log('   PM:         pm1@induspv.com')
    console.log('   QM:         qm1@induspv.com')
    console.log('   Ops Mgr:    ops1@induspv.com')
    console.log('   Team Lead:  tl1@induspv.com')
    console.log('   Processor:  proc01@induspv.com')
    console.log('')
    console.log('TENANT 2 — EuroSafe (EU):')
    console.log('   Admin:      admin@eurosafe.de')
    console.log('   PM:         pm1@eurosafe.de')
    console.log('')
    console.log('TENANT 3 — PharmaSafety (US):')
    console.log('   Admin:      admin@pharmasafety.us')
    console.log('   PM:         pm1@pharmasafety.us')
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error('Seed failed:', e)
        prisma.$disconnect()
        process.exit(1)
    })
