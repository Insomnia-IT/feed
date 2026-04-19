import { useState } from 'react';
import { useTable, useModalForm } from '@refinedev/antd';
import { notification, type FormInstance } from 'antd';
import axios from 'axios';
import type { CrudFilter } from '@refinedev/core';
import type { StorageItemPositionEntity } from 'interfaces';
import { NEW_API_URL } from 'const';

interface UsePositionsTabParams {
    storage: any;
    filters: CrudFilter[];
    actionForm: FormInstance;
}

export const usePositionsTab = ({ storage, filters, actionForm }: UsePositionsTabParams) => {
    const {
        tableProps: positionsTableProps,
        tableQuery: { refetch: positionsRefetch }
    } = useTable<StorageItemPositionEntity>({
        resource: 'storage-positions',
        filters: {
            permanent: filters.concat([{ field: 'has_count', operator: 'eq', value: true }])
        },
        pagination: { mode: 'server' },
        queryOptions: { enabled: !!storage?.id }
    });

    const [isReceiveModalVisible, setIsReceiveModalVisible] = useState(false);
    const [isIssueModalVisible, setIsIssueModalVisible] = useState(false);
    const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<StorageItemPositionEntity | null>(null);

    const {
        modalProps: positionModalProps,
        formProps: positionFormProps,
        show: showPositionModal
    } = useModalForm<StorageItemPositionEntity>({
        resource: 'storage-positions',
        action: 'create',
        onMutationSuccess: () => {
            positionsRefetch();
        }
    });

    const handleAction = async (action: 'receive' | 'issue') => {
        try {
            const values = await actionForm.validateFields();

            await axios.post(`${NEW_API_URL}/storage-positions/${selectedPosition?.id}/${action}/`, values);

            notification.success({ message: 'Успешно' });
            setIsReceiveModalVisible(false);
            setIsIssueModalVisible(false);
            setIsMoveModalVisible(false);
            actionForm.resetFields();
            positionsRefetch();
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Ошибка при выполнении операции' });
        }
    };

    const handleMove = async () => {
        try {
            const values = await actionForm.validateFields();

            await axios.post(`${NEW_API_URL}/storage-positions/${selectedPosition?.id}/move/`, {
                target_bin_id: values.bin
            });

            notification.success({ message: 'Успешно перемещено' });
            setIsMoveModalVisible(false);
            actionForm.resetFields();
            positionsRefetch();
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Ошибка при перемещении' });
        }
    };

    return {
        positionsTableProps,
        isReceiveModalVisible,
        setIsReceiveModalVisible,
        isIssueModalVisible,
        setIsIssueModalVisible,
        isMoveModalVisible,
        setIsMoveModalVisible,
        selectedPosition,
        setSelectedPosition,
        positionModalProps,
        positionFormProps,
        showPositionModal,
        handleAction,
        handleMove
    };
};
