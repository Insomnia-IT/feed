import { Form, Input, Select } from 'antd';

import { Rules } from 'components/form';

import styles from '../../common.module.css';

export const HrInfoSection = ({
    canFullEditing,
    allowRoleEdit,
    denyBadgeEdit,
    person,
    mainRole,
    directionOptions,
    rolesOptions,
    accessRoleOptions
}: {
    canFullEditing: boolean;
    allowRoleEdit: boolean;
    denyBadgeEdit: boolean;
    person: any;
    mainRole: string;
    directionOptions: { label: string; value: string | number }[];
    rolesOptions: { label: string; value: string | number }[];
    accessRoleOptions: { label: string; value: string | number }[];
}) => {
    const form = Form.useFormInstance();

    //TODO: вынести в константы
    const allowEmptyDirections = ['FELLOW', 'ART_FELLOW', 'VIP', 'PRESS', 'CONTRACTOR'].includes(mainRole);

    const onAccessRoleClear = () => {
        setTimeout(() => {
            form.setFieldValue('access_role', '');
        });
    };

    const getDirectionIds = (direction: any[]) => ({
        value: direction ? direction.map((d) => d.id || d) : direction
    });

    return (
        <>
            <p className={styles.formSection__title}>HR информация</p>
            <div className={styles.hrInputsWrap}>
                <div className={styles.hrInput}>
                    <Form.Item label="Право доступа" name="access_role">
                        <Select
                            allowClear
                            disabled={!canFullEditing}
                            options={accessRoleOptions}
                            onClear={onAccessRoleClear}
                        />
                    </Form.Item>
                </div>
                <div className={styles.hrInput}>
                    <Form.Item label="Роль" name="main_role" rules={Rules.required}>
                        <Select disabled={!allowRoleEdit && !!person} options={rolesOptions} />
                    </Form.Item>
                </div>
            </div>
            <div className={styles.hrInputsWrap}>
                <div className={styles.hrInput}>
                    <Form.Item
                        label="Служба / Локация"
                        getValueProps={getDirectionIds}
                        name="directions"
                        rules={allowEmptyDirections ? undefined : Rules.required}
                    >
                        <Select disabled={!allowRoleEdit && !!person} mode="multiple" options={directionOptions} />
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
