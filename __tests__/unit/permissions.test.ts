import { describe, it, expect } from 'vitest'
import { Role } from '@prisma/client'
import {
    hasPermission,
    assertPermission,
    getPermissions,
    hasAnyPermission,
    hasAllPermissions,
    canManageRole,
    PermissionDeniedError,
} from '@/lib/security/permissions'

describe('RBAC Permissions', () => {
    describe('hasPermission', () => {
        it('SUPER_ADMIN has all permissions', () => {
            expect(hasPermission(Role.SUPER_ADMIN, 'admin:system')).toBe(true)
            expect(hasPermission(Role.SUPER_ADMIN, 'admin:tenant')).toBe(true)
            expect(hasPermission(Role.SUPER_ADMIN, 'cases:delete')).toBe(true)
            expect(hasPermission(Role.SUPER_ADMIN, 'users:deactivate')).toBe(true)
        })

        it('PROCESSOR has limited permissions', () => {
            expect(hasPermission(Role.PROCESSOR, 'cases:read')).toBe(true)
            expect(hasPermission(Role.PROCESSOR, 'cases:update')).toBe(true)
            expect(hasPermission(Role.PROCESSOR, 'cases:stage_advance')).toBe(true)
            // Should NOT have
            expect(hasPermission(Role.PROCESSOR, 'cases:allocate')).toBe(false)
            expect(hasPermission(Role.PROCESSOR, 'cases:delete')).toBe(false)
            expect(hasPermission(Role.PROCESSOR, 'admin:tenant')).toBe(false)
            expect(hasPermission(Role.PROCESSOR, 'users:create')).toBe(false)
        })

        it('TEAM_LEAD can allocate but not manage users', () => {
            expect(hasPermission(Role.TEAM_LEAD, 'cases:allocate')).toBe(true)
            expect(hasPermission(Role.TEAM_LEAD, 'cases:hold')).toBe(true)
            expect(hasPermission(Role.TEAM_LEAD, 'users:create')).toBe(false)
            expect(hasPermission(Role.TEAM_LEAD, 'admin:tenant')).toBe(false)
        })

        it('QUALITY_MANAGER can manage CAPA', () => {
            expect(hasPermission(Role.QUALITY_MANAGER, 'capa:manage')).toBe(true)
            expect(hasPermission(Role.QUALITY_MANAGER, 'corrections:resolve')).toBe(true)
            expect(hasPermission(Role.QUALITY_MANAGER, 'cases:allocate')).toBe(false)
        })

        it('TENANT_ADMIN can manage tenant but not system', () => {
            expect(hasPermission(Role.TENANT_ADMIN, 'admin:tenant')).toBe(true)
            expect(hasPermission(Role.TENANT_ADMIN, 'admin:system')).toBe(false)
            expect(hasPermission(Role.TENANT_ADMIN, 'users:deactivate')).toBe(true)
        })
    })

    describe('assertPermission', () => {
        it('does not throw for valid permission', () => {
            expect(() => assertPermission(Role.SUPER_ADMIN, 'cases:read')).not.toThrow()
        })

        it('throws PermissionDeniedError for invalid permission', () => {
            expect(() => assertPermission(Role.PROCESSOR, 'admin:system')).toThrow(PermissionDeniedError)
        })
    })

    describe('getPermissions', () => {
        it('returns array of permissions for role', () => {
            const perms = getPermissions(Role.PROCESSOR)
            expect(Array.isArray(perms)).toBe(true)
            expect(perms.length).toBeGreaterThan(0)
            expect(perms).toContain('cases:read')
        })
    })

    describe('hasAnyPermission', () => {
        it('returns true if role has at least one permission', () => {
            expect(hasAnyPermission(Role.PROCESSOR, ['admin:system', 'cases:read'])).toBe(true)
        })

        it('returns false if role has none', () => {
            expect(hasAnyPermission(Role.PROCESSOR, ['admin:system', 'admin:tenant'])).toBe(false)
        })
    })

    describe('hasAllPermissions', () => {
        it('returns true if role has all permissions', () => {
            expect(hasAllPermissions(Role.SUPER_ADMIN, ['cases:read', 'admin:system'])).toBe(true)
        })

        it('returns false if role is missing any', () => {
            expect(hasAllPermissions(Role.PROCESSOR, ['cases:read', 'admin:system'])).toBe(false)
        })
    })

    describe('canManageRole', () => {
        it('higher role can manage lower role', () => {
            expect(canManageRole(Role.TENANT_ADMIN, Role.PROCESSOR)).toBe(true)
            expect(canManageRole(Role.TEAM_LEAD, Role.PROCESSOR)).toBe(true)
        })

        it('lower role cannot manage higher', () => {
            expect(canManageRole(Role.PROCESSOR, Role.TEAM_LEAD)).toBe(false)
            expect(canManageRole(Role.TEAM_LEAD, Role.TENANT_ADMIN)).toBe(false)
        })

        it('same role cannot manage itself', () => {
            expect(canManageRole(Role.PROCESSOR, Role.PROCESSOR)).toBe(false)
        })
    })
})
