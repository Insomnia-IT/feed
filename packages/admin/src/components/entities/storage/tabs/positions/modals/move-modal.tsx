import React from 'react';
import { Modal, Form, Select, type FormInstance } from 'antd';
import type { StorageItemPositionEntity } from 'interfaces';

interface MoveModalProps {
    open: boolean;
    position: StorageItemPositionEntity | null;
    onClose: () => void;
    onOk: () => void;
    form: FormInstance;
    binOptions: { label: string; value: any }[];
}

export const MoveModal: React.FC<MoveModalProps> = ({ open, position, onClose, onOk, form, binOptions }) => {
    return (
        <Modal title={`Переместить товар: ${position?.item_name}`} open={open} onOk={onOk} onCancel={onClose}>
            <Form form={form} layout="vertical">
                <Form.Item name="bin" label="Целевая ячейка" rules={[{ required: true }]}>
                    <Select options={binOptions} showSearch optionFilterProp="label" />
                </Form.Item>
            </Form>
        </Modal>
    );
};
