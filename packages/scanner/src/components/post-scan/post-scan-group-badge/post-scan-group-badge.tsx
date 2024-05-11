import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { AppColor, useApp } from '~/model/app-provider/app-provider';
import type { GroupBadge } from '~/db';
import { db, dbIncFeed } from '~/db';
import { ErrorCard } from '~/components/post-scan-cards/error-card/error-card';

import { getTodayStart, getVolTransactionsAsync, validateVol } from '../post-scan.utils';

import type { ValidatedVol, ValidationGroups } from './post-scan-group-badge.lib';
import { getAllVols } from './post-scan-group-badge.utils';
import { GroupBadgeErrorCard, GroupBadgeSuccessCard, GroupBadgeWarningCard } from './post-scan-group-badge-misc';

enum Views {
    'LOADING',
    'GREEN',
    'YELLOW',
    'RED',
    'BLUE',
    'ERROR_EMPTY',
    'ERROR_VALIDATION'
}

export const PostScanGroupBadge: FC<{
    groupBadge: GroupBadge;
    closeFeed: () => void;
}> = ({ closeFeed, groupBadge: { id, name, qr } }) => {
    // get vols, and their transactions for today
    const vols = useLiveQuery(async () => {
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
    const [validationGroups, setValidationGroups] = useState<ValidationGroups>();

    // get app context
    const { kitchenId, mealTime } = useApp();

    // set callback (not) to feed vols
    const incFeedAsync = useCallback(
        async (vols: Array<ValidatedVol>, error: boolean) =>
            await Promise.all(
                vols.map((vol) => {
                    const log =
                        !error && vol.msg.length === 0
                            ? undefined
                            : { error, reason: vol.msg.concat('Групповое питание').join(', ') };

                    return dbIncFeed({
                        vol,
                        mealTime: mealTime!,
                        isVegan: undefined,
                        log,
                        kitchenId
                    });
                })
            ),
        []
    );
    const doFeed = useCallback((vols: Array<ValidatedVol>) => void incFeedAsync(vols, false), [incFeedAsync]);
    const doNotFeed = useCallback((vols: Array<ValidatedVol>) => void incFeedAsync(vols, true), [incFeedAsync]);

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
            return { ...vol, ...validateVol(vol, vol.transactions!, kitchenId, mealTime!, true) };
        });

        setValidationGroups({
            // greens don't have any messages
            greens: validatedVols.filter((vol) => vol.msg.length === 0),

            // yellows have one or more messages but nobody has red color
            yellows: validatedVols.filter((vol) => vol.msg.length > 0 && !vol.isRed),

            // reds are similar to yellows but everyone has red flag being true instead
            reds: validatedVols.filter((vol) => vol.msg.length > 0 && vol.isRed)
        });
    }, [vols]);

    useEffect(() => {
        // loading
        if (!validationGroups) {
            setView(Views.LOADING);
            return;
        }

        // validation went wrong
        if (getAllVols(validationGroups).length !== vols!.length) {
            setView(Views.ERROR_VALIDATION);
            return;
        }

        // nobody eats
        if (vols!.length === validationGroups.reds.length) {
            setView(Views.RED);
            return;
        }

        // everyone eats w/o any messages
        if (vols!.length === validationGroups.greens.length) {
            setView(Views.GREEN);
            return;
        }

        // all vols or some of them eat but there is messages to show
        setView(Views.YELLOW);
    }, [validationGroups]);
    return (
        <>
            {Views.LOADING === view && <ErrorCard close={closeFeed} title='Загрузка...' msg='' />}

            {Views.ERROR_EMPTY === view && <ErrorCard close={closeFeed} msg={`В группе '${name}' нет волонтеров.`} />}

            {Views.ERROR_VALIDATION === view && (
                <GroupBadgeErrorCard
                    close={closeFeed}
                    doNotFeed={doNotFeed}
                    msg={'Упс.. Ошибка при проверке волонтеров. Cделай скриншот и передай в бюро!'}
                    volsNotToFeed={vols!.map(
                        (vol) =>
                            ({
                                ...vol,
                                msg: [`Ошибка в проверке волонтеров в групповом бейдже(qr: ${qr}).`],
                                isRed: true
                            } as ValidatedVol)
                    )}
                />
            )}

            {Views.GREEN === view && (
                <GroupBadgeSuccessCard
                    name={name}
                    volsToFeed={validationGroups!.greens}
                    doFeed={doFeed}
                    close={closeFeed}
                />
            )}

            {Views.YELLOW === view && (
                <GroupBadgeWarningCard
                    name={name}
                    doFeed={doFeed}
                    doNotFeed={doNotFeed}
                    close={closeFeed}
                    validationGroups={validationGroups!}
                />
            )}

            {Views.RED === view && (
                <GroupBadgeErrorCard
                    close={closeFeed}
                    doNotFeed={doNotFeed}
                    msg={'Никто не ест.'}
                    volsNotToFeed={validationGroups!.reds}
                />
            )}
        </>
    );
};
