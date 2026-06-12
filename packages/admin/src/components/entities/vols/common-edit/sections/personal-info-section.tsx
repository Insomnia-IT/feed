import { Form, Input, Select, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import styles from '../../common.module.css';

export const PersonalInfoSection = ({
    denyBadgeEdit,
    genderOptions
}: {
    denyBadgeEdit: boolean;
    genderOptions: { label: string; value: string | number }[];
}) => {
    return (
        <>
            <div className={styles.formSection__title}>
                <h4>Личная информация</h4>
            </div>

            <div className={styles.fieldsGrid3}>
                <Form.Item className={styles.fieldsGrid3Field} label="Телефон" name="phone">
                    <Input type="phone" />
                </Form.Item>
                <Form.Item
                    className={styles.fieldsGrid3Field}
                    label={
                        <span>
                            Telegram
                            <Tooltip title="Подтягивается из профиля и недоступен для ручного редактирования">
                                <InfoCircleOutlined className={styles.labelHint} />
                            </Tooltip>
                        </span>
                    }
                    name={['person', 'telegram']}
                >
                    <Input readOnly={denyBadgeEdit} disabled={true} />
                </Form.Item>
                <Form.Item className={styles.fieldsGrid3Field} label="Пол волонтера" name="gender">
                    <Select options={genderOptions} />
                </Form.Item>
            </div>
        </>
    );
};
