import dayjs from 'dayjs';
import { useCallback, useState } from 'react';

import { FeedType, getFeedStats, getVolsOnField, isActivatedStatus, MealTime } from 'db';
import type { Volunteer } from 'db';
import { DATE_FORMAT } from 'shared/lib/date';
import type { LocalStatsHook } from './lib';

export const MEAL_TIME = [MealTime.breakfast, MealTime.lunch, MealTime.dinner, MealTime.night] as const;

type StatsByNutritionType = {
    NT1: number;
    NT2: number;
    total: number;
};

type FeedStatsRecord = Record<MealTime, StatsByNutritionType>;
export type FeedStats = { onField: FeedStatsRecord; feedCount: FeedStatsRecord };

const createEmptyFeedStatsRecord = (): FeedStatsRecord => ({
    [MealTime.breakfast]: { NT1: 0, NT2: 0, total: 0 },
    [MealTime.lunch]: { NT1: 0, NT2: 0, total: 0 },
    [MealTime.dinner]: { NT1: 0, NT2: 0, total: 0 },
    [MealTime.night]: { NT1: 0, NT2: 0, total: 0 }
});

const getUnixDayRange = (statsDate: string) => {
    const start = dayjs(statsDate).startOf('day');
    return {
        start: start.unix(),
        nextDayStart: start.add(1, 'day').unix()
    };
};

type StatsInterval = {
    arrival_date: string;
    departure_date: string;
};

const getStatsIntervals = (vol: Volunteer): Array<StatsInterval> => {
    const arrivals = vol.arrivals.filter(({ status }) => isActivatedStatus(status));
    const paidArrivals = vol.paid_arrivals ?? [];

    if (vol.feed_type === FeedType.Paid) {
        return paidArrivals;
    }

    return [...arrivals, ...paidArrivals];
};

const getStatsByDate = async (statsDate: string): Promise<FeedStats> => {
    const [volsOnField, feedTransactions] = await Promise.all([getVolsOnField(statsDate), getFeedStats(statsDate)]);
    const { start, nextDayStart } = getUnixDayRange(statsDate);

    const onField: FeedStatsRecord = createEmptyFeedStatsRecord();
    for (const vol of volsOnField) {
        let hasBreakfast = false;
        let hasDinner = false;
        let hasNight = false;

        for (const interval of getStatsIntervals(vol)) {
            const arrivalUnix = dayjs(interval.arrival_date).unix();
            const departureUnix = dayjs(interval.departure_date).unix();

            if (arrivalUnix <= start && departureUnix >= start) {
                hasBreakfast = true;
            }
            if (arrivalUnix <= start && departureUnix >= nextDayStart) {
                hasDinner = true;
                if (vol.feed_type !== FeedType.Paid) {
                    hasNight = true;
                }
            }

            if (hasBreakfast && hasDinner && (hasNight || vol.feed_type === FeedType.Paid)) {
                break;
            }
        }

        for (const mealTime of MEAL_TIME) {
            const include =
                mealTime === MealTime.lunch ||
                (mealTime === MealTime.breakfast && hasBreakfast) ||
                (mealTime === MealTime.dinner && hasDinner) ||
                (mealTime === MealTime.night && hasNight);

            if (!include) continue;

            const mealStats = onField[mealTime];
            if (vol.is_vegan) {
                mealStats.NT2 += 1;
            } else {
                mealStats.NT1 += 1;
            }
            mealStats.total += 1;
        }
    }

    const feedCount: FeedStatsRecord = createEmptyFeedStatsRecord();
    for (const tx of feedTransactions) {
        const mealStats = feedCount[tx.mealTime];
        if (tx.is_vegan) {
            mealStats.NT2 += tx.amount;
        } else {
            mealStats.NT1 += tx.amount;
        }
        mealStats.total += tx.amount;
    }

    return { onField, feedCount };
};

const calcPredict = async (statsDate: string): Promise<FeedStats> => {
    const yesterday = dayjs(statsDate).subtract(1, 'd').format(DATE_FORMAT);
    const dayBefore = dayjs(statsDate).subtract(2, 'd').format(DATE_FORMAT);

    const { feedCount: prevFC, onField: prevOF } = await getStatsByDate(yesterday);
    const { feedCount: prev2FC, onField: prev2OF } = await getStatsByDate(dayBefore);
    const { feedCount, onField } = await getStatsByDate(statsDate);

    for (const MT of MEAL_TIME) {
        for (const NT of ['NT1', 'NT2'] as const) {
            const basisFC = prevFC[MT][NT] !== 0 ? prevFC[MT][NT] : prev2FC[MT][NT];
            const basisOF = prevFC[MT][NT] !== 0 ? prevOF[MT][NT] : prev2OF[MT][NT];

            const predict = (basisFC / basisOF) * onField[MT][NT];
            feedCount[MT][NT] = isFinite(predict) && !isNaN(predict) ? Math.round(predict) : onField[MT][NT];
        }
        feedCount[MT].total = feedCount[MT].NT1 + feedCount[MT].NT2;
    }

    return { onField, feedCount };
};

export const useLocalStats = (): LocalStatsHook => {
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<FeedStats | null>(null);
    const [progress, setProgress] = useState<boolean>(true);
    const [updated, setUpdated] = useState<boolean>(false);

    const update = useCallback(async (statsDate: string, predict = false): Promise<void> => {
        setUpdated(false);
        setError(null);
        setProgress(true);

        try {
            const result = predict ? await calcPredict(statsDate) : await getStatsByDate(statsDate);
            setStats(result);
            setUpdated(true);
        } catch (e: unknown) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setProgress(false);
        }
    }, []);

    return { progress, update, error, updated, stats };
};
