import React from 'react';
import { Modal, Form, InputNumber, Select, Input, Button, type FormInstance } from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import type { StorageItemPositionEntity } from 'interfaces';

interface IssueModalProps {
    open: boolean;
    position: StorageItemPositionEntity | null;
    onClose: () => void;
    onOk: () => void;
    form: FormInstance;
    volunteerSelectProps: any;
    isVolunteerLoading: boolean;
    onOpenQrScanner: (form: FormInstance) => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({
    open,
    position,
    onClose,
    onOk,
    form,
    volunteerSelectProps,
    isVolunteerLoading,
    onOpenQrScanner
}) => {
    return (
        <Modal title={`Выдать предмет: ${position?.item_name}`} open={open} onOk={onOk} onCancel={onClose}>
            <Form form={form} layout="vertical">
                {!position?.item_is_unique && (
                    <Form.Item name="count" label="Количество" rules={[{ required: true }]}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                )}
                {position?.item_is_unique && (
                    <Form.Item name="count" hidden initialValue={1}>
                        <InputNumber />
                    </Form.Item>
                )}
                <Form.Item name="volunteer" label="Кому" rules={[{ required: !position?.item_is_anonymous }]}>
                    <Select
                        {...volunteerSelectProps}
                        showSearch
                        allowClear={position?.item_is_anonymous}
                        suffixIcon={
                            <Button
                                type="text"
                                icon={<QrcodeOutlined />}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onOpenQrScanner(form);
                                }}
                            />
                        }
                        loading={isVolunteerLoading}
                    />
                </Form.Item>
                <Form.Item name="notes" label="Заметки">
                    <Input.TextArea />
                </Form.Item>
            </Form>
        </Modal>
    );
};
