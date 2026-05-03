import { useEffect } from 'react';
import { useModalForm, useTable } from '@refinedev/antd';
import { useSelect } from '@refinedev/core';
import type { BinEntity } from 'interfaces';
import type { CrudFilter } from '@refinedev/core';

interface UseBinsTabParams {
    storage: any;
    filters: CrudFilter[];
}

export const useBinsTab = ({ storage, filters }: UseBinsTabParams) => {
    const {
        tableProps: binsTableProps,
        tableQuery: { refetch: binsRefetch }
    } = useTable<BinEntity>({
        resource: 'storage-bins',
        filters: {
            initial: filters
        },
        pagination: { mode: 'server' },
        queryOptions: { enabled: !!storage?.id }
    });

    const {
        modalProps: createModalProps,
        formProps: createFormProps,
        show: showCreateModal
    } = useModalForm<BinEntity>({
        resource: 'storage-bins',
        action: 'create',
        onMutationSuccess: () => {
            binsRefetch();
        }
    });

    const {
        modalProps: editModalProps,
        formProps: editFormProps,
        show: showEditModal
    } = useModalForm<BinEntity>({
        resource: 'storage-bins',
        action: 'edit',
        onMutationSuccess: () => {
            binsRefetch();
        }
    });

    useEffect(() => {
        if (storage?.id) {
            createFormProps.form?.setFieldsValue({ storage: storage.id });
        }
    }, [storage?.id, createFormProps.form]);

    return {
        binsTableProps,
        createModalProps,
        createFormProps,
        showCreateModal,
        editModalProps,
        editFormProps,
        showEditModal
    };
};

export const useBinOptions = (filters: CrudFilter[]) => {
    const { options: binOptions } = useSelect<BinEntity>({
        resource: 'storage-bins',
        optionLabel: 'name',
        filters
    });

    return { binOptions };
};
