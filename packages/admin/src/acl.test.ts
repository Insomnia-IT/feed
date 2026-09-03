import { describe, expect, it } from 'vitest';

import { AppRoles } from 'auth';
import { canAccessByRole } from './acl';

describe('canAccessByRole', () => {
    it('preserves inherited resource permissions', () => {
        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'list', 'volunteers')).toBe(true);
        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'list', 'wash')).toBe(false);

        expect(canAccessByRole(AppRoles.CAT, 'list', 'volunteers')).toBe(true);
        expect(canAccessByRole(AppRoles.CAT, 'list', 'wash')).toBe(true);
        expect(canAccessByRole(AppRoles.CAT, 'create', 'volunteers')).toBe(true);

        expect(canAccessByRole(AppRoles.SENIOR, 'list', 'wash')).toBe(true);
        expect(canAccessByRole(AppRoles.SENIOR, 'list', 'volunteer-custom-fields')).toBe(true);
        expect(canAccessByRole(AppRoles.SENIOR, 'edit', 'storage-items')).toBe(true);

        expect(canAccessByRole(AppRoles.ADMIN, 'create', 'volunteers')).toBe(true);
        expect(canAccessByRole(AppRoles.ADMIN, 'create', 'feed-transaction')).toBe(true);
        expect(canAccessByRole(AppRoles.ADMIN, 'delete', 'volunteers')).toBe(true);
    });

    it('keeps SOVA permissions isolated', () => {
        expect(canAccessByRole(AppRoles.SOVA, 'list', 'wash')).toBe(true);
        expect(canAccessByRole(AppRoles.SOVA, 'create', 'wash')).toBe(true);
        expect(canAccessByRole(AppRoles.SOVA, 'list', 'volunteers')).toBe(false);
    });

    it('maps list/show to read and edit to update', () => {
        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'show', 'group-badges')).toBe(true);
        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'edit', 'group-badges')).toBe(true);
        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'delete', 'group-badges')).toBe(false);
    });

    it('preserves custom action rules', () => {
        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'full_list', 'volunteers')).toBe(false);
        expect(canAccessByRole(AppRoles.CAT, 'full_list', 'volunteers')).toBe(true);

        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'status_started_assign', 'volunteers')).toBe(true);
        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'status_arrived_assign', 'volunteers')).toBe(false);
        expect(canAccessByRole(AppRoles.CAT, 'status_arrived_assign', 'volunteers')).toBe(true);

        expect(canAccessByRole(AppRoles.DIRECTION_HEAD, 'direction_head_comment_edit', 'volunteers')).toBe(true);
        expect(canAccessByRole(AppRoles.ADMIN, 'direction_head_comment_edit', 'volunteers')).toBe(false);

        expect(canAccessByRole(AppRoles.KITCHEN, 'brigadier_edit', 'volunteers')).toBe(true);
        expect(canAccessByRole(AppRoles.SOVA, 'brigadier_edit', 'volunteers')).toBe(false);
        expect(canAccessByRole(AppRoles.CAT, 'feed_type_edit', 'volunteers')).toBe(false);
        expect(canAccessByRole(AppRoles.KITCHEN, 'feed_type_edit', 'volunteers')).toBe(true);
        expect(canAccessByRole(AppRoles.SENIOR, 'role_edit', 'volunteers')).toBe(true);
        expect(canAccessByRole(AppRoles.ADMIN, 'full_edit', 'volunteers')).toBe(true);
    });

    it('denies unknown roles, actions and resources', () => {
        expect(canAccessByRole('UNKNOWN', 'list', 'volunteers')).toBe(false);
        expect(canAccessByRole(AppRoles.ADMIN, 'unknown', 'volunteers')).toBe(false);
        expect(canAccessByRole(AppRoles.ADMIN, 'list', 'unknown')).toBe(false);
    });
});
