import { useState } from 'react';
import dayjs from 'dayjs';

import { FeedType, getFeedStats, getVolsOnField, MealTime } from '~/db';
import type { LocalStatsHook } from '~/request-local-db/lib';
import { DATE_FORMAT } from '~/lib/date';

export const MEAL_TIME = [MealTime.breakfast, MealTime.lunch, MealTime.dinner, MealTime.night] as const;

type StatsByNutritionType = {
    NT1: number;
    NT2: number;
    total: number;
};

type FeedStatsRecord = Record<MealTime, StatsByNutritionType>;
export type FeedStats = { onField: FeedStatsRecord; feedCount: FeedStatsRecord };

const getStatsByDate = async (statsDate) => {
    const onFieldPromises = MEAL_TIME.map(async (MT): Promise<FeedStatsRecord> => {
        let vols = await getVolsOnField(statsDate);
        if (MT === MealTime.breakfast) {
            vols = vols.filter((vol) =>
                vol.arrivals.some(
                    ({ arrival_date, departure_date }) =>
                        dayjs(arrival_date).unix() < dayjs(statsDate).unix() &&
                        dayjs(departure_date).unix() >= dayjs(statsDate).unix()
                )
            );
        }
        if (MT === MealTime.dinner) {
            vols = vols.filter((vol) =>
                vol.arrivals.some(
                    ({ arrival_date, departure_date }) =>
                        dayjs(arrival_date).unix() < dayjs(statsDate).unix() &&
                        dayjs(departure_date).unix() >= dayjs(statsDate).add(1, 'd').unix()
                )
            );
        }
        if (MT === MealTime.night) {
            vols = vols.filter((vol) =>
                vol.arrivals.some(
                    ({ arrival_date, departure_date }) =>
                        dayjs(arrival_date).unix() < dayjs(statsDate).unix() &&
                        dayjs(departure_date).unix() >= dayjs(statsDate).add(1, 'd').unix() &&
                        vol.feed_type !== FeedType.FT2
                )
            );
        }

        try {
            console.log(
                `stat: type - plan, date - ${statsDate}, meal_time - ${MT}:`,
                vols.map((vol) => ({
                    id: vol.id,
                    date: statsDate,
                    type: 'plan',
                    meal_time: MT,
                    is_vegan: vol.is_vegan,
                    amount: 1,
                    kitchen_id: vol.kitchen
                }))
            );
        } catch (error) {
            console.log('stat, plan:', `logging failed - ${error}`);
        }

        const nt1 = vols.filter((vol) => !vol.is_vegan).length;
        const nt2 = vols.filter((vol) => vol.is_vegan).length;
        const total = vols.length;

        return <FeedStatsRecord>{
            [MT]: {
                NT1: nt1,
                NT2: nt2,
                total: total
            }
        };
    });

    const feedCountPromises = MEAL_TIME.map(async (MT): Promise<FeedStatsRecord> => {
        let txs = await getFeedStats(statsDate);
        if (MT === MealTime.breakfast) {
            txs = txs.filter((tx) => tx.mealTime === MealTime.breakfast);
        }
        if (MT === MealTime.lunch) {
            txs = txs.filter((tx) => tx.mealTime === MealTime.lunch);
        }
        if (MT === MealTime.dinner) {
            txs = txs.filter((tx) => tx.mealTime === MealTime.dinner);
        }
        if (MT === MealTime.night) {
            txs = txs.filter((tx) => tx.mealTime === MealTime.night);
        }

        const nt1 = txs.reduce((acc, curr) => {
            if (!curr.is_vegan) {
                return acc + curr.amount;
            }
            return acc;
        }, 0);
        const nt2 = txs.reduce((acc, curr) => {
            if (curr.is_vegan) {
                return acc + curr.amount;
            }
            return acc;
        }, 0);
        const total = nt1 + nt2;

        return <FeedStatsRecord>{
            [MT]: {
                NT1: nt1,
                NT2: nt2,
                total: total
            }
        };
    });

    const onFieldArr = await Promise.all(onFieldPromises);
    const onFieldRecords = <FeedStatsRecord>{};
    Object.assign(onFieldRecords, ...onFieldArr);

    const feedCountArr = await Promise.all(feedCountPromises);
    const feedCountRecords = <FeedStatsRecord>{};
    Object.assign(feedCountRecords, ...feedCountArr);

    return {
        onField: onFieldRecords,
        feedCount: feedCountRecords
    };
};

const calcPredict = async (statsDate: string) => {
    const { feedCount: prevFeedCount, onField: prevOnField } = await getStatsByDate(
        dayjs(statsDate).subtract(1, 'd').format(DATE_FORMAT)
    );
    const { feedCount: prev2FeedCount, onField: prev2OnField } = await getStatsByDate(
        dayjs(statsDate).subtract(2, 'd').format(DATE_FORMAT)
    );
    const { feedCount, onField } = await getStatsByDate(statsDate);
    Object.keys(feedCount).forEach((MTKey) => {
        Object.keys(feedCount[MTKey]).forEach((NTKey) => {
            if (NTKey === 'total') return;

            let basisFeedCount;
            let basisOnField;
            if (prevFeedCount[MTKey][NTKey] !== 0) {
                basisFeedCount = prevFeedCount[MTKey][NTKey];
                basisOnField = prevOnField[MTKey][NTKey];
            } else {
                basisFeedCount = prev2FeedCount[MTKey][NTKey];
                basisOnField = prev2OnField[MTKey][NTKey];
            }
            const feedCountPredict = (basisFeedCount / basisOnField) * onField[MTKey][NTKey];
            feedCount[MTKey][NTKey] =
                isNaN(feedCountPredict) || !isFinite(feedCountPredict)
                    ? onField[MTKey][NTKey]
                    : Math.round(feedCountPredict);
        });
    });

    Object.keys(feedCount).forEach((MTKey) => {
        feedCount[MTKey].total = feedCount[MTKey].NT1 + feedCount[MTKey].NT2;
    });

    return { feedCount: feedCount, onField };
};

export const useLocalStats = (): LocalStatsHook => {
    const [error, setError] = useState<any>(null);
    const [stats, setStats] = useState<FeedStats | null>(null);
    const [progress, setProgress] = useState<boolean>(true);
    const [updated, setUpdated] = useState<boolean>(false);

    const update = async (statsDate: string, predict = false) => {
        setUpdated(false);
        setProgress(true);
        try {
            if (predict) {
                const stats = await calcPredict(statsDate);
                setStats(stats);
            } else {
                const stats = await getStatsByDate(statsDate);
                setStats(stats);
            }
            setUpdated(true);
            setProgress(false);
        } catch (e) {
            console.error(e);
            setError(e);
            setProgress(false);
        }
    };
    return { progress, update, error, updated, stats };
};
