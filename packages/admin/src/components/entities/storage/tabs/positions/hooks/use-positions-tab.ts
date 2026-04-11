import { useState } from 'react';
import { useTable, useModalForm } from '@refinedev/antd';
import { notification, type FormInstance } from 'antd';
import axios from 'axios';
import Cookies from 'js-cookie';
import type { CrudFilter } from '@refinedev/core';
import type { StorageItemPositionEntity } from 'interfaces';

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
            initial: filters
        },
        pagination: { mode: 'server' },
        sorters: {
            initial: [{ field: 'id', order: 'desc' }]
        },
        queryOptions: { enabled: !!storage?.id }
    });

    const [isReceiveModalVisible, setIsReceiveModalVisible] = useState(false);
    const [isIssueModalVisible, setIsIssueModalVisible] = useState(false);
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
            const apiUrl = (window as any)._env_?.VITE_NEW_API_URL || 'http://localhost:8000/feedapi/v1';
            const token = Cookies.get('auth');

            await axios.post(`${apiUrl}/storage-positions/${selectedPosition?.id}/${action}/`, values, {
                headers: {
                    Authorization: token?.startsWith('V-TOKEN ') ? token : `Token ${token}`
                }
            });

            notification.success({ message: 'Успешно' });
            setIsReceiveModalVisible(false);
            setIsIssueModalVisible(false);
            actionForm.resetFields();
            positionsRefetch();
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Ошибка при выполнении операции' });
        }
    };

    return {
        positionsTableProps,
        isReceiveModalVisible,
        setIsReceiveModalVisible,
        isIssueModalVisible,
        setIsIssueModalVisible,
        selectedPosition,
        setSelectedPosition,
        positionModalProps,
        positionFormProps,
        showPositionModal,
        handleAction
    };
};
