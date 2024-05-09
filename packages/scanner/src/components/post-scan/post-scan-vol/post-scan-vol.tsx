import type { FC } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { FeedType, type Volunteer } from '~/db';
import { AppColor, useApp } from '~/model/app-provider';
import { WarningCard } from '~/components/post-scan-cards/warning-card';
import { FeedCard } from '~/components/post-scan-cards/feed-card/feed-card';
import { ErrorCard } from '~/components/post-scan-cards/error-card/error-card';
import { FeedErrorCard } from '~/components/post-scan-cards/feed-error-card/feed-error-card';

import { getTodayStart, getVolTransactionsAsync, useFeedVol, validateVol } from '../post-scan.utils';

export const PostScanVol: FC<{
    qrcode: string;
    vol: Volunteer;
    closeFeed: () => void;
}> = ({ closeFeed, qrcode, vol }) => {
    const volTransactions = useLiveQuery(async () => await getVolTransactionsAsync(vol, getTodayStart()), [vol]);

    const { kitchenId, mealTime, setColor } = useApp();

    const [doFeed, doNotFeed] = useFeedVol(vol, mealTime, closeFeed, kitchenId);

    if (!volTransactions) {
        return <ErrorCard close={closeFeed} doNotFeed={doNotFeed} msg={`Бейдж не найден: ${qrcode}`} />;
    }

    const { isRed, msg } = validateVol(vol, volTransactions, kitchenId, mealTime!, false);

    if (msg.length > 0) {
        if (isRed) {
            return <FeedErrorCard close={closeFeed} doNotFeed={doNotFeed} msg={msg} vol={vol} />;
        } else {
            return <WarningCard close={closeFeed} doFeed={doFeed} doNotFeed={doNotFeed} vol={vol} msg={msg} />;
        }
    }

    return <FeedCard close={closeFeed} doFeed={doFeed} vol={vol} />;
};
