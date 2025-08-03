import dayjs from 'dayjs';
import { useState } from 'react';

import { FeedType, getFeedStats, getVolsOnField, MealTime } from 'db';
import { DATE_FORMAT } from 'shared/lib/date';
import { LocalStatsHook } from './lib';

export const MEAL_TIME = [MealTime.breakfast, MealTime.lunch, MealTime.dinner, MealTime.night] as const;

type StatsByNutritionType = {
    NT1: number;
    NT2: number;
    total: number;
};

type FeedStatsRecord = Record<MealTime, StatsByNutritionType>;
export type FeedStats = { onField: FeedStatsRecord; feedCount: FeedStatsRecord };

const getStatsByDate = async (statsDate: string): Promise<FeedStats> => {
    const onFieldArr = await Promise.all(
        MEAL_TIME.map(async (MT): Promise<FeedStatsRecord> => {
            let vols = await getVolsOnField(statsDate);
            if (MT === MealTime.breakfast) {
                vols = vols.filter((vol) =>
                    vol.arrivals.some(
                        ({ arrival_date, departure_date }) =>
                            dayjs(arrival_date).unix() <= dayjs(statsDate).unix() &&
                            dayjs(departure_date).unix() >= dayjs(statsDate).unix()
                    )
                );
            }
            if (MT === MealTime.dinner) {
                vols = vols.filter((vol) =>
                    vol.arrivals.some(
                        ({ arrival_date, departure_date }) =>
                            dayjs(arrival_date).unix() <= dayjs(statsDate).unix() &&
                            dayjs(departure_date).unix() >= dayjs(statsDate).add(1, 'd').unix()
                    )
                );
            }
            if (MT === MealTime.night) {
                vols = vols.filter((vol) =>
                    vol.arrivals.some(
                        ({ arrival_date, departure_date }) =>
                            dayjs(arrival_date).unix() <= dayjs(statsDate).unix() &&
                            dayjs(departure_date).unix() >= dayjs(statsDate).add(1, 'd').unix() &&
                            vol.feed_type !== FeedType.Paid
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

            return {
                [MT]: { NT1: nt1, NT2: nt2, total }
            } as FeedStatsRecord;
        })
    );

    const feedCountArr = await Promise.all(
        MEAL_TIME.map(async (MT): Promise<FeedStatsRecord> => {
            let txs = await getFeedStats(statsDate);
            txs = txs.filter((tx) => tx.mealTime === MT);

            const nt1 = txs.reduce((acc, curr) => (!curr.is_vegan ? acc + curr.amount : acc), 0);
            const nt2 = txs.reduce((acc, curr) => (curr.is_vegan ? acc + curr.amount : acc), 0);
            const total = nt1 + nt2;

            return {
                [MT]: { NT1: nt1, NT2: nt2, total }
            } as FeedStatsRecord;
        })
    );

    const onField: FeedStatsRecord = {} as any;
    Object.assign(onField, ...onFieldArr);

    const feedCount: FeedStatsRecord = {} as any;
    Object.assign(feedCount, ...feedCountArr);

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
    const [error, setError] = useState<any>(null);
    const [stats, setStats] = useState<FeedStats | null>(null);
    const [progress, setProgress] = useState<boolean>(true);
    const [updated, setUpdated] = useState<boolean>(false);

    const update = async (statsDate: string, predict = false): Promise<void> => {
        setUpdated(false);
        setProgress(true);

        try {
            const result = predict ? await calcPredict(statsDate) : await getStatsByDate(statsDate);
            setStats(result);
            setUpdated(true);
        } catch (e) {
            console.error(e);
            setError(e);
        } finally {
            setProgress(false);
        }
    };

    return { progress, update, error, updated, stats };
};
