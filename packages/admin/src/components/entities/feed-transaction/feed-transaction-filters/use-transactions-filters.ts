import { useMemo, useState } from 'react';
import { useList } from '@refinedev/core';

import { FilterFieldType } from '../../vols/vol-list/filters/filter-types';
import type { DirectionEntity, GroupBadgeEntity, KitchenEntity } from 'interfaces';
import { MEAL_MAP } from 'const';

const mealTypes = Object.entries(MEAL_MAP).map(([id, name]) => ({ id, name }));

export const useTransactionsFilters = () => {
    const [visibleFilters, setVisibleFilters] = useState<string[]>([]);

    const { result: kitchensResult } = useList<KitchenEntity>({
        resource: 'kitchens',
        pagination: { mode: 'off' }
    });

    const { result: groupBadgesResult } = useList<GroupBadgeEntity>({
        resource: 'group-badges',
        pagination: { mode: 'off' }
    });

    const { result: directionsResult } = useList<DirectionEntity>({
        resource: 'directions',
        pagination: { mode: 'off' }
    });

    const filterFields = useMemo(() => {
        const kitchens = kitchensResult?.data ?? [];
        const groupBadges = groupBadgesResult?.data ?? [];
        const directions = directionsResult?.data ?? [];

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
                type: FilterFieldType.Boolean,
                name: 'is_paid',
                title: 'Платное',
                single: true
            },
            {
                type: FilterFieldType.Boolean,
                name: 'is_anomaly',
                title: 'Аномалия',
                single: true
            },
            {
                type: FilterFieldType.Lookup,
                name: 'kitchen',
                title: 'Кухня',
                skipNull: true,
                single: true,
                lookup: () => kitchens
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
                lookup: () => groupBadges
            },
            {
                type: FilterFieldType.Lookup,
                name: 'direction',
                title: 'Службы',
                skipNull: true,
                single: true,
                lookup: () => directions
            }
        ];
    }, [kitchensResult, groupBadgesResult, directionsResult]);

    return { filterFields, visibleFilters, setVisibleFilters };
};
