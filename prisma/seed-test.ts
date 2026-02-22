/**
 * PV-OpsHub — Test Seed Script (CI/CD)
 * Seeds minimal data for E2E and integration tests.
 * Usage: pnpm db:seed:test
 */

import { PrismaClient, Role } from '@prisma/client'
import { hashSync } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('[TEST SEED] Starting minimal test data seed...')

    const passwordHash = hashSync('TestPass123!', 10)
    const now = new Date()

    // ─── Single Tenant ──────────────────
    const tenant = await prisma.tenant.upsert({
        where: { id: 'test-tenant' },
        update: {},
        create: {
            id: 'test-tenant',
            name: 'Test Tenant',
            region: 'GLOBAL',
            timezone: 'UTC',
        },
    })

    // ─── Test Users (one per role) ──────
    const roles: { name: string; role: Role; email: string }[] = [
        { name: 'Super Admin', role: 'SUPER_ADMIN', email: 'super@test.com' },
        { name: 'Tenant Admin', role: 'TENANT_ADMIN', email: 'admin@test.com' },
        { name: 'Project Manager', role: 'PROJECT_MANAGER', email: 'pm@test.com' },
        { name: 'Quality Manager', role: 'QUALITY_MANAGER', email: 'qm@test.com' },
        { name: 'Ops Manager', role: 'OPS_MANAGER', email: 'ops@test.com' },
        { name: 'Team Lead', role: 'TEAM_LEAD', email: 'tl@test.com' },
        { name: 'Processor', role: 'PROCESSOR', email: 'processor@test.com' },
    ]

    const users: string[] = []
    for (const r of roles) {
        const user = await prisma.user.upsert({
            where: { tenantId_email: { tenantId: tenant.id, email: r.email } },
            update: {},
            create: {
                tenantId: tenant.id,
                name: r.name,
                email: r.email,
                role: r.role,
                passwordHash,
            },
        })
        users.push(user.id)
    }

    // ─── 20 Test Cases ──────────────────
    for (let i = 0; i < 20; i++) {
        const isCompleted = i < 5
        const deadline = new Date(now.getTime() + (i < 3 ? -2 : 14) * 24 * 60 * 60 * 1000)

        await prisma.case.create({
            data: {
                tenantId: tenant.id,
                referenceId: `TEST-REF-${String(i + 1).padStart(3, '0')}`,
                caseNumber: `PV-TEST-2025-${String(i + 1).padStart(3, '0')}`,
                reportType: 'INDIVIDUAL',
                caseCategory: i % 2 === 0 ? 'INITIAL' : 'FOLLOW_UP',
                caseComplexity: i < 5 ? 'LOW' : i < 10 ? 'MEDIUM' : i < 15 ? 'HIGH' : 'CRITICAL',
                country: 'United States',
                therapeuticArea: 'Oncology',
                productName: 'TestDrug 100mg',
                source: 'LP',
                seriousness: i < 3 ? 'SERIOUS' : 'NON_SERIOUS',
                haVapIndicator: 'NEITHER',
                manufacturerReceiptDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                centralReceiptDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
                currentStage: isCompleted ? 'COMPLETED' : i < 10 ? 'DE' : 'QC',
                currentStatus: isCompleted ? 'COMPLETED' : i < 7 ? 'IN_PROGRESS' : 'ALLOCATED',
                slaDeadline: deadline,
                slaRiskScore: i < 3 ? 85 : i < 10 ? 45 : 20,
                assignedToId: !isCompleted ? users[6] : null,
            },
        })
    }

    // ─── A Few Corrections ──────────────
    const cases = await prisma.case.findMany({
        where: { tenantId: tenant.id },
        take: 5,
        select: { id: true },
    })

    for (const c of cases.slice(0, 3)) {
        await prisma.correction.create({
            data: {
                tenantId: tenant.id,
                caseId: c.id,
                correctedById: users[3],
                stage: 'QC',
                category: 'DATA_ENTRY',
                description: 'Test correction entry',
                isResolved: false,
            },
        })
    }

    // ─── A Few Audit Logs ───────────────
    for (const c of cases.slice(0, 5)) {
        await prisma.auditLog.create({
            data: {
                tenantId: tenant.id,
                userId: users[0],
                action: 'CASE_CREATED',
                entityType: 'Case',
                entityId: c.id,
                metadata: { source: 'test-seed' },
            },
        })
    }

    console.log('[TEST SEED] Complete: 1 tenant, 7 users, 20 cases, 3 corrections, 5 audit logs')
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error('Test seed failed:', e)
        prisma.$disconnect()
        process.exit(1)
    })
