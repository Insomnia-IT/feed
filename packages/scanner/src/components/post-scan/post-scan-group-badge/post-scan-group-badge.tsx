import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { useApp } from '~/model/app-provider/app-provider';
import { db, dbIncFeed } from '~/db';
import type { GroupBadge, MealTime, Transaction, Volunteer, TransactionJoined } from '~/db';
import { ErrorCard } from '~/components/post-scan/post-scan-cards/error-card/error-card';
import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { AlreadyFedModal } from '~/components/post-scan/post-scan-group-badge/already-fed-modal/already-fed-modal';

import {
    getGroupBadgeCurrentMealTransactions,
    getTodayStart,
    getVolTransactionsAsync,
    massFeedAnons,
    validateVol
} from '../post-scan.utils';

import type { ValidatedVol, ValidationGroups } from './post-scan-group-badge.lib';
import { getAllVols } from './post-scan-group-badge.utils';
import { GroupBadgeWarningCard } from './post-scan-group-badge-misc';

enum Views {
    'LOADING',
    'YELLOW',
    'RED',
    'ERROR_EMPTY',
    'ERROR_VALIDATION'
}

const todayStart = getTodayStart();

const useGroupBadgeData = ({
    badge,
    mealTime
}: {
    badge: GroupBadge;
    mealTime?: MealTime | null;
}): { alreadyFedTransactions: Array<TransactionJoined>; vols: Array<Volunteer> } => {
    const { id } = badge;

    // get vols linked tp badge, and their transactions for today
    const vols =
        useLiveQuery<Array<Volunteer>>(async (): Promise<Array<Volunteer>> => {
            const vols = await db.volunteers.where('group_badge').equals(id).toArray();

            // pre-fetching transactions by each vol
            await Promise.all(
                vols.map(async (vol) => {
                    vol.transactions = await getVolTransactionsAsync(vol, todayStart);
                })
            );

            return vols;
        }, [id]) ?? ([] as Array<Volunteer>);

    // Транзакции с текущим бейджем и временем питания - уже покормленные волонтеры (чаще всего - анонимы)
    const alreadyFedTransactions =
        useLiveQuery<Array<TransactionJoined>>(() => {
            return getGroupBadgeCurrentMealTransactions(id, mealTime);
        }, [id]) ?? ([] as Array<TransactionJoined>);

    return { alreadyFedTransactions, vols };
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
            const log =
                vol.msg.length === 0
                    ? { error: false, reason: 'Групповое питание' }
                    : { error: false, reason: vol.msg.concat('Групповое питание').join(', ') };

            return dbIncFeed({
                vol,
                mealTime: mealTime,
                isVegan: vol.is_vegan,
                log,
                kitchenId,
                group_badge: groupBadge.id
            });
        })
    );
};

export const PostScanGroupBadge: FC<{
    groupBadge: GroupBadge;
    closeFeed: () => void;
}> = ({ closeFeed, groupBadge }) => {
    const { name } = groupBadge;

    // get app context
    const { kitchenId, mealTime } = useApp();

    const { alreadyFedTransactions, vols } = useGroupBadgeData({ badge: groupBadge, mealTime });

    // result view
    const [view, setView] = useState<Views>(Views.LOADING);

    // vols validation result
    const [validationGroups, setValidationGroups] = useState<ValidationGroups>({
        greens: [],
        reds: []
    });

    const doFeed = (vols: Array<ValidatedVol>): void => {
        void incFeedAsync({ vols, mealTime, kitchenId, groupBadge });
    };

    const doFeedAnons = (value: { vegansCount: number; nonVegansCount: number }): void => {
        void massFeedAnons({ ...value, groupBadge, kitchenId, mealTime });
    };

    const leftToFeedInBadge =
        // Транзакции кормления анонимов по групповому бейджу могут содержать значение amount, отличное от 1
        validationGroups.greens.length - (alreadyFedTransactions?.reduce((count, next) => count + next.amount, 0) ?? 0);

    useEffect(() => {
        // loading
        if (!vols) {
            setView(Views.LOADING);
            return;
        }

        // nobody is attached to group badge
        if (vols.length === 0) {
            setView(Views.ERROR_EMPTY);
            return;
        }

        // pass each vol through validation and combine result
        const validatedVols = vols.map((vol) => {
            return {
                ...vol,
                ...validateVol({
                    vol,
                    volTransactions: vol?.transactions ?? new Array<Transaction>(),
                    kitchenId,
                    mealTime,
                    isGroupScan: true
                })
            };
        });

        const validationGroupsNext = {
            // greens don't have any messages
            greens: validatedVols.filter((vol) => vol.msg.length === 0),

            // reds have one or more messages for Group Badge
            reds: validatedVols.filter((vol) => vol.msg.length > 0)
        };

        setValidationGroups(validationGroupsNext);

        // validation went wrong
        if (getAllVols(validationGroupsNext).length !== vols?.length) {
            setView(Views.ERROR_VALIDATION);
            return;
        }

        // nobody eats
        if (vols?.length === validationGroupsNext.reds.length) {
            setView(Views.RED);
            return;
        }

        // all vols or some of them eat but there is messages to show
        setView(Views.YELLOW);
    }, [kitchenId, mealTime, vols]);

    return (
        <CardContainer>
            <AlreadyFedModal alreadyFedVolsCount={alreadyFedTransactions?.length} leftToFeedCount={leftToFeedInBadge} />
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

const ResultScreen: React.FC<{
    alreadyFedTransactions: Array<TransactionJoined>;
    closeFeed: () => void;
    doFeed: (vols: Array<ValidatedVol>) => void;
    doFeedAnons: (value: { vegansCount: number; nonVegansCount: number }) => void;
    name: string;
    validationGroups: ValidationGroups;
    view: Views;
}> = ({ alreadyFedTransactions, closeFeed, doFeed, doFeedAnons, name, validationGroups, view }) => {
    switch (view) {
        case Views.LOADING:
            return <ErrorCard close={closeFeed} title='Загрузка...' msg='' />;
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
        case Views.RED:
            return <ErrorCard close={closeFeed} msg={`Вы отсканировали групповой бейдж “${name}”. Никто не ест.`} />;
        default:
            return <ErrorCard close={closeFeed} msg={'Непредвиденная ошибка'} />;
    }
};
