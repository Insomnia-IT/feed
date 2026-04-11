import React from 'react';
import { Modal, Form, Input, Checkbox, Space } from 'antd';
import type { ModalProps } from 'antd';

interface CreateItemModalProps {
    modalProps: ModalProps;
    formProps: any;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({ modalProps, formProps }) => {
    return (
        <Modal {...modalProps} title="Создать предмет">
            <Form {...formProps} layout="vertical">
                <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="sku" label="Артикул / SKU">
                    <Input />
                </Form.Item>
                <Space size="large">
                    <Form.Item name="is_unique" valuePropName="checked">
                        <Checkbox>Уникальный</Checkbox>
                    </Form.Item>
                    <Form.Item name="is_anonymous" valuePropName="checked">
                        <Checkbox>Анонимный</Checkbox>
                    </Form.Item>
                </Space>
            </Form>
        </Modal>
    );
};
