import { useMemo } from 'react';
import { useList } from '@refinedev/core';
import type { BaseKey, HttpError } from '@refinedev/core';

import type { FeedTypeEntity, VolEntity } from 'interfaces';

import { calculatePlannedCountsByDate, type PlannedCountsByDate } from './calculatePlannedCountsByDate';

interface UseGroupBadgeVolunteerCountsReturn {
    countsByDate: PlannedCountsByDate;
    isLoading: boolean;
}

export const useGroupBadgeVolunteerCounts = ({ id }: { id?: BaseKey }): UseGroupBadgeVolunteerCountsReturn => {
    const isEnabled = id !== undefined && id !== null;

    const { result: volunteersResult, query: volunteersQuery } = useList<VolEntity, HttpError>({
        resource: 'volunteers',
        filters: isEnabled ? [{ field: 'group_badge', operator: 'eq', value: id }] : [],
        pagination: { mode: 'off' },
        queryOptions: { enabled: isEnabled }
    });

    const { result: feedTypesResult, query: feedTypesQuery } = useList<FeedTypeEntity, HttpError>({
        resource: 'feed-types',
        pagination: { mode: 'off' }
    });

    const countsByDate = useMemo<PlannedCountsByDate>(() => {
        if (!isEnabled) {
            return new Map();
        }

        const volunteers = volunteersResult?.data ?? [];
        const feedTypes = feedTypesResult?.data ?? [];

        return calculatePlannedCountsByDate({ volunteers, feedTypes });
    }, [isEnabled, volunteersResult?.data, feedTypesResult?.data]);

    const isLoading = Boolean(
        isEnabled &&
        (volunteersQuery.isLoading ||
            volunteersQuery.isFetching ||
            feedTypesQuery.isLoading ||
            feedTypesQuery.isFetching)
    );

    return {
        countsByDate,
        isLoading
    };
};
