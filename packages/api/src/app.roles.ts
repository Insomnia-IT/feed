import { RolesBuilder } from 'nest-access-control';

export enum AppRoles {
    ADMIN = 'ADMIN',
    EDITOR = 'EDITOR',
}

export const roles: RolesBuilder = new RolesBuilder();

roles
    // editor
    .grant(AppRoles.EDITOR)
    .read(['departments', 'vols', 'locations'])
    .create(['departments', 'vols'])
    .update(['departments', 'vols'])
    // admin
    .grant(AppRoles.ADMIN)
    .extend(AppRoles.EDITOR)
    .read(['departments', 'vols', 'locations'])
    .create(['departments', 'vols', 'locations'])
    .update(['departments', 'vols', 'locations'])
    .delete(['departments', 'vols', 'locations']);
