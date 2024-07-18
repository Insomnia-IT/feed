import dayjs from 'dayjs';
import { useCallback } from 'react';

import type { Transaction, Volunteer } from '~/db';
import { db, dbIncFeed, FeedType, FeedWithBalance, isActivatedStatus, MealTime } from '~/db';
import { getMealTimeText } from '~/shared/lib/utils';

const isVolExpired = (vol: Volunteer): boolean => {
    return vol.arrivals.every(
        ({ arrival_date, departure_date, status }) =>
            !isActivatedStatus(status) ||
            dayjs() < dayjs(arrival_date).startOf('day').add(7, 'hours') ||
            dayjs() > dayjs(departure_date).endOf('day').add(7, 'hours')
    );
};

export const validateVol = (
    vol: Volunteer,
    volTransactions: Array<Transaction>,
    kitchenId: number,
    mealTime: MealTime,
    isGroupScan: boolean
): { msg: Array<string>; isRed: boolean } => {
    const msg: Array<string> = [];
    let isRed = false;

    if (vol.feed_type !== FeedType.Child && vol.kitchen?.toString() !== kitchenId.toString()) {
        msg.push(`Кормится на кухне №${vol.kitchen}`);
    }
    if (!vol.arrivals.some(({ status }) => isActivatedStatus(status))) {
        msg.push('Бейдж не активирован в штабе');
    }
    if (vol.is_blocked) {
        isRed = true;
        msg.push('Волонтер заблокирован');
    }
    if (isVolExpired(vol)) {
        msg.push('Даты активности не совпадают');
    }
    if (!FeedWithBalance.has(vol.feed_type)) {
        isRed = true;
        msg.push('НЕТ ПИТАНИЯ, СХОДИ В ИЦ');
    }
    if (volTransactions.some((t) => t.mealTime === mealTime) && vol.feed_type !== FeedType.Child) {
        msg.push(`Волонтер уже получил ${getMealTimeText(mealTime)}`);

        if (vol.group_badge && !isGroupScan) {
            const hasDebt = Object.values(
                volTransactions.reduce(
                    (acc, { mealTime }) => ({
                        ...acc,
                        [mealTime]: (acc[mealTime] || 0) + 1
                    }),
                    {} as { [mealTime: string]: number }
                )
            ).some((count) => count > 1);

            if (hasDebt) {
                isRed = true;
            }
        } else {
            isRed = true;
        }
    }
    if (
        msg.length &&
        !isRed &&
        // TODO: Доработать логи по желтым экранам
        // Проверка t.amount > 0 && t.reason означало кормление по желтому экрану, а теперь добавилась маркировка "Групповое питание"
        volTransactions.some((t) => t.amount && t.reason && t.reason !== 'Групповое питание') &&
        vol.feed_type !== FeedType.Child
    ) {
        msg.push('Волонтер уже питался сегодня в долг');
        isRed = true;
    }

    if (vol.feed_type === FeedType.FT2) {
        if (mealTime === MealTime.night) {
            msg.push('Платник не может питаться в дожор');
        }
        if (msg.length > 0) {
            isRed = true;
        }
    }

    return { msg, isRed };
};

export const getTodayStart = () => dayjs().subtract(7, 'h').startOf('day').add(7, 'h').unix();

let isFeedInProgress = false;

export const useFeedVol = (
    vol: Volunteer | undefined | null,
    mealTime: MealTime | null,
    closeFeed: () => void,
    kitchenId: number
) => {
    const feed = useCallback(
        async (isVegan: boolean | undefined, log?: { error: boolean; reason: string }) => {
            if (mealTime && !isFeedInProgress) {
                try {
                    isFeedInProgress = true;
                    await dbIncFeed({ vol, mealTime, isVegan, log, kitchenId });
                    closeFeed();
                } catch (e) {
                    console.error(e);
                } finally {
                    isFeedInProgress = false;
                }
            }
        },
        [closeFeed, kitchenId, mealTime, vol]
    );

    return [
        useCallback(
            (isVegan?: boolean, reason?: string) => {
                let log;
                if (reason) {
                    log = { error: false, reason };
                }
                void feed(isVegan, log);
            },
            [feed]
        ),
        useCallback((reason: string) => void feed(undefined, { error: true, reason }), [feed])
    ] as const;
};

export const getVolTransactionsAsync = async (vol: Volunteer, todayStart: number) =>
    db.transactions
        .where('vol_id')
        .equals(vol.id)
        .filter((transaction) => {
            return transaction.ts > todayStart && transaction.amount !== 0;
        })
        .toArray();
