import { Button, Form, Input, InputNumber, Modal, Select } from 'antd';

import type { InventoryRow, TransferFormValues } from './types';

import styles from '../../../common.module.css';
import { QrcodeOutlined } from '@ant-design/icons';

interface InventoryTransferModalProps {
    open: boolean;
    volunteerId?: number;
    volunteerName?: string | null;
    form: ReturnType<typeof Form.useForm<TransferFormValues>>[0];
    isTransferLoading: boolean;
    targetVolunteerId?: number;
    sourceInventoryLoading: boolean;
    selectedSourceInventoryItem?: InventoryRow;
    itemOptions: Array<{ value: number; label: string }>;
    volunteerSelectProps: Record<string, any>;
    isVolunteerLoading: boolean;
    onOpenQrScanner: () => void;
    onClose: () => void;
    onSubmit: () => void;
    onSourceChange: () => void;
    onPositionChange: () => void;
}

export const InventoryTransferModal = ({
    open,
    volunteerId,
    volunteerName,
    form,
    isTransferLoading,
    targetVolunteerId,
    sourceInventoryLoading,
    selectedSourceInventoryItem,
    itemOptions,
    volunteerSelectProps,
    isVolunteerLoading,
    onOpenQrScanner,
    onClose,
    onSubmit,
    onSourceChange,
    onPositionChange
}: InventoryTransferModalProps) => {
    return (
        <Modal
            title="Передать предмет"
            open={open}
            onCancel={onClose}
            onOk={onSubmit}
            confirmLoading={isTransferLoading}
        >
            <Form form={form} layout="vertical">
                <Form.Item label="От кого">
                    <Input value={volunteerName || (volunteerId ? `ID ${volunteerId}` : '')} readOnly />
                </Form.Item>
                <Form.Item
                    name="to"
                    label="Кому"
                    rules={[
                        { required: true, message: 'Выберите получателя' },
                        {
                            validator: (_, value) => {
                                if (!value || value !== volunteerId) {
                                    return Promise.resolve();
                                }

                                return Promise.reject(new Error('Получатель должен отличаться от отправителя'));
                            }
                        }
                    ]}
                >
                    <Select
                        {...volunteerSelectProps}
                        showSearch
                        filterOption={false}
                        placeholder="Найти получателя"
                        onChange={onSourceChange}
                        loading={isVolunteerLoading}
                        suffixIcon={<Button type="text" icon={<QrcodeOutlined />} onClick={onOpenQrScanner} />}
                    />
                </Form.Item>
                <Form.Item name="position" label="Предмет" rules={[{ required: true, message: 'Выберите предмет' }]}>
                    <Select
                        options={itemOptions}
                        loading={sourceInventoryLoading}
                        disabled={!targetVolunteerId}
                        placeholder={targetVolunteerId ? 'Выберите предмет' : 'Сначала выберите владельца'}
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
                                if (
                                    !selectedSourceInventoryItem ||
                                    !value ||
                                    value <= selectedSourceInventoryItem.count
                                ) {
                                    return Promise.resolve();
                                }

                                return Promise.reject(new Error('Недостаточно предметов у владельца'));
                            }
                        }
                    ]}
                >
                    <InputNumber
                        min={1}
                        max={selectedSourceInventoryItem?.count}
                        disabled={!selectedSourceInventoryItem}
                        className={styles.fullWidthControl}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
