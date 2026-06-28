import { Form, Input, InputNumber, Modal, Select } from 'antd';

import type { InventoryRow } from './types';
import type { StorageReturnFormValues } from './types';

interface StorageReturnModalProps {
    open: boolean;
    volunteerId?: number;
    volunteerName?: string | null;
    form: ReturnType<typeof Form.useForm<StorageReturnFormValues>>[0];
    isLoading: boolean;
    positionOptions: Array<{ value: number; label: string }>;
    selectedPosition?: InventoryRow;
    onClose: () => void;
    onReturn: () => void;
    onPositionChange: () => void;
}

export const StorageReturnModal = ({
    open,
    volunteerId,
    volunteerName,
    form,
    isLoading,
    positionOptions,
    selectedPosition,
    onClose,
    onReturn,
    onPositionChange
}: StorageReturnModalProps) => {
    return (
        <Modal
            title="Вернуть предмет на склад"
            open={open}
            onCancel={onClose}
            onOk={onReturn}
            confirmLoading={isLoading}
        >
            <Form form={form} layout="vertical">
                <Form.Item label="От кого">
                    <Input value={volunteerName || (volunteerId ? `ID ${volunteerId}` : '')} readOnly />
                </Form.Item>
                <Form.Item name="position" label="Предмет" rules={[{ required: true, message: 'Выберите предмет' }]}>
                    <Select
                        options={positionOptions}
                        disabled={!positionOptions.length}
                        placeholder={positionOptions.length ? 'Выберите предмет' : 'Нет предметов в инвентаре'}
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
                                return Promise.reject(new Error('Недостаточно предметов в инвентаре'));
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
