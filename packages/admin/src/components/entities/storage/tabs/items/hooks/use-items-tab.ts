import { useModalForm, useTable } from '@refinedev/antd';
import { useDelete, useSelect, useShow } from '@refinedev/core';
import type { ItemEntity } from 'interfaces';

export const useItemsTab = () => {
    const { result } = useShow<ItemEntity>();
    const storageId = result?.id;

    const {
        tableProps: itemsTableProps,
        tableQuery: { refetch: itemsRefetch }
    } = useTable<ItemEntity>({
        resource: 'storage-items',
        filters: {
            initial: [{ field: 'storage', operator: 'eq', value: storageId }]
        },
        pagination: { mode: 'server' }
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
        itemsTableProps,
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
