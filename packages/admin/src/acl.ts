import { AccessControl } from 'accesscontrol';
import type { AccessControlProvider } from '@refinedev/core';

import { AppRoles, getUserData, type AppRole } from 'auth';

const ac = new AccessControl();

const canRole = (role: AppRole) => ac.can(role as string);
ac
    // Руководитель локации
    .grant(AppRoles.DIRECTION_HEAD)
    .read(['dashboard', 'volunteers', 'group-badges'])
    .update(['group-badges', 'volunteers'])
    // Кот
    .grant(AppRoles.CAT)
    .extend(AppRoles.DIRECTION_HEAD)
    .read(['wash', 'directions', 'feed-transaction', 'sync', 'stats', 'scanner-page'])
    .create(['volunteers'])
    // Старший смены
    .grant(AppRoles.SENIOR)
    .extend(AppRoles.CAT)
    .read(['volunteer-custom-fields'])
    .create(['group-badges', 'volunteer-custom-fields'])
    .update(['volunteer-custom-fields'])
    // Администратор
    .grant(AppRoles.ADMIN)
    .extend(AppRoles.SENIOR)
    .create(['group-badges', 'volunteer-custom-fields', 'feed-transaction', 'wash'])
    .update(['group-badges', 'volunteer-custom-fields'])
    .delete(['group-badges', 'volunteer-custom-fields', 'feed-transaction', 'volunteers'])
    // Сова
    .grant(AppRoles.SOVA)
    .read('wash')
    .create('wash');

type Action =
    | 'list'
    | 'show'
    | 'create'
    | 'edit'
    | 'delete'
    | 'full_list'
    | 'badge_edit'
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
        case 'full_list':
        case 'badge_edit':
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

export const ACL: AccessControlProvider = {
    can: async ({ action, resource }) => {
        const user = await getUserData(true);

        if (!user) {
            if (!window.location.pathname.endsWith('/login')) {
                window.location.replace('/login');
            }
            return { can: false };
        }

        const granted = user.roles.some((role) => {
            if (action === 'list' || action === 'show') {
                return canRole(role).read(resource).granted;
            }
            if (action === 'create') {
                return canRole(role).create(resource).granted;
            }
            if (action === 'edit') {
                return canRole(role).update(resource).granted;
            }
            if (action === 'delete') {
                return canRole(role).delete(resource).granted;
            }
            return checkCustomPermission(role, action as Action);
        });

        return { can: granted };
    }
};
