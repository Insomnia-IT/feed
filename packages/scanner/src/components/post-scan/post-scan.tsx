import type { FC } from 'react';
import { memo } from 'react';

import { useScan } from '~/model/scan-provider/scan-provider';
import { FeedAnonCard, FeedCard, WarningCard } from '~/components/post-scan-cards';
import { FeedErrorCard } from '~/components/post-scan-cards/feed-error-card/feed-error-card';
import { useFeedVol, validateVol } from '~/components/post-scan/post-scan.utils';
import { useApp } from '~/model/app-provider';

export const PostScan: FC = memo(() => {
    const { kitchenId, mealTime } = useApp();
    const { handleCloseCard, qrcode, vol, volTransactions } = useScan();

    const [doFeed, doNotFeed] = useFeedVol(vol, mealTime, handleCloseCard, kitchenId);

    let postScanView;
    let errorMessage: Array<string> = [];

    if (qrcode === 'anon') {
        postScanView = 'anon';
    }

    if (vol && volTransactions) {
        const { isRed, msg } = validateVol(vol, volTransactions, kitchenId, mealTime!, false);

        if (msg?.length) {
            postScanView = isRed ? 'vol-error' : 'vol-warning';
            errorMessage = msg;
        } else {
            postScanView = 'vol-feed';
        }
    }

    return (
        <>
            {postScanView === 'anon' && <FeedAnonCard close={handleCloseCard} doFeed={doFeed} />}
            {postScanView === 'vol-feed' && vol && <FeedCard doFeed={doFeed} close={handleCloseCard} vol={vol} />}
            {postScanView === 'vol-warning' && vol && (
                <WarningCard
                    close={handleCloseCard}
                    doFeed={doFeed}
                    doNotFeed={doNotFeed}
                    vol={vol}
                    msg={errorMessage}
                />
            )}
            {postScanView === 'vol-error' && vol && (
                <FeedErrorCard close={handleCloseCard} doNotFeed={doNotFeed} msg={errorMessage} vol={vol} />
            )}
        </>
    );
});
PostScan.displayName = 'PostScan';
