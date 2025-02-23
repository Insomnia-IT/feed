import { FC } from 'react';
import { Edit, useForm, useSelect } from '@refinedev/antd';
import { Form, Input, Select } from 'antd';
import type { IResourceComponentsProps } from '@refinedev/core';

import { Rules } from 'components/form/rules';
import type { DirectionEntity, DirectionTypeEntity } from 'interfaces';

export const DirectionEdit: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<DirectionEntity>();

    const { selectProps: typesSelectProps } = useSelect<DirectionTypeEntity>({
        resource: 'direction-types',
        optionLabel: 'name'
    });

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item label="Название" name="name" rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label="Тип" name="type" rules={Rules.required}>
                    <Select {...typesSelectProps} />
                </Form.Item>
            </Form>
        </Edit>
    );
};
