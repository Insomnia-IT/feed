import React from 'react';
import { Create, useForm } from '@refinedev/antd';
import { Form, Input } from 'antd';
import type { StorageEntity } from 'interfaces';

export const StorageCreate: React.FC = () => {
    const { formProps, saveButtonProps } = useForm<StorageEntity>();

    return (
        <Create saveButtonProps={saveButtonProps} title="Создать склад">
            <Form {...formProps} layout="vertical">
                <Form.Item label="Название" name="name" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Описание" name="description">
                    <Input.TextArea />
                </Form.Item>
            </Form>
        </Create>
    );
};
