import type { FC } from 'react';
import { useCallback, useEffect, useContext, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';

import { AppColor, AppContext } from '~/app-context';
import { db, dbIncFeed, GroupBadge, Volunteer } from '~/db';
import { ErrorMsg } from '~/components/misc';
import { validateVol } from '../post-scan.utils';
import { ValidatedVol, ValidationGroups, Scenarios } from './post-scan-group-badge.lib';
import { getTotalCount } from './post-scan-group-badge.misc';

export const PostScanGroupBadge: FC<{
    qrcode: string;
    groupBadge: GroupBadge;
    closeFeed: () => void;
}> = ({ closeFeed, groupBadge, qrcode }) => {
    // get vols, and their transactions for today
    const vols = useLiveQuery(async () => {
        const todayStart = dayjs().subtract(7, 'h').startOf('day').add(7, 'h').unix();

        const vols = await db.volunteers.where('group_badge').equals(groupBadge.id).toArray();

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
    }, [groupBadge.id]);

    // scenarios to control result view
    const [scenario, setScenario] = useState<Scenarios>(Scenarios.LOADING);

    // vols validation result
    const [validationGroups, setValidationGroups] = useState<ValidationGroups>();

    // vols which are claimed to get feed
    const [volsToFeed, setVolsToFeed] = useState<Array<ValidatedVol>>();

    // get app context
    const { kitchenId, mealTime, setColor } = useContext(AppContext);

    // closure volsToFeed to feed
    const feed = useCallback(async () => {
        if (!volsToFeed) return Promise.reject(volsToFeed);

        await Promise.all(volsToFeed.map((group) => dbIncFeed(group.vol, mealTime!, group.vol.is_vegan)));
    }, [volsToFeed]);

    // create callback to feed vols
    const doFeed = useCallback(() => void feed(), [feed]);

    useEffect(() => {
        // loading
        if (!vols) {
            setScenario(Scenarios.LOADING);
            return;
        }

        // nobody is attached to group badge
        if (vols.length === 0) {
            setScenario(Scenarios.ERROR_EMPTY);
            return;
        }

        // pass each vol through validation and combine result
        const validatedVols = vols.map((vol) => {
            return { vol, ...validateVol(vol, vol.transactions!, kitchenId!, mealTime!) };
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
            setScenario(Scenarios.LOADING);
            return;
        }

        // validation went wrong
        if (getTotalCount(validationGroups) !== vols!.length) {
            setScenario(Scenarios.ERROR_VALIDATION);
            return;
        }

        // nobody eats
        if (vols!.length === validationGroups.reds.length) {
            setScenario(Scenarios.RED);
            return;
        }

        // everyone eats w/o any messages
        if (vols!.length === validationGroups.greens.length) {
            setScenario(Scenarios.GREEN);
            return;
        }

        // all vols or some of them eat but there is messages to show
        setScenario(Scenarios.YELLOW);
    }, [validationGroups]);

    useEffect(() => {
        switch (scenario) {
            case Scenarios.ERROR_EMPTY:
            case Scenarios.ERROR_VALIDATION:
            case Scenarios.RED:
                setColor(AppColor.RED);
                break;

            case Scenarios.GREEN:
                setColor(AppColor.GREEN);
                setVolsToFeed(validationGroups!.greens);
                break;

            case Scenarios.YELLOW:
                setColor(AppColor.YELLOW);
                setVolsToFeed(validationGroups!.yellows.concat(validationGroups!.greens));
                break;

            default:
                break;
        }
    }, [scenario]);

    return (
        <>
            {Scenarios.LOADING === scenario && <ErrorMsg close={closeFeed} msg={`Загрузка...`} />}

            {Scenarios.ERROR_EMPTY === scenario && (
                <ErrorMsg close={closeFeed} msg={`В группе '${groupBadge.name}' нет волонтеров.`} />
            )}

            {Scenarios.ERROR_VALIDATION === scenario && (
                <ErrorMsg close={closeFeed} msg={`Упс.. Ошибка при проверке волонтеров.`} />
            )}
        </>
    );
};
