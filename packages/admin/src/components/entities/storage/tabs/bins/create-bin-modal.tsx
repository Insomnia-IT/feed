import React from 'react';
import { Modal, Form, Input, InputNumber } from 'antd';
import type { ModalProps } from 'antd';

interface CreateBinModalProps {
    modalProps: ModalProps;
    formProps: any;
    storageId: number | undefined;
}

export const CreateBinModal: React.FC<CreateBinModalProps> = ({ modalProps, formProps, storageId }) => {
    return (
        <Modal {...modalProps} title="Создать ячейку">
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
