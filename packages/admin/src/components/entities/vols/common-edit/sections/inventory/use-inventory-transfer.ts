import { useState } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { Form, notification } from 'antd';

import type { UserData } from 'auth';
import { createInventoryMovement } from './api';
import type { TransferFormValues } from './types';
import { useVolunteerInventory } from './use-volunteer-inventory';

interface UseInventoryTransferParams {
    volunteerId?: number;
    reloadTargetInventory: () => Promise<unknown>;
}

export const useInventoryTransfer = ({ volunteerId, reloadTargetInventory }: UseInventoryTransferParams) => {
    const { data: user } = useGetIdentity<UserData>();
    const [transferForm] = Form.useForm<TransferFormValues>();
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isTransferLoading, setIsTransferLoading] = useState(false);
    const userId = user?.id ? Number(user.id) : undefined;
    const sourceVolunteerId = Form.useWatch('from', transferForm);
    const sourceInventory = useVolunteerInventory(sourceVolunteerId);
    const selectedPositionId = Form.useWatch('position', transferForm);
    const selectedSourceInventoryItem = sourceInventory.inventory.find((item) => item.position === selectedPositionId);

    const itemOptions = sourceInventory.inventory.map((item) => ({
        value: item.position,
        label: `${item.positionData?.item_name || `Позиция ${item.position}`} (${item.count})`
    }));

    const openTransferModal = () => {
        transferForm.resetFields();
        transferForm.setFieldsValue({
            from: userId,
            count: 1
        });
        setIsTransferModalOpen(true);
    };

    const closeTransferModal = () => {
        setIsTransferModalOpen(false);
        transferForm.resetFields();
    };

    const handleSourceChange = () => {
        transferForm.setFieldsValue({ position: undefined, count: 1 });
    };

    const handlePositionChange = () => {
        transferForm.setFieldValue('count', 1);
    };

    const handleTransfer = async () => {
        if (!volunteerId) return;

        try {
            const values = await transferForm.validateFields();
            setIsTransferLoading(true);

            await createInventoryMovement({
                position: values.position,
                count: values.count,
                from: values.from,
                to: volunteerId,
                actor: userId
            });

            notification.success({ message: 'Предмет передан' });
            await Promise.all([reloadTargetInventory(), sourceInventory.reload()]);
            closeTransferModal();
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Не удалось передать предмет' });
        } finally {
            setIsTransferLoading(false);
        }
    };

    return {
        transferForm,
        userId,
        isTransferModalOpen,
        isTransferLoading,
        sourceVolunteerId,
        sourceInventory,
        selectedSourceInventoryItem,
        itemOptions,
        openTransferModal,
        closeTransferModal,
        handleSourceChange,
        handlePositionChange,
        handleTransfer
    };
};
