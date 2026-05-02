import React from 'react';
import { Modal, Form, Input, InputNumber } from 'antd';
import type { ModalProps } from 'antd';

interface BinModalProps {
    modalProps: ModalProps;
    formProps: any;
    storageId: number;
    action: 'create' | 'edit';
}

export const BinModal: React.FC<BinModalProps> = ({ modalProps, formProps, storageId, action }) => {
    return (
        <Modal {...modalProps} title={action === 'create' ? 'Создать ячейку' : 'Редактировать ячейку'}>
            <Form {...formProps} layout="vertical">
                <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="capacity" label="Вместимость">
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="description" label="Описание">
                    <Input.TextArea />
                </Form.Item>
                <Form.Item name="storage" hidden initialValue={storageId}>
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};
