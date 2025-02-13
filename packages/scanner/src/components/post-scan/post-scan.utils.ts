import dayjs from 'dayjs';
import { useCallback } from 'react';

import { getTodayTrans, db, dbIncFeed, FeedType, isActivatedStatus, MealTime } from '~/db';
import type { Transaction, TransactionJoined, Volunteer, GroupBadge } from '~/db';
import { getMealTimeText } from '~/shared/lib/utils';

const isVolExpired = (vol: Volunteer): boolean => {
    return vol.arrivals.every(
        ({ arrival_date, departure_date, status }) =>
            !isActivatedStatus(status) ||
            dayjs() < dayjs(arrival_date).startOf('day').add(7, 'hours') ||
            dayjs() > dayjs(departure_date).endOf('day').add(7, 'hours')
    );
};

export const validateVol = ({
    isGroupScan = false,
    kitchenId,
    mealTime,
    vol,
    volTransactions
}: {
    vol: Volunteer;
    volTransactions: Array<Transaction>;
    kitchenId: number;
    mealTime?: MealTime | null;
    isGroupScan?: boolean;
}): { msg: Array<string>; isRed: boolean; isActivated: boolean } => {
    const msg: Array<string> = [];
    let isRed = false;
    const isActivated = true;

    if (
        vol.kitchen?.toString() !== kitchenId.toString() &&
        // В рамках группового бейжда детей не кормим в долг
        (isGroupScan || vol.feed_type !== FeedType.Child)
    ) {
        msg.push(`Кормится на кухне №${vol.kitchen}`);

        if (isGroupScan) {
            isRed = true;
        }
    }

    if (!vol.arrivals.some(({ status }) => isActivatedStatus(status))) {
        // isActivated = false;
        // msg.push('Бейдж не активирован в штабе');
    }

    if (vol.is_blocked) {
        isRed = true;
        msg.push('Волонтер заблокирован');
    }

    if (isVolExpired(vol)) {
        // msg.push('Даты активности не совпадают');
    }

    if (vol.feed_type === FeedType.NoFeed) {
        isRed = true;
        msg.push('НЕТ ПИТАНИЯ, СХОДИ В ИЦ');
    }

    if (
        volTransactions.some((t) => t.mealTime === mealTime) &&
        // В рамках группового бейжда детей не кормим в долг
        (isGroupScan || vol.feed_type !== FeedType.Child)
    ) {
        msg.push(`Волонтер уже получил ${getMealTimeText(mealTime)}`);

        if (vol.group_badge && !isGroupScan) {
            // Считаем, что волонтер имеет долг, если его кормили за один приём пищи больше, чем один раз
            const hasDebt = Object.values(
                volTransactions.reduce(
                    (acc, { mealTime }) => ({
                        ...acc,
                        [mealTime]: (acc[mealTime] || 0) + 1
                    }),
                    <Record<string, number>>{}
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
        // Проверка t.amount > 0 && t.reason означает кормление по желтому экрану
        volTransactions.some((t) => t.amount && t.reason) &&
        // В рамках группового бейжда детей не кормим в долг
        (isGroupScan || vol.feed_type !== FeedType.Child)
    ) {
        msg.push('Волонтер уже питался сегодня в долг');
        isRed = true;
    }

    if (vol.feed_type === FeedType.Paid) {
        if (mealTime === MealTime.night) {
            msg.push('Платник не может питаться в дожор');
        }
        if (msg.length > 0) {
            isRed = true;
        }
    }

    return { msg, isRed, isActivated };
};

// Кормим большое количество анонимов, если введено "другое число"
export const massFeedAnons = async ({
    comment = '',
    groupBadge,
    kitchenId,
    mealTime,
    nonVegansCount,
    vegansCount
}: {
    groupBadge?: GroupBadge;
    kitchenId: number;
    vegansCount: number;
    nonVegansCount: number;
    mealTime?: MealTime | null;
    comment?: string;
}): Promise<void> => {
    if (!mealTime) {
        return;
    }

    const createTransactionDraft = ({
        amount = 1,
        isVegan
    }: {
        isVegan?: boolean;
        amount?: number;
    } = {}): {
        group_badge?: number;
        vol: null;
        mealTime: MealTime;
        isVegan?: boolean;
        log: {
            error: boolean;
            reason: string;
        };
        amount: number;
        kitchenId: number;
    } => {
        return {
            amount,
            vol: null,
            mealTime,
            isVegan: Boolean(isVegan),
            log: { error: false, reason: comment },
            kitchenId,
            group_badge: groupBadge?.id
        };
    };

    // Количество меньше нуля маловероятно, но, так как тип number предполагает такое поведение, стоит предусмотреть такой вариант
    const vegans = vegansCount <= 0 ? [] : [createTransactionDraft({ isVegan: true, amount: vegansCount })];

    // Количество меньше нуля маловероятно, но, так как тип number предполагает такое поведение, стоит предусмотреть такой вариант
    const nonVegans = nonVegansCount <= 0 ? [] : [createTransactionDraft({ isVegan: false, amount: nonVegansCount })];

    const promises = [...vegans, ...nonVegans].map((transactionDraft) => dbIncFeed(transactionDraft));

    await Promise.all(promises);
};

export const getTodayStart = (): number => dayjs().subtract(7, 'h').startOf('day').add(7, 'h').unix();

let isFeedInProgress = false;

export const useFeedVol = (
    vol: Volunteer | undefined | null,
    mealTime: MealTime | null,
    closeFeed: () => void,
    kitchenId: number
): {
    doFeed: (isVegan?: boolean, reason?: string) => void;
    doNotFeed: (reason: string) => void;
} => {
    const feed = useCallback(
        async (isVegan: boolean | undefined, log?: { error: boolean; reason: string }) => {
            if (mealTime && !isFeedInProgress) {
                try {
                    isFeedInProgress = true;
                    await dbIncFeed({ vol, mealTime, isVegan, log, kitchenId });
                    closeFeed();
                } catch (error) {
                    console.error(error);
                } finally {
                    isFeedInProgress = false;
                }
            }
        },
        [closeFeed, kitchenId, mealTime, vol]
    );

    const doFeed = (isVegan?: boolean, reason?: string): void => {
        let log;

        if (reason) {
            log = { error: false, reason };
        }

        void feed(isVegan, log);
    };

    const doNotFeed = (reason: string): void => {
        void feed(undefined, { error: true, reason });
    };

    return {
        doFeed,
        doNotFeed
    } as const;
};

export const getVolTransactionsAsync = async (vol: Volunteer, todayStart: number): Promise<Array<Transaction>> =>
    db.transactions
        .where('vol_id')
        .equals(vol.id)
        .filter((transaction) => {
            return transaction.ts > todayStart && transaction.amount !== 0;
        })
        .toArray();

export const getGroupBadgeCurrentMealTransactions = async (
    badgeId: number,
    mealTime?: MealTime | null
): Promise<Array<TransactionJoined>> => {
    const todayTransactions = await getTodayTrans();

    return todayTransactions.filter(
        (transaction) => transaction.group_badge === badgeId && transaction.mealTime === mealTime
    );
};

export const calculateAlreadyFedCount = (alreadyFedTransactions: Array<TransactionJoined>): number =>
    alreadyFedTransactions?.reduce((count, next) => count + next.amount, 0) ?? 0;
