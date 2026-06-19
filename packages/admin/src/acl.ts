import type { AccessControlProvider } from '@refinedev/core';

import { AppRoles, getUserData, isAppRole, type AppRole } from 'auth';

type ResourceAction = 'read' | 'create' | 'update' | 'delete';
type RolePermissions = Record<ResourceAction, ReadonlySet<string>>;

const permissions = (params: {
    read?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
}): RolePermissions => ({
    read: new Set(params.read),
    create: new Set(params.create),
    update: new Set(params.update),
    delete: new Set(params.delete)
});

const directionHeadPermissions = permissions({
    read: ['dashboard', 'volunteers', 'group-badges'],
    update: ['group-badges', 'volunteers']
});

const catPermissions = permissions({
    read: [
        ...directionHeadPermissions.read,
        'wash',
        'directions',
        'feed-transaction',
        'sync',
        'stats',
        'scanner-page',
        'storages',
        'storage-bins',
        'storage-items',
        'storage-positions',
        'storage-issuances',
        'storage-receivings'
    ],
    create: ['volunteers'],
    update: [...directionHeadPermissions.update]
});

const seniorPermissions = permissions({
    read: [...catPermissions.read, 'volunteer-custom-fields'],
    create: [
        ...catPermissions.create,
        'group-badges',
        'volunteer-custom-fields',
        'storages',
        'storage-bins',
        'storage-items',
        'storage-positions'
    ],
    update: [
        ...catPermissions.update,
        'volunteer-custom-fields',
        'storages',
        'storage-bins',
        'storage-items',
        'storage-positions'
    ]
});

const adminPermissions = permissions({
    read: [...seniorPermissions.read],
    create: [...seniorPermissions.create, 'group-badges', 'volunteer-custom-fields', 'feed-transaction', 'wash'],
    update: [...seniorPermissions.update, 'group-badges', 'volunteer-custom-fields'],
    delete: [
        'group-badges',
        'volunteer-custom-fields',
        'feed-transaction',
        'volunteers',
        'storages',
        'storage-bins',
        'storage-items',
        'storage-positions'
    ]
});

const rolePermissions: Record<AppRole, RolePermissions> = {
    [AppRoles.DIRECTION_HEAD]: directionHeadPermissions,
    [AppRoles.CAT]: catPermissions,
    [AppRoles.SENIOR]: seniorPermissions,
    [AppRoles.ADMIN]: adminPermissions,
    [AppRoles.SOVA]: permissions({ read: ['wash'], create: ['wash'] }),
    [AppRoles.KITCHEN]: permissions({})
};

type Action =
    | 'list'
    | 'show'
    | 'create'
    | 'edit'
    | 'delete'
    | 'full_list'
    | 'badge_edit'
    | 'storage_edit'
    | 'bulk_edit'
    | 'feed_type_edit'
    | 'unban'
    | 'role_edit'
    | 'full_edit'
    | 'status_started_assign'
    | 'status_arrived_assign'
    | 'direction_head_comment_edit'
    | 'brigadier_edit';

const checkCustomPermission = (role: AppRole, action: Action): boolean => {
    switch (action) {
        case 'storage_edit':
        case 'badge_edit':
        case 'full_list':
        case 'bulk_edit': // массовые изменения
            return role !== AppRoles.DIRECTION_HEAD;
        case 'status_started_assign': {
            const roles: AppRole[] = [AppRoles.DIRECTION_HEAD, AppRoles.CAT, AppRoles.SENIOR, AppRoles.ADMIN];
            return roles.includes(role);
        }
        case 'status_arrived_assign': {
            const roles: AppRole[] = [AppRoles.CAT, AppRoles.SENIOR, AppRoles.ADMIN];
            return roles.includes(role);
        }
        case 'direction_head_comment_edit':
            return role === AppRoles.DIRECTION_HEAD;
        case 'brigadier_edit':
            return role !== AppRoles.SOVA;
        case 'feed_type_edit':
        case 'unban':
            return role !== AppRoles.CAT;
        case 'role_edit':
            return role === AppRoles.ADMIN || role === AppRoles.SENIOR;
        case 'full_edit':
            return role === AppRoles.ADMIN;
        default:
            return false;
    }
};

export const canAccessByRole = (role: string, action: string, resource: string): boolean => {
    if (!isAppRole(role)) {
        return false;
    }

    if (action === 'list' || action === 'show') {
        return rolePermissions[role].read.has(resource);
    }
    if (action === 'create') {
        return rolePermissions[role].create.has(resource);
    }
    if (action === 'edit') {
        return rolePermissions[role].update.has(resource);
    }
    if (action === 'delete') {
        return rolePermissions[role].delete.has(resource);
    }

    return checkCustomPermission(role, action as Action);
};

export const ACL: AccessControlProvider = {
    can: async ({ action, resource }) => {
        const user = await getUserData(true);

        if (!user) {
            if (!window.location.pathname.endsWith('/login')) {
                window.location.replace('/login');
            }
            return { can: false };
        }

        if (!resource) {
            return { can: false };
        }

        const granted = user.roles.some((role) => canAccessByRole(role, action, resource));

        return { can: granted };
    }
};
