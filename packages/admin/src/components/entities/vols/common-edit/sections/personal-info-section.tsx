import { Form, Input, Select, Checkbox, Divider, Button, Tooltip } from 'antd';
import { type ChangeEvent, useState } from 'react';
import { QrcodeOutlined, InfoCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';

import { Rules } from 'components/form';
import { QRScannerModal } from 'shared/components/qr-scanner-modal';

import styles from '../../common.module.css';

export const PersonalInfoSection = ({
    canFullEditing,
    isCreationProcess,
    denyBadgeEdit,
    genderOptions,
    handleQRChange
}: {
    canFullEditing: boolean;
    isCreationProcess: boolean;
    denyBadgeEdit: boolean;
    genderOptions: { label: string; value: string | number }[];
    handleQRChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
    const [openQrModal, setOpenQrModal] = useState(false);
    // На создании показываем только обязательное (QR), опциональное прячем за переключателем.
    // На редактировании раскрываем сразу, чтобы видеть уже заполненные данные.
    const [showOptional, setShowOptional] = useState(!isCreationProcess);

    return (
        <>
            <div className={styles.formSection__title}>
                <h4>Личная информация</h4>
            </div>

            <div className={styles.fieldRow}>
                <Form.Item
                    className={styles.fieldMd}
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
                <Form.Item name="is_badge_located_at_leader" valuePropName="checked" className={styles.inlineCheckbox}>
                    <Checkbox>
                        Бейдж у Руководителя
                        <Tooltip title="Бейдж физически находится у руководителя службы, а не у волонтёра">
                            <InfoCircleOutlined className={styles.labelHint} />
                        </Tooltip>
                    </Checkbox>
                </Form.Item>
            </div>

            <Button
                type="link"
                className={styles.optionalToggle}
                icon={showOptional ? <UpOutlined /> : <DownOutlined />}
                onClick={() => setShowOptional((prev) => !prev)}
            >
                {showOptional ? 'Скрыть дополнительные поля' : 'Дополнительные поля'}
            </Button>

            <div style={{ display: showOptional ? undefined : 'none' }}>
                <Divider className={styles.compactDivider} orientation="left" orientationMargin={0}>
                    Контакты
                </Divider>
                <div className={styles.fieldRow}>
                    <Form.Item className={styles.fieldMd} label="Телефон" name="phone">
                        <Input type="phone" />
                    </Form.Item>
                    <Form.Item
                        className={styles.fieldMd}
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
                    <Form.Item className={styles.fieldSm} label="Пол волонтера" name="gender">
                        <Select options={genderOptions} />
                    </Form.Item>
                </div>

                <Divider className={styles.compactDivider} orientation="left" orientationMargin={0}>
                    Бейдж
                </Divider>
                <div className={styles.fieldRow}>
                    <Form.Item className={styles.fieldSm} label="Номер бейджа" name="badge_number">
                        <Input disabled={denyBadgeEdit} />
                    </Form.Item>
                    <Form.Item
                        className={styles.fieldSm}
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
                    <Form.Item name="is_ticket_received" valuePropName="checked" className={styles.inlineCheckbox}>
                        <Checkbox disabled>Выдан билет</Checkbox>
                    </Form.Item>
                </div>
            </div>

            <QRScannerModal open={openQrModal} onClose={() => setOpenQrModal(false)} handleQRChange={handleQRChange} />
        </>
    );
};
