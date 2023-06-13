import type { FC } from 'react';
import { useCallback, useEffect, useContext, useState, memo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { AppColor, AppContext } from '~/app-context';
import { db, dbIncFeed, GroupBadge, Volunteer } from '~/db';
import { ErrorMsg } from '~/components/misc';
import { getTodayStart, validateVol } from '../post-scan.utils';
import { ValidationGroups } from './post-scan-group-badge.lib';
import { getAllVols } from './post-scan-group-badge.utils';
import { GroupBadgeGreenCard, GroupBadgeYellowCard } from './post-scan-group-badge-misc';

enum Views {
    'LOADING',
    'GREEN',
    'YELLOW',
    'RED',
    'ERROR_EMPTY',
    'ERROR_VALIDATION'
}

export const PostScanGroupBadge: FC<{
    groupBadge: GroupBadge;
    closeFeed: () => void;
}> = ({ closeFeed, groupBadge: { id, name } }) => {
    // get vols, and their transactions for today
    const vols = useLiveQuery(async () => {
        const todayStart = getTodayStart();

        const vols = await db.volunteers.where('group_badge').equals(id).toArray();

        // pre-fetching transactions by each vol
        await Promise.all(
            vols.map(async (vol) => {
                vol.transactions = await db.transactions
                    .where('vol_id')
                    .equals(vol.id)

                    .filter((transaction) => {
                        return transaction.ts > todayStart;
                    })
                    .toArray();
            })
        );

        return vols;
    }, [id]);

    // result view
    const [view, setView] = useState<Views>(Views.LOADING);

    // vols validation result
    const [validationGroups, setValidationGroups] = useState<ValidationGroups>();

    // get app context
    const { kitchenId, mealTime, setColor } = useContext(AppContext);

    // set callback to feed vols
    const getDoFeed = useCallback((vols: Array<Volunteer>) => {
        const feed = async (vols: Array<Volunteer>) => {
            if (!vols) {
                await Promise.reject(vols);
                return;
            }

            await Promise.all(vols.map((vol) => dbIncFeed(vol, mealTime!, vol.is_vegan)));
        };

        return () => void feed(vols);
    }, []);

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
            return { ...vol, ...validateVol(vol, vol.transactions!, kitchenId!, mealTime!) };
        });

        setValidationGroups({
            // greens don't have any messages
            greens: validatedVols.filter((vol) => vol.msg.length === 0),

            // yellows have one or more messages but nobody has red color
            yellows: validatedVols.filter((vol) => vol.msg.length > 0 && !vol.isRed),

            // reds are as yellows but everyone has red color instead
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

    useEffect(() => {
        switch (view) {
            case Views.ERROR_EMPTY:
            case Views.ERROR_VALIDATION:
            case Views.RED:
                setColor(AppColor.RED);
                break;

            case Views.GREEN:
                setColor(AppColor.GREEN);
                break;

            case Views.YELLOW:
                setColor(AppColor.YELLOW);
                break;

            case Views.LOADING:
                setColor(null);
                break;

            default:
                break;
        }
    }, [view]);

    return (
        <>
            {Views.LOADING === view && <ErrorMsg close={closeFeed} msg={`Загрузка...`} />}

            {Views.ERROR_EMPTY === view && <ErrorMsg close={closeFeed} msg={`В группе '${name}' нет волонтеров.`} />}

            {Views.ERROR_VALIDATION === view && (
                <ErrorMsg close={closeFeed} msg={`Упс.. Ошибка при проверке волонтеров.`} />
            )}

            {Views.GREEN === view && (
                <GroupBadgeGreenCard
                    name={name}
                    volsToFeed={validationGroups!.greens}
                    close={closeFeed}
                    getDoFeed={getDoFeed}
                />
            )}

            {Views.YELLOW === view && (
                <GroupBadgeYellowCard
                    name={name}
                    getDoFeed={getDoFeed}
                    getDoNotFeed={(vols: Array<Volunteer>) => () => console.log('DUMMY: do not feed', vols)}
                    close={closeFeed}
                    validationGroups={validationGroups!}
                />
            )}

            {Views.RED === view && <ErrorMsg close={closeFeed} msg={`Никто не ест.`} />}
        </>
    );
};
