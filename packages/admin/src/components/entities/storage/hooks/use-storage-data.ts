import { useShow, type CrudFilter } from '@refinedev/core';
import type { StorageEntity } from 'interfaces';

export const useStorageData = () => {
    const {
        result: storage,
        query: { isLoading: storageLoading }
    } = useShow<StorageEntity>();

    const filters: CrudFilter[] = [
        {
            field: 'storage',
            operator: 'eq',
            value: storage?.id
        }
    ];

    return {
        storage,
        storageLoading,
        filters
    };
};
