import { useState } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { Form, notification } from 'antd';

import type { UserData } from 'auth';
import type { InventoryRow } from './types';
import { returnToStorage } from './api';
import type { StorageReturnFormValues } from './types';

interface UseStorageReturnParams {
    volunteerId?: number;
    inventory: InventoryRow[];
    reloadInventory: () => Promise<unknown>;
}

export const useStorageReturn = ({ volunteerId, inventory, reloadInventory }: UseStorageReturnParams) => {
    const { data: user } = useGetIdentity<UserData>();
    const [storageReturnForm] = Form.useForm<StorageReturnFormValues>();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const userId = user?.id ? Number(user.id) : undefined;
    const selectedPositionId = Form.useWatch('position', storageReturnForm);

    const selectedPosition = inventory.find((item) => item.position === selectedPositionId);

    const positionOptions = inventory.map((item) => ({
        value: item.position,
        label: `${item.positionData?.item_name || `Позиция ${item.position}`} (${item.positionData?.bin_name || 'Без ячейки'}) - ${item.count} шт.`
    }));

    const openModal = () => {
        storageReturnForm.resetFields();
        storageReturnForm.setFieldsValue({
            count: 1
        });
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        storageReturnForm.resetFields();
    };

    const handlePositionChange = () => {
        storageReturnForm.setFieldValue('count', 1);
    };

    const handleReturn = async () => {
        if (!volunteerId) return;

        try {
            const values = await storageReturnForm.validateFields();
            setIsLoading(true);

            await returnToStorage({
                position: values.position,
                count: values.count,
                volunteer: volunteerId,
                notes: values.notes,
                actor: userId
            });

            notification.success({ message: 'Предмет возвращён на склад' });
            await reloadInventory();
            closeModal();
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Не удалось вернуть предмет' });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        form: storageReturnForm,
        isOpen,
        isLoading,
        positionOptions,
        selectedPosition,
        openModal,
        closeModal,
        handlePositionChange,
        handleReturn
    };
};
