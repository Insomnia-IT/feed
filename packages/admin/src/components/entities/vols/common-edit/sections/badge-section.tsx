import { Form, Input, Checkbox, Button, Tooltip } from 'antd';
import { type ChangeEvent, useState } from 'react';
import { QrcodeOutlined, InfoCircleOutlined } from '@ant-design/icons';

import { Rules } from 'components/form';
import { QRScannerModal } from 'shared/components/qr-scanner-modal';

import styles from '../../common.module.css';
import badgeStyles from './badge-section.module.css';

export const BadgeSection = ({
    canFullEditing,
    isCreationProcess,
    denyBadgeEdit,
    handleQRChange
}: {
    canFullEditing: boolean;
    isCreationProcess: boolean;
    denyBadgeEdit: boolean;
    handleQRChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
    const [openQrModal, setOpenQrModal] = useState(false);

    return (
        <>
            <div className={styles.formSection__title}>
                <h4>Бейдж</h4>
            </div>

            <div className={styles.fieldsGrid3}>
                <Form.Item
                    className={styles.fieldsGrid3Field}
                    label="QR бейджа"
                    name="qr"
                    rules={isCreationProcess ? Rules.required : undefined}
                >
                    <Input.Search
                        onChange={handleQRChange}
                        onSearch={() => setOpenQrModal(true)}
                        enterButton={<Button icon={<QrcodeOutlined />}></Button>}
                    />
                </Form.Item>
                <Form.Item className={styles.fieldsGrid3Field} label="Номер бейджа" name="badge_number">
                    <Input disabled={denyBadgeEdit} />
                </Form.Item>
                <Form.Item
                    className={styles.fieldsGrid3Field}
                    label={
                        <span>
                            Партия бейджа
                            <Tooltip title="Номер партии печати бейджей. Заполняется при массовой печати.">
                                <InfoCircleOutlined className={styles.labelHint} />
                            </Tooltip>
                        </span>
                    }
                    name="printing_batch"
                >
                    <Input disabled={!canFullEditing} />
                </Form.Item>
            </div>

            <div className={badgeStyles.badgeCheckboxesRow}>
                <Form.Item
                    name="is_badge_located_at_leader"
                    valuePropName="checked"
                    className={`${badgeStyles.badgeCheckboxItem} ${badgeStyles.badgeAtLeaderCheckbox}`}
                >
                    <Checkbox>
                        Бейдж у Руководителя
                        <Tooltip title="Бейдж физически находится у руководителя службы, а не у волонтёра">
                            <InfoCircleOutlined className={badgeStyles.badgeAtLeaderHint} />
                        </Tooltip>
                    </Checkbox>
                </Form.Item>
                <Form.Item name="is_ticket_received" valuePropName="checked" className={badgeStyles.badgeCheckboxItem}>
                    <Checkbox disabled>Выдан билет</Checkbox>
                </Form.Item>
            </div>

            <QRScannerModal open={openQrModal} onClose={() => setOpenQrModal(false)} handleQRChange={handleQRChange} />
        </>
    );
};
