import { Form, Input, Select } from 'antd';
import { useSelect } from '@refinedev/antd';

import { Rules } from 'components/form';
import type { AccessRoleEntity, PersonEntity, VolunteerRoleEntity } from 'interfaces';
import { useVolunteerRoleEdit } from '../../../use-volunteer-role-edit';

import styles from '../../common.module.css';

export const HrInfoSection = ({
    canFullEditing,
    denyBadgeEdit
}: {
    canFullEditing: boolean;
    denyBadgeEdit: boolean;
    person: PersonEntity | null;
}) => {
    const form = Form.useFormInstance();

    const { selectProps: rolesSelectProps } = useSelect<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        optionLabel: 'name',
        pagination: { mode: 'off' }
    });
    const { canEditRole, roleOptions: visibleRoleOptions } = useVolunteerRoleEdit({
        form,
        roleOptions: rolesSelectProps.options ?? []
    });

    const { selectProps: accessRoleselectProps } = useSelect<AccessRoleEntity>({
        resource: 'access-roles',
        optionLabel: 'name',
        pagination: { mode: 'off' }
    });

    const onAccessRoleClear = (): void => {
        setTimeout((): void => {
            form.setFieldValue('access_role', '');
        });
    };

    return (
        <>
            <p className={styles.formSection__title}>HR информация</p>
            <div className={styles.threeColumnsWrap}>
                <Form.Item label="Должность" name="position">
                    <Input disabled={denyBadgeEdit} />
                </Form.Item>
                <Form.Item label="Право доступа" name="access_role">
                    <Select
                        allowClear
                        disabled={!canFullEditing}
                        onClear={onAccessRoleClear}
                        {...accessRoleselectProps}
                    />
                </Form.Item>
                <Form.Item label="Роль" name="main_role" rules={Rules.required}>
                    <Select {...rolesSelectProps} options={visibleRoleOptions} disabled={!canEditRole} />
                </Form.Item>
            </div>
        </>
    );
};
