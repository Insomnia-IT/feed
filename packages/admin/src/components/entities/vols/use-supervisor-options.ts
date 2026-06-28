import { useMemo, useState } from 'react';
import { Form, type FormInstance } from 'antd';
import { type CrudFilters, useList } from '@refinedev/core';
import { useParams } from 'react-router';

import type { VolEntity } from 'interfaces';
import { useDebouncedCallback } from 'shared/hooks';
import { formatVolunteerLabel } from 'shared/utils/format-volunteer-label';

export const useSupervisorOptions = ({ form }: { form: FormInstance }) => {
    const { id: routeVolunteerId } = useParams<{ id: string }>();
    const formVolunteerId = Form.useWatch('id', form);
    const directions = Form.useWatch('directions', form) as Array<string | { id: string }> | undefined;
    const [search, setSearch] = useState('');
    const onSearch = useDebouncedCallback((value: string) => setSearch(value));
    const targetId = routeVolunteerId ?? formVolunteerId;
    const directionIds = useMemo(
        () =>
            directions?.map((direction) =>
                String(typeof direction === 'object' && direction && 'id' in direction ? direction.id : direction)
            ) ?? [],
        [directions]
    );
    const canLoad = Boolean(targetId || directionIds.length);

    const filters = useMemo<CrudFilters>(
        () => [
            ...(targetId
                ? [
                      {
                          field: 'target_id',
                          operator: 'eq' as const,
                          value: targetId
                      }
                  ]
                : [
                      {
                          field: 'direction_ids',
                          operator: 'eq' as const,
                          value: directionIds.join(',')
                      }
                  ]),
            ...(search
                ? [
                      {
                          field: 'search',
                          operator: 'eq' as const,
                          value: search
                      }
                  ]
                : [])
        ],
        [directionIds, search, targetId]
    );

    const { result, query } = useList<VolEntity>({
        resource: 'volunteers/supervisor-candidates/',
        filters,
        pagination: {
            mode: 'server',
            currentPage: 1,
            pageSize: 50
        },
        queryOptions: {
            enabled: canLoad
        }
    });

    const options = useMemo(
        () =>
            (result.data ?? []).map((volunteer) => ({
                value: volunteer.id,
                label: formatVolunteerLabel(volunteer)
            })),
        [result.data]
    );

    const onClear = () => setSearch('');

    return {
        loading: query.isLoading,
        onClear,
        onSearch,
        options
    };
};
