import type { FC } from 'react';
import { memo, useState } from 'react';

import { useScan } from '~/model/scan-provider/scan-provider';
import { FeedAnonCard, FeedCard, FeedWarningCard } from 'src/components/post-scan/post-scan-cards';
import { FeedErrorCard } from '~/components/post-scan/post-scan-cards/feed-error-card/feed-error-card';
import { useFeedVol, validateVol } from '~/components/post-scan/post-scan.utils';
import { useApp } from '~/model/app-provider';
import { FeedAnonGroupCard } from '~/components/post-scan/post-scan-cards/feed-anon-group-card/feed-anon-group-card';

/**
 * Функция возвращает тип экрана для отрисовки и список ошибок в случае ошибочного экрана
 * */
const getInitialScreenState = ({ kitchenId, mealTime, qrcode, vol, volTransactions }) => {
    let view;
    let errors: Array<string> = [];

    if (qrcode === 'anon') {
        view = 'anon';
    }

    if (vol && volTransactions) {
        const { isRed, msg } = validateVol(vol, volTransactions, kitchenId, mealTime, false);

        if (msg?.length) {
            view = isRed ? 'vol-error' : 'vol-warning';
            errors = msg;
        } else {
            view = 'vol-feed';
        }
    }

    return { view, errors };
};

export const PostScan: FC = memo(() => {
    const { kitchenId, mealTime } = useApp();
    const { handleCloseCard, qrcode, vol, volTransactions } = useScan();

    const { errors, view } = getInitialScreenState({ kitchenId, mealTime, qrcode, vol, volTransactions });

    const [postScanView, setPostScanView] = useState<'anon' | 'anon-group' | 'vol-feed' | 'vol-warning' | 'vol-error'>(
        view
    );

    const { doFeed, doNotFeed } = useFeedVol(vol, mealTime, handleCloseCard, kitchenId);

    return (
        <>
            {postScanView === 'anon' && (
                <FeedAnonCard
                    close={handleCloseCard}
                    doFeed={doFeed}
                    onClickFeedGroup={() => {
                        setPostScanView('anon-group');
                    }}
                />
            )}
            {postScanView === 'anon-group' && <FeedAnonGroupCard close={handleCloseCard} doFeed={doFeed} />}
            {postScanView === 'vol-feed' && vol && <FeedCard doFeed={doFeed} close={handleCloseCard} vol={vol} />}
            {postScanView === 'vol-warning' && vol && (
                <FeedWarningCard close={handleCloseCard} doFeed={doFeed} doNotFeed={doNotFeed} vol={vol} msg={errors} />
            )}
            {postScanView === 'vol-error' && vol && (
                <FeedErrorCard close={handleCloseCard} doNotFeed={doNotFeed} msg={errors} vol={vol} />
            )}
        </>
    );
});

PostScan.displayName = 'PostScan';
