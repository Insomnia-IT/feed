import dayjs from 'dayjs';

import type { PlanningArrival, PlanningPaidArrival, PlanningVolunteer } from './types';
import { FeedTypeCode } from './types';

export const ACTIVATED_ARRIVAL_STATUSES = ['ARRIVED', 'STARTED', 'JOINED'] as const;

export type ActivatedArrivalStatus = (typeof ACTIVATED_ARRIVAL_STATUSES)[number];

export const isActivatedArrivalStatus = (status: string | null | undefined): status is ActivatedArrivalStatus =>
    Boolean(status && (ACTIVATED_ARRIVAL_STATUSES as readonly string[]).includes(status));

export interface DateInterval {
    arrival_date: string;
    departure_date: string;
}

export const isDateWithinInterval = ({
    interval,
    statsDate
}: {
    interval: DateInterval;
    statsDate: string;
}): boolean => {
    const statsDateUnix = dayjs(statsDate).startOf('day').unix();
    return (
        dayjs(interval.departure_date).startOf('day').unix() >= statsDateUnix &&
        dayjs(interval.arrival_date).startOf('day').unix() <= statsDateUnix
    );
};

export const isNowWithinInterval = (interval: DateInterval): boolean => {
    const now = dayjs();
    return (
        now.unix() >= dayjs(interval.arrival_date).startOf('day').add(7, 'hours').unix() &&
        now.unix() <= dayjs(interval.departure_date).endOf('day').add(7, 'hours').unix()
    );
};

export const getActivatedArrivals = (vol: PlanningVolunteer): ReadonlyArray<PlanningArrival> =>
    (vol.arrivals ?? []).filter((arrival) => isActivatedArrivalStatus(arrival.status));

export const getPaidArrivals = (vol: PlanningVolunteer): ReadonlyArray<PlanningPaidArrival> => vol.paid_arrivals ?? [];

export interface FeedingPermissionForDate {
    allowed: boolean;
    byArrivals: boolean;
    byPaidArrivals: boolean;
}

export const getFeedingPermissionForDate = (vol: PlanningVolunteer, statsDate: string): FeedingPermissionForDate => {
    const byArrivals = getActivatedArrivals(vol).some((interval) => isDateWithinInterval({ interval, statsDate }));
    const byPaidArrivals = getPaidArrivals(vol).some((interval) => isDateWithinInterval({ interval, statsDate }));

    if (vol.feed_type_code === FeedTypeCode.NoFeed) {
        return { allowed: false, byArrivals, byPaidArrivals };
    }
    if (vol.feed_type_code === FeedTypeCode.Paid) {
        return { allowed: byPaidArrivals, byArrivals, byPaidArrivals };
    }

    return { allowed: byArrivals || byPaidArrivals, byArrivals, byPaidArrivals };
};

export interface FeedingPermissionForNow {
    allowed: boolean;
    byArrivals: boolean;
    byPaidArrivals: boolean;
    paidArrival: PlanningPaidArrival | null;
}

export const getFeedingPermissionForNow = (vol: PlanningVolunteer): FeedingPermissionForNow => {
    const byArrivals = getActivatedArrivals(vol).some((interval) => isNowWithinInterval(interval));
    const matchedPaidArrival = getPaidArrivals(vol).find((interval) => isNowWithinInterval(interval)) ?? null;
    const byPaidArrivals = Boolean(matchedPaidArrival);

    if (vol.feed_type_code === FeedTypeCode.NoFeed) {
        return { allowed: false, byArrivals, byPaidArrivals, paidArrival: matchedPaidArrival };
    }
    if (vol.feed_type_code === FeedTypeCode.Paid) {
        return { allowed: byPaidArrivals, byArrivals, byPaidArrivals, paidArrival: matchedPaidArrival };
    }

    return { allowed: byArrivals || byPaidArrivals, byArrivals, byPaidArrivals, paidArrival: matchedPaidArrival };
};
