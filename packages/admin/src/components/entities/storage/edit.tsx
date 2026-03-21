import { FC } from 'react';
import { Edit, useForm } from '@refinedev/antd';
import { Form, Input } from 'antd';
import type { IResourceComponentsProps } from '@refinedev/core';

import type { StorageEntity } from 'interfaces';
import { Rules } from 'components/form/rules';

export const StorageEdit: FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<StorageEntity>();

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item label="Название" name="name" rules={Rules.required}>
                    <Input />
                </Form.Item>
                <Form.Item label="Описание" name="description">
                    <Input.TextArea rows={4} />
                </Form.Item>
            </Form>
        </Edit>
    );
};
