import { useEffect } from 'react';
import { useModalForm } from '@refinedev/antd';
import { useList, useSelect } from '@refinedev/core';
import type { BinEntity } from 'interfaces';
import type { CrudFilter } from '@refinedev/core';

interface UseBinsTabParams {
    storage: any;
    filters: CrudFilter[];
}

export const useBinsTab = ({ storage, filters }: UseBinsTabParams) => {
    const {
        result: binsData,
        query: { isLoading: binsLoading, refetch: binsRefetch }
    } = useList<BinEntity>({
        resource: 'storage-bins',
        filters,
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
        binsData: binsData?.data,
        binsLoading,
        binsRefetch,
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
