import { useMemo, useState } from 'react';
import { FilterFieldType } from '../../vols/vol-list/filters/filter-types.ts';
import { useList } from '@refinedev/core';
import { GroupBadgeEntity, KitchenEntity } from 'interfaces';
import { mealTimeById } from 'const';

export const useTransactionsFilters = () => {
    const [visibleFilters, setVisibleFilters] = useState<Array<string>>([]);

    const { data: kitchens } = useList<KitchenEntity>({
        resource: 'kitchens',
        pagination: {
            pageSize: 0
        }
    });

    const mealTypes = Object.entries(mealTimeById).map(([id, name]) => {
        return { id, name };
    });

    const { data: groupBadges } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        pagination: {
            pageSize: 0
        }
    });

    const filterFields = useMemo(() => {
        return [
            {
                type: FilterFieldType.Boolean,
                name: 'anonymous',
                title: 'Аноним',
                single: true
            },
            {
                type: FilterFieldType.Boolean,
                name: 'is_group_badge',
                title: 'Группа',
                single: true
            },
            {
                type: FilterFieldType.Lookup,
                name: 'kitchen',
                title: 'Кухня',
                skipNull: true,
                single: true,
                lookup: () => kitchens?.data ?? []
            },
            {
                type: FilterFieldType.Lookup,
                name: 'meal_time',
                title: 'Прием пищи',
                skipNull: true,
                single: true,
                lookup: () => mealTypes
            },
            {
                type: FilterFieldType.Lookup,
                name: 'group_badge',
                title: 'Групповой бейдж',
                skipNull: true,
                single: true,
                lookup: () => groupBadges?.data ?? []
            }
        ];
    }, [kitchens?.data, mealTypes, groupBadges?.data]);

    return { filterFields, visibleFilters, setVisibleFilters };
};
