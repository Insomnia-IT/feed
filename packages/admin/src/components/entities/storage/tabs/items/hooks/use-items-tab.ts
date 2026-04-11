import { useModalForm } from '@refinedev/antd';
import { useDelete, useList, useSelect } from '@refinedev/core';
import type { ItemEntity } from 'interfaces';

export const useItemsTab = () => {
    const {
        result: itemsData,
        query: { isLoading: itemsLoading, refetch: itemsRefetch }
    } = useList<ItemEntity>({
        resource: 'storage-items'
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
    const itemOptionsResult = useSelect<ItemEntity>({
        resource: 'storage-items',
        optionLabel: 'name'
    });

    return { itemOptions: itemOptionsResult.options };
};
