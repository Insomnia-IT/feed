import React from 'react';
import { Modal, Form, Input, Checkbox, Space, Tooltip } from 'antd';
import type { ModalProps } from 'antd';
import { ANONYMOUS_ITEM_TOOLTIP, UNIQUE_ITEM_TOOLTIP } from './item-tooltips';

interface EditItemModalProps {
    modalProps: ModalProps;
    formProps: any;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ modalProps, formProps }) => {
    return (
        <Modal {...modalProps} title="Редактировать предмет">
            <Form {...formProps} layout="vertical">
                <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Space size="large">
                    <Form.Item name="is_unique" valuePropName="checked">
                        <Checkbox>
                            <Tooltip title={UNIQUE_ITEM_TOOLTIP}>
                                <span>Уникальный</span>
                            </Tooltip>
                        </Checkbox>
                    </Form.Item>
                    <Form.Item name="is_anonymous" valuePropName="checked">
                        <Checkbox>
                            <Tooltip title={ANONYMOUS_ITEM_TOOLTIP}>
                                <span>Анонимный</span>
                            </Tooltip>
                        </Checkbox>
                    </Form.Item>
                </Space>
            </Form>
        </Modal>
    );
};
