import type { SelectProps } from 'antd';
import { Form, Input, InputNumber, Modal, Select } from 'antd';

import type { StorageItemPositionEntity } from 'interfaces';
import type { StorageIssueFormValues } from './types';

interface StorageIssueModalProps {
    open: boolean;
    volunteerId?: number;
    volunteerName?: string | null;
    form: ReturnType<typeof Form.useForm<StorageIssueFormValues>>[0];
    isLoading: boolean;
    storageSelectProps: SelectProps;
    positionOptions: Array<{ value: number; label: string }>;
    selectedPosition?: StorageItemPositionEntity;
    onClose: () => void;
    onIssue: () => void;
    onStorageChange: (storageId: number) => void;
    onPositionChange: () => void;
}

export const StorageIssueModal = ({
    open,
    volunteerId,
    volunteerName,
    form,
    isLoading,
    storageSelectProps,
    positionOptions,
    selectedPosition,
    onClose,
    onIssue,
    onStorageChange,
    onPositionChange
}: StorageIssueModalProps) => {
    return (
        <Modal title="Выдать предмет" open={open} onCancel={onClose} onOk={onIssue} confirmLoading={isLoading}>
            <Form form={form} layout="vertical">
                <Form.Item label="Кому">
                    <Input value={volunteerName || (volunteerId ? `ID ${volunteerId}` : '')} readOnly />
                </Form.Item>
                <Form.Item name="storage" label="Склад" rules={[{ required: true, message: 'Выберите склад' }]}>
                    <Select
                        {...storageSelectProps}
                        showSearch
                        filterOption={(input, option) =>
                            ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        placeholder="Выберите склад"
                        onChange={onStorageChange}
                    />
                </Form.Item>
                <Form.Item name="position" label="Предмет" rules={[{ required: true, message: 'Выберите предмет' }]}>
                    <Select
                        options={positionOptions}
                        disabled={!positionOptions.length}
                        placeholder={positionOptions.length ? 'Выберите предмет' : 'Сначала выберите склад'}
                        showSearch
                        filterOption={(input, option) =>
                            ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={onPositionChange}
                    />
                </Form.Item>
                <Form.Item
                    name="count"
                    label="Кол-во"
                    rules={[
                        { required: true, message: 'Укажите количество' },
                        {
                            validator: (_, value) => {
                                if (!selectedPosition || !value || value <= selectedPosition.count) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Недостаточно предметов на складе'));
                            }
                        }
                    ]}
                >
                    <InputNumber
                        min={1}
                        max={selectedPosition?.count}
                        disabled={!selectedPosition}
                        style={{ width: '100%' }}
                    />
                </Form.Item>
                <Form.Item name="notes" label="Заметки">
                    <Input.TextArea />
                </Form.Item>
            </Form>
        </Modal>
    );
};
