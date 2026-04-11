import { useState } from 'react';
import { useList } from '@refinedev/core';
import { useModalForm } from '@refinedev/antd';
import { notification, type FormInstance } from 'antd';
import axios from 'axios';
import Cookies from 'js-cookie';
import type { CrudFilter } from '@refinedev/core';
import type { StorageItemPositionEntity, ReceivingEntity, IssuanceEntity } from 'interfaces';

interface UsePositionsTabParams {
    storage: any;
    filters: CrudFilter[];
    actionForm: FormInstance;
}

export const usePositionsTab = ({ storage, filters, actionForm }: UsePositionsTabParams) => {
    const {
        result: positionsResult,
        query: { isLoading: positionsLoading, refetch: positionsRefetch }
    } = useList<StorageItemPositionEntity>({
        resource: 'storage-positions',
        filters,
        queryOptions: { enabled: !!storage?.id }
    });
    const positionsData = positionsResult;

    const {
        result: receivingsData,
        query: { isLoading: receivingsLoading, refetch: receivingsRefetch }
    } = useList<ReceivingEntity>({
        resource: 'storage-receivings',
        filters: [
            {
                field: 'position__storage',
                operator: 'eq',
                value: storage?.id
            }
        ],
        queryOptions: { enabled: !!storage?.id }
    });

    const {
        result: issuancesResult,
        query: { isLoading: issuancesLoading, refetch: issuancesRefetch }
    } = useList<IssuanceEntity>({
        resource: 'storage-issuances',
        filters: [
            {
                field: 'position__storage',
                operator: 'eq',
                value: storage?.id
            }
        ],
        queryOptions: { enabled: !!storage?.id }
    });
    const issuancesData = issuancesResult;

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
            receivingsRefetch();
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
            receivingsRefetch();
            issuancesRefetch();
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Ошибка при выполнении операции' });
        }
    };

    return {
        positionsData: positionsData?.data,
        positionsLoading,
        positionsRefetch,
        receivingsData: receivingsData?.data,
        receivingsLoading,
        receivingsRefetch,
        issuancesData: issuancesData?.data,
        issuancesLoading,
        issuancesRefetch,
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
