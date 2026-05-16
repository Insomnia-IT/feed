import dayjs from 'dayjs';

import type { ArrivalEntity, FeedTypeEntity, PaidArrivalEntity, VolEntity } from 'interfaces';
import { isVolunteerActivatedStatusValue } from 'shared/helpers/volunteer-status';

export interface PlannedDayCounts {
    meat: number;
    vegan: number;
}

export type PlannedCountsByDate = Map<string, PlannedDayCounts>;

const FEED_TYPE_NOFEED_CODE = 'NOFEED';
const FEED_TYPE_PAID_CODE = 'PAID';

interface DateInterval {
    arrival_date: string;
    departure_date: string;
}

const isDateWithinInterval = ({ interval, statsDate }: { interval: DateInterval; statsDate: string }): boolean => {
    const statsDateUnix = dayjs(statsDate).startOf('day').unix();
    return (
        dayjs(interval.departure_date).startOf('day').unix() >= statsDateUnix &&
        dayjs(interval.arrival_date).startOf('day').unix() <= statsDateUnix
    );
};

const getActivatedArrivals = (vol: VolEntity): ArrivalEntity[] =>
    (vol.arrivals ?? []).filter((arrival) => isVolunteerActivatedStatusValue(arrival.status));

const getPaidArrivals = (vol: VolEntity): PaidArrivalEntity[] => vol.paid_arrivals ?? [];

const getFeedTypeCodeById = (
    feedTypeId: number | null | undefined,
    feedTypeCodeById: Map<number, string>
): string | undefined => {
    if (feedTypeId === null || feedTypeId === undefined) {
        return undefined;
    }
    return feedTypeCodeById.get(feedTypeId);
};

const isVolunteerPresentOnDate = ({
    feedTypeCode,
    statsDate,
    vol
}: {
    vol: VolEntity;
    statsDate: string;
    feedTypeCode: string | undefined;
}): boolean => {
    if (feedTypeCode === FEED_TYPE_NOFEED_CODE) {
        return false;
    }

    const byPaidArrivals = getPaidArrivals(vol).some((interval) => isDateWithinInterval({ interval, statsDate }));

    if (feedTypeCode === FEED_TYPE_PAID_CODE) {
        return byPaidArrivals;
    }

    const byArrivals = getActivatedArrivals(vol).some((interval) => isDateWithinInterval({ interval, statsDate }));

    return byArrivals || byPaidArrivals;
};

const collectVolunteerDates = (vol: VolEntity): Set<string> => {
    const dates = new Set<string>();

    const collect = (interval: DateInterval) => {
        let cursor = dayjs(interval.arrival_date).startOf('day');
        const end = dayjs(interval.departure_date).startOf('day');
        while (!cursor.isAfter(end, 'day')) {
            dates.add(cursor.format('YYYY-MM-DD'));
            cursor = cursor.add(1, 'day');
        }
    };

    getActivatedArrivals(vol).forEach(collect);
    getPaidArrivals(vol).forEach(collect);

    return dates;
};

export const buildFeedTypeCodeById = (feedTypes: FeedTypeEntity[]): Map<number, string> => {
    const result = new Map<number, string>();
    for (const feedType of feedTypes) {
        if (feedType.code) {
            result.set(feedType.id, feedType.code);
        }
    }
    return result;
};

export const calculatePlannedCountsByDate = ({
    feedTypes,
    volunteers
}: {
    volunteers: VolEntity[];
    feedTypes: FeedTypeEntity[];
}): PlannedCountsByDate => {
    const feedTypeCodeById = buildFeedTypeCodeById(feedTypes);
    const result: PlannedCountsByDate = new Map();

    const eligibleVolunteers = volunteers.filter((vol) => !vol.is_blocked);

    for (const vol of eligibleVolunteers) {
        const feedTypeCode = getFeedTypeCodeById(vol.feed_type, feedTypeCodeById);
        if (feedTypeCode === FEED_TYPE_NOFEED_CODE) {
            continue;
        }

        const candidateDates = collectVolunteerDates(vol);

        for (const statsDate of candidateDates) {
            if (!isVolunteerPresentOnDate({ vol, statsDate, feedTypeCode })) {
                continue;
            }

            const bucket = result.get(statsDate) ?? { meat: 0, vegan: 0 };
            if (vol.is_vegan) {
                bucket.vegan += 1;
            } else {
                bucket.meat += 1;
            }
            result.set(statsDate, bucket);
        }
    }

    return result;
};

export const getPlannedCountsForDate = (countsByDate: PlannedCountsByDate, date: string): PlannedDayCounts =>
    countsByDate.get(date) ?? { meat: 0, vegan: 0 };
