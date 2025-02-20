import { Form, Input, Select } from 'antd';

import { Rules } from 'components/form';

import styles from '../../common.module.css';

export const BadgeSection = ({
    denyBadgeEdit,
    canEditGroupBadge,
    colorTypeOptions,
    groupBadgeOptions,
    handleQRChange
}: {
    denyBadgeEdit: boolean;
    canEditGroupBadge: boolean;
    colorTypeOptions: { label: string; value: string | number }[];
    groupBadgeOptions: { label: string; value: string | number }[];
    handleQRChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
    const form = Form.useFormInstance();

    const onGroupBadgeClear = () => {
        setTimeout(() => {
            form.setFieldValue('group_badge', '');
        });
    };

    console.log(denyBadgeEdit);

    return (
        <>
            <p className={styles.formSection__title}>Бейдж</p>
            <div className={styles.badgeInfoWrap}>
                <div className={styles.badgeInfo}>
                    <Form.Item label="QR бейджа" name="qr" rules={Rules.required}>
                        <Input disabled={denyBadgeEdit} onChange={handleQRChange} />
                    </Form.Item>
                </div>
                <div className={styles.badgeInfo}>
                    <Form.Item label="Групповой бейдж" name="group_badge">
                        <Select
                            disabled={!canEditGroupBadge}
                            allowClear
                            options={groupBadgeOptions}
                            onClear={onGroupBadgeClear}
                        />
                    </Form.Item>
                </div>
            </div>
            <div className={styles.badgeInfoWrap}>
                <div className={styles.badgeInfo}>
                    <div className={styles.badgeInfoPart}>
                        <Form.Item label="Партия бейджа" name="printing_batch" className={styles.badgeInfoPartItem}>
                            <Input readOnly disabled={denyBadgeEdit} />
                        </Form.Item>
                        <Form.Item label="Номер бейджа" name="badge_number" className={styles.badgeInfoPartItem}>
                            <Input disabled={denyBadgeEdit} />
                        </Form.Item>
                    </div>
                </div>
                <div className={styles.badgeInfo}>
                    <Form.Item label="Цвет бейджа" name="color_type">
                        <Select disabled={true} options={colorTypeOptions} />
                    </Form.Item>
                </div>
            </div>
        </>
    );
};
