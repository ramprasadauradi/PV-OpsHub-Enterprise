import { Role } from '@prisma/client'

export type Permission =
    | 'cases:read'
    | 'cases:create'
    | 'cases:update'
    | 'cases:delete'
    | 'cases:allocate'
    | 'cases:hold'
    | 'cases:release'
    | 'cases:reassign'
    | 'cases:stage_advance'
    | 'corrections:read'
    | 'corrections:create'
    | 'corrections:resolve'
    | 'capa:read'
    | 'capa:create'
    | 'capa:manage'
    | 'sla:read'
    | 'sla:configure'
    | 'reports:read'
    | 'reports:export'
    | 'reports:scheduled'
    | 'audit:read'
    | 'audit:export'
    | 'users:read'
    | 'users:create'
    | 'users:update'
    | 'users:deactivate'
    | 'admin:tenant'
    | 'admin:system'
    | 'dashboard:tl'
    | 'dashboard:manager'
    | 'dashboard:project'

const PERMISSION_MATRIX: Record<Role, Permission[]> = {
    [Role.SUPER_ADMIN]: [
        'cases:read', 'cases:create', 'cases:update', 'cases:delete',
        'cases:allocate', 'cases:hold', 'cases:release', 'cases:reassign', 'cases:stage_advance',
        'corrections:read', 'corrections:create', 'corrections:resolve',
        'capa:read', 'capa:create', 'capa:manage',
        'sla:read', 'sla:configure',
        'reports:read', 'reports:export', 'reports:scheduled',
        'audit:read', 'audit:export',
        'users:read', 'users:create', 'users:update', 'users:deactivate',
        'admin:tenant', 'admin:system',
        'dashboard:tl', 'dashboard:manager', 'dashboard:project',
    ],
    [Role.TENANT_ADMIN]: [
        'cases:read', 'cases:create', 'cases:update',
        'cases:allocate', 'cases:hold', 'cases:release', 'cases:reassign', 'cases:stage_advance',
        'corrections:read', 'corrections:create', 'corrections:resolve',
        'capa:read', 'capa:create', 'capa:manage',
        'sla:read', 'sla:configure',
        'reports:read', 'reports:export', 'reports:scheduled',
        'audit:read', 'audit:export',
        'users:read', 'users:create', 'users:update', 'users:deactivate',
        'admin:tenant',
        'dashboard:tl', 'dashboard:manager', 'dashboard:project',
    ],
    [Role.PROJECT_MANAGER]: [
        'cases:read', 'cases:create', 'cases:update',
        'cases:allocate', 'cases:hold', 'cases:release', 'cases:reassign', 'cases:stage_advance',
        'corrections:read', 'corrections:create', 'corrections:resolve',
        'capa:read', 'capa:create', 'capa:manage',
        'sla:read', 'sla:configure',
        'reports:read', 'reports:export', 'reports:scheduled',
        'audit:read',
        'users:read',
        'dashboard:tl', 'dashboard:manager', 'dashboard:project',
    ],
    [Role.QUALITY_MANAGER]: [
        'cases:read',
        'corrections:read', 'corrections:create', 'corrections:resolve',
        'capa:read', 'capa:create', 'capa:manage',
        'sla:read',
        'reports:read', 'reports:export',
        'audit:read',
        'dashboard:manager',
    ],
    [Role.OPS_MANAGER]: [
        'cases:read', 'cases:update',
        'cases:allocate', 'cases:hold', 'cases:release', 'cases:reassign', 'cases:stage_advance',
        'corrections:read',
        'capa:read',
        'sla:read',
        'reports:read', 'reports:export',
        'audit:read',
        'users:read',
        'dashboard:tl', 'dashboard:manager',
    ],
    [Role.TEAM_LEAD]: [
        'cases:read', 'cases:update',
        'cases:allocate', 'cases:hold', 'cases:release', 'cases:reassign', 'cases:stage_advance',
        'corrections:read', 'corrections:create',
        'sla:read',
        'reports:read',
        'dashboard:tl',
    ],
    [Role.PROCESSOR]: [
        'cases:read', 'cases:update',
        'cases:stage_advance',
        'corrections:read',
        'sla:read',
        'reports:read',
        'dashboard:project',
    ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
    const permissions = PERMISSION_MATRIX[role]
    return permissions?.includes(permission) ?? false
}

export function assertPermission(role: Role, permission: Permission): void {
    if (!hasPermission(role, permission)) {
        throw new PermissionDeniedError(
            `Role "${role}" does not have permission "${permission}"`
        )
    }
}

export function getPermissions(role: Role): Permission[] {
    return PERMISSION_MATRIX[role] ?? []
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every((p) => hasPermission(role, p))
}

export class PermissionDeniedError extends Error {
    public readonly code = 'PERMISSION_DENIED'

    constructor(message: string) {
        super(message)
        this.name = 'PermissionDeniedError'
    }
}

export const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 100,
    [Role.TENANT_ADMIN]: 90,
    [Role.PROJECT_MANAGER]: 80,
    [Role.QUALITY_MANAGER]: 70,
    [Role.OPS_MANAGER]: 60,
    [Role.TEAM_LEAD]: 50,
    [Role.PROCESSOR]: 10,
}

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole]
}
