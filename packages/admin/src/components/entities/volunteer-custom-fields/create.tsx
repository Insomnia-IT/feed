import { Form, Button } from 'antd';
import type { FormInstance } from 'antd';
import { useForm } from '@refinedev/core';

import type { VolunteerCustomFieldEntity } from 'interfaces';

import { CreateEdit } from './common';

export const VolunteerCustomFieldCreate = () => {
    const { mutation, onFinish } = useForm<VolunteerCustomFieldEntity>();

    const [form] = Form.useForm();

    const handleFinish = async (values: VolunteerCustomFieldEntity) => {
        await onFinish(values);
    };

    return (
        <div style={{ padding: '24px' }}>
            <Form form={form as FormInstance} layout="vertical" onFinish={handleFinish}>
                <CreateEdit />
                <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                    Сохранить
                </Button>
            </Form>
        </div>
    );
};
