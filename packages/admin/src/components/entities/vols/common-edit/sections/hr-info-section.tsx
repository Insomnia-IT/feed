import { Form, Input, Select } from 'antd';
import { useSelect } from '@refinedev/antd';

import { Rules } from 'components/form';
import type { AccessRoleEntity, DirectionEntity, VolunteerRoleEntity } from 'interfaces';
import useCanAccess from '../../use-can-access.tsx';

import styles from '../../common.module.css';

export const HrInfoSection = ({
    canFullEditing,
    denyBadgeEdit,
    person
}: {
    canFullEditing: boolean;
    denyBadgeEdit: boolean;
    person: { id: number; name: string; role: string };
}) => {
    const form = Form.useFormInstance();
    const mainRole = Form.useWatch('main_role', form);
    const allowRoleEdit = useCanAccess({ action: 'role_edit', resource: 'volunteers' });

    const { selectProps: rolesSelectProps } = useSelect<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        optionLabel: 'name'
    });

    const { selectProps: accessRoleselectProps } = useSelect<AccessRoleEntity>({
        resource: 'access-roles',
        optionLabel: 'name'
    });

    const { selectProps: directionsSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name',
        optionValue: 'id'
    });

    //TODO: вынести в константы
    const allowEmptyDirections = ['FELLOW', 'ART_FELLOW', 'VIP', 'PRESS', 'CONTRACTOR'].includes(mainRole);

    const onAccessRoleClear = (): void => {
        setTimeout((): void => {
            form.setFieldValue('access_role', '');
        });
    };

    return (
        <>
            <p className={styles.formSection__title}>HR информация</p>
            <div className={styles.hrInputsWrap}>
                <div className={styles.hrInput}>
                    <Form.Item label="Право доступа" name="access_role">
                        <Select
                            allowClear
                            disabled={!canFullEditing}
                            onClear={onAccessRoleClear}
                            {...accessRoleselectProps}
                        />
                    </Form.Item>
                </div>
                <div className={styles.hrInput}>
                    <Form.Item label="Роль" name="main_role" rules={Rules.required}>
                        <Select disabled={!allowRoleEdit && !!person} {...rolesSelectProps} />
                    </Form.Item>
                </div>
            </div>
            <div className={styles.hrInputsWrap}>
                <div className={styles.hrInput}>
                    <Form.Item
                        label="Служба / Локация"
                        name="directions"
                        rules={allowEmptyDirections ? undefined : Rules.required}
                    >
                        <Select disabled={!allowRoleEdit && !!person} mode="multiple" {...directionsSelectProps} />
                    </Form.Item>
                </div>
                <div className={styles.hrInput}>
                    <Form.Item label="Должность" name="position">
                        <Input disabled={denyBadgeEdit} />
                    </Form.Item>
                </div>
            </div>
        </>
    );
};
