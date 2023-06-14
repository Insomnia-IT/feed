import type { FC } from 'react';
import { useCallback, useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';

import { AppColor, AppContext } from '~/app-context';
import { db, dbIncFeed, Volunteer } from '~/db';
import { ErrorMsg, GreenCard, GreenAnonCard, YellowCard } from '~/components/misc';
import { useDoFeedVol, validateVol } from '../post-scan.utils';

export const PostScanVol: FC<{
    qrcode: string;
    vol: Volunteer;
    closeFeed: () => void;
}> = ({ closeFeed, qrcode, vol }) => {
    const volTransactions = useLiveQuery(async () => {
        const todayStart = dayjs().subtract(7, 'h').startOf('day').add(7, 'h').unix();
        return await db.transactions
            .where('vol_id')
            .equals(vol.id)
            .filter((transaction) => {
                return transaction.ts > todayStart;
            })
            .toArray();
    }, [vol]);

    const { kitchenId, mealTime, setColor } = useContext(AppContext);

    const doFeed = useDoFeedVol(vol, mealTime, closeFeed);

    if (!volTransactions) {
        return <ErrorMsg close={closeFeed} msg={`Бейдж не найден: ${qrcode}`} />;
    }

    const { isRed, msg } = validateVol(vol, volTransactions, kitchenId!, mealTime!);

    if (msg.length > 0) {
        if (isRed) {
            setColor(AppColor.RED);
            return <ErrorMsg close={closeFeed} msg={msg} />;
        } else {
            setColor(AppColor.YELLOW);
            return <YellowCard close={closeFeed} doFeed={doFeed} vol={vol} msg={msg} />;
        }
    }

    setColor(AppColor.GREEN);
    return <GreenCard close={closeFeed} doFeed={doFeed} vol={vol} />;
};
