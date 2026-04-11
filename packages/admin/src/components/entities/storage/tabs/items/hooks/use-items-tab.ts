import { useModalForm } from '@refinedev/antd';
import { useDelete, useList, useSelect, useShow } from '@refinedev/core';
import type { ItemEntity } from 'interfaces';

export const useItemsTab = () => {
    const { result } = useShow<ItemEntity>();
    const storageId = result?.id;

    const {
        result: itemsData,
        query: { isLoading: itemsLoading, refetch: itemsRefetch }
    } = useList<ItemEntity>({
        resource: 'storage-items',
        filters: [{ field: 'storage', operator: 'eq', value: storageId }]
    });

    const {
        modalProps: itemModalProps,
        formProps: itemFormProps,
        show: showItemModal
    } = useModalForm<ItemEntity>({
        resource: 'storage-items',
        action: 'create',
        onMutationSuccess: () => {
            itemsRefetch();
        }
    });

    const {
        modalProps: editItemModalProps,
        formProps: editItemFormProps,
        show: showEditItemModal
    } = useModalForm<ItemEntity>({
        resource: 'storage-items',
        action: 'edit',
        onMutationSuccess: () => {
            itemsRefetch();
        }
    });

    const { mutate: deleteMutate } = useDelete();

    return {
        storageId,
        itemsData: itemsData?.data,
        itemsLoading,
        itemsRefetch,
        itemModalProps,
        itemFormProps,
        showItemModal,
        editItemModalProps,
        editItemFormProps,
        showEditItemModal,
        deleteMutate
    };
};

export const useItemOptions = () => {
    const { result } = useShow<ItemEntity>();
    const storageId = result?.id;

    const itemOptionsResult = useSelect<ItemEntity>({
        resource: 'storage-items',
        optionLabel: 'name',
        filters: [{ field: 'storage', operator: 'eq', value: storageId }]
    });

    return { itemOptions: itemOptionsResult.options };
};
