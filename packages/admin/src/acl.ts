import { AccessControl } from 'accesscontrol';

import { AppRoles, getUserData } from '~/auth';

export const ac = new AccessControl();
ac
    // editor
    .grant(AppRoles.EDITOR)
    .read(['departments', 'vols', 'dashboard', 'locations'])
    .create('departments')
    .update('departments')
    // admin
    .grant(AppRoles.ADMIN)
    .extend(AppRoles.EDITOR)
    .create(['departments', 'vols', 'locations'])
    .update(['departments', 'vols', 'locations'])
    .delete(['departments', 'vols', 'locations']);

export const ACL = {
    can: async ({ action, resource }) => {
        let can = false;
        const user = getUserData(null, true);
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
