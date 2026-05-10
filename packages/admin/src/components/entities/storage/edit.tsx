import React from 'react';
import { Edit, useForm } from '@refinedev/antd';
import { Form, Input } from 'antd';
import type { StorageEntity } from 'interfaces';

export const StorageEdit: React.FC = () => {
    const { formProps, saveButtonProps, query } = useForm<StorageEntity>();
    const storage = query?.data?.data;

    return (
        <Edit saveButtonProps={saveButtonProps} title={`Редактировать склад: ${storage?.name}`}>
            <Form {...formProps} layout="vertical">
                <Form.Item label="Название" name="name" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Описание" name="description">
                    <Input.TextArea />
                </Form.Item>
            </Form>
        </Edit>
    );
};
