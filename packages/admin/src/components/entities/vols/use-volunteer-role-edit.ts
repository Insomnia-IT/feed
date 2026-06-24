import { Form, type FormInstance, type SelectProps } from 'antd';

import { DIRECTION_HEAD_EDITABLE_ROLE_IDS } from 'shared/constants/volunteer-role';
import useCanAccess from './use-can-access';
import useVisibleDirections from './use-visible-directions';

export const useVolunteerRoleEdit = ({
    form,
    roleOptions
}: {
    form: FormInstance;
    roleOptions: NonNullable<SelectProps['options']>;
}) => {
    const canEditAllRoles = useCanAccess({ action: 'role_edit', resource: 'volunteers' });
    const canEditBrigadierRole = useCanAccess({ action: 'brigadier_role_edit', resource: 'volunteers' });
    const visibleDirections = useVisibleDirections();
    const volunteerDirections = (Form.useWatch('directions', form) as Array<string | { id: string }> | undefined) ?? [];
    const currentRole = Form.useWatch('main_role', form) as string | undefined;
    const volunteerDirectionIds = volunteerDirections.map((direction) =>
        String(typeof direction === 'object' && 'id' in direction ? direction.id : direction)
    );
    const hasSharedDirection =
        visibleDirections?.some((directionId) => volunteerDirectionIds.includes(String(directionId))) ?? false;
    const currentRoleIsEditable = DIRECTION_HEAD_EDITABLE_ROLE_IDS.includes(
        currentRole as (typeof DIRECTION_HEAD_EDITABLE_ROLE_IDS)[number]
    );
    const canEditLimitedRole = canEditBrigadierRole && hasSharedDirection && currentRoleIsEditable;

    return {
        canEditRole: canEditAllRoles || canEditLimitedRole,
        roleOptions:
            canEditAllRoles || !canEditLimitedRole
                ? roleOptions
                : roleOptions.filter((role) =>
                      DIRECTION_HEAD_EDITABLE_ROLE_IDS.includes(
                          role.value as (typeof DIRECTION_HEAD_EDITABLE_ROLE_IDS)[number]
                      )
                  )
    };
};
