import { AccessControl } from 'accesscontrol';

import { AppRoles, getUserData } from '~/auth';

export const ac = new AccessControl();
ac
    // editor
    .grant(AppRoles.EDITOR)
    .read([
        'departments',
        'volunteers',
        'dashboard',
        'locations',
        'feed-transaction',
        'sync',
        'stats',
        'group-badges',
        'volunteer-custom-fields',
        'scanner-page'
    ])
    .create(['departments', 'group-badges', 'volunteer-custom-fields'])
    .update(['departments', 'group-badges', 'volunteer-custom-fields'])
    // admin
    .grant(AppRoles.ADMIN)
    .extend(AppRoles.EDITOR)
    .create(['departments', 'volunteers', 'locations', 'feed-transaction', 'group-badges', 'volunteer-custom-fields'])
    .update(['departments', 'volunteers', 'locations', 'group-badges', 'volunteer-custom-fields'])
    .delete(['departments', 'volunteers', 'locations', 'feed-transaction', 'group-badges', 'volunteer-custom-fields']);

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
                }
            });
        }
        return Promise.resolve({ can });
    }
};
