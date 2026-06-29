import dayjs from 'dayjs';

import type { DateInterval } from './feeding-permission';
import { getActivatedArrivals, getFeedingPermissionForDate, getPaidArrivals } from './feeding-permission';
import { FeedTypeCode, type PlanningVolunteer } from './types';

export interface PlannedDayCounts {
    meat: string[];
    vegan: string[];
}

export type PlannedCountsByDate = Map<string, PlannedDayCounts>;

const collectVolunteerDates = (vol: PlanningVolunteer): Set<string> => {
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

export const calculatePlannedCountsByDate = ({
    volunteers
}: {
    volunteers: ReadonlyArray<PlanningVolunteer>;
}): PlannedCountsByDate => {
    const result: PlannedCountsByDate = new Map();

    const eligibleVolunteers = volunteers.filter((vol) => !vol.is_blocked);

    for (const vol of eligibleVolunteers) {
        if (vol.feed_type_code === FeedTypeCode.NoFeed) {
            continue;
        }

        const candidateDates = collectVolunteerDates(vol);

        for (const statsDate of candidateDates) {
            if (!getFeedingPermissionForDate(vol, statsDate).allowed) {
                continue;
            }

            const bucket = result.get(statsDate) ?? { meat: [], vegan: [] };
            if (vol.is_vegan) {
                bucket.vegan.push(vol.qr ?? '-');
            } else {
                bucket.meat.push(vol.qr ?? '-');
            }
            result.set(statsDate, bucket);
        }
    }

    return result;
};

export const getPlannedCountsForDate = (countsByDate: PlannedCountsByDate, date: string): PlannedDayCounts =>
    countsByDate.get(date) ?? { meat: [], vegan: [] };
