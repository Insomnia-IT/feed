import { Form, Input, Select } from 'antd';
import { useSelect } from '@refinedev/antd';

import { Rules } from 'components/form';
import type { AccessRoleEntity, PersonEntity, VolunteerRoleEntity } from 'interfaces';
import useCanAccess from '../../use-can-access';

import styles from '../../common.module.css';

export const HrInfoSection = ({
    canFullEditing,
    denyBadgeEdit,
    person
}: {
    canFullEditing: boolean;
    denyBadgeEdit: boolean;
    person: PersonEntity | null;
}) => {
    const form = Form.useFormInstance();
    const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });

    const { selectProps: rolesSelectProps } = useSelect<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        optionLabel: 'name'
    });

    const { selectProps: accessRoleselectProps } = useSelect<AccessRoleEntity>({
        resource: 'access-roles',
        optionLabel: 'name'
    });

    const onAccessRoleClear = (): void => {
        setTimeout((): void => {
            form.setFieldValue('access_role', '');
        });
    };

    return (
        <>
            <div className={styles.formSection__title}>
                <h4>HR информация</h4>
            </div>
            <div className={styles.fieldsGrid3}>
                <Form.Item className={styles.fieldsGrid3Field} label="Роль" name="main_role" rules={Rules.required}>
                    <Select disabled={!allowRoleEdit && !!person} {...rolesSelectProps} />
                </Form.Item>
                <Form.Item className={styles.fieldsGrid3Field} label="Право доступа" name="access_role">
                    <Select
                        allowClear
                        disabled={!canFullEditing}
                        onClear={onAccessRoleClear}
                        {...accessRoleselectProps}
                    />
                </Form.Item>
                <Form.Item className={styles.fieldsGrid3Field} label="Должность" name="position">
                    <Input disabled={denyBadgeEdit} />
                </Form.Item>
            </div>
        </>
    );
};
