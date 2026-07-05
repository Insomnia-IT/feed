import { useState, useEffect, useRef } from 'react';
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
import { useSearchVolunteer } from 'shared/hooks';

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
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [scannedQr, setScannedQr] = useState<string | undefined>();
    const processedQrRef = useRef<string | undefined>(undefined);
    const actorId = user?.id ? Number(user.id) : undefined;
    const targetVolunteerId = Form.useWatch('to', transferForm);
    const sourceInventory = useVolunteerInventory(volunteerId);
    const selectedPositionId = Form.useWatch('position', transferForm);
    const selectedSourceInventoryItem = sourceInventory.inventory.find((item) => item.position === selectedPositionId);

    const { data: scannedVolunteer, isLoading: isVolunteerLoading } = useSearchVolunteer(scannedQr);

    useEffect(() => {
        if (scannedQr && scannedVolunteer && processedQrRef.current !== scannedQr) {
            processedQrRef.current = scannedQr;
            transferForm.setFieldValue('to', scannedVolunteer.id);
            notification.success({ message: `Волонтер найден: ${scannedVolunteer.name}` });
        }
    }, [scannedQr, scannedVolunteer, transferForm]);

    const volunteerSelectProps = useSelect<VolEntity>({
        resource: 'volunteers',
        optionLabel: formatVolunteerLabel,
        filters: visibleDirections?.map((value) => ({
            field: 'directions',
            operator: 'eq',
            value
        })),
        sorters: [
            { field: 'last_name', order: 'asc' },
            { field: 'first_name', order: 'asc' },
            { field: 'name', order: 'asc' }
        ],
        pagination: {
            mode: 'off'
        },
        onSearch: (value: string) => [
            {
                field: 'search',
                operator: 'eq',
                value
            }
        ],
        defaultValue: scannedVolunteer?.id
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

    const handleOpenQrScanner = () => {
        processedQrRef.current = undefined;
        setScannedQr(undefined);
        setIsQrModalOpen(true);
    };

    const handleQrScan = (qr: string) => {
        setScannedQr(qr);
        setIsQrModalOpen(false);
    };

    const handleCloseQrScanner = () => {
        setIsQrModalOpen(false);
    };

    return {
        transferForm,
        sourceVolunteerId: volunteerId,
        targetVolunteerId,
        isTransferModalOpen,
        isTransferLoading,
        isQrModalOpen,
        isVolunteerLoading,
        sourceInventory,
        selectedSourceInventoryItem,
        itemOptions,
        volunteerSelectProps,
        openTransferModal,
        closeTransferModal,
        handleSourceChange,
        handlePositionChange,
        handleTransfer,
        handleOpenQrScanner,
        handleQrScan,
        handleCloseQrScanner
    };
};
