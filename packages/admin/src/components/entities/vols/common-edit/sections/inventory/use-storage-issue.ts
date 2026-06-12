import { useState } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { useSelect } from '@refinedev/antd';
import { Form, notification } from 'antd';

import type { UserData } from 'auth';
import type { StorageEntity, StorageItemPositionEntity } from 'interfaces';
import { getStoragePositions, issueFromStorage } from './api';
import type { StorageIssueFormValues } from './types';

interface UseStorageIssueParams {
    volunteerId?: number;
    reloadInventory: () => Promise<unknown>;
}

export const useStorageIssue = ({ volunteerId, reloadInventory }: UseStorageIssueParams) => {
    const { data: user } = useGetIdentity<UserData>();
    const [storageIssueForm] = Form.useForm<StorageIssueFormValues>();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const userId = user?.id ? Number(user.id) : undefined;
    const selectedStorageId = Form.useWatch('storage', storageIssueForm);
    const selectedPositionId = Form.useWatch('position', storageIssueForm);

    const { selectProps: storageSelectProps } = useSelect<StorageEntity>({
        resource: 'storages',
        optionLabel: (record) => record.name
    });

    const [positions, setPositions] = useState<StorageItemPositionEntity[]>([]);

    const loadPositions = async (storageId: number) => {
        try {
            const data = await getStoragePositions(storageId);
            setPositions(data.filter((pos) => pos.count > 0));
        } catch (error) {
            console.error(error);
            setPositions([]);
        }
    };

    const handleStorageChange = (storageId: number) => {
        storageIssueForm.setFieldsValue({ position: undefined, count: 1 });
        loadPositions(storageId);
    };

    const handlePositionChange = () => {
        storageIssueForm.setFieldValue('count', 1);
    };

    const selectedPosition = positions.find((pos) => pos.id === selectedPositionId);

    const positionOptions = positions.map((pos) => ({
        value: pos.id,
        label: `${pos.item_name} (${pos.bin_name || 'Без ячейки'}) - ${pos.count} шт.`
    }));

    const openModal = () => {
        storageIssueForm.resetFields();
        storageIssueForm.setFieldsValue({
            count: 1
        });
        setPositions([]);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        storageIssueForm.resetFields();
        setPositions([]);
    };

    const handleIssue = async () => {
        if (!volunteerId) return;

        try {
            const values = await storageIssueForm.validateFields();
            setIsLoading(true);

            await issueFromStorage({
                position: values.position,
                count: values.count,
                volunteer: volunteerId,
                notes: values.notes,
                actor: userId
            });

            notification.success({ message: 'Предмет выдан' });
            await reloadInventory();
            closeModal();
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Не удалось выдать предмет' });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        form: storageIssueForm,
        isOpen,
        isLoading,
        storageSelectProps,
        selectedStorageId,
        positionOptions,
        selectedPosition,
        openModal,
        closeModal,
        handleStorageChange,
        handlePositionChange,
        handleIssue
    };
};
