import { Form, Input, Select } from 'antd';
import { useSelect } from '@refinedev/antd';
import { FC, useEffect } from 'react';

import { Rules } from 'components/form/rules';
import { TextEditor } from 'components/controls/text-editor';
import type { DirectionEntity } from 'interfaces';
import useVisibleDirections from '../vols/use-visible-directions';

export const CreateEdit: FC = () => {
    const { selectProps: directionSelectProps } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name'
    });

    const visibleDirections = useVisibleDirections();
    const directions = directionSelectProps.options?.filter(
        ({ value }) => !visibleDirections || visibleDirections.includes(value as string)
    );

    const form = Form.useFormInstance();

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
            <Form.Item label="QR" name="qr" rules={Rules.required}>
                <Input />
            </Form.Item>
            <Form.Item label="Комментарий" name="comment">
                <TextEditor />
            </Form.Item>
        </>
    );
};
