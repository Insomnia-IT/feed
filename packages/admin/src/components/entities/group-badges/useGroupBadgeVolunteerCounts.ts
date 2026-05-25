import { useMemo } from 'react';
import { useList } from '@refinedev/core';
import type { BaseKey, HttpError } from '@refinedev/core';

import { calculatePlannedCountsByDate, type PlannedCountsByDate, type PlanningVolunteer } from '@feed/shared/planning';
import type { FeedTypeEntity, VolEntity } from 'interfaces';

interface UseGroupBadgeVolunteerCountsReturn {
    countsByDate: PlannedCountsByDate;
    isLoading: boolean;
}

const buildFeedTypeCodeById = (feedTypes: FeedTypeEntity[]): Map<number, string> => {
    const result = new Map<number, string>();
    for (const feedType of feedTypes) {
        if (feedType.code) {
            result.set(feedType.id, feedType.code);
        }
    }
    return result;
};

const mapVolunteerToPlanning = (vol: VolEntity, feedTypeCodeById: Map<number, string>): PlanningVolunteer => ({
    is_blocked: vol.is_blocked ?? false,
    is_vegan: vol.is_vegan ?? false,
    arrivals: vol.arrivals ?? [],
    paid_arrivals: vol.paid_arrivals ?? [],
    feed_type_code:
        vol.feed_type !== undefined && vol.feed_type !== null ? (feedTypeCodeById.get(vol.feed_type) ?? null) : null
});

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

        const feedTypeCodeById = buildFeedTypeCodeById(feedTypesResult?.data ?? []);
        const planningVolunteers = (volunteersResult?.data ?? []).map((vol) =>
            mapVolunteerToPlanning(vol, feedTypeCodeById)
        );

        return calculatePlannedCountsByDate({ volunteers: planningVolunteers });
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
