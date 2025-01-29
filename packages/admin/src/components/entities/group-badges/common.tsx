import { Form, Input, Select } from 'antd';
import { useSelect } from '@refinedev/antd';
import { FC } from 'react';

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
