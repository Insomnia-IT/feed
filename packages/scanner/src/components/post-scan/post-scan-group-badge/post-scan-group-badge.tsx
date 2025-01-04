import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { useApp } from '~/model/app-provider/app-provider';
import type { GroupBadge, Transaction, Volunteer } from '~/db';
import { db, dbIncFeed } from '~/db';
import { ErrorCard } from '~/components/post-scan/post-scan-cards/error-card/error-card';
import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { AlreadyFedModal } from '~/components/post-scan/post-scan-group-badge/already-fed-modal/already-fed-modal';

import { getTodayStart, getVolTransactionsAsync, validateVol } from '../post-scan.utils';

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

export const PostScanGroupBadge: FC<{
    groupBadge: GroupBadge;
    closeFeed: () => void;
}> = ({ closeFeed, groupBadge }) => {
    const { id, name } = groupBadge;

    // get vols linked tp badge, and their transactions for today
    const vols = useLiveQuery(async (): Promise<Array<Volunteer>> => {
        const todayStart = getTodayStart();

        const vols = await db.volunteers.where('group_badge').equals(id).toArray();

        // pre-fetching transactions by each vol
        await Promise.all(
            vols.map(async (vol) => {
                vol.transactions = await getVolTransactionsAsync(vol, todayStart);
            })
        );

        return vols;
    }, [id]);

    // result view
    const [view, setView] = useState<Views>(Views.LOADING);

    // vols validation result
    const [validationGroups, setValidationGroups] = useState<ValidationGroups>({
        greens: [],
        reds: []
    });

    // get app context
    const { kitchenId, mealTime } = useApp();

    // callback to feed vols
    const incFeedAsync = async (vols: Array<ValidatedVol>): Promise<void> => {
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
                    isVegan: undefined,
                    log,
                    kitchenId,
                    group_badge: groupBadge.id
                });
            })
        );
    };

    // Кормим анонимов, если введено "другое число"
    const feedAnons = async ({ nonVegansCount, vegansCount }: { vegansCount: number; nonVegansCount: number }) => {
        if (!mealTime) {
            return;
        }

        const createTransactionDraft = (isVegan?: boolean) => {
            return {
                vol: null,
                mealTime,
                isVegan,
                log: { error: false, reason: 'Групповое питание' },
                kitchenId,
                group_badge: groupBadge.id
            };
        };

        const vegans = Array.from(new Array(vegansCount), () => createTransactionDraft(true));
        const nonVegans = Array.from(new Array(nonVegansCount), () => createTransactionDraft());

        const promises = [...vegans, ...nonVegans].map((transactionDraft) => dbIncFeed(transactionDraft));

        await Promise.all(promises);
    };

    const doFeed = (vols: Array<ValidatedVol>): void => {
        void incFeedAsync(vols);
    };

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
            <AlreadyFedModal
                validatedVolsCount={validationGroups.greens.length}
                allVolsCount={vols?.length ?? 0}
                vols={vols}
                groupBadgeId={groupBadge.id}
                mealTime={mealTime}
            />
            <ResultScreen
                validationGroups={validationGroups}
                doFeed={doFeed}
                closeFeed={closeFeed}
                name={name}
                view={view}
                // view={Views.OTHER_COUNT}
            />
        </CardContainer>
    );
};

const ResultScreen: React.FC<{
    doFeed: (vols: Array<ValidatedVol>) => void;
    view: Views;
    closeFeed: () => void;
    name: string;
    validationGroups: ValidationGroups;
}> = ({ closeFeed, doFeed, name, validationGroups, view }) => {
    switch (view) {
        case Views.LOADING:
            return <ErrorCard close={closeFeed} title='Загрузка...' msg='' />;
        case Views.ERROR_EMPTY:
            return <ErrorCard close={closeFeed} msg={`В группе '${name}' нет волонтеров.`} />;
        case Views.ERROR_VALIDATION:
            // <GroupBadgeErrorCard
            //     close={closeFeed}
            //     doNotFeed={doNotFeed}
            //     msg={'Упс.. Ошибка при проверке волонтеров. Cделай скриншот и передай в бюро!'}
            //     volsNotToFeed={vols!.map(
            //         (vol) =>
            //             ({
            //                 ...vol,
            //                 msg: [`Ошибка в проверке волонтеров в групповом бейдже(qr: ${qr}).`],
            //                 isRed: true
            //             }) as ValidatedVol
            //     )}
            // />
            return (
                <ErrorCard
                    msg={'Упс.. Ошибка при проверке волонтеров. Cделай скриншот и передай в бюро!'}
                    close={closeFeed}
                />
            );
        case Views.YELLOW:
            return (
                <GroupBadgeWarningCard
                    name={name}
                    doFeed={doFeed}
                    close={closeFeed}
                    validationGroups={validationGroups}
                />
            );
        case Views.RED:
            return <ErrorCard close={closeFeed} msg={'Никто не ест.'} />;
        default:
            return <ErrorCard close={closeFeed} msg={'Непредвиденная ошибка'} />;
    }
};
