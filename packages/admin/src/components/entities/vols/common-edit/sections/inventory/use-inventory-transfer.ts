import { useState } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { useSelect } from '@refinedev/antd';
import { Form, notification } from 'antd';

import type { UserData } from 'auth';
import type { VolEntity } from 'interfaces';
import { createInventoryMovement } from './api';
import type { TransferFormValues } from './types';
import { useVolunteerInventory } from './use-volunteer-inventory';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';
import useVisibleDirections from '../../../use-visible-directions';

interface UseInventoryTransferParams {
    volunteerId?: number;
    reloadTargetInventory: () => Promise<unknown>;
}

export const useInventoryTransfer = ({ volunteerId, reloadTargetInventory }: UseInventoryTransferParams) => {
    const { data: user } = useGetIdentity<UserData>();
    const visibleDirections = useVisibleDirections();
    const [transferForm] = Form.useForm<TransferFormValues>();
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isTransferLoading, setIsTransferLoading] = useState(false);
    const actorId = user?.id ? Number(user.id) : undefined;
    const targetVolunteerId = Form.useWatch('to', transferForm);
    const sourceInventory = useVolunteerInventory(volunteerId);
    const selectedPositionId = Form.useWatch('position', transferForm);
    const selectedSourceInventoryItem = sourceInventory.inventory.find((item) => item.position === selectedPositionId);

    const volunteerSelectProps = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: formatVolunteerLabel,
        filters: visibleDirections?.map((value) => ({
            field: 'directions',
            operator: 'eq',
            value
        })),
        onSearch: (value: string) => [
            {
                field: 'search',
                operator: 'eq',
                value
            }
        ]
    }).selectProps;

    const itemOptions = sourceInventory.inventory.map((item) => ({
        value: item.position,
        label: `${item.positionData?.item_name || `Позиция ${item.position}`} (${item.count})`
    }));

    const openTransferModal = () => {
        transferForm.resetFields();
        transferForm.setFieldsValue({
            from: volunteerId,
            to: undefined,
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
        if (!volunteerId || !actorId) return;

        try {
            const values = await transferForm.validateFields();
            setIsTransferLoading(true);

            await createInventoryMovement({
                position: values.position,
                count: values.count,
                from: volunteerId,
                to: values.to,
                actor: actorId
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
        sourceVolunteerId: volunteerId,
        targetVolunteerId,
        isTransferModalOpen,
        isTransferLoading,
        sourceInventory,
        selectedSourceInventoryItem,
        itemOptions,
        volunteerSelectProps,
        openTransferModal,
        closeTransferModal,
        handleSourceChange,
        handlePositionChange,
        handleTransfer
    };
};
