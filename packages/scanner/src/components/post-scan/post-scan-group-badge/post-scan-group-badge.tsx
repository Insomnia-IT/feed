import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { useApp } from 'model/app-provider/app-provider';
import { db, dbIncFeed } from 'db';
import type { GroupBadge, MealTime, Transaction, Volunteer, TransactionJoined } from 'db';
import { ErrorCard } from 'components/post-scan/post-scan-cards/error-card/error-card';
import { CardContainer } from 'components/post-scan/post-scan-cards/ui/card-container/card-container';
import { AlreadyFedModal } from 'components/post-scan/post-scan-group-badge/already-fed-modal/already-fed-modal';

import {
    calculateAlreadyFedCount,
    getGroupBadgeCurrentMealTransactions,
    getTodayStart,
    getVolTransactionsAsync,
    massFeedAnons,
    validateVol
} from '../post-scan.utils';

import type { ValidatedVol, ValidationGroups } from './post-scan-group-badge.lib';
import { getAllVols } from './post-scan-group-badge.utils';
import { GroupBadgeWarningCard } from './post-scan-group-badge-misc';

export const Views = {
    LOADING: 'LOADING',
    YELLOW: 'YELLOW',
    ERROR_EMPTY: 'ERROR_EMPTY',
    ERROR_VALIDATION: 'ERROR_VALIDATION'
} as const;

export type Views = (typeof Views)[keyof typeof Views];

const todayStart = getTodayStart();

const useGroupBadgeData = ({
    badge,
    mealTime
}: {
    badge: GroupBadge;
    mealTime?: MealTime | null;
}): {
    volsRaw: Array<Volunteer> | undefined;
    alreadyFedTransactionsRaw: Array<TransactionJoined> | undefined;
} => {
    const { id } = badge;

    // get vols linked tp badge, and their transactions for today
    const volsRaw = useLiveQuery<Array<Volunteer>>(async () => {
        const vols = await db.volunteers.where('group_badge').equals(id).toArray();

        // pre-fetching transactions by each vol
        const withTxs = await Promise.all(
            vols.map(async (vol) => {
                const txs = await getVolTransactionsAsync(vol, todayStart);
                return { ...vol, transactions: txs };
            })
        );

        return withTxs;
    }, [id]);

    // Транзакции с текущим бейджем и временем питания - уже покормленные волонтеры (чаще всего - анонимы)
    const alreadyFedTransactionsRaw = useLiveQuery<Array<TransactionJoined>>(() => {
        return getGroupBadgeCurrentMealTransactions(id, mealTime);
    }, [id, mealTime]);

    return { volsRaw, alreadyFedTransactionsRaw };
};

// callback to feed vols
const incFeedAsync = async ({
    groupBadge,
    kitchenId,
    mealTime,
    vols
}: {
    groupBadge: GroupBadge;
    kitchenId: number;
    mealTime?: MealTime | null;
    vols: Array<ValidatedVol>;
}): Promise<void> => {
    if (!mealTime) {
        return;
    }

    await Promise.all(
        vols.map((vol) => {
            const log = { error: false, reason: vol.msg.join(', ') };

            return dbIncFeed({
                vol,
                mealTime,
                isVegan: vol.is_vegan,
                log,
                kitchenId,
                group_badge: groupBadge.id
            });
        })
    );
};

export const PostScanGroupBadge = ({ closeFeed, groupBadge }: { closeFeed: () => void; groupBadge: GroupBadge }) => {
    const { name } = groupBadge;

    // get app context
    const { kitchenId, mealTime } = useApp();
    const { volsRaw, alreadyFedTransactionsRaw } = useGroupBadgeData({ badge: groupBadge, mealTime });

    const isLoading = volsRaw === undefined || alreadyFedTransactionsRaw === undefined;

    const vols = volsRaw ?? [];
    const alreadyFedTransactions = alreadyFedTransactionsRaw ?? [];

    const alreadyFedVolsCount = calculateAlreadyFedCount(alreadyFedTransactions);

    const { view, validationGroups } = useMemo(() => {
        // loading
        if (isLoading) {
            return {
                view: Views.LOADING as Views,
                validationGroups: { greens: [], reds: [] } as ValidationGroups
            };
        }

        // nobody is attached to group badge
        if (vols.length === 0) {
            return {
                view: Views.ERROR_EMPTY as Views,
                validationGroups: { greens: [], reds: [] } as ValidationGroups
            };
        }

        // pass each vol through validation and combine result
        const validatedVols: Array<ValidatedVol> = vols.map((vol) => {
            const volTransactions = (vol.transactions ?? []) as Array<Transaction>;

            return {
                ...vol,
                ...validateVol({
                    vol,
                    volTransactions,
                    kitchenId,
                    mealTime,
                    isGroupScan: true
                })
            } as ValidatedVol;
        });

        const validationGroupsNext: ValidationGroups = {
            // greens don't have any messages
            greens: validatedVols.filter((vol) => vol.msg.length === 0),

            // reds have one or more messages for Group Badge
            reds: validatedVols.filter((vol) => vol.msg.length > 0)
        };

        // validation went wrong
        if (getAllVols(validationGroupsNext).length !== vols.length) {
            return {
                view: Views.ERROR_VALIDATION as Views,
                validationGroups: validationGroupsNext
            };
        }

        // all vols or some of them eat but there is messages to show
        return {
            view: Views.YELLOW as Views,
            validationGroups: validationGroupsNext
        };
    }, [isLoading, vols, kitchenId, mealTime]);

    const leftToFeedInBadge =
        // Транзакции кормления анонимов по групповому бейджу могут содержать значение amount, отличное от 1
        validationGroups.greens.length - alreadyFedVolsCount;

    const doFeed = (volsToFeed: Array<ValidatedVol>): void => {
        void incFeedAsync({ vols: volsToFeed, mealTime, kitchenId, groupBadge });
    };

    const doFeedAnons = (value: { vegansCount: number; nonVegansCount: number }): void => {
        void massFeedAnons({ ...value, groupBadge, kitchenId, mealTime });
    };

    return (
        <CardContainer>
            <AlreadyFedModal alreadyFedVolsCount={alreadyFedVolsCount} leftToFeedCount={leftToFeedInBadge} />
            <ResultScreen
                alreadyFedTransactions={alreadyFedTransactions}
                doFeedAnons={doFeedAnons}
                validationGroups={validationGroups}
                doFeed={doFeed}
                closeFeed={closeFeed}
                name={name}
                view={view}
            />
        </CardContainer>
    );
};

const ResultScreen = ({
    alreadyFedTransactions,
    closeFeed,
    doFeed,
    doFeedAnons,
    name,
    validationGroups,
    view
}: {
    alreadyFedTransactions: Array<TransactionJoined>;
    closeFeed: () => void;
    doFeed: (vols: Array<ValidatedVol>) => void;
    doFeedAnons: (value: { vegansCount: number; nonVegansCount: number }) => void;
    name: string;
    validationGroups: ValidationGroups;
    view: Views;
}) => {
    switch (view) {
        case Views.LOADING:
            return <ErrorCard close={closeFeed} title="Загрузка..." msg="" />;
        case Views.ERROR_EMPTY:
            return <ErrorCard close={closeFeed} msg={`В группе '${name}' нет волонтеров.`} />;
        case Views.ERROR_VALIDATION:
            return (
                <ErrorCard
                    msg={`Упс.. Ошибка при проверке волонтеров в бейдже “${name}”. Cделай скриншот и передай в бюро!`}
                    close={closeFeed}
                />
            );
        case Views.YELLOW:
            return (
                <GroupBadgeWarningCard
                    alreadyFedTransactions={alreadyFedTransactions}
                    doFeedAnons={doFeedAnons}
                    name={name}
                    doFeed={doFeed}
                    close={closeFeed}
                    validationGroups={validationGroups}
                />
            );

        default:
            return <ErrorCard close={closeFeed} msg="Непредвиденная ошибка" />;
    }
};
