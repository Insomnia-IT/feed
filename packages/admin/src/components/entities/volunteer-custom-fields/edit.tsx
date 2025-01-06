import { FC } from 'react';
import { Form, Button } from 'antd';
import type { FormInstance } from 'antd';
import { useForm } from '@refinedev/core';
import type { IResourceComponentsProps } from '@refinedev/core';

import type { VolunteerCustomFieldEntity } from 'interfaces';

import { CreateEdit } from './common';

export const VolunteerCustomFieldEdit: FC<IResourceComponentsProps> = () => {
    const { query, mutation, onFinish } = useForm<VolunteerCustomFieldEntity>({
        action: 'edit'
    });

    const [form] = Form.useForm();

    const handleFinish = async (values: VolunteerCustomFieldEntity) => {
        await onFinish(values);
    };

    return (
        <div style={{ padding: '24px' }}>
            <Form
                form={form as FormInstance}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={query?.data?.data}
            >
                <CreateEdit isEdit={true} />
                <Button type="primary" htmlType="submit" loading={mutation.isLoading}>
                    Сохранить
                </Button>
            </Form>
        </div>
    );
};
