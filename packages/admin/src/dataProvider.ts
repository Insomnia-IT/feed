import type { CrudFilter, CrudSorting, DataProvider, LogicalFilter } from '@refinedev/core';
import type { AxiosInstance } from 'axios';

import { NEW_API_URL } from 'const';
import { axios } from 'authProvider';

type MethodTypes = 'get' | 'delete' | 'head' | 'options';
type MethodTypesWithBody = 'post' | 'put' | 'patch';

function isLogicalFilter(filter: CrudFilter): filter is LogicalFilter {
    return (filter as LogicalFilter).field !== undefined;
}

function generateOrdering(sorters?: CrudSorting): string | undefined {
    if (!sorters?.length) return undefined;

    return sorters.map(({ field, order }) => `${order === 'desc' ? '-' : ''}${String(field)}`).join(',');
}

export const crudDataProvider = (
    apiUrl: string,
    httpClient: AxiosInstance = axios
): Omit<Required<DataProvider>, 'createMany' | 'updateMany' | 'deleteMany' | 'custom'> => ({
    getList: async ({ resource, pagination, sorters, filters, meta }) => {
        const url = `${apiUrl}/${resource}${resource.includes('/') ? '' : '/'}`;

        const { headers: headersFromMeta, method } = meta ?? {};
        const requestMethod = (method as MethodTypes) ?? 'get';
        const currentPage = pagination?.currentPage ?? 1;
        const pageSize = pagination?.pageSize ?? 10;
        const mode = pagination?.mode ?? 'server';
        const ordering = generateOrdering(sorters);

        const { data } = await httpClient[requestMethod](url, {
            params: {
                ...filters?.reduce((acc, filter) => {
                    if (isLogicalFilter(filter) && filter.value) {
                        return { ...acc, [filter.field]: filter.value };
                    }
                    return acc;
                }, {}),
                ...(ordering ? { ordering } : {}),
                limit: mode === 'server' ? pageSize : 10000,
                offset: mode === 'server' ? (currentPage - 1) * pageSize : 0
            },
            headers: headersFromMeta
        });

        return {
            data: data.results,
            total: data.count
        };
    },

    getMany: async ({ resource, ids, meta }) => {
        const { headers, method } = meta ?? {};
        const requestMethod = (method as MethodTypes) ?? 'get';

        const { data } = await httpClient[requestMethod](`${apiUrl}/${resource}?id__in=${ids.join(',')}`, { headers });

        return {
            data: data.results
        };
    },

    create: async ({ resource, variables, meta }) => {
        const url = `${apiUrl}/${resource}/`;

        const { headers, method } = meta ?? {};
        const requestMethod = (method as MethodTypesWithBody) ?? 'post';

        const { data } = await httpClient[requestMethod](url, variables, {
            headers
        });

        return {
            data
        };
    },

    update: async ({ resource, id, variables, meta }) => {
        const url = `${apiUrl}/${resource}/${id}/`;

        const { headers, method } = meta ?? {};
        const requestMethod = (method as MethodTypesWithBody) ?? 'patch';

        const { data } = await httpClient[requestMethod](url, variables, {
            headers
        });

        return {
            data
        };
    },

    getOne: async ({ resource, id, meta }) => {
        const url = `${apiUrl}/${resource}/${id}/`;

        const { headers, method } = meta ?? {};
        const requestMethod = (method as MethodTypes) ?? 'get';

        const { data } = await httpClient[requestMethod](url, {
            headers
        });

        return {
            data
        };
    },

    deleteOne: async ({ resource, id, variables, meta }) => {
        const url = `${apiUrl}/${resource}/${id}/`;

        const { headers, method } = meta ?? {};
        const requestMethod = (method as MethodTypesWithBody) ?? 'delete';

        const { data } = await httpClient[requestMethod](url, {
            data: variables,
            headers
        });

        return {
            data
        };
    },

    getApiUrl: () => {
        return apiUrl;
    }
});

export const dataProvider = crudDataProvider(NEW_API_URL, axios);
