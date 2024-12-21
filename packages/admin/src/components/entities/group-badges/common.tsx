import { Form, Input, Select, useSelect } from '@pankod/refine-antd';
import { FC, lazy, Suspense } from 'react';

import { Rules } from 'components/form/rules';
import type { DirectionEntity } from 'interfaces';

import useVisibleDirections from '../vols/use-visible-directions';

const ReactQuill = lazy(() => import('react-quill'));

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
                <Suspense fallback={<div>Loading editor...</div>}>
                    <ReactQuill />
                </Suspense>
            </Form.Item>
        </>
    );
};
