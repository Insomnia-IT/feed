import { Form, Input, Select, Checkbox, Divider, Button } from 'antd';

import { QrcodeOutlined } from '@ant-design/icons';

import { Rules } from 'components/form';

import styles from '../../common.module.css';
import { useState } from 'react';
import { QRScannerModal } from 'shared/components/qr-scanner-modal';

export const PersonalInfoSection = ({
    isCreationProcess,
    denyBadgeEdit,
    denyFeedTypeEdit,
    feedTypeOptions,
    kitchenOptions,
    genderOptions,
    handleQRChange
}: {
    isCreationProcess: boolean;
    denyBadgeEdit: boolean;
    denyFeedTypeEdit: boolean;
    feedTypeOptions: { label: string; value: string | number }[];

    kitchenOptions: { label: string; value: string | number }[];
    genderOptions: { label: string; value: string | number }[];
    handleQRChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
    const [openQrModal, setOpenQrModal] = useState(false);

    return (
        <>
            <p className={styles.formSection__title}>Личная информация</p>

            <div className={styles.twoEqualColumnsWrap}>
                <Form.Item label="Кухня" name="kitchen" rules={Rules.required}>
                    <Select options={kitchenOptions} disabled={denyBadgeEdit} />
                </Form.Item>
                <Form.Item label="Тип питания" name="feed_type" rules={Rules.required}>
                    <Select disabled={denyFeedTypeEdit} options={feedTypeOptions} />
                </Form.Item>
            </div>

            <div className={styles.threeColumnsWrap}>
                <Form.Item label="Телефон" name="phone">
                    <Input type="phone" />
                </Form.Item>
                <Form.Item label="Telegram" name={['person', 'telegram']}>
                    <Input readOnly={denyBadgeEdit} disabled={true} />
                </Form.Item>
                <Form.Item label="Пол волонтера" name="gender">
                    <Select options={genderOptions} />
                </Form.Item>
            </div>
            <div className={styles.twoColumnsStartWrap}>
                <Form.Item name="is_vegan" valuePropName="checked">
                    <Checkbox>Веган</Checkbox>
                </Form.Item>
                <Form.Item name="infant" valuePropName="checked">
                    <Checkbox>&lt;18 лет</Checkbox>
                </Form.Item>
                <Form.Item name="is_ticket_received" valuePropName="checked">
                    <Checkbox disabled>Выдан билет</Checkbox>
                </Form.Item>
            </div>

            <Divider style={{ marginTop: '0px' }} />

            <div className={styles.threeColumnsWrap}>
                <Form.Item label="QR бейджа" name="qr" rules={isCreationProcess ? Rules.required : undefined}>
                    <Input.Search
                        onChange={handleQRChange}
                        onSearch={() => setOpenQrModal(true)}
                        enterButton={<Button icon={<QrcodeOutlined />}></Button>}
                    />
                </Form.Item>
                <Form.Item label="Номер бейджа" name="badge_number">
                    <Input disabled={denyBadgeEdit} />
                </Form.Item>
                <Form.Item label="Партия бейджа" name="printing_batch">
                    <Input disabled={denyBadgeEdit} />
                </Form.Item>
                {/* <Form.Item name="is_badged_leader" valuePropName="checked">
                    <Checkbox>Бейдж у Руководителя</Checkbox>
                </Form.Item> */}
            </div>
            <QRScannerModal open={openQrModal} onClose={() => setOpenQrModal(false)} handleQRChange={handleQRChange} />
        </>
    );
};
