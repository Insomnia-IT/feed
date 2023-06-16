import type { FC } from 'react';
import { useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { AppColor, AppContext } from '~/app-context';
import { Volunteer } from '~/db';
import { ErrorMsg, GreenCard, YellowCard } from '~/components/misc';
import { getTodayStart, getVolTransactionsAsync, useFeedVol, validateVol } from '../post-scan.utils';

export const PostScanVol: FC<{
    qrcode: string;
    vol: Volunteer;
    closeFeed: () => void;
}> = ({ closeFeed, qrcode, vol }) => {
    const volTransactions = useLiveQuery(async () => await getVolTransactionsAsync(vol, getTodayStart()), [vol]);

    const { kitchenId, mealTime, setColor } = useContext(AppContext);

    const [doFeed, doNotFeed] = useFeedVol(vol, mealTime, closeFeed);

    if (!volTransactions) {
        return <ErrorMsg close={closeFeed} doNotFeed={doNotFeed} msg={`Бейдж не найден: ${qrcode}`} />;
    }

    const { isRed, msg } = validateVol(vol, volTransactions, kitchenId!, mealTime!);

    if (msg.length > 0) {
        if (isRed) {
            setColor(AppColor.RED);
            return <ErrorMsg close={closeFeed} doNotFeed={doNotFeed} msg={msg} />;
        } else {
            setColor(AppColor.YELLOW);
            return <YellowCard close={closeFeed} doFeed={doFeed} doNotFeed={doNotFeed} vol={vol} msg={msg} />;
        }
    }

    setColor(AppColor.GREEN);
    return <GreenCard close={closeFeed} doFeed={doFeed} vol={vol} />;
};
