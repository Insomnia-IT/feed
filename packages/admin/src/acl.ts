import { AccessControl } from 'accesscontrol';

import { AppRoles, getUserData } from '~/auth';

export const ac = new AccessControl();
ac
    // Руководитель локации
    .grant(AppRoles.DIRECTION_HEAD)
    .read(['dashboard', 'volunteers', 'group-badges'])
    .update(['group-badges'])
    .update(['volunteers'])
    // Кот
    .grant(AppRoles.CAT)
    .extend(AppRoles.DIRECTION_HEAD)
    .create(['volunteers'])
    .read(['directions', 'feed-transaction', 'sync', 'stats', 'scanner-page'])
    // Старший смены
    .grant(AppRoles.SENIOR)
    .extend(AppRoles.CAT)
    .read(['volunteer-custom-fields'])
    .create(['group-badges', 'volunteer-custom-fields'])
    .update(['volunteer-custom-fields'])
    .delete(['volunteers'])
    // Администратор
    .grant(AppRoles.ADMIN)
    .extend(AppRoles.SENIOR)
    .create(['group-badges', 'volunteer-custom-fields', 'feed-transaction'])
    .update(['group-badges', 'volunteer-custom-fields'])
    .delete(['group-badges', 'volunteer-custom-fields', 'feed-transaction', 'volunteers']);

export const ACL = {
    can: async ({ action, resource }) => {
        let can = false;
        const user = await getUserData(null, true);
        if (user) {
            const { roles } = user;
            roles.forEach((role: string) => {
                switch (action) {
                    case 'list':
                    case 'show':
                        can = ac.can(role).read(resource).granted;
                        break;
                    case 'create':
                        can = ac.can(role).create(resource).granted;
                        break;
                    case 'edit':
                        can = ac.can(role).update(resource).granted;
                        break;
                    case 'delete':
                        can = ac.can(role).delete(resource).granted;
                        break;
                    case 'full_list':
                    case 'badge_edit':
                        can = role !== AppRoles.DIRECTION_HEAD;
                        break;
                    case 'unban':
                        can = role === AppRoles.ADMIN || role == AppRoles.SENIOR;
                        break;
                    case 'full_edit':
                        can = role === AppRoles.ADMIN;
                        break;
                }
            });
        } else {
            if (!window.location.href.endsWith('/login')) {
                window.location.href = `${window.location.origin}/login`;
            }
        }
        return Promise.resolve({ can });
    }
};
