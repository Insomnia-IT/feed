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
        modalProps: binModalProps,
        formProps: binFormProps,
        show: showBinModal
    } = useModalForm<BinEntity>({
        resource: 'storage-bins',
        action: 'create',
        onMutationSuccess: () => {
            binsRefetch();
        }
    });

    useEffect(() => {
        if (storage?.id) {
            binFormProps.form?.setFieldsValue({ storage: storage.id });
        }
    }, [storage?.id, binFormProps.form]);

    return {
        binsTableProps,
        binModalProps,
        binFormProps,
        showBinModal
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
