import { useSelect } from '@refinedev/antd';
import { Form, InputNumber, Modal, Select } from 'antd';

import type { VolEntity } from 'interfaces';
import type { InventoryRow, TransferFormValues } from './types';

import styles from '../../../common.module.css';

interface InventoryTransferModalProps {
    open: boolean;
    volunteerId?: number;
    volunteerName?: string | null;
    form: ReturnType<typeof Form.useForm<TransferFormValues>>[0];
    isTransferLoading: boolean;
    sourceVolunteerId?: number;
    sourceInventoryLoading: boolean;
    selectedSourceInventoryItem?: InventoryRow;
    itemOptions: Array<{ value: number; label: string }>;
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
    sourceVolunteerId,
    sourceInventoryLoading,
    selectedSourceInventoryItem,
    itemOptions,
    onClose,
    onSubmit,
    onSourceChange,
    onPositionChange
}: InventoryTransferModalProps) => {
    const { selectProps: volunteerSelectProps } = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: 'name'
    });

    return (
        <Modal
            title={`Передать предмет${volunteerName ? `: ${volunteerName}` : ''}`}
            open={open}
            onCancel={onClose}
            onOk={onSubmit}
            confirmLoading={isTransferLoading}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="from"
                    label="От кого"
                    rules={[
                        { required: true, message: 'Выберите владельца' },
                        {
                            validator: (_, value) => {
                                if (!volunteerId || !value || value !== volunteerId) {
                                    return Promise.resolve();
                                }

                                return Promise.reject(new Error('Источник должен отличаться от получателя'));
                            }
                        }
                    ]}
                >
                    <Select {...volunteerSelectProps} showSearch onChange={onSourceChange} />
                </Form.Item>
                <Form.Item name="position" label="Предмет" rules={[{ required: true, message: 'Выберите предмет' }]}>
                    <Select
                        options={itemOptions}
                        loading={sourceInventoryLoading}
                        disabled={!sourceVolunteerId}
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
