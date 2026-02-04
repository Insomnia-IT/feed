import { Button, Form, Input, Select } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import { useSelect } from '@refinedev/antd';
import { useEffect, useState } from 'react';

import { Rules } from 'components/form/rules';
import { TextEditor } from 'components/controls/text-editor';
import type { DirectionEntity } from 'interfaces';
import useVisibleDirections from '../vols/use-visible-directions';
import { QRScannerModal } from 'shared/components/qr-scanner-modal';

export const CreateEdit = () => {
    const form = Form.useFormInstance();
    const { selectProps: directionSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name',
        optionValue: 'id',
        pagination: { mode: 'off' }
    });

    const visibleDirections = useVisibleDirections();
    const directions = directionSelectProps.options?.filter(
        ({ value }) => !visibleDirections || visibleDirections.includes(value as string)
    );

    const directionValue = Form.useWatch('direction', form);
    const shouldHideDirectionValue = directionValue != null && (directionSelectProps.options?.length ?? 0) === 0;

    const [openQrModal, setOpenQrModal] = useState(false);

    useEffect(() => {
        function onHardwareScan(e: CustomEvent<{ scanCode: string }>): void {
            const scanCode = e?.detail?.scanCode;
            if (scanCode) {
                form.setFieldValue('qr', scanCode.replace(/[^A-Za-z0-9]/g, ''));
            }
        }
        document.addEventListener('scan', onHardwareScan);
        return () => {
            document.removeEventListener('scan', onHardwareScan);
        };
    }, [form]);

    return (
        <>
            <Form.Item label="Название" name="name" rules={Rules.required}>
                <Input />
            </Form.Item>
            <Form.Item label="Служба/Направление" name="direction" rules={Rules.required}>
                <Select
                    {...directionSelectProps}
                    options={directions}
                    loading={shouldHideDirectionValue || directionSelectProps.loading}
                    value={shouldHideDirectionValue ? undefined : directionSelectProps.value}
                    placeholder={shouldHideDirectionValue ? 'Загрузка...' : undefined}
                />
            </Form.Item>
            <Form.Item label="QR" name="qr" rules={Rules.required}>
                <Input.Search
                    onSearch={() => setOpenQrModal(true)}
                    enterButton={<Button icon={<QrcodeOutlined />}></Button>}
                />
            </Form.Item>
            <Form.Item label="Комментарий" name="comment">
                <TextEditor />
            </Form.Item>
            <QRScannerModal open={openQrModal} onClose={() => setOpenQrModal(false)} />
        </>
    );
};
