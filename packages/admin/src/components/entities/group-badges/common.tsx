import { Button, Form, Input, Select } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import { useSelect } from '@refinedev/antd';
import { FC, useEffect, useMemo, useState } from 'react';

import { Rules } from 'components/form/rules';
import { TextEditor } from 'components/controls/text-editor';
import type { DirectionEntity, VolunteerRoleEntity } from 'interfaces';
import useVisibleDirections from '../vols/use-visible-directions';
import { QRScannerModal } from 'shared/components/qr-scanner-modal';

export const CreateEdit: FC = () => {
    const { selectProps: directionSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name'
    });
    const { selectProps: volunteerRoleSelectProps } = useSelect<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        optionLabel: 'name',
        filters: [
            {
                field: 'is_group_badge',
                operator: 'eq',
                value: true
            }
        ]
    });

    const visibleDirections = useVisibleDirections();
    const directions = directionSelectProps.options?.filter(
        ({ value }) => !visibleDirections || visibleDirections.includes(value as string)
    );
    const groupBadgeRoles = useMemo(
        () =>
            [...(volunteerRoleSelectProps.options ?? [])].sort((left, right) =>
                String(left.label).localeCompare(String(right.label), 'ru')
            ),
        [volunteerRoleSelectProps.options]
    );

    const form = Form.useFormInstance();
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
                <Select {...directionSelectProps} options={directions} />
            </Form.Item>
            <Form.Item label="Роль волонтеров" name="role" rules={Rules.required}>
                <Select {...volunteerRoleSelectProps} options={groupBadgeRoles} />
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
